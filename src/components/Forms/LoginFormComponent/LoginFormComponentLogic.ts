import { useEffect, useRef, useState } from 'react';
import { Alert, Animated } from 'react-native';
import { Auth } from '../../../interfaces/AuthInterfaces';
import { Core } from '../../../interfaces/CoreInterfaces';
import { authService } from '../../../services/AuthServices/AuthService';
import { coreService } from '../../../services/CoreServices/CoreService';
import { calculatePasswordSecureLevel } from '../../../utils/passwordUtils';
import { maskPhone, sanitizePhoneDigits, validatePhone } from '../../../utils/phoneUtils';
import { SupportContactType, getSupportContactAlert } from '../../../utils/supportUtils';
import { getOtpNextPage, sanitizeOtpInput, validateLoginPassword, validateNewPasswordForm, validateOtpCode } from '../../../utils/validationUtils';
import { useRancho } from '../../../context/RanchoContext';
import { useLoader } from '../../../context/LoaderContext';
import { apiClient } from '../../../lib/apiClient';
import { supabase } from '../../../lib/supabase';

// Page index mapping:
// 0 = P1: Phone entry
// 1 = P2: Phone not registered
// 2 = P3: Enter password
// 3 = P4: Verify code (OTP)
// 4 = P5: Create password
// 5 = P6: Help / Support
// 6 = P7: Choose organization

export type LoginPage = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const PAGE_LABELS: Record<number, string> = {
  0: 'inicio de sesión',
  1: 'número no encontrado',
  2: 'ingresar contraseña',
  3: 'verificar número',
  4: 'crear contraseña',
  5: 'ayuda',
  6: 'elegir organización',
  7: 'registrar rancho',
};

export const OTP_TIMER_SECONDS = 30;

function getApiErrorMessage(err: any, fallback: string): string {
  const apiError = err.response?.data as Auth.ApiErrorResponse;
  return apiError?.error?.message || err.message || fallback;
}

// --- DECOUPLED LOGIC FUNCTIONS (EXTRACTED OUTSIDE HOOK) ---

export async function performLoadUserOrganizations(
  setOrganizations: (orgs: Core.Organization[]) => void,
  setSelectedOrg: (orgId: string) => void,
  setAppLoading: (loading: boolean) => void
) {
  setAppLoading(true);
  try {
    const response = await coreService.getUserOrganizations();
    const orgList = response.data;

    setOrganizations(orgList);
    if (orgList.length > 0) {
      setSelectedOrg(orgList[0].org_id);
    }
  } catch (err: any) {
    Alert.alert('Error', err.message || 'Error al obtener organizaciones');
  } finally {
    setAppLoading(false);
  }
}

export async function performP1Continue(
  phone: string,
  setPhone: (phone: string) => void,
  setPhoneError: (err: string) => void,
  setLoading: (loading: boolean) => void,
  setIsLoginFlow: (val: boolean) => void,
  setIsResetFlow: (val: boolean) => void,
  transitionToPage: (page: number) => void
) {
  const phoneValidation = validatePhone(phone);
  if (!phoneValidation.isValid) {
    setPhoneError(phoneValidation.error);
    return;
  }

  setPhoneError('');
  setLoading(true);

  try {
    const response = await authService.checkPhoneExistence(phone);
    const { state, nextAction, phone: normalizedPhone, devVerificationCode } = response.data;

    if (devVerificationCode) {
      console.log('[Dev OTP Code]:', devVerificationCode);
    }

    if (normalizedPhone) {
      setPhone(normalizedPhone);
    }

    if (state === 'not_found') {
      setIsLoginFlow(true);
      setIsResetFlow(false);
      transitionToPage(1); // Page 1: Phone not registered
    } else if (state === 'pending_otp' || nextAction === 'verify_code') {
      setIsLoginFlow(false);
      setIsResetFlow(false);
      transitionToPage(3); // Go to OTP verification
    } else if (state === 'registered' || nextAction === 'enter_password') {
      setIsLoginFlow(true);
      setIsResetFlow(false);
      transitionToPage(2); // Page 2: Enter password
    } else {
      // Fallback
      setIsLoginFlow(true);
      setIsResetFlow(false);
      transitionToPage(1);
    }
  } catch (err: any) {
    setPhoneError(getApiErrorMessage(err, 'Error al validar teléfono'));
  } finally {
    setLoading(false);
  }
}

export async function performP3Submit(
  phone: string,
  password: string,
  setPasswordError: (err: string) => void,
  setLoading: (loading: boolean) => void,
  setIsLoginFlow: (val: boolean) => void,
  transitionToPage: (page: number) => void
) {
  const passwordValidation = validateLoginPassword(password);
  if (!passwordValidation.isValid) {
    setPasswordError(passwordValidation.error);
    return;
  }

  setPasswordError('');
  setLoading(true);

  try {
    const response = await authService.passwordLogin(phone, password);
    console.log(response,'pol')
    const token = response.data.accessToken || (response.data as any).access_token;
    if (token) {
      apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
      // Store real JWT so the mock supabase session uses it instead of a fake token
      if (typeof (supabase.auth as any).setRealToken === 'function') {
        (supabase.auth as any).setRealToken(token);
      }
    }
    setIsLoginFlow(true);
    transitionToPage(6);
  } catch (err: any) {
    setPasswordError(getApiErrorMessage(err, 'Contraseña incorrecta'));
  } finally {
    setLoading(false);
  }
}

export async function performP4Verify(
  phone: string,
  otpCode: string,
  isResetFlow: boolean,
  isLoginFlow: boolean,
  setOtpError: (err: string) => void,
  setLoading: (loading: boolean) => void,
  transitionToPage: (page: number) => void
) {
  const otpValidation = validateOtpCode(otpCode);
  if (!otpValidation.isValid) {
    setOtpError(otpValidation.error);
    return;
  }

  setOtpError('');
  setLoading(true);

  try {
    const response = await authService.verifyCode(phone, otpCode);
    const { phoneVerified, passwordRequired, nextAction } = response.data;

    if (phoneVerified && (passwordRequired || nextAction === 'set_password')) {
      transitionToPage(4);
    } else if (phoneVerified) {
      transitionToPage(getOtpNextPage(isLoginFlow));
    } else {
      setOtpError('No se pudo verificar el código.');
    }
  } catch (err: any) {
    setOtpError(getApiErrorMessage(err, 'Error al verificar código'));
  } finally {
    setLoading(false);
  }
}

export async function performP5Submit(
  phone: string,
  otpCode: string,
  newPassword: string,
  confirmPassword: string,
  isResetFlow: boolean,
  setNewPasswordError: (err: string) => void,
  setConfirmPasswordError: (err: string) => void,
  setLoading: (loading: boolean) => void,
  setPassword: (pwd: string) => void,
  setNewPassword: (pwd: string) => void,
  setConfirmPassword: (pwd: string) => void,
  setOtpCode: (code: string) => void,
  transitionToPage: (page: number) => void
) {
  const validation = validateNewPasswordForm(newPassword, confirmPassword);
  setNewPasswordError(validation.newPasswordError);
  setConfirmPasswordError(validation.confirmPasswordError);

  if (!validation.isValid) {
    return;
  }

  setLoading(true);
  try {
    await authService.setPassword(phone, otpCode, newPassword);

    // Auto-login to obtain the Bearer token for page 6 (Choose/Create Org)
    try {
      const loginRes = await authService.passwordLogin(phone, newPassword);
      const token = loginRes.data.accessToken || (loginRes.data as any).access_token;
      if (token) {
        apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
        // Store real JWT so the mock supabase session uses it instead of a fake token
        if (typeof (supabase.auth as any).setRealToken === 'function') {
          (supabase.auth as any).setRealToken(token);
        }
      }
    } catch (e) {
      console.warn('Auto-login failed after setPassword', e);
    }

    const savedPassword = newPassword;
    const nextPage = 6;

    Alert.alert(
      'Éxito',
      isResetFlow
        ? 'Tu contraseña ha sido restablecida exitosamente.'
        : 'Tu contraseña ha sido creada exitosamente.',
      [
        {
          text: 'OK',
          onPress: () => {
            setPassword(savedPassword);
            setNewPassword('');
            setConfirmPassword('');
            setOtpCode('');
            transitionToPage(nextPage);
          },
        },
      ]
    );
  } catch (err: any) {
    Alert.alert('Error', getApiErrorMessage(err, 'Error al guardar la contraseña'));
  } finally {
    setLoading(false);
  }
}

export async function performOrgSubmit(
  phone: string,
  password: string,
  selectedOrg: string,
  setLoading: (loading: boolean) => void,
  onSubmit: (data: Auth.LogInInterface) => Promise<void> | void
) {
  setLoading(true);
  try {
    const response = await coreService.selectOrganization(selectedOrg);
    const { access_token, active_org } = response.data;

    await onSubmit({ phone, password, orgId: selectedOrg });
  } catch (err: any) {
    const apiError = err.response?.data?.error;
    const errorMsg = apiError?.message || err.message || 'Error al seleccionar la organización';
    Alert.alert('Error', errorMsg);
  } finally {
    setLoading(false);
  }
}

export async function performCreateOrg(
  orgName: string,
  setOrgNameError: (err: string) => void,
  setLoading: (loading: boolean) => void,
  setOrganizations: (orgs: Core.Organization[]) => void,
  setSelectedOrg: (orgId: string) => void,
  transitionToPage: (page: number) => void
) {
  if (!orgName.trim()) {
    setOrgNameError('El nombre del rancho es obligatorio.');
    return;
  }
  setOrgNameError('');
  setLoading(true);
  try {
    const response = await coreService.createOrganization(orgName.trim());
    const newOrg = response.data;

    // Fetch updated organizations
    const orgsRes = await coreService.getUserOrganizations();
    setOrganizations(orgsRes.data);

    // Select the new rancho automatically
    setSelectedOrg(newOrg.org_id);
    Alert.alert('Éxito', `El rancho "${newOrg.org_name}" ha sido registrado correctamente.`);
    transitionToPage(6);
  } catch (err: any) {
    const apiError = err.response?.data?.error;
    const errorMsg = apiError?.message || err.message || 'Error al registrar el rancho';
    setOrgNameError(errorMsg);
  } finally {
    setLoading(false);
  }
}

export async function performResendOtp(
  phone: string,
  isResetFlow: boolean,
  setTimerSeconds: (secs: number) => void,
  setLoading: (loading: boolean) => void
) {
  setLoading(true);
  try {
    const response = await authService.checkPhoneExistence(phone);
    const { devVerificationCode } = response.data;
    if (devVerificationCode) {
      console.log('[Dev OTP Code (Resend)]:', devVerificationCode);
    }

    setTimerSeconds(OTP_TIMER_SECONDS);
    Alert.alert('Reenviado', 'Se ha reenviado un nuevo código a tu número.');
  } catch (err: any) {
    Alert.alert('Error', getApiErrorMessage(err, 'Error al reenviar el código'));
  } finally {
    setLoading(false);
  }
}

export async function performStartInvitationFlow(
  phone: string,
  setIsLoginFlow: (val: boolean) => void,
  setIsResetFlow: (val: boolean) => void,
  setLoading: (loading: boolean) => void,
  transitionToPage: (page: number) => void
) {
  setIsLoginFlow(false);
  setIsResetFlow(false);
  setLoading(true);
  try {
    // REAL API CALL:
    // await authService.sendOtp({ phone, reason: 'invitation' });

    transitionToPage(3);
  } catch (err: any) {
    Alert.alert('Error', err.message || 'Error al enviar invitación');
  } finally {
    setLoading(false);
  }
}

export async function performStartForgotPasswordFlow(
  phone: string,
  setIsLoginFlow: (val: boolean) => void,
  setIsResetFlow: (val: boolean) => void,
  setLoading: (loading: boolean) => void,
  transitionToPage: (page: number) => void
) {
  setIsLoginFlow(false);
  setIsResetFlow(true);
  setLoading(true);
  try {
    // REAL API CALL:
    // await authService.sendOtp({ phone, reason: 'forgot_password' });

    transitionToPage(3);
  } catch (err: any) {
    Alert.alert('Error', err.message || 'Error al enviar OTP de recuperación');
  } finally {
    setLoading(false);
  }
}

// --- HOOK DEFINITION ---

interface UseLoginFormLogicParams {
  onSubmit: (data: Auth.LogInInterface) => Promise<void> | void;
}

export function useLoginFormLogic({ onSubmit }: UseLoginFormLogicParams) {
  const {
    selectedOrgId: selectedOrg,
    setSelectedOrgId: setSelectedOrg,
    organizations,
    setOrganizations,
    phone,
    setPhone,
    password,
    setPassword,
    loginPage: page,
    setLoginPage: setPage,
    loginPageHistory: pageHistory,
    setLoginPageHistory: setPageHistory,
  } = useRancho();

  const { appLoading, setAppLoading } = useLoader();

  const [isResetFlow, setIsResetFlow] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [timerSeconds, setTimerSeconds] = useState(OTP_TIMER_SECONDS);
  const [passwordSecureLevel, setPasswordSecureLevel] = useState(0);
  const [isLoginFlow, setIsLoginFlow] = useState(true);

  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [orgName, setOrgName] = useState('');
  const [orgNameError, setOrgNameError] = useState('');

  const otpInputRef = useRef<any>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (page !== 3) return;

    setTimerSeconds(OTP_TIMER_SECONDS);
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [page]);

  useEffect(() => {
    setPasswordSecureLevel(calculatePasswordSecureLevel(newPassword));
  }, [newPassword]);

  useEffect(() => {
    if (page === 6) {
      performLoadUserOrganizations(setOrganizations, setSelectedOrg, setAppLoading);
    }
  }, [page]);

  const resetOtherPagesState = (nextPage: number) => {
    if (nextPage !== 0) {
      setPhoneError('');
    }

    if (nextPage !== 2 && nextPage !== 6) {
      setPassword('');
      setPasswordError('');
      setShowPassword(false);
    }

    if (nextPage !== 7) {
      setOrgName('');
      setOrgNameError('');
    }

    if (nextPage !== 3 && nextPage !== 4) {
      setOtpCode('');
      setOtpError('');
    }

    if (nextPage !== 4) {
      setNewPassword('');
      setConfirmPassword('');
      setNewPasswordError('');
      setConfirmPasswordError('');
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }
  };

  const transitionToPage = (nextPage: number, options?: { isBack?: boolean }) => {
    const isForward = !options?.isBack && nextPage > page;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: isForward ? -20 : 20,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (nextPage === 0) {
        setPageHistory([]);
      } else if (options?.isBack) {
        setPageHistory((prev) => prev.slice(0, -1));
      } else {
        setPageHistory((prev) => [...prev, page]);
      }
      resetOtherPagesState(nextPage);
      setPage(nextPage as LoginPage);
      slideAnim.setValue(isForward ? 20 : -20);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleP1Continue = () => {
    performP1Continue(
      phone,
      setPhone,
      setPhoneError,
      setLoading,
      setIsLoginFlow,
      setIsResetFlow,
      transitionToPage
    );
  };

  const handleP3Submit = () => {
    performP3Submit(
      phone,
      password,
      setPasswordError,
      setLoading,
      setIsLoginFlow,
      transitionToPage
    );
  };

  const handleP4Verify = () => {
    performP4Verify(
      phone,
      otpCode,
      isResetFlow,
      isLoginFlow,
      setOtpError,
      setLoading,
      transitionToPage
    );
  };

  const handleNewPasswordChange = (value: string) => {
    setNewPassword(value);
  };

  const handleP5Submit = () => {
    performP5Submit(
      phone,
      otpCode,
      newPassword,
      confirmPassword,
      isResetFlow,
      setNewPasswordError,
      setConfirmPasswordError,
      setLoading,
      setPassword,
      setNewPassword,
      setConfirmPassword,
      setOtpCode,
      transitionToPage
    );
  };

  const handleOrgSubmit = () => {
    performOrgSubmit(phone, password, selectedOrg, setLoading, onSubmit);
  };

  const handleSupportContact = (type: SupportContactType) => {
    const { title, message } = getSupportContactAlert(type);
    Alert.alert(title, message);
  };

  const handleResendOtp = () => {
    performResendOtp(phone, isResetFlow, setTimerSeconds, setLoading);
  };

  const startInvitationFlow = () => {
    performStartInvitationFlow(phone, setIsLoginFlow, setIsResetFlow, setLoading, transitionToPage);
  };

  const startForgotPasswordFlow = () => {
    performStartForgotPasswordFlow(phone, setIsLoginFlow, setIsResetFlow, setLoading, transitionToPage);
  };

  const clearPhoneError = () => {
    if (phoneError) setPhoneError('');
  };

  const clearPasswordError = () => {
    if (passwordError) setPasswordError('');
  };

  const clearOtpError = () => {
    if (otpError) setOtpError('');
  };

  const clearNewPasswordError = () => {
    if (newPasswordError) setNewPasswordError('');
  };

  const clearConfirmPasswordError = () => {
    if (confirmPasswordError) setConfirmPasswordError('');
  };

  const handleCreateOrgSubmit = () => {
    performCreateOrg(
      orgName,
      setOrgNameError,
      setLoading,
      setOrganizations,
      setSelectedOrg,
      transitionToPage
    );
  };

  const clearOrgNameError = () => {
    if (orgNameError) setOrgNameError('');
  };

  return {
    page,
    pageHistory,
    phone,
    setPhone,
    password,
    setPassword,
    newPassword,
    confirmPassword,
    setConfirmPassword,
    otpCode,
    setOtpCode,
    showPassword,
    setShowPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    loading,
    appLoading,
    timerSeconds,
    passwordSecureLevel,
    organizations,
    selectedOrg,
    setSelectedOrg,
    isLoginFlow,
    setIsLoginFlow,
    isResetFlow,
    setIsResetFlow,
    phoneError,
    passwordError,
    otpError,
    newPasswordError,
    confirmPasswordError,
    otpInputRef,
    fadeAnim,
    slideAnim,
    transitionToPage,
    handleP1Continue,
    handleP3Submit,
    handleP4Verify,
    handleNewPasswordChange,
    handleP5Submit,
    handleOrgSubmit,
    handleSupportContact,
    handleResendOtp,
    startInvitationFlow,
    startForgotPasswordFlow,
    clearPhoneError,
    clearPasswordError,
    clearOtpError,
    clearNewPasswordError,
    clearConfirmPasswordError,
    orgName,
    setOrgName,
    orgNameError,
    handleCreateOrgSubmit,
    clearOrgNameError,
  };
}
