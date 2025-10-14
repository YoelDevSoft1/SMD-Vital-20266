import api from './api';
import type { LoginCredentials, AuthResponse } from '@/types';

export interface RegisterCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
}

export const authService = {
  login: (credentials: LoginCredentials) =>
    api.post<{ success: boolean; message: string; data: AuthResponse }>('/auth/login', credentials),

  register: (credentials: RegisterCredentials) =>
    api.post<{ success: boolean; message: string; data: AuthResponse }>('/auth/register', credentials),

  logout: () => api.post('/auth/logout'),

  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),

  getProfile: () => api.get('/auth/me'),
};
