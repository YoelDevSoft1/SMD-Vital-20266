/**
 * Roles — fuente única de verdad para metadata de roles.
 *
 * Combina:
 *   - META_ROLES / obtenerMetaRol → etiquetas, iconos, clases de insignia, color
 *   - RUTAS_INICIO / obtenerRutaInicio → ruta de inicio por rol
 *   - esRolAdmin → helpers de permisos
 *   - OPCIONES_ROLES → opciones para selects / filtros
 *
 * Reemplaza versiones divergentes que vivían en Users.tsx y UserDetailsView.tsx.
 */

import {
  Briefcase,
  HeartPulse,
  Shield,
  ShieldCheck,
  Stethoscope,
  User,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '@/types';

export interface MetaRol {
  etiqueta: string;
  etiquetaCorta: string;
  color: string;       // matches `role-{name}` token
  icon: LucideIcon;
  rutaInicio: string;
  /** Clases listas para usar en fondos de insignia (light + dark via tokens) */
  claseInsignia: string;
  /** Clase de color de texto para la insignia */
  claseTexto: string;
}

export const META_ROLES: Record<UserRole, MetaRol> = {
  SUPER_ADMIN: {
    etiqueta: 'Super Administrador',
    etiquetaCorta: 'Super',
    color: 'role-super',
    icon: ShieldCheck,
    rutaInicio: '/',
    claseInsignia: 'bg-role-super-muted text-role-super ring-1 ring-role-super/20',
    claseTexto: 'text-role-super',
  },
  ADMIN: {
    etiqueta: 'Administrador',
    etiquetaCorta: 'Admin',
    color: 'role-admin',
    icon: Shield,
    rutaInicio: '/',
    claseInsignia: 'bg-role-admin-muted text-role-admin ring-1 ring-role-admin/20',
    claseTexto: 'text-role-admin',
  },
  DOCTOR: {
    etiqueta: 'Médico',
    etiquetaCorta: 'Médico',
    color: 'role-doctor',
    icon: Stethoscope,
    rutaInicio: '/doctor',
    claseInsignia: 'bg-role-doctor-muted text-role-doctor ring-1 ring-role-doctor/20',
    claseTexto: 'text-role-doctor',
  },
  NURSE: {
    etiqueta: 'Enfermería',
    etiquetaCorta: 'Enfermera',
    color: 'role-nurse',
    icon: HeartPulse,
    rutaInicio: '/doctor',
    claseInsignia: 'bg-role-nurse-muted text-role-nurse ring-1 ring-role-nurse/20',
    claseTexto: 'text-role-nurse',
  },
  PATIENT: {
    etiqueta: 'Paciente',
    etiquetaCorta: 'Paciente',
    color: 'role-patient',
    icon: User,
    rutaInicio: '/patient',
    claseInsignia: 'bg-role-patient-muted text-role-patient ring-1 ring-role-patient/20',
    claseTexto: 'text-role-patient',
  },
  AGENT: {
    etiqueta: 'Asesor',
    etiquetaCorta: 'Asesor',
    color: 'role-agent',
    icon: Briefcase,
    rutaInicio: '/agent',
    claseInsignia: 'bg-role-agent-muted text-role-agent ring-1 ring-role-agent/20',
    claseTexto: 'text-role-agent',
  },
};

/** Búsqueda segura con fallback neutro. */
export function obtenerMetaRol(rol: string | null | undefined): MetaRol {
  if (!rol) {
    return {
      etiqueta: '—',
      etiquetaCorta: '—',
      color: 'neutral',
      icon: User,
      rutaInicio: '/login',
      claseInsignia: 'bg-neutral-muted text-neutral-muted-foreground',
      claseTexto: 'text-neutral-muted-foreground',
    };
  }
  return (META_ROLES as Record<string, MetaRol>)[rol]
    ?? (META_ROLES as Record<string, MetaRol>)[rol.toUpperCase() as UserRole]
    ?? {
      etiqueta: rol,
      etiquetaCorta: rol,
      color: 'neutral',
      icon: User,
      rutaInicio: '/',
      claseInsignia: 'bg-neutral-muted text-neutral-muted-foreground',
      claseTexto: 'text-neutral-muted-foreground',
    };
}

/** Rutas de inicio por rol (legado — usado en Login/Register). */
export const RUTAS_INICIO: Record<UserRole, string> = {
  SUPER_ADMIN: '/',
  ADMIN: '/',
  DOCTOR: '/doctor',
  NURSE: '/doctor',
  PATIENT: '/patient',
  AGENT: '/agent',
};

export const obtenerRutaInicio = (rol?: UserRole | null) => {
  if (!rol) return '/';
  return RUTAS_INICIO[rol] ?? '/';
};

export const esRolAdmin = (rol?: UserRole | null) =>
  rol === 'ADMIN' || rol === 'SUPER_ADMIN';

/** Opciones para selects / filtros. */
export const OPCIONES_ROLES: Array<{ valor: UserRole; etiqueta: string }> = [
  { valor: 'PATIENT',     etiqueta: 'Paciente' },
  { valor: 'DOCTOR',      etiqueta: 'Médico' },
  { valor: 'NURSE',       etiqueta: 'Enfermería' },
  { valor: 'AGENT',       etiqueta: 'Asesor' },
  { valor: 'ADMIN',       etiqueta: 'Administrador' },
  { valor: 'SUPER_ADMIN', etiqueta: 'Super Administrador' },
];

// Aliases legacy en inglés para mantener compatibilidad con imports existentes
// durante la migración. Se eliminarán una vez todos los archivos usen nombres en español.
export {
  META_ROLES as ROLE_META,
  obtenerMetaRol as getRoleMeta,
  RUTAS_INICIO as ROLE_HOME_PATHS,
  obtenerRutaInicio as getHomePath,
  esRolAdmin as isAdminRole,
  OPCIONES_ROLES as ROLE_OPTIONS,
};