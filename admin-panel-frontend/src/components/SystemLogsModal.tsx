import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, RefreshCw, Search, Filter, AlertCircle, Loader2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '@/services/admin.service';
import type { SystemLog, SystemLogFilters } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Select, SelectItem, SelectValue } from '@/components/ui/select';

interface SystemLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LEVEL_OPTIONS = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'];

const levelColors: Record<string, string> = {
  DEBUG: 'bg-slate-100 text-slate-800',
  INFO: 'bg-blue-100 text-blue-800',
  WARN: 'bg-amber-100 text-amber-800',
  ERROR: 'bg-red-100 text-red-800',
  CRITICAL: 'bg-red-200 text-red-900',
};

export default function SystemLogsModal({ isOpen, onClose }: SystemLogsModalProps) {
  const [filters, setFilters] = useState<SystemLogFilters>({
    page: 1,
    limit: 10,
    level: '',
    service: '',
    search: '',
    dateFrom: '',
    dateTo: '',
  });
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['system-logs', filters],
    queryFn: () => adminService.getSystemLogs(filters),
    enabled: isOpen,
    staleTime: 30_000,
    onError: () => {
      toast.error('No se pudieron cargar los logs del sistema.');
    },
  });

  const logsResponse = data?.data;
  const logs = logsResponse?.data ?? [];
  const pagination = logsResponse?.pagination;

  const services = useMemo(() => {
    const unique = new Set<string>();
    logs.forEach((log) => {
      if (log.service) {
        unique.add(log.service);
      }
    });
    return Array.from(unique).sort();
  }, [logs]);

  if (!isOpen) {
    return null;
  }

  const handleFilterChange = (key: keyof SystemLogFilters, value: string | number | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      level: '',
      service: '',
      search: '',
      dateFrom: '',
      dateTo: '',
    });
    setSelectedLog(null);
  };

  const handlePageChange = (page: number) => {
    if (!pagination) return;
    if (page < 1 || page > pagination.totalPages) return;
    setFilters((prev) => ({ ...prev, page }));
  };

  const formatTimestamp = (value: string) => {
    try {
      return new Intl.DateTimeFormat('es-ES', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(new Date(value));
    } catch {
      return value;
    }
  };

  const currentLevelColor = (level: string) => levelColors[level] ?? 'bg-gray-100 text-gray-800';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-6 backdrop-blur-sm">
      <div className="relative flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl">
        <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Logs del Sistema</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Monitorea los eventos críticos y operativos de la plataforma.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => refetch()}
              isLoading={isFetching}
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <div className="grid flex-1 gap-6 overflow-hidden p-6 lg:grid-cols-[2fr_1fr]">
          <section className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            <div className="border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-5 py-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="md:col-span-2">
                  <Label htmlFor="log-search" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Búsqueda
                  </Label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <Input
                      id="log-search"
                      placeholder="Buscar por mensaje, requestId o contexto"
                      className="pl-9"
                      value={filters.search ?? ''}
                      onChange={(event) => handleFilterChange('search', event.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="log-level" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nivel
                  </Label>
                  <Select
                    id="log-level"
                    value={filters.level ?? ''}
                    onChange={(event) => handleFilterChange('level', event.target.value)}
                  >
                    <SelectValue placeholder="Todos los niveles" />
                    {LEVEL_OPTIONS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label htmlFor="log-service" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Servicio
                  </Label>
                  <Select
                    id="log-service"
                    value={filters.service ?? ''}
                    onChange={(event) => handleFilterChange('service', event.target.value)}
                  >
                    <SelectValue placeholder="Todos los servicios" />
                    {services.map((service) => (
                      <SelectItem key={service} value={service}>
                        {service}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="date-from" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Desde
                  </Label>
                  <Input
                    id="date-from"
                    type="date"
                    value={filters.dateFrom ?? ''}
                    onChange={(event) => handleFilterChange('dateFrom', event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="date-to" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Hasta
                  </Label>
                  <Input
                    id="date-to"
                    type="date"
                    value={filters.dateTo ?? ''}
                    onChange={(event) => handleFilterChange('dateTo', event.target.value)}
                  />
                </div>
                <div className="flex items-end gap-3">
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={handleResetFilters}
                  >
                    Limpiar filtros
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              {isLoading ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-500">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  Cargando logs del sistema...
                </div>
              ) : error ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Error al cargar los logs</p>
                    <p className="text-sm text-gray-500">
                      Intenta actualizar o verifica que el backend esté disponible.
                    </p>
                  </div>
                </div>
              ) : logs.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                  <FileText className="h-8 w-8 text-gray-400" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Sin registros</p>
                    <p className="text-sm text-gray-500">
                      No se encontraron eventos con los filtros seleccionados.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-full overflow-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
                          Timestamp
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
                          Nivel
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
                          Servicio
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
                          Mensaje
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                      {logs.map((log) => (
                        <tr
                          key={log.id}
                          onClick={() => setSelectedLog(log)}
                          className={`cursor-pointer transition-colors hover:bg-blue-50 ${
                            selectedLog?.id === log.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                            {formatTimestamp(log.timestamp)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm">
                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${currentLevelColor(log.level)}`}>
                              {log.level}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                            {log.service || 'Desconocido'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <span className="line-clamp-2">{log.message}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 py-3">
                <div className="hidden text-sm text-gray-600 md:block">
                  Página {pagination.page} de {pagination.totalPages} · {pagination.total}{' '}
                  registros
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange((filters.page ?? 1) - 1)}
                    disabled={!pagination.hasPrev || (filters.page ?? 1) <= 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange((filters.page ?? 1) + 1)}
                    disabled={!pagination.hasNext || (filters.page ?? 1) >= pagination.totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </section>

          <aside className="flex h-full flex-col rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center border-b border-gray-200 px-5 py-4">
              <Filter className="mr-3 h-5 w-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Detalle del evento</h3>
                <p className="text-xs text-gray-500">Selecciona un log para ver información ampliada.</p>
              </div>
            </div>

            {selectedLog ? (
              <div className="flex-1 overflow-auto px-5 py-4">
                <div className="space-y-4 text-sm text-gray-700">
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">Timestamp</p>
                    <p>{formatTimestamp(selectedLog.timestamp)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">Nivel</p>
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${currentLevelColor(selectedLog.level)}`}>
                      {selectedLog.level}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">Servicio</p>
                    <p>{selectedLog.service || 'Desconocido'}</p>
                  </div>
                  {selectedLog.environment && (
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">Entorno</p>
                      <p>{selectedLog.environment}</p>
                    </div>
                  )}
                  {selectedLog.requestId && (
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">Request ID</p>
                      <p>{selectedLog.requestId}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">Mensaje</p>
                    <p className="whitespace-pre-wrap text-gray-800">{selectedLog.message}</p>
                  </div>
                  {selectedLog.context && (
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">Contexto</p>
                      <pre className="mt-2 overflow-auto rounded-lg bg-gray-100 p-3 text-xs text-gray-700">
                        {JSON.stringify(selectedLog.context, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-gray-500">
                <Filter className="h-10 w-10 text-gray-300" />
                <p className="text-sm">
                  Selecciona un registro de la tabla para revisar los detalles completos.
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
