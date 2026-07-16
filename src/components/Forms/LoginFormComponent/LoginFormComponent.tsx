import React from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { loginFormStyles } from './loginFormStyles';
import { Auth } from '../../../interfaces/AuthInterfaces';
import { theme } from '../../../styles/theme';
import {
  PAGE_LABELS,
  useLoginFormLogic,
} from './LoginFormComponentLogic';
import { maskPhone } from '../../../utils/phoneUtils';
import { getStrengthLabelAndColor } from '../../../utils/passwordUtils';
import { sanitizeOtpInput } from '../../../utils/validationUtils';
import PrimaryButton from "../../UI/buttons/primaryButton";
import SecondaryButton from "../../UI/buttons/secondaryButton";

interface LoginFormComponentProps {
  onSubmit: (data: Auth.LogInInterface) => Promise<void> | void;
  onToggleForm: () => void;
}

export default function LoginFormComponent({ onSubmit, onToggleForm }: LoginFormComponentProps) {
  const {
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
    isResetFlow,
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
  } = useLoginFormLogic({ onSubmit });

  const renderBackLink = () => {
    if (pageHistory.length === 0) return null;
    const target = pageHistory[pageHistory.length - 1];

    return (
      <TouchableOpacity
        onPress={() => transitionToPage(target, { isBack: true })}
        activeOpacity={0.7}
        style={loginFormStyles.backLink}
      >
        <Text style={loginFormStyles.backLinkText}>
          ← Volver a {PAGE_LABELS[target]}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderPageContent = () => {
    switch (page) {
      case 0: // P1: Phone entry
        return (
          <>
            <Text style={loginFormStyles.title}>Bienvenido</Text>
            <Text style={loginFormStyles.subtitle}>
              Ingresa tu número de teléfono para continuar.
            </Text>

            <View style={loginFormStyles.inputGroup}>
              <Text style={loginFormStyles.inputLabel}>Tu número de teléfono</Text>
              <View style={[loginFormStyles.inputWrapper, phoneError && loginFormStyles.inputWrapperError]}>

                <Ionicons
                  name="call-outline"
                  size={20}
                  color={phoneError ? theme.colors.error : "rgba(255, 255, 255, 0.6)"}
                  style={loginFormStyles.inputIcon}
                />


                <TextInput
                  style={loginFormStyles.inputText}
                  placeholder="Ej. +52 55 1234 5678"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text);
                    clearPhoneError();
                  }}
                />
                {phoneError &&
                  <Ionicons
                    name="warning-outline"
                    size={24}
                    color="#e6a08f"
                    style={loginFormStyles.inputIcon}
                  />
                }

              </View>
              {phoneError ? (
                <Text style={loginFormStyles.errorText}>{phoneError}</Text>
              ) : (
                <Text style={loginFormStyles.helperText}>
                  Te enviaremos un código para verificar tu número.
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={loginFormStyles.submitButton}
              onPress={handleP1Continue}
              activeOpacity={0.8}
            >
              <Text style={loginFormStyles.submitButtonText}>Continuar</Text>
              <Ionicons
                name="arrow-forward"
                size={20}
                color="#ffffff"
                style={loginFormStyles.buttonArrow}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => transitionToPage(5)} activeOpacity={0.7}>
              <Text style={loginFormStyles.footerLinkText}>
                ¿Problemas para entrar? <Text style={loginFormStyles.footerLinkBold}>Pide ayuda dando click aquí</Text>
              </Text>
            </TouchableOpacity>
          </>
        );

      case 1: // P2: Phone not registered
        return (
          <>
            <Text style={loginFormStyles.title}>Número no encontrado</Text>
            {renderBackLink()}
            <Text style={loginFormStyles.subtitle}>
              Este número aún no tiene una cuenta en Lumera.{"\n"}Elige cómo quieres continuar.
            </Text>

            <TouchableOpacity
              style={loginFormStyles.submitButton}
              onPress={onToggleForm}
              activeOpacity={0.8}
            >
              <Text style={loginFormStyles.submitButtonText}>Registrar mi rancho</Text>
              <Ionicons
                name="arrow-forward"
                size={20}
                color="#ffffff"
                style={loginFormStyles.buttonArrow}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={loginFormStyles.secondaryButton}
              onPress={startInvitationFlow}
              activeOpacity={0.8}
            >
              <Text style={loginFormStyles.secondaryButtonText}>Tengo una invitación</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => transitionToPage(5)}
              activeOpacity={0.7}
              style={{ marginTop: 24 }}
            >
              <Text style={[loginFormStyles.footerLinkText, { marginTop: 0 }]}>
                ¿No es ninguna de estas? <Text style={loginFormStyles.footerLinkBold}>Pide ayuda dando click aquí</Text>
              </Text>
            </TouchableOpacity>
          </>
        );

      case 2: // P3: Enter password
        return (
          <>
            <Text style={loginFormStyles.title}>Ingresar contraseña</Text>
            {renderBackLink()}
            <Text style={loginFormStyles.subtitle}>
              Cuenta · {maskPhone(phone)}
            </Text>

            <View style={loginFormStyles.inputGroup}>
              <Text style={loginFormStyles.inputLabel}>Tu contraseña</Text>
              <View style={loginFormStyles.passwordInputWrapper}>
                <View style={[loginFormStyles.inputWrapper, passwordError && loginFormStyles.inputWrapperError]}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={passwordError ? theme.colors.error : "rgba(255, 255, 255, 0.6)"}
                    style={loginFormStyles.inputIcon}
                  />
                  <TextInput
                    style={[loginFormStyles.inputText, { paddingRight: passwordError ? 70 : 45 }]}
                    placeholder="••••••••"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      clearPasswordError();
                    }}
                  />
                  {passwordError && (
                    <Ionicons
                      name="warning-outline"
                      size={24}
                      color="#e6a08f"
                      style={[loginFormStyles.inputIcon, { marginRight: 24 }]}
                    />
                  )}
                </View>
                <TouchableOpacity
                  style={loginFormStyles.eyeIconWrapper}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="rgba(255, 255, 255, 0.6)"
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? (
                <Text style={loginFormStyles.errorText}>{passwordError}</Text>
              ) : null}

              <TouchableOpacity
                onPress={startForgotPasswordFlow}
                activeOpacity={0.7}
              >
                <Text style={loginFormStyles.forgotPasswordLink}>No recuerdo mi contraseña</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[loginFormStyles.submitButton, loading && { opacity: 0.7 }]}
              onPress={handleP3Submit}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Text style={loginFormStyles.submitButtonText}>Ingresar</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color="#ffffff"
                    style={loginFormStyles.buttonArrow}
                  />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => transitionToPage(5)} activeOpacity={0.7}>
              <Text style={loginFormStyles.footerLinkText}>
                ¿Problemas para entrar? <Text style={loginFormStyles.footerLinkBold}>Pide ayuda dando click aquí</Text>
              </Text>
            </TouchableOpacity>
          </>
        );

      case 3: // P4: Verify code (OTP)
        return (
          <>
            <Text style={loginFormStyles.title}>Verifica tu número</Text>
            {renderBackLink()}
            <Text style={loginFormStyles.subtitle}>
              Enviado a {maskPhone(phone) || 'tu teléfono'}
            </Text>

            <TouchableOpacity
              style={loginFormStyles.otpRow}
              activeOpacity={1}
              onPress={() => otpInputRef.current?.focus()}
            >
              <TextInput
                ref={otpInputRef}
                style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
                keyboardType="number-pad"
                maxLength={6}
                value={otpCode}
                onChangeText={(text) => {
                  setOtpCode(sanitizeOtpInput(text));
                  clearOtpError();
                }}
                autoFocus={true}
              />
              {[0, 1, 2, 3, 4, 5].map((index) => {
                const char = otpCode[index] || '';
                const isFocused = otpCode.length === index;
                return (
                  <View
                    key={index}
                    style={[
                      loginFormStyles.otpBox,
                      isFocused && !otpError && loginFormStyles.otpBoxFocused,
                      otpError && loginFormStyles.otpBoxError,
                    ]}
                  >
                    <Text style={loginFormStyles.otpText}>{char}</Text>
                  </View>
                );
              })}
            </TouchableOpacity>
            {otpError ? (
              <Text style={[loginFormStyles.errorText, { marginBottom: 12 }]}>{otpError}</Text>
            ) : null}

            <View style={{ marginBottom: 20 }}>
              {timerSeconds > 0 ? (
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
                  Reenviar código en 0:{timerSeconds < 10 ? '0' : ''}{timerSeconds}
                </Text>
              ) : (
                <TouchableOpacity onPress={handleResendOtp}>
                  <Text style={{ color: theme.colors.tuscanSun, textDecorationLine: 'underline', fontWeight: 'bold' }}>
                    Reenviar código
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[loginFormStyles.submitButton, loading && { opacity: 0.7 }]}
              onPress={handleP4Verify}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Text style={loginFormStyles.submitButtonText}>Verificar</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color="#ffffff"
                    style={loginFormStyles.buttonArrow}
                  />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => transitionToPage(5)} activeOpacity={0.7}>
              <Text style={loginFormStyles.footerLinkText}>
                ¿No llegó el código? <Text style={loginFormStyles.footerLinkBold}>Pide ayuda</Text>
              </Text>
            </TouchableOpacity>
          </>
        );

      case 4: // P5: Create password
        const strength = getStrengthLabelAndColor(passwordSecureLevel);
        return (
          <>
            <Text style={loginFormStyles.title}>
              {isResetFlow ? 'Restablecer contraseña' : 'Crea tu contraseña'}
            </Text>
            {renderBackLink()}
            <Text style={loginFormStyles.subtitle}>
              {isResetFlow
                ? 'Elige una nueva contraseña segura para tu cuenta.'
                : 'Elige una contraseña segura para proteger tu cuenta.'}
            </Text>

            <View style={loginFormStyles.inputGroup}>
              <Text style={loginFormStyles.inputLabel}>Nueva contraseña</Text>
              <View style={loginFormStyles.passwordInputWrapper}>
                <View style={[loginFormStyles.inputWrapper, newPasswordError && loginFormStyles.inputWrapperError]}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={newPasswordError ? theme.colors.error : "rgba(255, 255, 255, 0.6)"}
                    style={loginFormStyles.inputIcon}
                  />
                  <TextInput
                    style={[loginFormStyles.inputText, { paddingRight: newPasswordError ? 70 : 45 }]}
                    placeholder="••••••••"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    secureTextEntry={!showNewPassword}
                    value={newPassword}
                    onChangeText={(text) => {
                      handleNewPasswordChange(text);
                      clearNewPasswordError();
                    }}
                  />
                  {newPasswordError && (
                    <Ionicons
                      name="warning-outline"
                      size={24}
                      color="#e6a08f"
                      style={[loginFormStyles.inputIcon, { marginRight: 24 }]}
                    />
                  )}
                </View>
                <TouchableOpacity
                  style={loginFormStyles.eyeIconWrapper}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showNewPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="rgba(255, 255, 255, 0.6)"
                  />
                </TouchableOpacity>
              </View>
              {newPasswordError ? (
                <Text style={loginFormStyles.errorText}>{newPasswordError}</Text>
              ) : (
                <Text style={loginFormStyles.helperText}>
                  Mínimo 8 caracteres, una mayúscula y un número.
                </Text>
              )}

              <View style={loginFormStyles.strengthRow}>
                {[1, 2, 3, 4].map((index) => {
                  const isLit = passwordSecureLevel >= index;
                  return (
                    <View
                      key={index}
                      style={[
                        loginFormStyles.strengthBar,
                        isLit && { backgroundColor: strength.color },
                      ]}
                    />
                  );
                })}
              </View>
              {strength.label ? (
                <Text style={[loginFormStyles.strengthText, { color: strength.color }]}>
                  {strength.label}
                </Text>
              ) : null}
            </View>

            <View style={loginFormStyles.inputGroup}>
              <Text style={loginFormStyles.inputLabel}>Confirmar contraseña</Text>
              <View style={loginFormStyles.passwordInputWrapper}>
                <View style={[loginFormStyles.inputWrapper, confirmPasswordError && loginFormStyles.inputWrapperError]}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={confirmPasswordError ? theme.colors.error : "rgba(255, 255, 255, 0.6)"}
                    style={loginFormStyles.inputIcon}
                  />
                  <TextInput
                    style={[loginFormStyles.inputText, { paddingRight: confirmPasswordError ? 70 : 45 }]}
                    placeholder="••••••••"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      clearConfirmPasswordError();
                    }}
                  />
                  {confirmPasswordError && (
                    <Ionicons
                      name="warning-outline"
                      size={24}
                      color="#e6a08f"
                      style={[loginFormStyles.inputIcon, { marginRight: 24 }]}
                    />
                  )}
                </View>
                <TouchableOpacity
                  style={loginFormStyles.eyeIconWrapper}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="rgba(255, 255, 255, 0.6)"
                  />
                </TouchableOpacity>
              </View>
              {confirmPasswordError ? (
                <Text style={loginFormStyles.errorText}>{confirmPasswordError}</Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={[loginFormStyles.submitButton, loading && { opacity: 0.7 }]}
              onPress={handleP5Submit}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Text style={loginFormStyles.submitButtonText}>
                    {isResetFlow ? 'Restablecer contraseña' : 'Crear cuenta'}
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color="#ffffff"
                    style={loginFormStyles.buttonArrow}
                  />
                </>
              )}
            </TouchableOpacity>
          </>
        );

      case 5: // P6: Help / Support
        return (
          <>
            <Text style={loginFormStyles.title}>¿Necesitas ayuda?</Text>
            {renderBackLink()}
            <Text style={loginFormStyles.subtitle}>
              Elige cómo prefieres contactar a soporte. Te respondemos lo antes posible.
            </Text>

            <TouchableOpacity
              style={loginFormStyles.supportCard}
              onPress={() => handleSupportContact('whatsapp')}
              activeOpacity={0.7}
            >
              <View style={loginFormStyles.supportCardContent}>
                <Text style={loginFormStyles.supportCardTitle}>Escribir por WhatsApp</Text>
                <Text style={loginFormStyles.supportCardSubtitle}>Respuesta en minutos</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>

            <TouchableOpacity
              style={loginFormStyles.supportCard}
              onPress={() => handleSupportContact('call')}
              activeOpacity={0.7}
            >
              <View style={loginFormStyles.supportCardContent}>
                <Text style={loginFormStyles.supportCardTitle}>Llamar a soporte</Text>
                <Text style={loginFormStyles.supportCardSubtitle}>Lun a Vie - 9:00 - 18:00</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>

            <TouchableOpacity
              style={loginFormStyles.supportCard}
              onPress={() => handleSupportContact('email')}
              activeOpacity={0.7}
            >
              <View style={loginFormStyles.supportCardContent}>
                <Text style={loginFormStyles.supportCardTitle}>Enviar un correo</Text>
                <Text style={loginFormStyles.supportCardSubtitle}>soporte@lumera.mx</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>

          </>
        );

      case 6: // P7: Choose organization
        return (
          <>
            <Text style={loginFormStyles.title}>¿A cuál rancho vas a entrar hoy?</Text>
            {renderBackLink()}
            <Text style={loginFormStyles.subtitle}>
              {organizations.length === 0 && !appLoading
                ? 'Aun no registras ningun rancho'
                : 'Toca el rancho con el que quieres trabajar. Puedes cambiarlo cuando quieras.'}
            </Text>

            <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={true} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
              {organizations.map((org) => {
                const isSelected = selectedOrg === org.org_id;
                return (
                  <TouchableOpacity
                    key={org.org_id}
                    style={[
                      loginFormStyles.supportCard,
                      isSelected && loginFormStyles.supportCardSelected,
                    ]}
                    onPress={() => setSelectedOrg(org.org_id)}
                    activeOpacity={0.7}
                  >
                    <View style={loginFormStyles.supportCardContent}>
                      <Text style={loginFormStyles.supportCardTitle}>{org.org_name}</Text>
                      <Text style={loginFormStyles.supportCardSubtitle}>{org.role}</Text>
                    </View>
                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={22} color={theme.colors.brightFern} />
                    ) : (
                      <Ionicons name="ellipse-outline" size={22} color="rgba(255,255,255,0.3)" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <PrimaryButton
              text="Entrar"
              onPress={handleOrgSubmit}
              loading={loading}
              disabled={appLoading || organizations.length === 0}
            />
            <SecondaryButton text="+ Registrar un nuevo rancho" onPress={() => transitionToPage(7)} />
          </>
        );

      case 7: // P8: Create organization
        return (
          <>
            <Text style={loginFormStyles.title}>Registrar tu rancho</Text>
            {renderBackLink()}
            <Text style={loginFormStyles.subtitle}>
              Ingresa el nombre de tu nuevo rancho o empresa ganadera para comenzar a gestionarlo.
            </Text>

            <View style={loginFormStyles.inputGroup}>
              <Text style={loginFormStyles.inputLabel}>Nombre del rancho</Text>
              <View style={[loginFormStyles.inputWrapper, orgNameError && loginFormStyles.inputWrapperError]}>
                <Ionicons
                  name="business-outline"
                  size={20}
                  color={orgNameError ? theme.colors.error : "rgba(255, 255, 255, 0.6)"}
                  style={loginFormStyles.inputIcon}
                />
                <TextInput
                  style={[loginFormStyles.inputText, { color: '#ffffff' }]}
                  placeholder="Ej. Rancho El Limonal"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={orgName}
                  onChangeText={(text) => {
                    setOrgName(text);
                    clearOrgNameError();
                  }}
                />
              </View>
              {orgNameError ? (
                <Text style={loginFormStyles.errorText}>{orgNameError}</Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={[loginFormStyles.submitButton, loading && { opacity: 0.7 }]}
              onPress={handleCreateOrgSubmit}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Text style={loginFormStyles.submitButtonText}>Registrar rancho</Text>
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color="#ffffff"
                    style={loginFormStyles.buttonArrow}
                  />
                </>
              )}
            </TouchableOpacity>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Animated.View
      style={[
        loginFormStyles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      {renderPageContent()}
    </Animated.View>
  );
}
