import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Edit2,
  Eye,
  Filter,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users as UsersIcon,
  XCircle,
} from 'lucide-react';
import { adminService } from '@/services/admin.service';
import { User, UserFilters, UserRole } from '@/types';
import { Boton } from '@/components/ui/Boton';
import { Entrada } from '@/components/ui/Entrada';
import { Etiqueta } from '@/components/ui/Etiqueta';
import { Tarjeta, TarjetaContenido, TarjetaEncabezado, TarjetaTitulo } from '@/components/ui/Tarjeta';
import { EsqueletoTabla } from '@/components/ui/Esqueleto';
import { Encabezado } from '@/components/ui/Encabezado';
import { TarjetaEstadistica } from '@/components/ui/TarjetaEstadistica';
import { Insignia } from '@/components/ui/Insignia';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Modal } from '@/components/ui/Modal';
import { Alerta } from '@/components/ui/Alerta';
import { Paginacion } from '@/components/ui/Paginacion';
import { Avatar } from '@/components/ui/Avatar';
import CreateUserForm from '@/components/CreateUserForm';
import UserDetailsView from '@/components/UserDetailsView';
import { EditUserForm } from '@/components/EditUserForm';
import { ExportUsersButton } from '@/components/ExportUsersButton';
import { obtenerMetaRol } from '@/utils/roles';
import { formatearFecha } from '@/utils/formato';
import toast from 'react-hot-toast';

export default function Users() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    limit: 10,
    search: '',
    role: undefined,
    isActive: undefined,
    isVerified: undefined,
  });

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const { data: usersData, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['users', filters],
    queryFn: () => adminService.getUsers(filters),
    staleTime: 30_000,
  });

  const { data: allUsersData } = useQuery({
    queryKey: ['all-users-stats'],
    queryFn: () => adminService.getUsers({ page: 1, limit: 1000 }),
    staleTime: 30_000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminService.updateUserStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Estado del usuario actualizado');
    },
    onError: () => toast.error('Error al actualizar el estado'),
  });

  const verifyUserMutation = useMutation({
    mutationFn: (id: string) => adminService.verifyUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario verificado exitosamente');
    },
    onError: () => toast.error('Error al verificar usuario'),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario eliminado exitosamente');
      setShowDeleteModal(false);
      setSelectedUser(null);
    },
    onError: () => toast.error('Error al eliminar usuario'),
  });

  const handleFilterChange = (key: keyof UserFilters, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleStatusToggle = (user: User) => {
    updateStatusMutation.mutate({ id: user.id, isActive: !user.isActive });
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const handleSelectAll = () => {
    const allUserIds = ((usersData?.data?.data?.data as User[]) ?? []).map((u) => u.id);
    setSelectedUsers(selectedUsers.length === allUserIds.length ? [] : allUserIds);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (selectedUser) deleteUserMutation.mutate(selectedUser.id);
  };

  // Data extraction (defensive against API shape changes)
  const users = (usersData?.data?.data?.data as User[]) ?? [];
  const pagination = usersData?.data?.data?.pagination;
  const totalUsers = pagination?.total ?? 0;
  const allUsers = (allUsersData?.data?.data?.data as User[]) ?? [];
  const allUsersTotal = allUsersData?.data?.data?.pagination?.total ?? 0;
  const activeCount = allUsers.filter((u) => u.isActive).length;
  const verifiedCount = allUsers.filter((u) => u.isVerified).length;

  /* ============================================================
     Error state — full-page friendly alert with retry
     ============================================================ */
  if (error) {
    return (
      <div className="space-y-6">
        <Encabezado title="Gestión de usuarios" />
        <Alerta
          variant="danger"
          title="No se pudieron cargar los usuarios"
          icon={AlertCircle}
          action={
            <Boton
              variant="outline"
              onClick={() => refetch()}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Reintentar
            </Boton>
          }
        >
          Verifica tu conexión o vuelve a intentarlo en unos segundos.
        </Alerta>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Encabezado
        title="Gestión de usuarios"
        subtitle="Administra todos los usuarios de la plataforma SMD Vital."
        actions={
          <>
            <Boton
              variant="outline"
              onClick={() => refetch()}
              isLoading={isFetching}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Actualizar
            </Boton>
            <ExportUsersButton users={users} selectedUsers={selectedUsers} />
            <Boton onClick={() => setShowCreateModal(true)} leftIcon={<UserPlus className="h-4 w-4" />}>
              Crear usuario
            </Boton>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <TarjetaEstadistica label="Total usuarios" value={String(allUsersTotal)} icon={UsersIcon} color="brand" />
        <TarjetaEstadistica label="Activos" value={String(activeCount)} icon={CheckCircle2} color="success" />
        <TarjetaEstadistica label="Verificados" value={String(verifiedCount)} icon={ShieldCheck} color="info" />
        <TarjetaEstadistica
          label="Seleccionados"
          value={String(selectedUsers.length)}
          icon={Filter}
          color={selectedUsers.length > 0 ? 'warning' : 'neutral'}
        />
      </div>

      {/* Filters */}
      <Tarjeta>
        <TarjetaEncabezado>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <TarjetaTitulo className="text-base">Filtros de búsqueda</TarjetaTitulo>
            <Boton
              variant="outline"
              size="sm"
              onClick={() => setShowFilters((p) => !p)}
              leftIcon={<Filter className="h-4 w-4" />}
            >
              {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
            </Boton>
          </div>
        </TarjetaEncabezado>
        {showFilters ? (
          <TarjetaContenido className="pt-0">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <Etiqueta htmlFor="users-search">Buscar</Etiqueta>
                <Entrada
                  id="users-search"
                  placeholder="Nombre, email o teléfono"
                  value={filters.search ?? ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
              <div>
                <Etiqueta htmlFor="users-role">Rol</Etiqueta>
                <select
                  id="users-role"
                  className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground shadow-soft-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:bg-card"
                  value={filters.role ?? ''}
                  onChange={(e) =>
                    handleFilterChange('role', e.target.value ? (e.target.value as UserRole) : undefined)
                  }
                >
                  <option value="">Todos los roles</option>
                  <option value="PATIENT">Paciente</option>
                  <option value="DOCTOR">Médico</option>
                  <option value="NURSE">Enfermero/a</option>
                  <option value="AGENT">Asesor</option>
                  <option value="ADMIN">Administrador</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
              <div>
                <Etiqueta htmlFor="users-status">Estado</Etiqueta>
                <select
                  id="users-status"
                  className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground shadow-soft-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:bg-card"
                  value={filters.isActive === undefined ? '' : String(filters.isActive)}
                  onChange={(e) =>
                    handleFilterChange(
                      'isActive',
                      e.target.value === '' ? undefined : e.target.value === 'true',
                    )
                  }
                >
                  <option value="">Todos</option>
                  <option value="true">Activos</option>
                  <option value="false">Inactivos</option>
                </select>
              </div>
              <div>
                <Etiqueta htmlFor="users-verified">Verificación</Etiqueta>
                <select
                  id="users-verified"
                  className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground shadow-soft-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:bg-card"
                  value={filters.isVerified === undefined ? '' : String(filters.isVerified)}
                  onChange={(e) =>
                    handleFilterChange(
                      'isVerified',
                      e.target.value === '' ? undefined : e.target.value === 'true',
                    )
                  }
                >
                  <option value="">Todos</option>
                  <option value="true">Verificados</option>
                  <option value="false">No verificados</option>
                </select>
              </div>
            </div>
          </TarjetaContenido>
        ) : null}
      </Tarjeta>

      {/* Bulk actions */}
      {selectedUsers.length > 0 ? (
        <Alerta
          variant="info"
          title={`${selectedUsers.length} usuario${selectedUsers.length !== 1 ? 's' : ''} seleccionado${selectedUsers.length !== 1 ? 's' : ''}`}
          action={
            <div className="flex flex-wrap gap-2">
              <Boton
                size="sm"
                variant="success"
                onClick={() => {
                  selectedUsers.forEach((id) =>
                    updateStatusMutation.mutate({ id, isActive: true }),
                  );
                  setSelectedUsers([]);
                }}
                leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
              >
                Activar
              </Boton>
              <Boton
                size="sm"
                variant="danger"
                onClick={() => {
                  selectedUsers.forEach((id) =>
                    updateStatusMutation.mutate({ id, isActive: false }),
                  );
                  setSelectedUsers([]);
                }}
                leftIcon={<XCircle className="h-3.5 w-3.5" />}
              >
                Desactivar
              </Boton>
              <ExportUsersButton users={users} selectedUsers={selectedUsers} />
              <Boton size="sm" variant="outline" onClick={() => setSelectedUsers([])}>
                Cancelar
              </Boton>
            </div>
          }
        />
      ) : null}

      {/* Users list */}
      <Tarjeta>
        <TarjetaEncabezado className="flex flex-row items-center justify-between">
          <div>
            <TarjetaTitulo className="text-base">Lista de usuarios</TarjetaTitulo>
            <p className="mt-1 text-sm text-muted-foreground">
              {isLoading
                ? 'Cargando...'
                : `${totalUsers} usuario${totalUsers !== 1 ? 's' : ''} registrado${totalUsers !== 1 ? 's' : ''}`}
            </p>
          </div>
          {!isLoading && users.length > 0 ? (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <input
                type="checkbox"
                checked={selectedUsers.length === users.length && users.length > 0}
                onChange={handleSelectAll}
                className="h-4 w-4 rounded border-input text-brand-600 focus:ring-2 focus:ring-ring"
                aria-label="Seleccionar todos los usuarios"
              />
              <span>Seleccionar todos</span>
            </label>
          ) : null}
        </TarjetaEncabezado>

        <TarjetaContenido className="p-0">
          {isLoading ? (
            <div className="p-3">
              <EsqueletoTabla rows={8} columns={5} />
            </div>
          ) : users.length === 0 ? (
            <EstadoVacio
              icon={UsersIcon}
              title="No hay usuarios"
              description="No se encontraron usuarios con los filtros aplicados."
              action={
                <Boton
                  variant="primary"
                  onClick={() => setShowCreateModal(true)}
                  leftIcon={<UserPlus className="h-4 w-4" />}
                >
                  Crear usuario
                </Boton>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {users.map((user) => {
                const metaRol = obtenerMetaRol(user.role);
                const RoleIcon = metaRol.icon;
                const roleVariant = `role-${user.role.toLowerCase().replace('_', '-')}` as
                  | 'role-admin'
                  | 'role-super'
                  | 'role-doctor'
                  | 'role-nurse'
                  | 'role-patient'
                  | 'role-agent';
                return (
                  <li
                    key={user.id}
                    className="p-4 transition-colors hover:bg-muted/40 sm:p-6"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <label className="mt-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                          className="h-4 w-4 rounded border-input text-brand-600 focus:ring-2 focus:ring-ring"
                          aria-label={`Seleccionar a ${user.firstName} ${user.lastName}`}
                        />
                      </label>

                      <Avatar
                        name={`${user.firstName} ${user.lastName}`}
                        src={user.avatar}
                        size="lg"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-[200px] flex-1">
                            <h3 className="text-sm font-semibold text-foreground">
                              {user.firstName} {user.lastName}
                            </h3>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                              {user.email ? (
                                <span className="inline-flex items-center gap-1">
                                  <Mail className="h-3 w-3" aria-hidden="true" />
                                  {user.email}
                                </span>
                              ) : null}
                              {user.phone ? (
                                <span className="inline-flex items-center gap-1">
                                  <Phone className="h-3 w-3" aria-hidden="true" />
                                  {user.phone}
                                </span>
                              ) : null}
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="h-3 w-3" aria-hidden="true" />
                                {formatearFecha(user.createdAt)}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-shrink-0 flex-wrap justify-end gap-2">
                            <Insignia variant={roleVariant} size="sm" icon={RoleIcon}>
                              {metaRol.etiqueta}
                            </Insignia>
                            <Insignia
                              variant={user.isActive ? 'success' : 'danger'}
                              size="sm"
                              icon={user.isActive ? CheckCircle2 : XCircle}
                            >
                              {user.isActive ? 'Activo' : 'Inactivo'}
                            </Insignia>
                            <Insignia
                              variant={user.isVerified ? 'info' : 'warning'}
                              size="sm"
                              icon={user.isVerified ? CheckCircle2 : AlertCircle}
                            >
                              {user.isVerified ? 'Verificado' : 'Pendiente'}
                            </Insignia>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Boton
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDetailsModal(true);
                            }}
                            leftIcon={<Eye className="h-3.5 w-3.5" />}
                          >
                            Ver detalles
                          </Boton>
                          <Boton
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowEditModal(true);
                            }}
                            leftIcon={<Edit2 className="h-3.5 w-3.5" />}
                          >
                            Editar
                          </Boton>
                          <Boton
                            size="sm"
                            variant={user.isActive ? 'danger' : 'success'}
                            onClick={() => handleStatusToggle(user)}
                            isLoading={updateStatusMutation.isPending}
                            leftIcon={
                              user.isActive ? (
                                <XCircle className="h-3.5 w-3.5" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              )
                            }
                          >
                            {user.isActive ? 'Desactivar' : 'Activar'}
                          </Boton>
                          {!user.isVerified ? (
                            <Boton
                              size="sm"
                              variant="outline"
                              onClick={() => verifyUserMutation.mutate(user.id)}
                              isLoading={verifyUserMutation.isPending}
                              leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                            >
                              Verificar
                            </Boton>
                          ) : null}
                          <Boton
                            size="sm"
                            variant="danger"
                            onClick={() => handleDeleteUser(user)}
                            leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                          >
                            Eliminar
                          </Boton>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </TarjetaContenido>

        {pagination && pagination.totalPages > 1 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/30 px-4 py-3 sm:px-6">
            <p className="text-sm text-muted-foreground">
              Mostrando{' '}
              <span className="font-medium text-foreground">
                {(filters.page! - 1) * filters.limit! + 1}
              </span>
              –
              <span className="font-medium text-foreground">
                {' '}
                {Math.min(filters.page! * filters.limit!, pagination.total)}
              </span>{' '}
              de <span className="font-medium text-foreground">{pagination.total}</span>
            </p>
            <Paginacion
              page={filters.page!}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        ) : null}
      </Tarjeta>

      {/* Modals */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Crear nuevo usuario"
        size="lg"
        variant="solid"
      >
        <CreateUserForm
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries({ queryKey: ['users'] });
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      <Modal
        open={showDetailsModal && Boolean(selectedUser)}
        onClose={() => setShowDetailsModal(false)}
        title="Detalles del usuario"
        size="lg"
        variant="solid"
      >
        {selectedUser ? <UserDetailsView user={selectedUser} /> : null}
      </Modal>

      <Modal
        open={showEditModal && Boolean(selectedUser)}
        onClose={() => setShowEditModal(false)}
        title="Editar usuario"
        size="lg"
        variant="solid"
      >
        {selectedUser ? (
          <EditUserForm
            user={selectedUser}
            onSuccess={() => {
              setShowEditModal(false);
              queryClient.invalidateQueries({ queryKey: ['users'] });
            }}
            onCancel={() => setShowEditModal(false)}
          />
        ) : null}
      </Modal>

      <Modal
        open={showDeleteModal && Boolean(selectedUser)}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar usuario"
        size="sm"
        variant="solid"
        footer={
          <>
            <Boton variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Boton>
            <Boton
              variant="danger"
              onClick={confirmDelete}
              isLoading={deleteUserMutation.isPending}
              leftIcon={<Trash2 className="h-4 w-4" />}
            >
              Eliminar
            </Boton>
          </>
        }
      >
        <Alerta variant="danger" title="Esta acción no se puede deshacer" icon={AlertCircle}>
          Vas a eliminar a{' '}
          <span className="font-semibold">
            {selectedUser?.firstName} {selectedUser?.lastName}
          </span>
          . Todos sus formData asociados (citas, historiales) quedarán sin acceso.
        </Alerta>
      </Modal>
    </div>
  );
}