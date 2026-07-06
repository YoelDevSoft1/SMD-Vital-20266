import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Stethoscope,
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
  Star,
  Award,
  Clock,
  DollarSign,
  GraduationCap,
} from 'lucide-react';
import { adminService } from '@/services/admin.service';
import { Doctor, DoctorFilters } from '@/types';
import { Boton } from '@/components/ui/Boton';
import { Entrada } from '@/components/ui/Entrada';
import { Tarjeta, TarjetaContenido, TarjetaEncabezado, TarjetaTitulo } from '@/components/ui/Tarjeta';
import { EsqueletoTabla } from '@/components/ui/Esqueleto';
import { Etiqueta } from '@/components/ui/Etiqueta';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { PickerSelect, type PickerSelectOption } from '@/components/ui/PickerSelect';
import CreateDoctorForm from '@/components/CreateDoctorForm';
import DoctorDetailsView from '@/components/DoctorDetailsView';
import { EditDoctorForm } from '@/components/EditDoctorForm';
import { ExportDoctorsButton } from '@/components/ExportDoctorsButton';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

export default function Doctors() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<DoctorFilters>({
    page: 1,
    limit: 10,
    search: '',
    specialty: undefined,
    isAvailable: undefined,
    rating: undefined,
    experience: undefined,
  });

  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Especialidades médicas en español
  const specialties = [
    'Medicina General',
    'Cardiología',
    'Dermatología',
    'Endocrinología',
    'Gastroenterología',
    'Ginecología',
    'Neurología',
    'Oftalmología',
    'Ortopedia',
    'Pediatría',
    'Psiquiatría',
    'Radiología',
    'Urología',
    'Anestesiología',
    'Cirugía General',
    'Medicina Interna',
    'Oncología',
    'Reumatología',
    'Neumología',
    'Hematología'
  ];

  const ESPECIALIDADES_OPCIONES: PickerSelectOption[] = specialties.map((s) => ({
    value: s,
    label: s,
  }));

  const DISPONIBILIDAD_OPCIONES: PickerSelectOption[] = [
    { value: 'true', label: 'Disponibles' },
    { value: 'false', label: 'No disponibles' },
  ];

  const EXPERIENCIA_OPCIONES: PickerSelectOption[] = [
    { value: '1', label: '1+ años' },
    { value: '3', label: '3+ años' },
    { value: '5', label: '5+ años' },
    { value: '10', label: '10+ años' },
    { value: '15', label: '15+ años' },
  ];

  // Fetch doctors for display
  const { data: doctorsData, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['doctors', filters],
    queryFn: () => adminService.getDoctors(filters),
    staleTime: 30_000,
  });

  // Fetch all doctors for statistics
  const { data: allDoctorsData } = useQuery({
    queryKey: ['all-doctors-stats'],
    queryFn: () => adminService.getDoctors({ page: 1, limit: 1000 }),
    staleTime: 30_000,
  });

  // Update doctor availability mutation
  const updateAvailabilityMutation = useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      adminService.updateDoctorAvailability(id, isAvailable),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      toast.success('Disponibilidad actualizada exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar disponibilidad');
    },
  });

  // Delete doctor mutation
  const deleteDoctorMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteDoctor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      toast.success('Doctor eliminado exitosamente');
      setShowDeleteModal(false);
      setSelectedDoctor(null);
    },
    onError: () => {
      toast.error('Error al eliminar doctor');
    },
  });

  const handleFilterChange = (key: keyof DoctorFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleAvailabilityToggle = (doctor: Doctor) => {
    updateAvailabilityMutation.mutate({ id: doctor.id, isAvailable: !doctor.isAvailable });
  };

  const handleSelectDoctor = (doctorId: string) => {
    setSelectedDoctors(prev =>
      prev.includes(doctorId)
        ? prev.filter(id => id !== doctorId)
        : [...prev, doctorId]
    );
  };

  const handleSelectAll = () => {
    const allDoctorIds = (doctorsData?.data?.data?.data as Doctor[])?.map(doctor => doctor.id) || [];
    setSelectedDoctors(selectedDoctors.length === allDoctorIds.length ? [] : allDoctorIds);
  };

  const handleDeleteDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (selectedDoctor) {
      deleteDoctorMutation.mutate(selectedDoctor.id);
    }
  };

  const getSpecialtyBadgeColor = (specialty: string) => {
    const colors = {
      'Medicina General': 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
      'Cardiología': 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
      'Dermatología': 'bg-pink-50 text-pink-700 border-pink-100 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-800',
      'Endocrinología': 'bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800',
      'Gastroenterología': 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
      'Ginecología': 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
      'Neurología': 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800',
      'Oftalmología': 'bg-cyan-50 text-cyan-700 border-cyan-100 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800',
      'Ortopedia': 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
      'Pediatría': 'bg-teal-50 text-teal-700 border-teal-100 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-800',
    };
    return colors[specialty as keyof typeof colors] || 'bg-muted text-foreground border-border dark:bg-card dark:text-muted-foreground dark:border-border';
  };

  // Doctors for display (paginated)
  const doctors = (doctorsData?.data?.data?.data as Doctor[]) || [];
  const pagination = doctorsData?.data?.data?.pagination;
  const totalDoctors = pagination?.total || 0;

  // All doctors for statistics
  const allDoctors = (allDoctorsData?.data?.data?.data as Doctor[]) || [];
  const allDoctorsTotal = allDoctorsData?.data?.data?.pagination?.total || 0;

  // Calculate stats from all doctors
  const availableDoctors = allDoctors.filter(d => d.isAvailable).length;
  const avgRating = allDoctors.length > 0
    ? allDoctors.reduce((acc, d) => acc + d.rating, 0) / allDoctors.length
    : 0;
  const totalReviews = allDoctors.reduce((acc, d) => acc + (d.totalReviews || 0), 0);

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold text-foreground dark:text-foreground">Gestión de doctores</h1>
        </div>
        <Tarjeta className="border border-red-200 bg-red-50/60 dark:border-red-800 dark:bg-red-900/20">
          <TarjetaContenido className="flex flex-col gap-4 p-6 text-sm">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div>
                <h2 className="text-lg font-semibold text-red-700 dark:text-red-300">No se pudo cargar los doctores</h2>
                <p className="text-red-600 dark:text-red-400">
                  Verifica tu conexión o vuelve a intentarlo en unos segundos.
                </p>
              </div>
            </div>
            <div>
              <Boton variant="outline" onClick={() => refetch()} className="dark:text-foreground dark:border-border dark:hover:bg-muted">
                <RefreshCw className="h-4 w-4" />
                Reintentar
              </Boton>
            </div>
          </TarjetaContenido>
        </Tarjeta>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground dark:text-foreground">Gestión de doctores</h1>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
            Administra el equipo médico de la plataforma SMD Vital
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Boton
            variant="outline"
            onClick={() => refetch()}
            isLoading={isFetching}
            disabled={isFetching}
            className="dark:text-foreground dark:border-border dark:hover:bg-muted"
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />
            Actualizar
          </Boton>
          <ExportDoctorsButton
            doctors={doctors}
            selectedDoctors={selectedDoctors}
          />
          <Boton onClick={() => setShowCreateModal(true)}>
            <UserPlus className="h-4 w-4" />
            Crear doctor
          </Boton>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Tarjeta className="border border-border shadow-sm dark:border-border">
          <TarjetaContenido className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">Total doctores</p>
                <p className="mt-2 text-2xl font-semibold text-foreground dark:text-foreground">{allDoctorsTotal}</p>
              </div>
              <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-3">
                <Stethoscope className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </TarjetaContenido>
        </Tarjeta>

        <Tarjeta className="border border-border shadow-sm dark:border-border">
          <TarjetaContenido className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">Disponibles</p>
                <p className="mt-2 text-2xl font-semibold text-foreground dark:text-foreground">{availableDoctors}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </TarjetaContenido>
        </Tarjeta>

        <Tarjeta className="border border-border shadow-sm dark:border-border">
          <TarjetaContenido className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">Calificación promedio</p>
                <p className="mt-2 text-2xl font-semibold text-foreground dark:text-foreground">
                  {avgRating.toFixed(1)} <span className="text-sm text-muted-foreground dark:text-muted-foreground">/5</span>
                </p>
              </div>
              <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-3">
                <Star className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </TarjetaContenido>
        </Tarjeta>

        <Tarjeta className="border border-border shadow-sm dark:border-border">
          <TarjetaContenido className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">Total reseñas</p>
                <p className="mt-2 text-2xl font-semibold text-foreground dark:text-foreground">{totalReviews}</p>
              </div>
              <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/20 p-3">
                <Award className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </TarjetaContenido>
        </Tarjeta>
      </div>

      {/* Filters */}
      <Tarjeta className="border border-border shadow-sm dark:border-border">
        <TarjetaEncabezado>
          <div className="flex items-center justify-between">
            <TarjetaTitulo className="text-lg font-semibold text-foreground dark:text-foreground">
              Filtros de búsqueda
            </TarjetaTitulo>
            <Boton
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="dark:text-foreground dark:border-border dark:hover:bg-muted"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
            </Boton>
          </div>
        </TarjetaEncabezado>
        {showFilters && (
          <TarjetaContenido className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground dark:text-muted-foreground mb-2">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-muted-foreground" />
                  <Entrada
                    placeholder="Nombre, especialidad, licencia..."
                    value={filters.search || ''}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <PickerSelect
                  id="doctors-specialty"
                  label="Especialidad"
                  value={filters.specialty || ''}
                  onChange={(v) => handleFilterChange('specialty', v || undefined)}
                  options={ESPECIALIDADES_OPCIONES}
                  placeholder="Todas las especialidades"
                  variant="glass"
                  title="Filtrar por especialidad"
                />
              </div>
              <div>
                <PickerSelect
                  id="doctors-availability"
                  label="Disponibilidad"
                  value={filters.isAvailable === undefined ? '' : filters.isAvailable.toString()}
                  onChange={(v) => handleFilterChange('isAvailable', v === '' ? undefined : v === 'true')}
                  options={DISPONIBILIDAD_OPCIONES}
                  placeholder="Todos"
                  variant="glass"
                  title="Filtrar por disponibilidad"
                />
              </div>
              <div>
                <PickerSelect
                  id="doctors-experience"
                  label="Experiencia (años)"
                  value={filters.experience?.toString() || ''}
                  onChange={(v) => handleFilterChange('experience', v ? parseInt(v, 10) : undefined)}
                  options={EXPERIENCIA_OPCIONES}
                  placeholder="Cualquier experiencia"
                  variant="glass"
                  title="Filtrar por experiencia"
                />
              </div>
            </div>
          </TarjetaContenido>
        )}
      </Tarjeta>

      {/* Bulk Actions */}
      {selectedDoctors.length > 0 && (
        <Tarjeta className="border border-indigo-200 bg-indigo-50/60 dark:border-indigo-800 dark:bg-indigo-900/20 shadow-sm">
          <TarjetaContenido className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-indigo-900 dark:text-indigo-300">
                  {selectedDoctors.length} doctor{selectedDoctors.length !== 1 ? 'es' : ''} seleccionado{selectedDoctors.length !== 1 ? 's' : ''}
                </span>
                <div className="flex gap-2">
                  <Boton
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      selectedDoctors.forEach(doctorId => {
                        updateAvailabilityMutation.mutate({ id: doctorId, isAvailable: true });
                      });
                      setSelectedDoctors([]);
                    }}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Activar
                  </Boton>
                  <Boton
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      selectedDoctors.forEach(doctorId => {
                        updateAvailabilityMutation.mutate({ id: doctorId, isAvailable: false });
                      });
                      setSelectedDoctors([]);
                    }}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/20 dark:hover:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Desactivar
                  </Boton>
                  <ExportDoctorsButton
                    doctors={doctors}
                    selectedDoctors={selectedDoctors}
                  />
                </div>
              </div>
              <Boton
                size="sm"
                variant="outline"
                onClick={() => setSelectedDoctors([])}
                className="text-muted-foreground dark:text-foreground dark:border-border dark:hover:bg-muted"
              >
                Cancelar
              </Boton>
            </div>
          </TarjetaContenido>
        </Tarjeta>
      )}

      {/* Doctors Grid */}
      <Tarjeta className="overflow-hidden border border-border shadow-sm dark:border-border">
        <TarjetaEncabezado className="flex flex-row items-center justify-between">
          <div>
            <TarjetaTitulo className="text-lg font-semibold text-foreground dark:text-foreground">
              Lista de doctores
            </TarjetaTitulo>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
              {isLoading ? 'Cargando...' : `${totalDoctors} doctor${totalDoctors !== 1 ? 'es' : ''} registrado${totalDoctors !== 1 ? 's' : ''}`}
            </p>
          </div>
          {!isLoading && doctors.length > 0 && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedDoctors.length === doctors.length && doctors.length > 0}
                onChange={handleSelectAll}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-border rounded cursor-pointer"
              />
              <span className="text-sm text-muted-foreground dark:text-muted-foreground">Seleccionar todos</span>
            </div>
          )}
        </TarjetaEncabezado>
        <TarjetaContenido className="p-0">
          {isLoading ? (
            <div className="p-3">
              <EsqueletoTabla rows={8} columns={5} />
            </div>
          ) : doctors.length === 0 ? (
            <EstadoVacio
              icon={Stethoscope}
              title="No hay doctores"
              description="No se encontraron doctores con los filtros aplicados."
              action={
                <Boton
                  variant="primary"
                  onClick={() => setShowCreateModal(true)}
                  leftIcon={<UserPlus className="h-4 w-4" />}
                >
                  Crear doctor
                </Boton>
              }
              size="md"
            />
          ) : (
            <div className="divide-y divide-border dark:divide-border">
              {doctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="p-6 hover:bg-muted/50 dark:hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedDoctors.includes(doctor.id)}
                      onChange={() => handleSelectDoctor(doctor.id)}
                      className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-border rounded cursor-pointer"
                    />

                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {doctor.user.avatar ? (
                        <img
                          className="h-14 w-14 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-600"
                          src={doctor.user.avatar}
                          alt={`Dr. ${doctor.user.firstName} ${doctor.user.lastName}`}
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center ring-2 ring-gray-100 dark:ring-gray-600">
                          <span className="text-lg font-semibold text-white">
                            {doctor.user.firstName[0]}{doctor.user.lastName[0]}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Doctor Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex-1 min-w-[200px]">
                          <h3 className="text-base font-semibold text-foreground dark:text-foreground">
                            Dr. {doctor.user.firstName} {doctor.user.lastName}
                          </h3>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground dark:text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <GraduationCap className="h-3 w-3" />
                              {doctor.licenseNumber}
                            </span>
                            {doctor.user.email && (
                              <span className="inline-flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {doctor.user.email}
                              </span>
                            )}
                            {doctor.user.phone && (
                              <span className="inline-flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {doctor.user.phone}
                              </span>
                            )}
                          </div>

                          {/* Additional Info */}
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                            <span className="inline-flex items-center gap-1 text-muted-foreground dark:text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span className="font-medium">{doctor.experience}</span> años exp.
                            </span>
                            <span className="inline-flex items-center gap-1 text-muted-foreground dark:text-muted-foreground">
                              <DollarSign className="h-4 w-4" />
                              <span className="font-medium">${doctor.consultationFee.toLocaleString()}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                              <Star className="h-4 w-4 fill-amber-400 dark:fill-amber-500" />
                              <span className="font-medium">{doctor.rating.toFixed(1)}</span>
                              <span className="text-muted-foreground dark:text-muted-foreground">({doctor.totalReviews})</span>
                            </span>
                          </div>
                        </div>

                        {/* Status Badges */}
                        <div className="flex flex-shrink-0 flex-wrap gap-2 justify-end">
                          <span className={cn(
                            'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                            getSpecialtyBadgeColor(doctor.specialty)
                          )}>
                            <Stethoscope className="h-3 w-3" />
                            {doctor.specialty}
                          </span>
                          <span className={cn(
                            'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                            doctor.isAvailable
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800'
                              : 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800'
                          )}>
                            {doctor.isAvailable ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            {doctor.isAvailable ? 'Disponible' : 'No disponible'}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Boton
                          variant="outline"
                          onClick={() => {
                            setSelectedDoctor(doctor);
                            setShowDetailsModal(true);
                          }}
                          leftIcon={<Eye className="h-4 w-4" />}
                          className="dark:text-foreground dark:border-border dark:hover:bg-muted"
                        >
                          Ver detalles
                        </Boton>
                        <Boton
                          variant="outline"
                          onClick={() => {
                            setSelectedDoctor(doctor);
                            setShowEditModal(true);
                          }}
                          leftIcon={<Edit2 className="h-4 w-4" />}
                          className="dark:text-foreground dark:border-border dark:hover:bg-muted"
                        >
                          Editar
                        </Boton>
                        <Boton
                          variant="outline"
                          onClick={() => handleAvailabilityToggle(doctor)}
                          isLoading={updateAvailabilityMutation.isPending}
                          leftIcon={
                            doctor.isAvailable ? (
                              <XCircle className="h-4 w-4" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )
                          }
                          className={doctor.isAvailable
                            ? 'text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 dark:border-border dark:hover:bg-muted'
                            : 'text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 dark:border-border dark:hover:bg-muted'
                          }
                        >
                          {doctor.isAvailable ? 'Desactivar' : 'Activar'}
                        </Boton>
                        <Boton
                          variant="outline"
                          onClick={() => handleDeleteDoctor(doctor)}
                          leftIcon={<Trash2 className="h-4 w-4" />}
                          className="text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 dark:border-border dark:hover:bg-muted"
                        >
                          Eliminar
                        </Boton>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TarjetaContenido>

        {/* Paginacion */}
        {pagination && pagination.totalPages > 1 && (
          <div className="border-t border-border dark:border-border bg-muted dark:bg-card px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                Mostrando{' '}
                <span className="font-medium text-foreground dark:text-foreground">
                  {((filters.page! - 1) * filters.limit!) + 1}
                </span>
                {' '}-{' '}
                <span className="font-medium text-foreground dark:text-foreground">
                  {Math.min(filters.page! * filters.limit!, pagination.total)}
                </span>
                {' '}de{' '}
                <span className="font-medium text-foreground dark:text-foreground">{pagination.total}</span>
                {' '}resultados
              </div>
              <div className="flex gap-2">
                <Boton
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.page! - 1)}
                  disabled={!pagination.hasPrev}
                  className="dark:text-foreground dark:border-border dark:hover:bg-muted"
                >
                  Anterior
                </Boton>
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
                    <Boton
                      key={page}
                      variant={page === filters.page ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className={page === filters.page ? '' : 'dark:text-foreground dark:border-border dark:hover:bg-muted'}
                    >
                      {page}
                    </Boton>
                  );
                })}
                <Boton
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.page! + 1)}
                  disabled={!pagination.hasNext}
                  className="dark:text-foreground dark:border-border dark:hover:bg-muted"
                >
                  Siguiente
                </Boton>
              </div>
            </div>
          </div>
        )}
      </Tarjeta>

      {/* Modals */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="relative flex w-full max-w-2xl flex-col overflow-hidden max-h-[100dvh] sm:max-h-[90vh]">
            <Tarjeta className="flex flex-1 flex-col overflow-hidden border border-border shadow-2xl">
              <TarjetaEncabezado>
                <div className="flex justify-between items-center">
                  <TarjetaTitulo className="text-xl font-semibold text-foreground">
                    Crear nuevo doctor
                  </TarjetaTitulo>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    aria-label="Cerrar"
                    className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <XCircle className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </TarjetaEncabezado>
              <TarjetaContenido className="flex-1 overflow-y-auto">
                <CreateDoctorForm
                  onSuccess={() => {
                    setShowCreateModal(false);
                    queryClient.invalidateQueries({ queryKey: ['doctors'] });
                  }}
                  onCancel={() => setShowCreateModal(false)}
                />
              </TarjetaContenido>
            </Tarjeta>
          </div>
        </div>
      )}

      {showDetailsModal && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="relative flex w-full max-w-2xl flex-col overflow-hidden max-h-[100dvh] sm:max-h-[90vh]">
            <Tarjeta className="flex flex-1 flex-col overflow-hidden border border-border shadow-2xl">
              <TarjetaEncabezado>
                <div className="flex justify-between items-center">
                  <TarjetaTitulo className="text-xl font-semibold text-foreground">
                    Detalles del doctor
                  </TarjetaTitulo>
                  <button
                    type="button"
                    onClick={() => setShowDetailsModal(false)}
                    aria-label="Cerrar"
                    className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <XCircle className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </TarjetaEncabezado>
              <TarjetaContenido className="flex-1 overflow-y-auto">
                <DoctorDetailsView doctor={selectedDoctor} />
              </TarjetaContenido>
            </Tarjeta>
          </div>
        </div>
      )}

      {showEditModal && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="relative flex w-full max-w-2xl flex-col overflow-hidden max-h-[100dvh] sm:max-h-[90vh]">
            <Tarjeta className="flex flex-1 flex-col overflow-hidden border border-border shadow-2xl">
              <TarjetaEncabezado>
                <div className="flex justify-between items-center">
                  <TarjetaTitulo className="text-xl font-semibold text-foreground">
                    Editar doctor
                  </TarjetaTitulo>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    aria-label="Cerrar"
                    className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <XCircle className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </TarjetaEncabezado>
              <TarjetaContenido className="flex-1 overflow-y-auto">
                <EditDoctorForm
                  doctor={selectedDoctor}
                  onSuccess={() => {
                    setShowEditModal(false);
                    queryClient.invalidateQueries({ queryKey: ['doctors'] });
                  }}
                  onCancel={() => setShowEditModal(false)}
                />
              </TarjetaContenido>
            </Tarjeta>
          </div>
        </div>
      )}

      {showDeleteModal && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="relative w-full max-w-md">
            <Tarjeta className="border border-red-200 shadow-2xl">
              <TarjetaContenido className="p-6">
                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">
                    Eliminar doctor
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground">
                      ¿Estás seguro de que quieres eliminar al{' '}
                      <span className="font-semibold text-foreground">
                        Dr. {selectedDoctor.user.firstName} {selectedDoctor.user.lastName}
                      </span>
                      ? Esta acción no se puede deshacer.
                    </p>
                  </div>
                  <div className="mt-6 flex justify-center gap-3">
                    <Boton
                      variant="outline"
                      onClick={() => setShowDeleteModal(false)}
                    >
                      Cancelar
                    </Boton>
                    <Boton
                      onClick={confirmDelete}
                      disabled={deleteDoctorMutation.isPending}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {deleteDoctorMutation.isPending ? 'Eliminando...' : 'Eliminar doctor'}
                    </Boton>
                  </div>
                </div>
              </TarjetaContenido>
            </Tarjeta>
          </div>
        </div>
      )}
    </div>
  );
}
