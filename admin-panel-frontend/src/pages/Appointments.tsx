import { useMemo, useState } from 'react';
import { formatearFechaHora, formatearHora } from '@/utils/dateFormat';
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
  Radio,
  Route,
  ShieldAlert,
  ListChecks,
} from 'lucide-react';
import { adminService } from '@/services/admin.service';
import { Boton } from '@/components/ui/Boton';
import { Entrada } from '@/components/ui/Entrada';
import { Tarjeta, TarjetaContenido, TarjetaEncabezado, TarjetaTitulo } from '@/components/ui/Tarjeta';
import { EsqueletoTabla } from '@/components/ui/Esqueleto';
import { Insignia } from '@/components/ui/Insignia';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Modal } from '@/components/ui/Modal';
import { obtenerMetaEstadoCita } from '@/utils/estados';
import AppointmentsModal from '@/components/AppointmentsModal';
import CreateAppointmentForm from '@/components/CreateAppointmentForm';
import AppointmentDetailsView from '@/components/AppointmentDetailsView';
import DailyRouteMap from '@/components/DailyRouteMap';
import { DialogoConfirmacion } from '@/components/ui/DialogoConfirmacion';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import type { Appointment, AppointmentFilters, AppointmentStatus, AppointmentTimelineItem, Doctor } from '@/types';



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
  const [selectedTimelineAppointment, setSelectedTimelineAppointment] = useState<Appointment | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAppointments, setSelectedAppointments] = useState<string[]>([]);
  const [routeDoctorId, setRouteDoctorId] = useState('');
  const [routeDate, setRouteDate] = useState(new Date().toISOString().slice(0, 10));
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);

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

  const { data: doctorsData } = useQuery({
    queryKey: ['doctors-for-route'],
    queryFn: () => adminService.getDoctors({ page: 1, limit: 100 }),
    staleTime: 60_000,
  });

  const { data: routeData, isFetching: isFetchingRoute } = useQuery({
    queryKey: ['doctor-daily-route', routeDoctorId, routeDate],
    queryFn: () => adminService.getDoctorDailyRoute(routeDoctorId, routeDate),
    enabled: Boolean(routeDoctorId && routeDate),
    staleTime: 15_000,
  });

  const { data: timelineData, isFetching: isFetchingTimeline } = useQuery({
    queryKey: ['appointment-timeline', selectedTimelineAppointment?.id],
    queryFn: () => adminService.getAppointmentTimeline(selectedTimelineAppointment!.id),
    enabled: Boolean(selectedTimelineAppointment?.id),
    staleTime: 10_000,
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
    setAppointmentToDelete(appointment);
  };

  const handleConfirmDeleteAppointment = () => {
    if (!appointmentToDelete) {
      return;
    }

    deleteAppointmentMutation.mutate(appointmentToDelete.id, {
      onSettled: () => setAppointmentToDelete(null),
    });
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

  const appointments = ((appointmentsData?.data?.data as any)?.data || []) as Appointment[];
  const pagination = (appointmentsData?.data?.data as any)?.pagination;
  const totalAppointments = pagination?.total || 0;

  // Stats from dashboard
  const stats = (dashboardData?.data?.data as any);
  const totalCitas = stats?.overview?.totalAppointments || 0;
  const pendientes = stats?.appointments?.pending || 0;
  const completadas = stats?.appointments?.completed || 0;
  const tasaExito = stats?.appointments?.completionRate || 0;
  const doctors = (doctorsData?.data?.data?.data as Doctor[]) ?? [];
  const route = routeData?.data?.data;
  const timeline = timelineData?.data?.data?.items ?? [];
  const liveStats = useMemo(() => buildLiveStats(appointments, route), [appointments, route]);
  const timelineAppointment = selectedTimelineAppointment;

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-foreground dark:text-foreground sm:text-3xl">Gestión de citas</h1>
        </div>
        <Tarjeta className="border border-red-200 bg-red-50/60 dark:border-red-800 dark:bg-red-900/20">
          <TarjetaContenido className="flex flex-col gap-4 p-6 text-sm">
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
              <Boton 
                variant="outline" 
                onClick={() => refetch()}
                className="dark:text-foreground dark:border-border dark:hover:bg-muted"
              >
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
          <h1 className="text-2xl font-bold text-foreground dark:text-foreground sm:text-3xl">Gestión de citas</h1>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
            Administra todas las citas médicas del sistema SMD Vital
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
          <Boton
            variant="outline"
            onClick={() => refetch()}
            isLoading={isFetching}
            disabled={isFetching}
            className="w-full dark:text-foreground dark:border-border dark:hover:bg-muted sm:w-auto"
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />
            Actualizar
          </Boton>
          <Boton 
            variant="outline" 
            onClick={() => setShowModal(true)}
            className="w-full dark:text-foreground dark:border-border dark:hover:bg-muted sm:w-auto"
          >
            <Calendar className="h-4 w-4" />
            Ver todas
          </Boton>
          <Boton
            onClick={() => {
              setSelectedAppointment(null);
              setShowCreateForm(true);
            }}
            className="col-span-2 w-full sm:col-span-1 sm:w-auto"
          >
            <CalendarPlus className="h-4 w-4" />
            Nueva cita
          </Boton>
        </div>
      </div>

      <Tarjeta className="border border-border shadow-sm dark:border-border">
        <TarjetaEncabezado className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <TarjetaTitulo className="flex items-center gap-2 text-lg font-semibold text-foreground dark:text-foreground">
              <Radio className="h-5 w-5 text-emerald-600" />
              Torre de control operativa
            </TarjetaTitulo>
            <p className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">
              Estado vivo de agenda, riesgos y trazabilidad del equipo.
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Sincronizado en tiempo real
          </div>
        </TarjetaEncabezado>
        <TarjetaContenido className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {liveStats.statusCards.map((item) => (
              <button
                key={item.status}
                type="button"
                onClick={() => handleFilterChange('status', item.status)}
                className={cn(
                  'rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-brand-300 hover:shadow-soft-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  filters.status === item.status && 'ring-2 ring-brand-500/40 bg-brand-50 dark:bg-brand-500/10'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.etiqueta}</p>
                    <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{item.count}</p>
                  </div>
                  <Insignia variant={item.variant} size="sm" />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{item.description}</p>
              </button>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="grid gap-4 lg:grid-cols-2">
              <section className="rounded-md border border-border p-4 dark:border-border">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground dark:text-foreground">
                      <ShieldAlert className="h-4 w-4 text-amber-600" />
                      Alertas de operacion
                    </h2>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground">Prioriza retrasos, coordenadas y choques de ruta.</p>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold text-foreground dark:bg-card dark:text-muted-foreground">
                    {liveStats.alerts.length}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {liveStats.alerts.length === 0 ? (
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
                      <div className="flex items-center gap-2 font-medium">
                        <CheckCircle2 className="h-4 w-4" />
                        Operacion estable
                      </div>
                      <p className="mt-1 text-xs">No hay riesgos visibles en la pagina actual.</p>
                    </div>
                  ) : (
                    liveStats.alerts.map((alert) => (
                      <button
                        key={alert.id}
                        type="button"
                        onClick={() => alert.status && handleFilterChange('status', alert.status)}
                        className={cn(
                          'w-full rounded-md border p-3 text-left text-sm transition hover:shadow-sm',
                          alert.tone === 'danger' && 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300',
                          alert.tone === 'warning' && 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300',
                          alert.tone === 'info' && 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                          <div>
                            <p className="font-semibold">{alert.title}</p>
                            <p className="mt-1 text-xs opacity-80">{alert.description}</p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-md border border-border p-4 dark:border-border">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground dark:text-foreground">
                      <Route className="h-4 w-4 text-blue-600" />
                      Cola prioritaria
                    </h2>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground">Siguientes citas que requieren seguimiento.</p>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold text-foreground dark:bg-card dark:text-muted-foreground">
                    {liveStats.priorityAppointments.length}
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  {liveStats.priorityAppointments.length === 0 ? (
                    <p className="rounded-md border border-border p-3 text-sm text-muted-foreground dark:border-border dark:text-muted-foreground">
                      No hay citas activas en la pagina actual.
                    </p>
                  ) : (
                    liveStats.priorityAppointments.map((appointment) => (
                      <button
                        key={appointment.id}
                        type="button"
                        onClick={() => setSelectedTimelineAppointment(appointment)}
                        className={cn(
                          'w-full rounded-md border border-border p-3 text-left transition hover:border-blue-300 hover:bg-blue-50 dark:border-border dark:hover:border-blue-800 dark:hover:bg-blue-900/20',
                          selectedTimelineAppointment?.id === appointment.id && 'border-blue-400 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground dark:text-foreground">
                              {appointment.patient?.user?.firstName} {appointment.patient?.user?.lastName}
                            </p>
                            <p className="mt-1 truncate text-xs text-muted-foreground dark:text-muted-foreground">
                              {formatearHora(appointment.scheduledAt)} - Dr. {appointment.doctor?.user?.firstName} {appointment.doctor?.user?.lastName}
                            </p>
                          </div>
                          <Insignia variant={obtenerMetaEstadoCita(appointment.status).variant} size="sm" icon={obtenerMetaEstadoCita(appointment.status).icon}>
                            {obtenerMetaEstadoCita(appointment.status).etiqueta}
                          </Insignia>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </section>
            </div>

            <section className="rounded-md border border-border p-4 dark:border-border">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground dark:text-foreground">
                    <ListChecks className="h-4 w-4 text-indigo-600" />
                    Trazabilidad activa
                  </h2>
                  {timelineAppointment ? (
                    <p className="mt-1 truncate text-xs text-muted-foreground dark:text-muted-foreground">
                      {timelineAppointment.patient?.user?.firstName} {timelineAppointment.patient?.user?.lastName} - {formatearHora(timelineAppointment.scheduledAt)}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground dark:text-muted-foreground">Selecciona una cita para ver sus eventos.</p>
                  )}
                </div>
                {isFetchingTimeline && <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />}
              </div>

              <div className="mt-4 max-h-[360px] space-y-3 overflow-y-auto pr-1">
                {!timelineAppointment ? (
                  <p className="rounded-md border border-border p-3 text-sm text-muted-foreground dark:border-border dark:text-muted-foreground">
                    Usa el boton Trazabilidad en una cita o selecciona una de la cola prioritaria.
                  </p>
                ) : timeline.length === 0 ? (
                  <p className="rounded-md border border-border p-3 text-sm text-muted-foreground dark:border-border dark:text-muted-foreground">
                    Todavia no hay eventos registrados para esta cita.
                  </p>
                ) : (
                  timeline.slice(0, 8).map((item: AppointmentTimelineItem) => (
                    <div key={`${item.source}-${item.id}`} className="relative rounded-md border border-border p-3 dark:border-border">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground dark:text-foreground">
                            {getTimelineActionLabel(item.action)}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground dark:text-muted-foreground">
                            {getTimelineActor(item)} - {formatearFechaHora(item.createdAt)}
                          </p>
                        </div>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground dark:bg-card dark:text-muted-foreground">
                          {item.actorRole}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </TarjetaContenido>
      </Tarjeta>

      <Tarjeta className="border border-border shadow-sm dark:border-border">
        <TarjetaEncabezado className="flex flex-col gap-3 p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <TarjetaTitulo className="flex items-center gap-2 text-lg font-semibold text-foreground dark:text-foreground">
              <MapPin className="h-5 w-5 text-blue-600" />
              Mapa diario de traslados
            </TarjetaTitulo>
            <p className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">
              Revisa las citas del medico por hora y los tramos con riesgo antes de agendar.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-[220px_160px]">
            <select
              value={routeDoctorId}
              onChange={(event) => setRouteDoctorId(event.target.value)}
              className="rounded-md border border-border bg-white p-2 text-sm dark:border-border dark:bg-card dark:text-foreground"
            >
              <option value="">Selecciona medico</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.user?.firstName} {doctor.user?.lastName}
                </option>
              ))}
            </select>
            <Entrada
              type="date"
              value={routeDate}
              onChange={(event) => setRouteDate(event.target.value)}
            />
          </div>
        </TarjetaEncabezado>
        <TarjetaContenido className="space-y-4 p-4 sm:p-6">
          <DailyRouteMap route={route} />

          {isFetchingRoute ? (
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">Cargando ruta...</p>
          ) : routeDoctorId && route ? (
            <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground dark:text-foreground">Citas del dia</h3>
                {route.stops.length === 0 ? (
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">No hay citas para este medico en la fecha seleccionada.</p>
                ) : (
                  route.stops.map((stop) => (
                    <div key={stop.appointment.id} className="rounded-md border border-border p-3 text-sm dark:border-border">
                      <div className="font-medium text-foreground dark:text-foreground">
                        #{stop.order} {formatearHora(stop.appointment.scheduledAt)} - {stop.appointment.patient?.user?.firstName} {stop.appointment.patient?.user?.lastName}
                      </div>
                      <div className="text-muted-foreground dark:text-muted-foreground">{stop.appointment.address}</div>
                    </div>
                  ))
                )}
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground dark:text-foreground">Tramos</h3>
                {route.segments.length === 0 ? (
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">Se necesitan al menos dos citas con coordenadas para calcular traslados.</p>
                ) : (
                  route.segments.map((segment) => (
                    <div
                      key={`${segment.fromAppointmentId}-${segment.toAppointmentId}`}
                      className={cn(
                        'rounded-md border p-3 text-sm',
                        segment.status === 'OK' && 'border-emerald-200 bg-emerald-50 text-emerald-800',
                        segment.status === 'RISK' && 'border-amber-200 bg-amber-50 text-amber-800',
                        segment.status === 'CONFLICT' && 'border-red-200 bg-red-50 text-red-800',
                        segment.status === 'MISSING_COORDINATES' && 'border-border bg-muted text-foreground'
                      )}
                    >
                      <div className="font-medium">
                        {segment.status === 'OK' ? 'Traslado viable' : segment.status === 'RISK' ? 'Riesgo de retraso' : segment.status === 'CONFLICT' ? 'Choque de agenda' : 'Faltan coordenadas'}
                      </div>
                      <div>
                        {segment.distanceKm ?? '-'} km - {segment.estimatedTravelMinutes ?? '-'} min estimados - {segment.availableMinutes ?? '-'} min disponibles
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              Selecciona un medico para ver su ruta diaria.
            </p>
          )}
        </TarjetaContenido>
      </Tarjeta>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Tarjeta className="border border-border shadow-sm dark:border-border">
          <TarjetaContenido className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">Total citas</p>
                <p className="mt-2 text-2xl font-semibold text-foreground dark:text-foreground">{totalCitas}</p>
              </div>
              <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-3">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </TarjetaContenido>
        </Tarjeta>

        <Tarjeta className="border border-border shadow-sm dark:border-border">
          <TarjetaContenido className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">Pendientes</p>
                <p className="mt-2 text-2xl font-semibold text-foreground dark:text-foreground">{pendientes}</p>
              </div>
              <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-3">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </TarjetaContenido>
        </Tarjeta>

        <Tarjeta className="border border-border shadow-sm dark:border-border">
          <TarjetaContenido className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">Completadas</p>
                <p className="mt-2 text-2xl font-semibold text-foreground dark:text-foreground">{completadas}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-3">
                <CalendarCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </TarjetaContenido>
        </Tarjeta>

        <Tarjeta className="border border-border shadow-sm dark:border-border">
          <TarjetaContenido className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">Tasa de éxito</p>
                <p className="mt-2 text-2xl font-semibold text-foreground dark:text-foreground">
                  {tasaExito.toFixed(1)}<span className="text-sm text-muted-foreground dark:text-muted-foreground">%</span>
                </p>
              </div>
              <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/20 p-3">
                <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </TarjetaContenido>
        </Tarjeta>
      </div>

      {/* Filters */}
      <Tarjeta className="border border-border shadow-sm dark:border-border">
        <TarjetaEncabezado className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TarjetaTitulo className="text-lg font-semibold text-foreground dark:text-foreground">
              Filtros de búsqueda
            </TarjetaTitulo>
            <Boton
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full dark:text-foreground dark:border-border dark:hover:bg-muted sm:w-auto"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
            </Boton>
          </div>
        </TarjetaEncabezado>
        {showFilters && (
          <TarjetaContenido className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground dark:text-muted-foreground mb-2">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-muted-foreground" />
                  <Entrada
                    placeholder="Paciente, doctor, servicio..."
                    value={filters.search || ''}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground dark:text-muted-foreground mb-2">
                  Estado
                </label>
                <select
                  className="w-full px-3 py-2 border border-border dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-card text-foreground dark:text-foreground"
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
                <label className="block text-sm font-medium text-foreground dark:text-muted-foreground mb-2">
                  Resultados por página
                </label>
                <select
                  className="w-full px-3 py-2 border border-border dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-card text-foreground dark:text-foreground"
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
          </TarjetaContenido>
        )}
      </Tarjeta>

      {/* Bulk Actions */}
      {selectedAppointments.length > 0 && (
        <Tarjeta className="border border-indigo-200 bg-indigo-50/60 dark:border-indigo-800 dark:bg-indigo-900/20 shadow-sm">
          <TarjetaContenido className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-indigo-900 dark:text-indigo-300">
                  {selectedAppointments.length} cita{selectedAppointments.length !== 1 ? 's' : ''} seleccionada{selectedAppointments.length !== 1 ? 's' : ''}
                </span>
              </div>
              <Boton
                size="sm"
                variant="outline"
                onClick={() => setSelectedAppointments([])}
                className="text-muted-foreground dark:text-foreground dark:border-border dark:hover:bg-muted"
              >
                Cancelar
              </Boton>
            </div>
          </TarjetaContenido>
        </Tarjeta>
      )}

      {/* Appointments Grid */}
      <Tarjeta className="border border-border shadow-sm dark:border-border">
        <TarjetaEncabezado className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <TarjetaTitulo className="text-lg font-semibold text-foreground dark:text-foreground">
              Lista de citas
            </TarjetaTitulo>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
              {isLoading ? 'Cargando...' : `${totalAppointments} cita${totalAppointments !== 1 ? 's' : ''} registrada${totalAppointments !== 1 ? 's' : ''}`}
            </p>
          </div>
          {!isLoading && appointments.length > 0 && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedAppointments.length === appointments.length && appointments.length > 0}
                onChange={handleSelectAll}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-border rounded cursor-pointer"
              />
              <span className="text-sm text-muted-foreground dark:text-muted-foreground">Seleccionar todas</span>
            </label>
          )}
        </TarjetaEncabezado>
        <TarjetaContenido className="p-0">
          {isLoading ? (
            <div className="p-3">
              <EsqueletoTabla rows={8} columns={6} />
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted dark:bg-card">
                <Calendar className="h-6 w-6 text-gray-400 dark:text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-sm font-medium text-foreground dark:text-foreground">No hay citas</h3>
              <p className="mt-2 text-sm text-muted-foreground dark:text-muted-foreground">
                No se encontraron citas con los filtros aplicados.
              </p>
              <div className="mt-6">
                <Boton
                  onClick={() => {
                    setSelectedAppointment(null);
                    setShowCreateForm(true);
                  }}
                >
                  <CalendarPlus className="h-4 w-4" />
                  Crear primera cita
                </Boton>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border dark:divide-border">
              {appointments.map((appointment: any) => (
                <div
                  key={appointment.id}
                  className="p-4 transition-colors hover:bg-muted/50 dark:hover:bg-muted/50 sm:p-6"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedAppointments.includes(appointment.id)}
                      onChange={() => handleSelectAppointment(appointment.id)}
                      className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-border rounded cursor-pointer"
                    />

                    {/* Icon */}
                    <div className="hidden flex-shrink-0 sm:block">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 ring-2 ring-gray-100 dark:ring-gray-600">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                    </div>

                    {/* Appointment Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-foreground dark:text-foreground">
                              {appointment.patient?.user?.firstName} {appointment.patient?.user?.lastName}
                            </h3>
                            <span className="text-xs text-muted-foreground dark:text-muted-foreground">→</span>
                            <span className="text-sm text-muted-foreground dark:text-muted-foreground">
                              Dr. {appointment.doctor?.user?.firstName} {appointment.doctor?.user?.lastName}
                            </span>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground dark:text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              {appointment.service?.name || 'Servicio no especificado'}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatearFechaHora(appointment.scheduledAt)}
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
                              <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground dark:text-muted-foreground">
                                <DollarSign className="h-4 w-4" />
                                {formatCurrency(appointment.totalAmount)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Status Insignia */}
                        <div className="flex flex-wrap gap-2 justify-end">
                          {(() => {
                            const meta = obtenerMetaEstadoCita(appointment.status);
                            const Icono = meta.icon;
                            return (
                              <Insignia variant={meta.variant} size="sm" icon={Icono}>
                                {meta.etiqueta}
                              </Insignia>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
                        <Boton
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(appointment)}
                          className="w-full dark:text-foreground dark:border-border dark:hover:bg-muted sm:w-auto"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Ver detalles
                        </Boton>
                        <Boton
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedTimelineAppointment(appointment)}
                          className="w-full dark:text-foreground dark:border-border dark:hover:bg-muted sm:w-auto"
                        >
                          <ListChecks className="h-3.5 w-3.5" />
                          Trazabilidad
                        </Boton>
                        <Boton
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setShowCreateForm(true);
                          }}
                          className="w-full dark:text-foreground dark:border-border dark:hover:bg-muted sm:w-auto"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          Editar
                        </Boton>
                        <Boton
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteAppointment(appointment)}
                          className="w-full text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 dark:border-border dark:hover:bg-muted sm:w-auto"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
          <div className="border-t border-border bg-muted px-4 py-4 dark:border-border dark:bg-card sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                Mostrando{' '}
                <span className="font-medium text-foreground dark:text-foreground">
                  {((filters.page || 1) - 1) * (filters.limit || 10) + 1}
                </span>
                {' '}-{' '}
                <span className="font-medium text-foreground dark:text-foreground">
                  {Math.min((filters.page || 1) * (filters.limit || 10), pagination.total)}
                </span>
                {' '}de{' '}
                <span className="font-medium text-foreground dark:text-foreground">{pagination.total}</span>
                {' '}resultados
              </div>
              <div className="flex flex-wrap gap-2">
                <Boton
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange((filters.page || 1) - 1)}
                  disabled={!pagination.hasPrev}
                  className="dark:text-foreground dark:border-border dark:hover:bg-muted"
                >
                  Anterior
                </Boton>
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
                    <Boton
                      key={page}
                      variant={page === currentPage ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className={page === currentPage ? '' : 'dark:text-foreground dark:border-border dark:hover:bg-muted'}
                    >
                      {page}
                    </Boton>
                  );
                })}
                <Boton
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange((filters.page || 1) + 1)}
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
      {showModal && (
        <AppointmentsModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      )}

      {showCreateForm && (
        <CreateAppointmentForm
          isOpen={showCreateForm}
          appointment={selectedAppointment}
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

      <DialogoConfirmacion
        isOpen={Boolean(appointmentToDelete)}
        title="Eliminar cita"
        message={`Esta accion eliminara la cita de ${appointmentToDelete?.patient?.user?.firstName ?? 'este paciente'}.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        isDanger
        isLoading={deleteAppointmentMutation.isPending}
        onConfirm={handleConfirmDeleteAppointment}
        onCancel={() => setAppointmentToDelete(null)}
      />
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function buildLiveStats(
  appointments: Appointment[],
  route?: { segments?: Array<{ status: string }> } | null
) {
  const activeStatuses: AppointmentStatus[] = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'];
  const statusCards = activeStatuses.map((status) => {
    const meta = obtenerMetaEstadoCita(status);
    return {
      status,
      etiqueta: meta.etiqueta,
      variant: meta.variant,
      count: appointments.filter((appointment) => appointment.status === status).length,
      description: getStatusDescription(status),
    };
  });

  const now = Date.now();
  const overdue = appointments.filter((appointment) => (
    ['PENDING', 'CONFIRMED'].includes(appointment.status)
    && Number.isFinite(new Date(appointment.scheduledAt).getTime())
    && new Date(appointment.scheduledAt).getTime() < now
  ));
  const inProgress = appointments.filter((appointment) => appointment.status === 'IN_PROGRESS');
  const missingCoordinates = appointments.filter((appointment) => !appointment.coordinates);
  const routeRisks = route?.segments?.filter((segment) => (
    segment.status === 'RISK' || segment.status === 'CONFLICT'
  )) ?? [];

  const alerts: Array<{
    id: string;
    title: string;
    description: string;
    tone: 'danger' | 'warning' | 'info';
    status?: AppointmentStatus;
  }> = [];

  if (overdue.length > 0) {
    alerts.push({
      id: 'overdue',
      title: `${overdue.length} cita${overdue.length === 1 ? '' : 's'} fuera de hora`,
      description: 'Hay citas pendientes o confirmadas con hora vencida.',
      tone: 'danger',
      status: 'PENDING',
    });
  }

  if (missingCoordinates.length > 0) {
    alerts.push({
      id: 'missing-coordinates',
      title: `${missingCoordinates.length} cita${missingCoordinates.length === 1 ? '' : 's'} sin coordenadas`,
      description: 'Completa direccion y coordenadas para calcular traslados.',
      tone: 'warning',
    });
  }

  if (routeRisks.length > 0) {
    alerts.push({
      id: 'route-risks',
      title: `${routeRisks.length} tramo${routeRisks.length === 1 ? '' : 's'} con riesgo`,
      description: 'La ruta seleccionada tiene retrasos probables o choques de agenda.',
      tone: 'warning',
    });
  }

  if (inProgress.length > 0) {
    alerts.push({
      id: 'in-progress',
      title: `${inProgress.length} atencion${inProgress.length === 1 ? '' : 'es'} en curso`,
      description: 'Da seguimiento clinico y operativo hasta cierre de documentos.',
      tone: 'info',
      status: 'IN_PROGRESS',
    });
  }

  const priorityAppointments = appointments
    .filter((appointment) => ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(appointment.status))
    .sort((left, right) => getAppointmentTimestamp(left) - getAppointmentTimestamp(right))
    .slice(0, 6);

  return {
    statusCards,
    alerts,
    priorityAppointments,
  };
}

function getStatusDescription(status: AppointmentStatus) {
  const descriptions: Record<AppointmentStatus, string> = {
    PENDING: 'Por confirmar con paciente o equipo.',
    CONFIRMED: 'Lista para ejecucion operativa.',
    IN_PROGRESS: 'Atencion activa en terreno o clinica.',
    COMPLETED: 'Cerrada con servicio finalizado.',
    CANCELLED: 'Fuera de la agenda activa.',
    NO_SHOW: 'Paciente no asistio.',
    RESCHEDULED: 'Movida a otra fecha u hora.',
  };

  return descriptions[status];
}

function getAppointmentTimestamp(appointment: Appointment) {
  const timestamp = new Date(appointment.scheduledAt).getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.MAX_SAFE_INTEGER;
}

function getTimelineActionLabel(action: string) {
  const labels: Record<string, string> = {
    appointment_created: 'Cita creada',
    appointment_updated: 'Cita actualizada',
    appointment_deleted: 'Cita eliminada',
    appointment_status_changed: 'Estado actualizado',
    encounter_started: 'Atencion iniciada',
    vitals_recorded: 'Signos vitales registrados',
    note_added: 'Nota clinica agregada',
    encounter_finished: 'Atencion finalizada',
    documents_sent: 'Documentos enviados',
  };

  return labels[action] ?? action.replace(/_/g, ' ');
}

function getTimelineActor(item: AppointmentTimelineItem) {
  if (!item.actor) {
    return 'Sistema';
  }

  return `${item.actor.firstName} ${item.actor.lastName}`.trim() || item.actor.email || 'Usuario';
}
