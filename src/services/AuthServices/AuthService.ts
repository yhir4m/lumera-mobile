import { apiClient } from '../../lib/apiClient';
import { Auth } from '../../interfaces/AuthInterfaces';
import { AxiosResponse } from 'axios';  
import { withLoader } from '../../context/LoaderContext';
import { supabase } from '../../lib/supabase';

// Helper to simulate network delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Helper to create a mocked AxiosResponse
const createMockResponse = <T>(data: T): AxiosResponse<T> => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {} as any,
});

// Helper to create a mocked standard_error
const createMockError = (code: string, message: string, details: any[] = []) => {
  return Promise.reject({
    message: 'Request failed with status code 400',
    response: {
      data: {
        error: {
          code,
          message,
          details,
          correlation_id: 'corr_mock_' + Math.random().toString(36).substring(7)
        }
      }
    }
  });
};

export const authService = {
  checkPhoneExistence: (phone: string): Promise<AxiosResponse<Auth.CheckPhoneResponse>> =>
    withLoader(() => apiClient.post('/auth/check-phone', { phone })),

  verifyCode: (phone: string, code: string): Promise<AxiosResponse<Auth.VerifyCodeResponse>> =>
    withLoader(() => apiClient.post('/auth/verify-code', { phone, code })),

  setPassword: (phone: string, code: string, password: string): Promise<AxiosResponse<Auth.SetPasswordResponse>> =>
    withLoader(() => apiClient.post('/auth/set-password', { phone, code, password })),

  passwordLogin: (phone: string, password: string): Promise<AxiosResponse<Auth.LoginResponse>> =>
    withLoader(() => apiClient.post('/auth/login', { phone, password })),

  me: (): Promise<AxiosResponse<any>> =>
    withLoader(() => apiClient.get('/me')),

  signIn: (email: string, display_name: string, first_name: string, paternal_last_name_string: string, maternal_last_name: string, phone: string, status: Auth.ProfileStatus): Promise<AxiosResponse<Auth.SignInInterface>> =>
    withLoader(async () => {
      await delay(800);
      return createMockResponse({
        email,
        display_name,
        first_name,
        paternal_last_name: paternal_last_name_string,
        maternal_last_name,
        phone,
        status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }),

  register: (data: Auth.RegisterRequest): Promise<AxiosResponse<Auth.RegisterResponse>> =>
    withLoader(async () => {
      await delay(800);
      return createMockResponse({
        message: 'Registrado correctamente (MOCK)',
        otp_ttl_seconds: 60
      });
    }),

  sendOtp: (data: Auth.SendOtpRequest): Promise<AxiosResponse<Auth.SendOtpResponse>> =>
    withLoader(async () => {
      await delay(800);
      return createMockResponse({
        success: true,
        otp_ttl_seconds: 60
      });
    }),

  verifyOtp: (data: Auth.VerifyOtpRequest): Promise<AxiosResponse<Auth.VerifyOtpResponse>> =>
    withLoader(async () => {
      await delay(800);
      return createMockResponse({
        verified: data.code === '123456',
        temp_token: 'mock-temp-token'
      });
    }),

  resetPassword: (data: Auth.ResetPasswordRequest): Promise<AxiosResponse<Auth.ResetPasswordResponse>> =>
    withLoader(async () => {
      await delay(800);
      return createMockResponse({
        success: true,
        message: 'Password reset successfully (MOCK)'
      });
    })
};
