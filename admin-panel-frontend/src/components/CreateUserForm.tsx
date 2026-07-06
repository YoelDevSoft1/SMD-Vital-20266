import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Boton } from '@/components/ui/Boton';
import { Entrada } from '@/components/ui/Entrada';
import { Etiqueta } from '@/components/ui/Etiqueta';
import { adminService } from '@/services/admin.service';
import { OPCIONES_ROLES } from '@/utils/roles';
import type { UserRole } from '@/types';
import toast from 'react-hot-toast';

interface Propiedades {
  alExito: () => void;
  alCancelar: () => void;
}

interface DatosFormulario {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
}

export default function CreateUserForm({ alExito, alCancelar }: Propiedades) {
  const [datos, setDatos] = useState<DatosFormulario>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'PATIENT',
    isActive: true,
    isVerified: false,
  });

  const [errores, setErrores] = useState<Partial<Record<keyof DatosFormulario, string>>>({});

  const crearUsuarioMutacion = useMutation({
    mutationFn: (datosUsuario: DatosFormulario) => adminService.createUser(datosUsuario),
    onSuccess: () => {
      toast.success('Usuario creado exitosamente');
      alExito();
    },
    onError: (e: unknown) =>
      toast.error(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          (e as { message?: string })?.message ??
          'Error al crear usuario',
      ),
  });

  const validar = (): boolean => {
    const nuevosErrores: Partial<Record<keyof DatosFormulario, string>> = {};

    if (!datos.email) {
      nuevosErrores.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(datos.email)) {
      nuevosErrores.email = 'El email no es válido';
    }

    if (!datos.password) {
      nuevosErrores.password = 'La contraseña es requerida';
    } else if (datos.password.length < 8) {
      nuevosErrores.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    if (!datos.firstName?.trim()) nuevosErrores.firstName = 'El nombre es requerido';
    if (!datos.lastName?.trim()) nuevosErrores.lastName = 'El apellido es requerido';

    if (datos.phone && !/^\+?[1-9]\d{6,14}$/.test(datos.phone)) {
      nuevosErrores.phone = 'El teléfono no es válido (ej. +573001234567)';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const alEnviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (validar()) crearUsuarioMutacion.mutate(datos);
  };

  const alCambiar = (campo: keyof DatosFormulario, valor: string | boolean) => {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
    if (errores[campo]) {
      setErrores((prev) => ({ ...prev, [campo]: undefined }));
    }
  };

  return (
    <form onSubmit={alEnviar} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Etiqueta htmlFor="create-firstName" required>
            Nombre
          </Etiqueta>
          <Entrada
            id="create-firstName"
            value={datos.firstName}
            onChange={(e) => alCambiar('firstName', e.target.value)}
            placeholder="Nombre"
            error={errores.firstName}
            autoComplete="given-name"
          />
        </div>
        <div className="space-y-1.5">
          <Etiqueta htmlFor="create-lastName" required>
            Apellido
          </Etiqueta>
          <Entrada
            id="create-lastName"
            value={datos.lastName}
            onChange={(e) => alCambiar('lastName', e.target.value)}
            placeholder="Apellido"
            error={errores.lastName}
            autoComplete="family-name"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Etiqueta htmlFor="create-email" required>
          Email
        </Etiqueta>
        <Entrada
          id="create-email"
          type="email"
          value={datos.email}
          onChange={(e) => alCambiar('email', e.target.value)}
          placeholder="usuario@ejemplo.com"
          error={errores.email}
          autoComplete="email"
        />
      </div>

      <div className="space-y-1.5">
        <Etiqueta htmlFor="create-password" required>
          Contraseña
        </Etiqueta>
        <Entrada
          id="create-password"
          type="password"
          value={datos.password}
          onChange={(e) => alCambiar('password', e.target.value)}
          placeholder="Mínimo 8 caracteres"
          error={errores.password}
          autoComplete="new-password"
        />
      </div>

      <div className="space-y-1.5">
        <Etiqueta htmlFor="create-phone">Teléfono</Etiqueta>
        <Entrada
          id="create-phone"
          type="tel"
          value={datos.phone ?? ''}
          onChange={(e) => alCambiar('phone', e.target.value)}
          placeholder="+573001234567"
          error={errores.phone}
          autoComplete="tel"
        />
      </div>

      <div className="space-y-1.5">
        <Etiqueta htmlFor="create-role" required>
          Rol
        </Etiqueta>
        <select
          id="create-role"
          className="h-11 w-full rounded-lg border border-input bg-card px-3 text-base text-foreground shadow-soft-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:bg-card dark:text-foreground sm:text-sm"
          value={datos.role}
          onChange={(e) => alCambiar('role', e.target.value as UserRole)}
        >
          {OPCIONES_ROLES.map((op) => (
            <option key={op.valor} value={op.valor}>
              {op.etiqueta}
            </option>
          ))}
        </select>
        {errores.role ? (
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            {errores.role}
          </p>
        ) : null}
      </div>

      <fieldset className="space-y-3 rounded-lg border border-border p-3">
        <legend className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Estado de la cuenta
        </legend>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <label
            htmlFor="create-isActive"
            className="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground"
          >
            <input
              type="checkbox"
              id="create-isActive"
              checked={datos.isActive}
              onChange={(e) => alCambiar('isActive', e.target.checked)}
              className="h-4 w-4 rounded border-input text-brand-600 focus:ring-2 focus:ring-ring"
            />
            Usuario activo
          </label>
          <label
            htmlFor="create-isVerified"
            className="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground"
          >
            <input
              type="checkbox"
              id="create-isVerified"
              checked={datos.isVerified}
              onChange={(e) => alCambiar('isVerified', e.target.checked)}
              className="h-4 w-4 rounded border-input text-brand-600 focus:ring-2 focus:ring-ring"
            />
            Usuario verificado
          </label>
        </div>
      </fieldset>

      <div className="flex flex-col-reverse items-stretch gap-2 border-t border-border pt-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end">
        <Boton type="button" variant="outline" onClick={alCancelar} disabled={crearUsuarioMutacion.isPending}>
          Cancelar
        </Boton>
        <Boton type="submit" isLoading={crearUsuarioMutacion.isPending}>
          {crearUsuarioMutacion.isPending ? 'Creando…' : 'Crear usuario'}
        </Boton>
      </div>
    </form>
  );
}