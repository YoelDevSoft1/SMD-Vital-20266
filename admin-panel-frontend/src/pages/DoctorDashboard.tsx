import { useEffect, useMemo, useState } from 'react';
import { formatDateTime } from '@/utils/dateFormat';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle2, Activity, AlertCircle, Upload, ImageIcon, Plus, Save, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { clinicalService } from '@/services/clinical.service';
import { adminService } from '@/services/admin.service';
import DailyRouteMap from '@/components/DailyRouteMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GlassModal } from '@/components/ui/GlassModal';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/store/auth.store';
import type { ClinicalAppointment, PaginatedResponse } from '@/types';

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'No asistio',
  RESCHEDULED: 'Reprogramada',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
  CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
  IN_PROGRESS: 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800',
  NO_SHOW: 'bg-gray-50 text-gray-700 border-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
  RESCHEDULED: 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
};

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const [availabilityDate, setAvailabilityDate] = useState(today);
  const [availabilityBlocks, setAvailabilityBlocks] = useState<Array<{ startTime: string; endTime: string; notes?: string }>>([
    { startTime: '08:00', endTime: '12:00' },
  ]);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['clinical-appointments', { page: 1, limit: 5 }],
    queryFn: () => clinicalService.getAssignedAppointments({ page: 1, limit: 5 }),
    staleTime: 30_000,
  });

  const payload = data?.data?.data as PaginatedResponse<ClinicalAppointment> | undefined;
  const appointments = payload?.data ?? [];

  const { data: availabilityData, isFetching: isFetchingAvailability } = useQuery({
    queryKey: ['doctor-my-availability', availabilityDate],
    queryFn: () => clinicalService.getMyAvailability(availabilityDate, 60),
    staleTime: 15_000,
  });

  const { data: routeData, isFetching: isFetchingRoute } = useQuery({
    queryKey: ['doctor-my-route', availabilityDate],
    queryFn: () => clinicalService.getMyRoute(availabilityDate),
    staleTime: 15_000,
  });

  const availabilityMutation = useMutation({
    mutationFn: () => clinicalService.setMyAvailability(availabilityDate, availabilityBlocks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-my-availability'] });
      toast.success('Disponibilidad guardada');
    },
    onError: (mutationError: any) => {
      toast.error(mutationError.response?.data?.message || 'No se pudo guardar la disponibilidad');
    },
  });

  useEffect(() => {
    const blocks = availabilityData?.data?.data?.availability;
    if (blocks) {
      setAvailabilityBlocks(
        blocks.length
          ? blocks.map((block) => ({
              startTime: block.startTime,
              endTime: block.endTime,
              notes: block.notes ?? undefined,
            }))
          : [{ startTime: '08:00', endTime: '12:00' }]
      );
    }
  }, [availabilityData]);

  const stats = useMemo(() => {
    return {
      total: appointments.length,
      pending: appointments.filter((appointment) =>
        appointment.status === 'PENDING' || appointment.status === 'CONFIRMED'
      ).length,
      inProgress: appointments.filter((appointment) => appointment.status === 'IN_PROGRESS').length,
      completed: appointments.filter((appointment) => appointment.status === 'COMPLETED').length,
    };
  }, [appointments]);

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Panel clinico</h1>
        </div>
        <Card className="border border-red-200 bg-red-50/60 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="flex flex-col gap-4 p-6 text-sm">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div>
                <h2 className="text-lg font-semibold text-red-700 dark:text-red-300">
                  No se pudo cargar el resumen
                </h2>
                <p className="text-red-600 dark:text-red-400">
                  Verifica tu conexion o intenta nuevamente.
                </p>
              </div>
            </div>
            <div>
              <Button
                variant="outline"
                onClick={() => refetch()}
                className="dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
              >
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Panel clinico</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Resumen de tus citas asignadas y estado actual.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/doctor/appointments')}
          isLoading={isFetching}
          className="dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
        >
          Ver agenda
        </Button>
      </div>

      <Card className="border border-gray-200 shadow-sm dark:border-gray-700">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Disponibilidad diaria
            </CardTitle>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Define los rangos que administracion puede usar para agendarte.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={availabilityDate}
              onChange={(event) => setAvailabilityDate(event.target.value)}
              className="w-40"
            />
            <Button
              onClick={() => availabilityMutation.mutate()}
              isLoading={availabilityMutation.isPending}
              disabled={isFetchingAvailability || availabilityMutation.isPending}
            >
              <Save className="h-4 w-4" />
              Guardar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {availabilityBlocks.map((block, index) => (
            <div key={`${index}-${block.startTime}-${block.endTime}`} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <div>
                <Label>Desde</Label>
                <Input
                  type="time"
                  value={block.startTime}
                  onChange={(event) =>
                    setAvailabilityBlocks((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, startTime: event.target.value } : item
                      )
                    )
                  }
                />
              </div>
              <div>
                <Label>Hasta</Label>
                <Input
                  type="time"
                  value={block.endTime}
                  onChange={(event) =>
                    setAvailabilityBlocks((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, endTime: event.target.value } : item
                      )
                    )
                  }
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setAvailabilityBlocks((current) =>
                      current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index)
                    )
                  }
                  disabled={availabilityBlocks.length === 1}
                  className="dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setAvailabilityBlocks((current) => [...current, { startTime: '14:00', endTime: '18:00' }])
            }
            className="dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
          >
            <Plus className="h-4 w-4" />
            Agregar rango
          </Button>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 shadow-sm dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Ruta del dia
          </CardTitle>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Citas ordenadas por hora y tiempos estimados de traslado.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <DailyRouteMap route={routeData?.data?.data} />
          {isFetchingRoute ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Cargando ruta...</p>
          ) : routeData?.data?.data?.segments?.length ? (
            <div className="grid gap-2 md:grid-cols-2">
              {routeData.data.data.segments.map((segment) => (
                <div
                  key={`${segment.fromAppointmentId}-${segment.toAppointmentId}`}
                  className={cn(
                    'rounded-md border p-3 text-sm',
                    segment.status === 'OK' && 'border-emerald-200 bg-emerald-50 text-emerald-800',
                    segment.status === 'RISK' && 'border-amber-200 bg-amber-50 text-amber-800',
                    segment.status === 'CONFLICT' && 'border-red-200 bg-red-50 text-red-800',
                    segment.status === 'MISSING_COORDINATES' && 'border-gray-200 bg-gray-50 text-gray-700'
                  )}
                >
                  <div className="font-medium">
                    {segment.status === 'OK' ? 'Traslado viable' : segment.status === 'RISK' ? 'Riesgo de retraso' : segment.status === 'CONFLICT' ? 'Choque de agenda' : 'Faltan coordenadas'}
                  </div>
                  <div>
                    {segment.distanceKm ?? '-'} km - {segment.estimatedTravelMinutes ?? '-'} min estimados
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Aun no hay suficientes citas con coordenadas para calcular la ruta.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-gray-200 shadow-sm dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Citas totales</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.total}
                </p>
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
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.pending}
                </p>
              </div>
              <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-3">
                <Activity className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">En progreso</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.inProgress}
                </p>
              </div>
              <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/20 p-3">
                <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completadas</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.completed}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-gray-200 shadow-sm dark:border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Proximas citas
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isLoading ? 'Cargando...' : `${appointments.length} citas en agenda`}
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-sm text-gray-500 dark:text-gray-400">
              Cargando citas...
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-500 dark:text-gray-400">
              No hay citas asignadas.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {appointment.patient?.user?.firstName} {appointment.patient?.user?.lastName}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {appointment.service?.name || 'Servicio no definido'} ·{' '}
                      {formatDateTime(appointment.scheduledAt)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                      statusColors[appointment.status] || 'bg-gray-50 text-gray-700 border-gray-100'
                    )}
                  >
                    {statusLabels[appointment.status] || appointment.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

