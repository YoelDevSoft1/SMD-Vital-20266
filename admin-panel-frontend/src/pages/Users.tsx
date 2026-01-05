import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users as UsersIcon,
  UserPlus,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit2,
  Eye,
  Trash2,
  Mail,
  Phone,
  Calendar,
  Shield,
} from 'lucide-react';
import { adminService } from '@/services/admin.service';
import { User, UserFilters, UserRole } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CreateUserForm from '@/components/CreateUserForm';
import UserDetailsView from '@/components/UserDetailsView';
import { EditUserForm } from '@/components/EditUserForm';
import { ExportUsersButton } from '@/components/ExportUsersButton';
import { cn } from '@/utils/cn';
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

  // Traducciones de roles
  const roleTranslations: Record<UserRole, string> = {
    'SUPER_ADMIN': 'Super Admin',
    'ADMIN': 'Administrador',
    'DOCTOR': 'Médico',
    'NURSE': 'Enfermero/a',
    'PATIENT': 'Paciente',
  };

  // Fetch users for display
  const { data: usersData, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['users', filters],
    queryFn: () => adminService.getUsers(filters),
    staleTime: 30_000,
  });

  // Fetch all users for statistics
  const { data: allUsersData } = useQuery({
    queryKey: ['all-users-stats'],
    queryFn: () => adminService.getUsers({ page: 1, limit: 1000 }),
    staleTime: 30_000,
  });

  // Update user status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminService.updateUserStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Estado del usuario actualizado');
    },
    onError: () => {
      toast.error('Error al actualizar el estado');
    },
  });

  // Verify user mutation
  const verifyUserMutation = useMutation({
    mutationFn: (id: string) => adminService.verifyUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario verificado exitosamente');
    },
    onError: () => {
      toast.error('Error al verificar usuario');
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario eliminado exitosamente');
      setShowDeleteModal(false);
      setSelectedUser(null);
    },
    onError: () => {
      toast.error('Error al eliminar usuario');
    },
  });

  const handleFilterChange = (key: keyof UserFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleStatusToggle = (user: User) => {
    updateStatusMutation.mutate({ id: user.id, isActive: !user.isActive });
  };

  const handleVerifyUser = (user: User) => {
    verifyUserMutation.mutate(user.id);
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    const allUserIds = (usersData?.data?.data?.data as User[])?.map(user => user.id) || [];
    setSelectedUsers(selectedUsers.length === allUserIds.length ? [] : allUserIds);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(selectedUser.id);
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    const colors: Record<UserRole, string> = {
      PATIENT: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
      DOCTOR: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
      NURSE: 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
      ADMIN: 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
      SUPER_ADMIN: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
    };
    return colors[role] || 'bg-gray-50 text-gray-700 border-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
  };

  // Users for display (paginated)
  const users = (usersData?.data?.data?.data as User[]) || [];
  const pagination = usersData?.data?.data?.pagination;
  const totalUsers = pagination?.total || 0;

  // All users for statistics
  const allUsers = (allUsersData?.data?.data?.data as User[]) || [];
  const allUsersTotal = allUsersData?.data?.data?.pagination?.total || 0;

  // Debug logging
  console.log('Users Debug:', {
    hasUsersData: !!usersData,
    hasAllUsersData: !!allUsersData,
    usersCount: users.length,
    allUsersCount: allUsers.length,
    allUsersTotal: allUsersTotal,
    activeUsers: allUsers.filter(u => u.isActive).length,
    verifiedUsers: allUsers.filter(u => u.isVerified).length,
    pagination: pagination,
    totalUsers: totalUsers
  });

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de usuarios</h1>
        </div>
        <Card className="border border-red-200 bg-red-50/60 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="flex flex-col gap-4 p-6 text-sm">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div>
                <h2 className="text-lg font-semibold text-red-700 dark:text-red-300">No se pudo cargar los usuarios</h2>
                <p className="text-red-600 dark:text-red-400">
                  Verifica tu conexión o vuelve a intentarlo en unos segundos.
                </p>
              </div>
            </div>
            <div>
              <Button 
                variant="outline" 
                onClick={() => refetch()}
                className="dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
              >
                <RefreshCw className="h-4 w-4" />
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de usuarios</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Administra todos los usuarios de la plataforma SMD Vital
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => refetch()}
            isLoading={isFetching}
            disabled={isFetching}
            className="dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
          >
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
            Actualizar
          </Button>
          <ExportUsersButton
            users={users}
            selectedUsers={selectedUsers}
          />
          <Button onClick={() => setShowCreateModal(true)}>
            <UserPlus className="h-4 w-4" />
            Crear usuario
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border border-gray-200 shadow-sm dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total usuarios</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{allUsersTotal}</p>
              </div>
              <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-3">
                <UsersIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Activos</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                  {allUsers.filter(u => u.isActive).length}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Verificados</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                  {allUsers.filter(u => u.isVerified).length}
                </p>
              </div>
              <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/20 p-3">
                <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Seleccionados</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                  {selectedUsers.length}
                </p>
              </div>
              <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-3">
                <Filter className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border border-gray-200 shadow-sm dark:border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Filtros de búsqueda
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <Input
                    placeholder="Nombre, email o teléfono"
                    value={filters.search || ''}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rol
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  value={filters.role || ''}
                  onChange={(e) => handleFilterChange('role', e.target.value || undefined)}
                >
                  <option value="">Todos los roles</option>
                  <option value="PATIENT">Paciente</option>
                  <option value="DOCTOR">Médico</option>
                  <option value="NURSE">Enfermero/a</option>
                  <option value="ADMIN">Administrador</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  value={filters.isActive === undefined ? '' : filters.isActive.toString()}
                  onChange={(e) => handleFilterChange('isActive', e.target.value === '' ? undefined : e.target.value === 'true')}
                >
                  <option value="">Todos</option>
                  <option value="true">Activos</option>
                  <option value="false">Inactivos</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Verificación
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  value={filters.isVerified === undefined ? '' : filters.isVerified.toString()}
                  onChange={(e) => handleFilterChange('isVerified', e.target.value === '' ? undefined : e.target.value === 'true')}
                >
                  <option value="">Todos</option>
                  <option value="true">Verificados</option>
                  <option value="false">No verificados</option>
                </select>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <Card className="border border-indigo-200 bg-indigo-50/60 dark:border-indigo-800 dark:bg-indigo-900/20 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-indigo-900 dark:text-indigo-300">
                  {selectedUsers.length} usuario{selectedUsers.length !== 1 ? 's' : ''} seleccionado{selectedUsers.length !== 1 ? 's' : ''}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      selectedUsers.forEach(userId => {
                        updateStatusMutation.mutate({ id: userId, isActive: true });
                      });
                      setSelectedUsers([]);
                    }}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Activar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      selectedUsers.forEach(userId => {
                        updateStatusMutation.mutate({ id: userId, isActive: false });
                      });
                      setSelectedUsers([]);
                    }}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Desactivar
                  </Button>
                  <ExportUsersButton
                    users={users}
                    selectedUsers={selectedUsers}
                  />
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedUsers([])}
                className="text-gray-600 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Grid */}
      <Card className="border border-gray-200 shadow-sm dark:border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Lista de usuarios
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isLoading ? 'Cargando...' : `${totalUsers} usuario${totalUsers !== 1 ? 's' : ''} registrado${totalUsers !== 1 ? 's' : ''}`}
            </p>
          </div>
          {!isLoading && users.length > 0 && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedUsers.length === users.length && users.length > 0}
                onChange={handleSelectAll}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">Seleccionar todos</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Cargando usuarios...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                <UsersIcon className="h-6 w-6 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-white">No hay usuarios</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                No se encontraron usuarios con los filtros aplicados.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="p-6 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                    />

                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {user.avatar ? (
                        <img
                          className="h-12 w-12 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-600"
                          src={user.avatar}
                          alt={`${user.firstName} ${user.lastName}`}
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center ring-2 ring-gray-100 dark:ring-gray-600">
                          <span className="text-base font-semibold text-white">
                            {user.firstName[0]}{user.lastName[0]}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {user.firstName} {user.lastName}
                          </h3>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                            {user.email && (
                              <span className="inline-flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {user.email}
                              </span>
                            )}
                            {user.phone && (
                              <span className="inline-flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {user.phone}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(user.createdAt.toString())}
                            </span>
                          </div>
                        </div>

                        {/* Status Badges */}
                        <div className="flex flex-wrap gap-2 justify-end">
                          <span className={cn(
                            'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                            getRoleBadgeColor(user.role)
                          )}>
                            <Shield className="h-3 w-3" />
                            {roleTranslations[user.role as keyof typeof roleTranslations] || user.role}
                          </span>
                          <span className={cn(
                            'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                            user.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800'
                              : 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800'
                          )}>
                            {user.isActive ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            {user.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                          <span className={cn(
                            'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                            user.isVerified
                              ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
                              : 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800'
                          )}>
                            {user.isVerified ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <AlertCircle className="h-3 w-3" />
                            )}
                            {user.isVerified ? 'Verificado' : 'Pendiente'}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDetailsModal(true);
                          }}
                          className="dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Ver detalles
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowEditModal(true);
                          }}
                          className="dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusToggle(user)}
                          disabled={updateStatusMutation.isPending}
                          className={user.isActive 
                            ? 'text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 dark:border-gray-600 dark:hover:bg-gray-700' 
                            : 'text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 dark:border-gray-600 dark:hover:bg-gray-700'
                          }
                        >
                          {user.isActive ? (
                            <>
                              <XCircle className="h-3.5 w-3.5" />
                              Desactivar
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Activar
                            </>
                          )}
                        </Button>
                        {!user.isVerified && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVerifyUser(user)}
                            disabled={verifyUserMutation.isPending}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 dark:border-gray-600 dark:hover:bg-gray-700"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Verificar
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteUser(user)}
                          className="text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 dark:border-gray-600 dark:hover:bg-gray-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Mostrando{' '}
                <span className="font-medium text-gray-900 dark:text-white">
                  {((filters.page! - 1) * filters.limit!) + 1}
                </span>
                {' '}-{' '}
                <span className="font-medium text-gray-900 dark:text-white">
                  {Math.min(filters.page! * filters.limit!, pagination.total)}
                </span>
                {' '}de{' '}
                <span className="font-medium text-gray-900 dark:text-white">{pagination.total}</span>
                {' '}resultados
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.page! - 1)}
                  disabled={!pagination.hasPrev}
                  className="dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  Anterior
                </Button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let page;
                  if (pagination.totalPages <= 5) {
                    page = i + 1;
                  } else if (filters.page! <= 3) {
                    page = i + 1;
                  } else if (filters.page! >= pagination.totalPages - 2) {
                    page = pagination.totalPages - 4 + i;
                  } else {
                    page = filters.page! - 2 + i;
                  }
                  return (
                    <Button
                      key={page}
                      variant={page === filters.page ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className={page === filters.page ? '' : 'dark:text-white dark:border-gray-600 dark:hover:bg-gray-700'}
                    >
                      {page}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.page! + 1)}
                  disabled={!pagination.hasNext}
                  className="dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Modals */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl">
            <Card className="border border-gray-200 dark:border-gray-700 shadow-2xl">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                    Crear nuevo usuario
                  </CardTitle>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <CreateUserForm
                  onSuccess={() => {
                    setShowCreateModal(false);
                    queryClient.invalidateQueries({ queryKey: ['users'] });
                  }}
                  onCancel={() => setShowCreateModal(false)}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl">
            <Card className="border border-gray-200 dark:border-gray-700 shadow-2xl">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                    Detalles del usuario
                  </CardTitle>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <UserDetailsView user={selectedUser} />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl">
            <Card className="border border-gray-200 dark:border-gray-700 shadow-2xl">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                    Editar usuario
                  </CardTitle>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <EditUserForm
                  user={selectedUser}
                  onSuccess={() => {
                    setShowEditModal(false);
                    queryClient.invalidateQueries({ queryKey: ['users'] });
                  }}
                  onCancel={() => setShowEditModal(false)}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md">
            <Card className="border border-red-200 dark:border-red-800 shadow-2xl">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                    <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                    Eliminar usuario
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ¿Estás seguro de que quieres eliminar a{' '}
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {selectedUser.firstName} {selectedUser.lastName}
                      </span>
                      ? Esta acción no se puede deshacer.
                    </p>
                  </div>
                  <div className="mt-6 flex justify-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteModal(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={confirmDelete}
                      disabled={deleteUserMutation.isPending}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {deleteUserMutation.isPending ? 'Eliminando...' : 'Eliminar usuario'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}
