import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Clock,
  Database,
  HardDrive,
  HeartPulse,
  RefreshCw,
  Server,
} from 'lucide-react';
import { adminService } from '@/services/admin.service';
import { Alerta } from '@/components/ui/Alerta';
import { Boton } from '@/components/ui/Boton';
import {
  Tarjeta,
  TarjetaContenido,
  TarjetaDescripcion,
  TarjetaEncabezado,
  TarjetaTitulo,
} from '@/components/ui/Tarjeta';
import { EsqueletoCuadriculaEstadisticas, EsqueletoTarjeta } from '@/components/ui/Esqueleto';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import SystemLogsModal from '@/components/SystemLogsModal';

function formatearFechaHora(value?: string) {
  if (!value) return 'Sin formData';
  try {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatUptime(seconds?: number) {
  if (!seconds || seconds <= 0) return 'Sin formData';
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (parts.length === 0) {
    parts.push(`${seconds}s`);
  }
  return parts.join(' ');
}

function statusStyles(status?: string) {
  if (!status) return 'bg-muted text-foreground';
  const normalized = status.toUpperCase();
  if (normalized === 'HEALTHY' || normalized === 'UP') {
    return 'bg-green-100 text-green-700';
  }
  if (normalized === 'DEGRADED' || normalized === 'WARN') {
    return 'bg-amber-100 text-amber-700';
  }
  if (normalized === 'DOWN' || normalized === 'CRITICAL') {
    return 'bg-red-100 text-red-700';
  }
  return 'bg-muted text-foreground';
}

export default function SystemHealth() {
  const [showLogs, setShowLogs] = useState(false);

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => adminService.getSystemHealth(),
    staleTime: 60_000,
  });

  const health = data?.data?.data;
  const memory = health?.system.memory;
  const cpu = health?.system.cpu;
  const memoryUsage =
    memory && memory.total > 0
      ? Math.min(100, Math.round((memory.used / memory.total) * 100))
      : 0;
  const cpuUsage =
    cpu && cpu.unit.toLowerCase() === 'percent'
      ? Math.min(100, Math.round(cpu.user + cpu.system))
      : cpu
      ? Math.min(100, Math.round(cpu.user + cpu.system))
      : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground dark:text-foreground">Estado del Sistema</h1>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
            Última actualización: cargando...
          </p>
        </div>
        <EsqueletoCuadriculaEstadisticas count={3} />
        <div className="grid gap-6 md:grid-cols-2">
          <EsqueletoTarjeta />
          <EsqueletoTarjeta />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground dark:text-foreground">Estado del Sistema</h1>
        <Alerta
          variant="danger"
          title="No se pudo obtener la información del sistema"
          icon={AlertCircle}
          action={
            <Boton variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </Boton>
          }
        >
          Verifica la conexión con el backend y vuelve a intentarlo.
        </Alerta>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground dark:text-foreground">Estado del Sistema</h1>
        <EstadoVacio
          icon={HeartPulse}
          title="Sin datos del sistema"
          description="Aún no se han recibido reportes de salud del backend."
          action={{
            label: 'Reintentar',
            onClick: () => refetch(),
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground dark:text-foreground">Estado del Sistema</h1>
          <p className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">
            Última actualización: {formatearFechaHora(health?.timestamp)}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Boton
            variant="outline"
            onClick={() => refetch()}
            isLoading={isFetching}
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar estado
          </Boton>
          <Boton onClick={() => setShowLogs(true)}>
            Ver logs del sistema
          </Boton>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Tarjeta className="lg:col-span-2">
          <TarjetaEncabezado className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <TarjetaTitulo>Resumen Operativo</TarjetaTitulo>
              <TarjetaDescripcion>
                Información general del estado actual del backend y sus recursos.
              </TarjetaDescripcion>
            </div>
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${statusStyles(health?.status)}`}>
              <Activity className="h-4 w-4" />
              {health?.status ? health.status : 'Sin formData'}
            </span>
          </TarjetaEncabezado>
          <TarjetaContenido className="grid gap-6 md:grid-cols-3">
            <div className="rounded-lg border border-border dark:border-border bg-white dark:bg-card p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-foreground dark:text-muted-foreground">
                <Clock className="h-4 w-4 text-blue-500" />
                Uptime
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground dark:text-foreground">
                {formatUptime(health?.uptime)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground dark:text-muted-foreground">
                Tiempo en línea desde el último reinicio
              </p>
            </div>
            <div className="rounded-lg border border-border dark:border-border bg-white dark:bg-card p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-foreground dark:text-muted-foreground">
                <Server className="h-4 w-4 text-purple-500" />
                Plataforma
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground dark:text-foreground">
                {health?.system.platform ?? 'Sin formData'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground dark:text-muted-foreground">
                Node {health?.system.nodeVersion ?? 'N/A'}
              </p>
            </div>
            <div className="rounded-lg border border-border dark:border-border bg-white dark:bg-card p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-foreground dark:text-muted-foreground">
                <HardDrive className="h-4 w-4 text-emerald-500" />
                Memoria externa
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground dark:text-foreground">
                {memory ? `${memory.external} ${memory.unit}` : 'Sin formData'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground dark:text-muted-foreground">
                Recursos adicionales disponibles
              </p>
            </div>
          </TarjetaContenido>
        </Tarjeta>

        <Tarjeta>
          <TarjetaEncabezado>
            <TarjetaTitulo>Servicios críticos</TarjetaTitulo>
            <TarjetaDescripcion>
              Estado de las dependencias principales para la operación.
            </TarjetaDescripcion>
          </TarjetaEncabezado>
          <TarjetaContenido className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-border dark:border-border bg-muted dark:bg-card p-4">
              <Database className="mt-1 h-5 w-5 text-indigo-500" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground dark:text-foreground">Base de formData</p>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">Conectividad y salud de la base de formData principal.</p>
              </div>
              <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusStyles(health?.services.database)}`}>
                {health?.services.database ?? 'Sin formData'}
              </span>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-border dark:border-border bg-muted dark:bg-card p-4">
              <Server className="mt-1 h-5 w-5 text-amber-500" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground dark:text-foreground">Redis / Cache</p>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">Estado del servicio de cache y colas.</p>
              </div>
              <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusStyles(health?.services.redis)}`}>
                {health?.services.redis ?? 'Sin formData'}
              </span>
            </div>
          </TarjetaContenido>
        </Tarjeta>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Tarjeta>
          <TarjetaEncabezado>
            <TarjetaTitulo>Uso de memoria</TarjetaTitulo>
            <TarjetaDescripcion>
              Monitoreo del consumo de memoria del proceso Node.js.
            </TarjetaDescripcion>
          </TarjetaEncabezado>
          <TarjetaContenido className="space-y-4">
            {memory ? (
              <>
                <div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground dark:text-muted-foreground">
                    <span>Uso actual</span>
                    <span>{memoryUsage}%</span>
                  </div>
                  <div className="mt-2 h-3 w-full rounded-full bg-muted dark:bg-card">
                    <div
                      className="h-3 rounded-full bg-blue-500 transition-all"
                      style={{ width: `${memoryUsage}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-foreground dark:text-muted-foreground">
                  <div>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground">Utilizada</p>
                    <p className="font-semibold">
                      {memory.used} {memory.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground">Total disponible</p>
                    <p className="font-semibold">
                      {memory.total} {memory.unit}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">No hay información disponible.</p>
            )}
          </TarjetaContenido>
        </Tarjeta>

        <Tarjeta>
          <TarjetaEncabezado>
            <TarjetaTitulo>Uso de CPU</TarjetaTitulo>
            <TarjetaDescripcion>Consumo de CPU del proceso y uso del sistema.</TarjetaDescripcion>
          </TarjetaEncabezado>
          <TarjetaContenido className="space-y-4">
            {cpu ? (
              <>
                <div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground dark:text-muted-foreground">
                    <span>Uso del proceso</span>
                    <span>{cpuUsage}%</span>
                  </div>
                  <div className="mt-2 h-3 w-full rounded-full bg-muted dark:bg-card">
                    <div
                      className="h-3 rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${cpuUsage}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-foreground dark:text-muted-foreground">
                  <div>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground">Proceso (user)</p>
                    <p className="font-semibold">
                      {cpu.user} {cpu.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground">Sistema</p>
                    <p className="font-semibold">
                      {cpu.system} {cpu.unit}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">No hay información disponible.</p>
            )}
          </TarjetaContenido>
        </Tarjeta>
      </div>

      <SystemLogsModal
        isOpen={showLogs}
        onClose={() => setShowLogs(false)}
      />
    </div>
  );
}
