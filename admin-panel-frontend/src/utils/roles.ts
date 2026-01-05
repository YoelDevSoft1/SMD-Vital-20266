import type { UserRole } from '@/types';

export const ROLE_HOME_PATHS: Record<UserRole, string> = {
  SUPER_ADMIN: '/',
  ADMIN: '/',
  DOCTOR: '/doctor',
  NURSE: '/doctor',
  PATIENT: '/patient',
};

export const getHomePath = (role?: UserRole | null) => {
  if (!role) {
    return '/';
  }
  return ROLE_HOME_PATHS[role] ?? '/';
};

export const isAdminRole = (role?: UserRole | null) =>
  role === 'ADMIN' || role === 'SUPER_ADMIN';
