import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  CalendarPlus,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit2,
  Eye,
  Trash2,
  Clock,
  MapPin,
  DollarSign,
  Activity,
  TrendingUp,
  CalendarCheck,
} from 'lucide-react';
import { adminService } from '@/services/admin.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppointmentsModal from '@/components/AppointmentsModal';
import CreateAppointmentForm from '@/components/CreateAppointmentForm';
import AppointmentDetailsView from '@/components/AppointmentDetailsView';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import type { AppointmentFilters, AppointmentStatus } from '@/types';

const statusTranslations: Record<AppointmentStatus, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  IN_PROGRESS: 'En Progreso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'No Asistió',
  RESCHEDULED: 'Reprogramada',
};

const statusColors: Record<AppointmentStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
  CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
  IN_PROGRESS: 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800',
  NO_SHOW: 'bg-gray-50 text-gray-700 border-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
  RESCHEDULED: 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
};

export default function Appointments() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<AppointmentFilters>({
    page: 1,
    limit: 10,
    search: '',
  });

  const [showModal, setShowModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAppointments, setSelectedAppointments] = useState<string[]>([]);

  // Fetch appointments
  const { data: appointmentsData, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['appointments', filters],
    queryFn: () => adminService.getAppointments(filters),
    staleTime: 30_000,
  });

  // Fetch dashboard stats
  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => adminService.getDashboard(),
  });

  // Delete appointment mutation
  const deleteAppointmentMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Cita eliminada exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar cita');
    },
  });

  const handleFilterChange = (key: keyof AppointmentFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleViewDetails = (appointment: any) => {
    setSelectedAppointment(appointment);
    setShowDetails(true);
  };

  const handleDeleteAppointment = (appointment: any) => {
    if (confirm(`¿Estás seguro de que quieres eliminar la cita con ${appointment.patient?.user?.firstName}?`)) {
      deleteAppointmentMutation.mutate(appointment.id);
    }
  };

  const handleSelectAppointment = (appointmentId: string) => {
    setSelectedAppointments(prev =>
      prev.includes(appointmentId)
        ? prev.filter(id => id !== appointmentId)
        : [...prev, appointmentId]
    );
  };

  const handleSelectAll = () => {
    const allIds = appointments.map((a: any) => a.id);
    setSelectedAppointments(selectedAppointments.length === allIds.length ? [] : allIds);
  };

  const appointments = (appointmentsData?.data?.data as any)?.data || [];
  const pagination = (appointmentsData?.data?.data as any)?.pagination;
  const totalAppointments = pagination?.total || 0;

  // Stats from dashboard
  const stats = (dashboardData?.data?.data as any);
  const totalCitas = stats?.overview?.totalAppointments || 0;
  const pendientes = stats?.appointments?.pending || 0;
  const completadas = stats?.appointments?.completed || 0;
  const tasaExito = stats?.appointments?.completionRate || 0;

  // Debug logging
  console.log('Appointments Debug:', {
    hasDashboardData: !!dashboardData,
    stats: stats,
    totalCitas: totalCitas,
    pendientes: pendientes,
    completadas: completadas,
    tasaExito: tasaExito
  });

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de citas</h1>
        </div>
        <Card className="border border-red-200 bg-red-50/60 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="flex flex-col gap-4 p-6 text-sm">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div>
                <h2 className="text-lg font-semibold text-red-700 dark:text-red-300">No se pudo cargar las citas</h2>
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
                <RefreshCw className="mr-2 h-4 w-4" />
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de citas</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Administra todas las citas médicas del sistema SMD Vital
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
            <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />
            Actualizar
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowModal(true)}
            className="dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Ver todas
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <CalendarPlus className="mr-2 h-4 w-4" />
            Nueva cita
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-gray-200 shadow-sm dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total citas</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{totalCitas}</p>
              </div>
              <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-3">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pendientes</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{pendientes}</p>
              </div>
              <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-3">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completadas</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{completadas}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-3">
                <CalendarCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tasa de éxito</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                  {tasaExito.toFixed(1)}<span className="text-sm text-gray-500 dark:text-gray-400">%</span>
                </p>
              </div>
              <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/20 p-3">
                <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
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
              <Filter className="mr-2 h-4 w-4" />
              {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <Input
                    placeholder="Paciente, doctor, servicio..."
                    value={filters.search || ''}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value ? e.target.value as AppointmentStatus : undefined)}
                >
                  <option value="">Todos los estados</option>
                  <option value="PENDING">Pendiente</option>
                  <option value="CONFIRMED">Confirmada</option>
                  <option value="IN_PROGRESS">En Progreso</option>
                  <option value="COMPLETED">Completada</option>
                  <option value="CANCELLED">Cancelada</option>
                  <option value="NO_SHOW">No Asistió</option>
                  <option value="RESCHEDULED">Reprogramada</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Resultados por página
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  value={filters.limit}
                  onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Bulk Actions */}
      {selectedAppointments.length > 0 && (
        <Card className="border border-indigo-200 bg-indigo-50/60 dark:border-indigo-800 dark:bg-indigo-900/20 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-indigo-900 dark:text-indigo-300">
                  {selectedAppointments.length} cita{selectedAppointments.length !== 1 ? 's' : ''} seleccionada{selectedAppointments.length !== 1 ? 's' : ''}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedAppointments([])}
                className="text-gray-600 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointments Grid */}
      <Card className="border border-gray-200 shadow-sm dark:border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Lista de citas
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isLoading ? 'Cargando...' : `${totalAppointments} cita${totalAppointments !== 1 ? 's' : ''} registrada${totalAppointments !== 1 ? 's' : ''}`}
            </p>
          </div>
          {!isLoading && appointments.length > 0 && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedAppointments.length === appointments.length && appointments.length > 0}
                onChange={handleSelectAll}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">Seleccionar todas</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Cargando citas...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                <Calendar className="h-6 w-6 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-white">No hay citas</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                No se encontraron citas con los filtros aplicados.
              </p>
              <div className="mt-6">
                <Button onClick={() => setShowCreateForm(true)}>
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  Crear primera cita
                </Button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {appointments.map((appointment: any) => (
                <div
                  key={appointment.id}
                  className="p-6 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedAppointments.includes(appointment.id)}
                      onChange={() => handleSelectAppointment(appointment.id)}
                      className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                    />

                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center ring-2 ring-gray-100 dark:ring-gray-600">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                    </div>

                    {/* Appointment Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                              {appointment.patient?.user?.firstName} {appointment.patient?.user?.lastName}
                            </h3>
                            <span className="text-xs text-gray-500 dark:text-gray-400">→</span>
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              Dr. {appointment.doctor?.user?.firstName} {appointment.doctor?.user?.lastName}
                            </span>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                            <span className="inline-flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              {appointment.service?.name || 'Servicio no especificado'}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDateTime(appointment.scheduledAt)}
                            </span>
                            {appointment.location && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {appointment.location}
                              </span>
                            )}
                          </div>

                          {/* Additional Info */}
                          {appointment.totalAmount && (
                            <div className="mt-2 flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                <DollarSign className="h-4 w-4" />
                                {formatCurrency(appointment.totalAmount)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Status Badge */}
                        <div className="flex flex-wrap gap-2 justify-end">
                          <span className={cn(
                            'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                            statusColors[appointment.status as keyof typeof statusColors] || 'bg-gray-50 text-gray-700 border-gray-100'
                          )}>
                            {appointment.status === 'COMPLETED' && <CheckCircle2 className="h-3 w-3" />}
                            {appointment.status === 'CANCELLED' && <XCircle className="h-3 w-3" />}
                            {appointment.status === 'PENDING' && <Clock className="h-3 w-3" />}
                            {statusTranslations[appointment.status as keyof typeof statusTranslations] || appointment.status}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(appointment)}
                          className="dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          Ver detalles
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setShowCreateForm(true);
                          }}
                          className="dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
                        >
                          <Edit2 className="mr-1.5 h-3.5 w-3.5" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteAppointment(appointment)}
                          className="text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 dark:border-gray-600 dark:hover:bg-gray-700"
                        >
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
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
                  {((filters.page || 1) - 1) * (filters.limit || 10) + 1}
                </span>
                {' '}-{' '}
                <span className="font-medium text-gray-900 dark:text-white">
                  {Math.min((filters.page || 1) * (filters.limit || 10), pagination.total)}
                </span>
                {' '}de{' '}
                <span className="font-medium text-gray-900 dark:text-white">{pagination.total}</span>
                {' '}resultados
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange((filters.page || 1) - 1)}
                  disabled={!pagination.hasPrev}
                  className="dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  Anterior
                </Button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const currentPage = filters.page || 1;
                  let page;
                  if (pagination.totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= pagination.totalPages - 2) {
                    page = pagination.totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={page}
                      variant={page === currentPage ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className={page === currentPage ? '' : 'dark:text-white dark:border-gray-600 dark:hover:bg-gray-700'}
                    >
                      {page}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange((filters.page || 1) + 1)}
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
      {showModal && (
        <AppointmentsModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      )}

      {showCreateForm && (
        <CreateAppointmentForm
          isOpen={showCreateForm}
          onClose={() => {
            setShowCreateForm(false);
            setSelectedAppointment(null);
          }}
        />
      )}

      {showDetails && selectedAppointment && (
        <AppointmentDetailsView
          appointment={selectedAppointment}
          onClose={() => {
            setShowDetails(false);
            setSelectedAppointment(null);
          }}
          onEdit={() => {
            setShowDetails(false);
            setShowCreateForm(true);
          }}
        />
      )}
    </div>
  );
}

function formatDateTime(dateString: string) {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
