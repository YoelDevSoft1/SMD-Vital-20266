import { User, UserRole } from '@/types';

interface UserDetailsViewProps {
  user: User;
}

export default function UserDetailsView({ user }: UserDetailsViewProps) {
  const getRoleBadgeColor = (role: UserRole) => {
    const colors: Record<UserRole, string> = {
      PATIENT: 'bg-blue-100 text-blue-800',
      DOCTOR: 'bg-green-100 text-green-800',
      NURSE: 'bg-purple-100 text-purple-800',
      ADMIN: 'bg-orange-100 text-orange-800',
      SUPER_ADMIN: 'bg-red-100 text-red-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (role: UserRole) => {
    const labels: Record<UserRole, string> = {
      PATIENT: 'Paciente',
      DOCTOR: 'Médico',
      NURSE: 'Enfermero/a',
      ADMIN: 'Administrador',
      SUPER_ADMIN: 'Super Administrador',
    };
    return labels[role] || role;
  };

  return (
    <div className="space-y-6">
      {/* User Header */}
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0 h-16 w-16">
          {user.avatar ? (
            <img
              className="h-16 w-16 rounded-full"
              src={user.avatar}
              alt={`${user.firstName} ${user.lastName}`}
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-xl font-medium text-gray-700">
                {user.firstName[0]}{user.lastName[0]}
              </span>
            </div>
          )}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {user.firstName} {user.lastName}
          </h2>
          <p className="text-gray-600">{user.email}</p>
          <div className="flex items-center space-x-2 mt-1">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
              {getRoleLabel(user.role)}
            </span>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {user.isActive ? 'Activo' : 'Inactivo'}
            </span>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              user.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {user.isVerified ? 'Verificado' : 'Pendiente'}
            </span>
          </div>
        </div>
      </div>

      {/* User Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Información Personal</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-500">Nombre completo</label>
              <p className="mt-1 text-sm text-gray-900">{user.firstName} {user.lastName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Email</label>
              <p className="mt-1 text-sm text-gray-900">{user.email}</p>
            </div>
            {user.phone && (
              <div>
                <label className="block text-sm font-medium text-gray-500">Teléfono</label>
                <p className="mt-1 text-sm text-gray-900">{user.phone}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-500">Rol</label>
              <p className="mt-1 text-sm text-gray-900">{getRoleLabel(user.role)}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Estado de la Cuenta</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-500">Estado</label>
              <p className={`mt-1 text-sm font-medium ${
                user.isActive ? 'text-green-600' : 'text-red-600'
              }`}>
                {user.isActive ? 'Activo' : 'Inactivo'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Verificación</label>
              <p className={`mt-1 text-sm font-medium ${
                user.isVerified ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {user.isVerified ? 'Verificado' : 'Pendiente de verificación'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Fecha de registro</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(user.createdAt).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Última actualización</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(user.updatedAt).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Información Adicional</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">ID del Usuario</h4>
            <p className="text-sm text-gray-600 font-mono">{user.id}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Avatar</h4>
            <p className="text-sm text-gray-600">
              {user.avatar ? 'Imagen personalizada' : 'Avatar por defecto'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
