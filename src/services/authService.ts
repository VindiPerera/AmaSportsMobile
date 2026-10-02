import { apiClient } from './apiClient';
import {
  ApiSuccessResponse,
  AuthTokenPayload,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  User,
} from '../types';

/** All calls to the `/auth/*` and `/user` endpoints live here. */
export const authService = {
  async register(payload: RegisterPayload) {
    const { data } = await apiClient.post<ApiSuccessResponse<AuthTokenPayload>>(
      '/auth/register',
      payload
    );
    return data.data;
  },

  async login(payload: LoginPayload) {
    const { data } = await apiClient.post<ApiSuccessResponse<AuthTokenPayload>>(
      '/auth/login',
      payload
    );
    return data.data;
  },

  async logout() {
    await apiClient.post('/auth/logout');
  },

  async forgotPassword(payload: ForgotPasswordPayload) {
    const { data } = await apiClient.post<ApiSuccessResponse<null>>(
      '/auth/forgot-password',
      payload
    );
    return data.message;
  },

  async resetPassword(payload: ResetPasswordPayload) {
    const { data } = await apiClient.post<ApiSuccessResponse<null>>(
      '/auth/reset-password',
      payload
    );
    return data.message;
  },

  /** Permanently deletes the account and all player data (Google Play account-deletion requirement). */
  async deleteAccount(password: string) {
    await apiClient.delete('/user', { data: { password } });
  },

  async fetchProfile() {
    const { data } = await apiClient.get<ApiSuccessResponse<User>>('/user');
    return data.data;
  },
};
