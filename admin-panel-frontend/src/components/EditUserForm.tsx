import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Boton } from '@/components/ui/Boton';
import { Entrada } from '@/components/ui/Entrada';
import { Etiqueta } from '@/components/ui/Etiqueta';
import { Interruptor } from '@/components/ui/Interruptor';
import { PickerSelect, type PickerSelectOption } from '@/components/ui/PickerSelect';
import { adminService } from '@/services/admin.service';
import { OPCIONES_ROLES } from '@/utils/roles';
import type { User, UserRole } from '@/types';
import { toast } from 'react-hot-toast';

const OPCIONES_ROL_PICKER: PickerSelectOption[] = OPCIONES_ROLES.map((op) => ({
  value: op.valor,
  label: op.etiqueta,
}));

interface UsuarioEditable {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
}

interface Propiedades {
  user: User;
  alExito: () => void;
  alCancelar: () => void;
}

interface DatosFormulario {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
}

export const EditUserForm: React.FC<Propiedades> = ({ user, alExito, alCancelar }) => {
  const [datos, setDatos] = useState<DatosFormulario>({
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone ?? '',
    role: (user.role as UserRole) ?? 'PATIENT',
    isActive: user.isActive,
    isVerified: user.isVerified,
  });
  const [errores, setErrores] = useState<Partial<Record<keyof DatosFormulario, string>>>({});

  const queryClient = useQueryClient();

  const actualizarUsuarioMutacion = useMutation({
    mutationFn: (payload: DatosFormulario) => adminService.updateUser(user.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario actualizado exitosamente');
      alExito();
    },
    onError: (e: unknown) =>
      toast.error(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Error al actualizar usuario',
      ),
  });

  const validar = (): boolean => {
    const nuevosErrores: Partial<Record<keyof DatosFormulario, string>> = {};
    if (!datos.firstName.trim()) nuevosErrores.firstName = 'El nombre es requerido';
    if (!datos.lastName.trim()) nuevosErrores.lastName = 'El apellido es requerido';
    if (!datos.email.trim()) nuevosErrores.email = 'El email es requerido';
    else if (!/\S+@\S+\.\S+/.test(datos.email)) nuevosErrores.email = 'El email no es válido';
    if (datos.phone && !/^\+?[1-9]\d{6,14}$/.test(datos.phone)) {
      nuevosErrores.phone = 'El teléfono no es válido';
    }
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const alEnviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (validar()) actualizarUsuarioMutacion.mutate(datos);
  };

  const alCambiar = (campo: keyof DatosFormulario, valor: string | boolean) => {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
    if (errores[campo]) {
      setErrores((prev) => ({ ...prev, [campo]: undefined }));
    }
  };

  return (
    <form onSubmit={alEnviar} className="space-y-6" noValidate>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Etiqueta htmlFor="edit-firstName" required>
            Nombre
          </Etiqueta>
          <Entrada
            id="edit-firstName"
            value={datos.firstName}
            onChange={(e) => alCambiar('firstName', e.target.value)}
            error={errores.firstName}
            autoComplete="given-name"
          />
        </div>

        <div className="space-y-1.5">
          <Etiqueta htmlFor="edit-lastName" required>
            Apellido
          </Etiqueta>
          <Entrada
            id="edit-lastName"
            value={datos.lastName}
            onChange={(e) => alCambiar('lastName', e.target.value)}
            error={errores.lastName}
            autoComplete="family-name"
          />
        </div>

        <div className="space-y-1.5">
          <Etiqueta htmlFor="edit-email" required>
            Correo electrónico
          </Etiqueta>
          <Entrada
            id="edit-email"
            type="email"
            value={datos.email}
            onChange={(e) => alCambiar('email', e.target.value)}
            error={errores.email}
            autoComplete="email"
          />
        </div>

        <div className="space-y-1.5">
          <Etiqueta htmlFor="edit-phone">Teléfono</Etiqueta>
          <Entrada
            id="edit-phone"
            type="tel"
            value={datos.phone}
            onChange={(e) => alCambiar('phone', e.target.value)}
            error={errores.phone}
            autoComplete="tel"
          />
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <PickerSelect
            id="edit-role"
            label="Rol"
            required
            value={datos.role}
            onChange={(value) => alCambiar('role', value as UserRole)}
            options={OPCIONES_ROL_PICKER}
            error={errores.role}
          />
        </div>
      </div>

      <fieldset className="space-y-4 rounded-lg border border-border p-4">
        <legend className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Estado de la cuenta
        </legend>

        <div className="flex items-center justify-between gap-3">
          <div>
            <Etiqueta htmlFor="edit-isActive">Usuario activo</Etiqueta>
            <p className="text-sm text-muted-foreground">El usuario puede iniciar sesión.</p>
          </div>
          <Interruptor
            id="edit-isActive"
            checked={datos.isActive}
            onCheckedChange={(checked) => alCambiar('isActive', checked)}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <Etiqueta htmlFor="edit-isVerified">Usuario verificado</Etiqueta>
            <p className="text-sm text-muted-foreground">
              El usuario ha confirmado su correo electrónico.
            </p>
          </div>
          <Interruptor
            id="edit-isVerified"
            checked={datos.isVerified}
            onCheckedChange={(checked) => alCambiar('isVerified', checked)}
          />
        </div>
      </fieldset>

      <div className="flex flex-col-reverse items-stretch gap-2 border-t border-border pt-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end">
        <Boton type="button" variant="outline" onClick={alCancelar}>
          Cancelar
        </Boton>
        <Boton type="submit" isLoading={actualizarUsuarioMutacion.isPending}>
          {actualizarUsuarioMutacion.isPending ? 'Actualizando…' : 'Actualizar usuario'}
        </Boton>
      </div>
    </form>
  );
};