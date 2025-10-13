import api from './api';
import type { LoginCredentials, AuthResponse } from '@/types';

export const authService = {
  login: (credentials: LoginCredentials) =>
    api.post<{ data: AuthResponse }>('/auth/login', credentials),

  logout: () => api.post('/auth/logout'),

  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),

  getProfile: () => api.get('/auth/me'),
};
