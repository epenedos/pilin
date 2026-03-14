import api from './client';
import { User } from '../types';

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateCurrencyRequest {
  currency: string;
}

export const userApi = {
  async getProfile(): Promise<User> {
    const { data } = await api.get('/users/me');
    return data;
  },

  async changePassword(request: ChangePasswordRequest): Promise<void> {
    await api.put('/users/me/password', request);
  },

  async updateCurrency(request: UpdateCurrencyRequest): Promise<User> {
    const { data } = await api.put('/users/me/currency', request);
    return data;
  },
};
