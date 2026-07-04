import { useMemo } from 'react';
import { formatearFechaHora } from '@/utils/dateFormat';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Calendar, FileText, Activity, AlertCircle } from 'lucide-react';
import { clinicalService } from '@/services/clinical.service';
import { Tarjeta, TarjetaContenido, TarjetaEncabezado, TarjetaTitulo } from '@/components/ui/Tarjeta';
import { Boton } from '@/components/ui/Boton';
import type { PatientHistory } from '@/types';

export default function PatientDashboard() {
  const navigate = useNavigate();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['patient-history'],
    queryFn: () => clinicalService.getPatientHistory(),
    staleTime: 30_000,
  });

  const history = data?.data?.data as PatientHistory | undefined;
  const appointments = history?.appointments ?? [];
  const medicalRecords = history?.medicalRecords ?? [];
  const prescriptions = history?.prescriptions ?? [];

  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    return appointments
      .filter((appointment) => appointment.status !== 'COMPLETED')
      .filter((appointment) => new Date(appointment.scheduledAt) >= now)
      .slice(0, 3);
  }, [appointments]);

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold text-foreground dark:text-foreground">Mi resumen</h1>
        </div>
        <Tarjeta className="border border-red-200 bg-red-50/60 dark:border-red-800 dark:bg-red-900/20">
          <TarjetaContenido className="flex flex-col gap-4 p-6 text-sm">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div>
                <h2 className="text-lg font-semibold text-red-700 dark:text-red-300">
                  No se pudo cargar tu informacion
                </h2>
                <p className="text-red-600 dark:text-red-400">
                  Verifica tu conexion o intenta de nuevo.
                </p>
              </div>
            </div>
            <div>
              <Boton
                variant="outline"
                onClick={() => refetch()}
                className="dark:text-foreground dark:border-border dark:hover:bg-muted"
              >
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground dark:text-foreground">Mi resumen</h1>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
            Consulta tus proximas citas y documentos clinicos.
          </p>
        </div>
        <Boton variant="outline" onClick={() => navigate('/patient/history')}>
          Ver historial
        </Boton>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Tarjeta className="border border-border shadow-sm dark:border-border">
          <TarjetaContenido className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">Citas registradas</p>
                <p className="mt-2 text-2xl font-semibold text-foreground dark:text-foreground">
                  {appointments.length}
                </p>
              </div>
              <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-3">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </TarjetaContenido>
        </Tarjeta>

        <Tarjeta className="border border-border shadow-sm dark:border-border">
          <TarjetaContenido className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">Historias medicas</p>
                <p className="mt-2 text-2xl font-semibold text-foreground dark:text-foreground">
                  {medicalRecords.length}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-3">
                <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </TarjetaContenido>
        </Tarjeta>

        <Tarjeta className="border border-border shadow-sm dark:border-border">
          <TarjetaContenido className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">Formulas medicas</p>
                <p className="mt-2 text-2xl font-semibold text-foreground dark:text-foreground">
                  {prescriptions.length}
                </p>
              </div>
              <div className="rounded-xl bg-purple-50 dark:bg-purple-900/20 p-3">
                <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </TarjetaContenido>
        </Tarjeta>
      </div>

      <Tarjeta className="border border-border shadow-sm dark:border-border">
        <TarjetaEncabezado className="flex flex-row items-center justify-between">
          <div>
            <TarjetaTitulo className="text-lg font-semibold text-foreground dark:text-foreground">
              Proximas citas
            </TarjetaTitulo>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
              {isLoading ? 'Cargando...' : `${upcomingAppointments.length} en agenda`}
            </p>
          </div>
        </TarjetaEncabezado>
        <TarjetaContenido className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-sm text-muted-foreground dark:text-muted-foreground">
              Cargando citas...
            </div>
          ) : upcomingAppointments.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground dark:text-muted-foreground">
              No tienes citas proximas.
            </div>
          ) : (
            <div className="divide-y divide-border dark:divide-border">
              {upcomingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="text-sm font-semibold text-foreground dark:text-foreground">
                      {appointment.service?.name || 'Servicio no definido'}
                    </h3>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                      {formatearFechaHora(appointment.scheduledAt)} · Dr.{' '}
                      {appointment.doctor?.user?.firstName} {appointment.doctor?.user?.lastName}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                    {appointment.city}
                  </span>
                </div>
              ))}
            </div>
          )}
        </TarjetaContenido>
      </Tarjeta>
    </div>
  );
}

