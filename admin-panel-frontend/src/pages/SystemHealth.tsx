import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Database, Server, HardDrive, RefreshCw, Clock, AlertTriangle } from 'lucide-react';
import { adminService } from '@/services/admin.service';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import SystemLogsModal from '@/components/SystemLogsModal';

function formatDateTime(value?: string) {
  if (!value) return 'Sin datos';
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
  if (!seconds || seconds <= 0) return 'Sin datos';
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
  if (!status) return 'bg-gray-100 text-gray-700';
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
  return 'bg-gray-100 text-gray-700';
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
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-600">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span>Cargando estado del sistema...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Estado del Sistema</h1>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1 h-5 w-5 text-red-600" />
            <div className="space-y-2">
              <p className="font-medium text-red-700">
                No se pudo obtener la información del sistema.
              </p>
              <p className="text-sm text-red-600/80">
                Verifica la conexión con el backend y vuelve a intentarlo.
              </p>
              <Button
                variant="outline"
                onClick={() => refetch()}
              >
                Reintentar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Estado del Sistema</h1>
          <p className="mt-1 text-sm text-gray-600">
            Última actualización: {formatDateTime(health?.timestamp)}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => refetch()}
            isLoading={isFetching}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar estado
          </Button>
          <Button onClick={() => setShowLogs(true)}>
            Ver logs del sistema
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Resumen Operativo</CardTitle>
              <CardDescription>
                Información general del estado actual del backend y sus recursos.
              </CardDescription>
            </div>
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${statusStyles(health?.status)}`}>
              <Activity className="h-4 w-4" />
              {health?.status ? health.status : 'Sin datos'}
            </span>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Clock className="h-4 w-4 text-blue-500" />
                Uptime
              </p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {formatUptime(health?.uptime)}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Tiempo en línea desde el último reinicio
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Server className="h-4 w-4 text-purple-500" />
                Plataforma
              </p>
              <p className="mt-2 text-lg font-semibold text-gray-900">
                {health?.system.platform ?? 'Sin datos'}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Node {health?.system.nodeVersion ?? 'N/A'}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <HardDrive className="h-4 w-4 text-emerald-500" />
                Memoria externa
              </p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {memory ? `${memory.external} ${memory.unit}` : 'Sin datos'}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Recursos adicionales disponibles
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Servicios críticos</CardTitle>
            <CardDescription>
              Estado de las dependencias principales para la operación.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <Database className="mt-1 h-5 w-5 text-indigo-500" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Base de datos</p>
                <p className="text-xs text-gray-500">Conectividad y salud de la base de datos principal.</p>
              </div>
              <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusStyles(health?.services.database)}`}>
                {health?.services.database ?? 'Sin datos'}
              </span>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <Server className="mt-1 h-5 w-5 text-amber-500" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Redis / Cache</p>
                <p className="text-xs text-gray-500">Estado del servicio de cache y colas.</p>
              </div>
              <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusStyles(health?.services.redis)}`}>
                {health?.services.redis ?? 'Sin datos'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Uso de memoria</CardTitle>
            <CardDescription>
              Monitoreo del consumo de memoria del proceso Node.js.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {memory ? (
              <>
                <div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Uso actual</span>
                    <span>{memoryUsage}%</span>
                  </div>
                  <div className="mt-2 h-3 w-full rounded-full bg-gray-200">
                    <div
                      className="h-3 rounded-full bg-blue-500 transition-all"
                      style={{ width: `${memoryUsage}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                  <div>
                    <p className="text-xs text-gray-500">Utilizada</p>
                    <p className="font-semibold">
                      {memory.used} {memory.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total disponible</p>
                    <p className="font-semibold">
                      {memory.total} {memory.unit}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">No hay información disponible.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Uso de CPU</CardTitle>
            <CardDescription>Consumo de CPU del proceso y uso del sistema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cpu ? (
              <>
                <div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Uso del proceso</span>
                    <span>{cpuUsage}%</span>
                  </div>
                  <div className="mt-2 h-3 w-full rounded-full bg-gray-200">
                    <div
                      className="h-3 rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${cpuUsage}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                  <div>
                    <p className="text-xs text-gray-500">Proceso (user)</p>
                    <p className="font-semibold">
                      {cpu.user} {cpu.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Sistema</p>
                    <p className="font-semibold">
                      {cpu.system} {cpu.unit}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">No hay información disponible.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <SystemLogsModal
        isOpen={showLogs}
        onClose={() => setShowLogs(false)}
      />
    </div>
  );
}
