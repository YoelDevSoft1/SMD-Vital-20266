import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import type { User, UserRole } from '@/types';
import { Insignia } from '@/components/ui/Insignia';
import { Avatar } from '@/components/ui/Avatar';
import { obtenerMetaRol } from '@/utils/roles';
import { formatearFechaHora } from '@/utils/formato';

interface UserDetailsViewProps {
  user: User;
}

const ROLE_VARIANT: Record<UserRole, 'role-admin' | 'role-super' | 'role-doctor' | 'role-nurse' | 'role-patient' | 'role-agent'> = {
  SUPER_ADMIN: 'role-super',
  ADMIN: 'role-admin',
  DOCTOR: 'role-doctor',
  NURSE: 'role-nurse',
  PATIENT: 'role-patient',
  AGENT: 'role-agent',
};

export default function UserDetailsView({ user }: UserDetailsViewProps) {
  const metaRol = obtenerMetaRol(user.role);
  const RoleIcon = metaRol.icon;
  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        <Avatar name={fullName} src={user.avatar} size="xl" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-semibold text-foreground">{fullName}</h2>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{user.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Insignia variant={ROLE_VARIANT[user.role]} size="md" icon={RoleIcon}>
              {metaRol.etiqueta}
            </Insignia>
            <Insignia
              variant={user.isActive ? 'success' : 'danger'}
              size="md"
              icon={user.isActive ? CheckCircle2 : XCircle}
            >
              {user.isActive ? 'Activo' : 'Inactivo'}
            </Insignia>
            <Insignia
              variant={user.isVerified ? 'info' : 'warning'}
              size="md"
              icon={user.isVerified ? CheckCircle2 : AlertCircle}
            >
              {user.isVerified ? 'Verificado' : 'Pendiente'}
            </Insignia>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="space-y-4">
          <h3 className="text-base font-medium text-foreground">Información personal</h3>
          <dl className="space-y-3 text-sm">
            <DetailRow label="Nombre completo" value={fullName} />
            <DetailRow label="Email" value={user.email} />
            {user.phone ? <DetailRow label="Teléfono" value={user.phone} /> : null}
            <DetailRow label="Rol" value={metaRol.etiqueta} />
          </dl>
        </section>

        <section className="space-y-4">
          <h3 className="text-base font-medium text-foreground">Estado de la cuenta</h3>
          <dl className="space-y-3 text-sm">
            <DetailRow
              label="Estado"
              value={
                <span className={user.isActive ? 'text-success' : 'text-danger'}>
                  {user.isActive ? 'Activo' : 'Inactivo'}
                </span>
              }
            />
            <DetailRow
              label="Verificación"
              value={
                <span className={user.isVerified ? 'text-success' : 'text-warning'}>
                  {user.isVerified ? 'Verificado' : 'Pendiente de verificación'}
                </span>
              }
            />
            <DetailRow label="Fecha de registro" value={formatearFechaHora(user.createdAt)} />
            <DetailRow label="Última actualización" value={formatearFechaHora(user.updatedAt)} />
          </dl>
        </section>
      </div>

      {/* Metadata */}
      <section className="border-t border-border pt-6">
        <h3 className="text-base font-medium text-foreground">Información adicional</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-muted p-4">
            <h4 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              ID del Usuario
            </h4>
            <p className="break-all font-mono text-xs text-foreground">{user.id}</p>
          </div>
          <div className="rounded-lg bg-muted p-4">
            <h4 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Avatar
            </h4>
            <p className="text-sm text-foreground">
              {user.avatar ? 'Imagen personalizada' : 'Avatar por defecto (iniciales)'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <dt className="w-32 flex-shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}