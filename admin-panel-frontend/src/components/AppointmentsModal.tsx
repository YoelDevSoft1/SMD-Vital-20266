import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Calendar, Clock, User, Stethoscope, MapPin, Filter, Search, Plus, Edit, Trash2, Eye, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { toast } from 'react-hot-toast';
import { adminService } from '@/services/admin.service';
import type { Appointment, Doctor, Patient, Service } from '@/types';
import AppointmentDetailsView from './AppointmentDetailsView';
import CreateAppointmentForm from './CreateAppointmentForm';
import { GlassModal } from '@/components/ui/GlassModal';

interface AppointmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AppointmentFilters {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  doctorId?: string;
  patientId?: string;
  serviceId?: string;
  dateFrom?: string;
  dateTo?: string;
}

const statusTranslations = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  IN_PROGRESS: 'En Progreso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'No Asistió',
  RESCHEDULED: 'Reprogramada'
};

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  NO_SHOW: 'bg-gray-100 text-gray-800',
  RESCHEDULED: 'bg-orange-100 text-orange-800'
};

export default function AppointmentsModal({ isOpen, onClose }: AppointmentsModalProps) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<AppointmentFilters>({
    page: 1,
    limit: 10,
    search: '',
    status: '',
    doctorId: '',
    patientId: '',
    serviceId: '',
    dateFrom: '',
    dateTo: ''
  });
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  // Fetch appointments
  const { data: appointmentsData, isLoading, error } = useQuery({
    queryKey: ['appointments', filters],
    queryFn: () => adminService.getAppointments(filters),
    enabled: isOpen
  });

  // Fetch doctors for filters
  const { data: doctorsData } = useQuery({
    queryKey: ['doctors-for-appointments'],
    queryFn: () => adminService.getDoctors({ page: 1, limit: 100 }),
    enabled: isOpen
  });

  // Fetch patients for filters
  const { data: patientsData } = useQuery({
    queryKey: ['patients-for-appointments'],
    queryFn: () => adminService.getPatients({ page: 1, limit: 100 }),
    enabled: isOpen
  });

  // Fetch services for filters
  const { data: servicesData } = useQuery({
    queryKey: ['services-for-appointments'],
    queryFn: () => adminService.getServices({ page: 1, limit: 100 }),
    enabled: isOpen
  });

  // Update appointment status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminService.updateAppointmentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Estado de cita actualizado');
    },
    onError: () => {
      toast.error('Error al actualizar estado');
    }
  });

  // Delete appointment mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Cita eliminada');
    },
    onError: () => {
      toast.error('Error al eliminar cita');
    }
  });

  const handleFilterChange = (key: keyof AppointmentFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleStatusUpdate = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta cita?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowDetails(true);
  };

  const handleEdit = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowEditForm(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <AlertCircle className="w-4 h-4" />;
      case 'CONFIRMED': return <CheckCircle className="w-4 h-4" />;
      case 'IN_PROGRESS': return <RefreshCw className="w-4 h-4" />;
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />;
      case 'CANCELLED': return <XCircle className="w-4 h-4" />;
      case 'NO_SHOW': return <XCircle className="w-4 h-4" />;
      case 'RESCHEDULED': return <RefreshCw className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xl sm:p-6">
      <div className="relative flex h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl border border-white/30 bg-white/80 shadow-[0_25px_80px_-20px_rgba(15,118,230,0.45)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-0 opacity-50">
          <div className="absolute -left-24 top-12 h-56 w-56 rounded-full bg-cyan-400/30 blur-3xl" />
          <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-blue-500/25 blur-3xl" />
        </div>
        <div className="relative flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Gestión de Citas</h2>
          </div>
          <Button variant="ghost" onClick={onClose}>
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Buscar citas..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Estado</Label>
              <select
                id="status"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos los estados</option>
                {Object.entries(statusTranslations).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="doctor">Doctor</Label>
              <select
                id="doctor"
                value={filters.doctorId}
                onChange={(e) => handleFilterChange('doctorId', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos los doctores</option>
                {(doctorsData?.data?.data as Doctor[])?.map((doctor: Doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.user.firstName} {doctor.user.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="patient">Paciente</Label>
              <select
                id="patient"
                value={filters.patientId}
                onChange={(e) => handleFilterChange('patientId', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos los pacientes</option>
                {(patientsData?.data?.data as Patient[])?.map((patient: Patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.user.firstName} {patient.user.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="dateFrom">Desde</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="dateTo">Hasta</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end mt-4">
            <div className="flex items-center space-x-2">
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4" />
                Nueva Cita
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600">Cargando citas...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <XCircle className="w-8 h-8 mx-auto mb-4 text-red-600" />
                <p className="text-red-600">Error al cargar las citas</p>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto">
              <div className="p-6">
                {(appointmentsData?.data?.data as Appointment[])?.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay citas</h3>
                    <p className="text-gray-600">No se encontraron citas con los filtros aplicados.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(appointmentsData?.data?.data as Appointment[])?.map((appointment: Appointment) => (
                      <div key={appointment.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[appointment.status as keyof typeof statusColors]}`}>
                                {getStatusIcon(appointment.status)}
                                <span className="ml-1">{statusTranslations[appointment.status as keyof typeof statusTranslations]}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">{formatDate(appointment.scheduledAt)}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">{appointment.duration} min</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Stethoscope className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">{appointment.doctor?.user?.firstName} {appointment.doctor?.user?.lastName}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">{appointment.patient?.user?.firstName} {appointment.patient?.user?.lastName}</span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 mb-4">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">{appointment.address}, {appointment.city}</span>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="text-lg font-semibold text-gray-900">
                                {formatCurrency(appointment.totalPrice)}
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewDetails(appointment)}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  Ver
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(appointment)}
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Editar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(appointment.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Eliminar
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {appointmentsData?.data?.data?.pagination && appointmentsData.data.data.pagination.totalPages > 1 && (
          <div className="border-t p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando{' '}
                <span className="font-medium">
                  {((filters.page! - 1) * filters.limit!) + 1}
                </span>{' '}
                a{' '}
                <span className="font-medium">
                  {Math.min(filters.page! * filters.limit!, appointmentsData.data.data.pagination.total)}
                </span>{' '}
                de{' '}
                <span className="font-medium">{appointmentsData.data.data.pagination.total}</span>{' '}
                resultados
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.page! - 1)}
                  disabled={!appointmentsData.data.data.pagination.hasPrev}
                >
                  Anterior
                </Button>
                {Array.from({ length: appointmentsData.data.data.pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={page === filters.page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.page! + 1)}
                  disabled={!appointmentsData.data.data.pagination.hasNext}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Modals */}
      {showDetails && selectedAppointment && (
        <AppointmentDetailsView
          appointment={selectedAppointment}
          onClose={() => {
            setShowDetails(false);
            setSelectedAppointment(null);
          }}
          onEdit={() => {
            setShowDetails(false);
            setShowEditForm(true);
          }}
        />
      )}

      {showEditForm && selectedAppointment && (
        <CreateAppointmentForm
          isOpen={showEditForm}
          onClose={() => {
            setShowEditForm(false);
            setSelectedAppointment(null);
          }}
          appointment={selectedAppointment}
        />
      )}

      {showCreateForm && (
        <CreateAppointmentForm
          isOpen={showCreateForm}
          onClose={() => {
            setShowCreateForm(false);
          }}
        />
      )}
    </div>
  );
}
