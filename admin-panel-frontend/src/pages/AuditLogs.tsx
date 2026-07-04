import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { adminService } from '@/services/admin.service';
import { Boton } from '@/components/ui/Boton';
import { Tarjeta, TarjetaContenido, TarjetaEncabezado, TarjetaTitulo } from '@/components/ui/Tarjeta';
import { Entrada } from '@/components/ui/Entrada';
import type { AuditLogFilters, AuditLogEntry, UserRole } from '@/types';

const roleOptions: Array<UserRole | ''> = ['', 'ADMIN', 'SUPER_ADMIN', 'DOCTOR', 'NURSE', 'PATIENT'];
const entityOptions = ['', 'APPOINTMENT', 'ENCOUNTER', 'MEDICAL_RECORD', 'PRESCRIPTION', 'PAYMENT', 'USER', 'SERVICE', 'REVIEW', 'NOTIFICATION'];
const actionOptions = ['', 'CREATE', 'UPDATE', 'DELETE', 'COMPLETE', 'SEND_EMAIL', 'DOWNLOAD', 'LOGIN', 'LOGOUT'];

const formatearFechaHora = (value: string) =>
  new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

export default function AuditLogs() {
  const initialFilters = useMemo<AuditLogFilters>(() => {
    const today = new Date();
    return {
      page: 1,
      limit: 25,
      dateFrom: format(subDays(today, 30), 'yyyy-MM-dd'),
      dateTo: format(today, 'yyyy-MM-dd'),
    };
  }, []);

  const [filters, setFilters] = useState<AuditLogFilters>(initialFilters);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => adminService.getAuditLogs(filters),
    staleTime: 30_000,
  });

  const payload = data?.data?.data;
  const logs: AuditLogEntry[] = payload?.data ?? [];
  const pagination = payload?.pagination;

  const updateFilter = <K extends keyof AuditLogFilters>(key: K, value: AuditLogFilters[K]) => {
    setFilters((current) => ({
      ...current,
      page: key === 'page' ? (value as number) : 1,
      [key]: value,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground dark:text-foreground">Auditoria</h1>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
            Bitacora de actions sensibles, descargas, correos y cambios clinicos.
          </p>
        </div>
        <Boton variant="outline" onClick={() => refetch()} isLoading={isFetching}>
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Boton>
      </div>

      <Tarjeta className="border border-border shadow-sm dark:border-border">
        <TarjetaEncabezado>
          <TarjetaTitulo className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            Filtros de auditoria
          </TarjetaTitulo>
        </TarjetaEncabezado>
        <TarjetaContenido className="grid gap-3 md:grid-cols-4">
          <Entrada
            value={filters.search ?? ''}
            onChange={(event) => updateFilter('search', event.target.value)}
            placeholder="Buscar actor o entidad"
          />
          <select
            value={filters.actorRole ?? ''}
            onChange={(event) => updateFilter('actorRole', event.target.value as UserRole | '')}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground dark:border-border dark:bg-card dark:text-foreground"
          >
            {roleOptions.map((role) => (
              <option key={role || 'all'} value={role}>
                {role || 'Todos los roles'}
              </option>
            ))}
          </select>
          <select
            value={filters.entity ?? ''}
            onChange={(event) => updateFilter('entity', event.target.value)}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground dark:border-border dark:bg-card dark:text-foreground"
          >
            {entityOptions.map((entity) => (
              <option key={entity || 'all'} value={entity}>
                {entity || 'Todas las entidades'}
              </option>
            ))}
          </select>
          <select
            value={filters.action ?? ''}
            onChange={(event) => updateFilter('action', event.target.value)}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground dark:border-border dark:bg-card dark:text-foreground"
          >
            {actionOptions.map((action) => (
              <option key={action || 'all'} value={action}>
                {action || 'Todas las actions'}
              </option>
            ))}
          </select>
          <Entrada
            type="date"
            value={filters.dateFrom ?? ''}
            onChange={(event) => updateFilter('dateFrom', event.target.value)}
          />
          <Entrada
            type="date"
            value={filters.dateTo ?? ''}
            onChange={(event) => updateFilter('dateTo', event.target.value)}
          />
          <Boton variant="outline" onClick={() => refetch()} className="md:col-span-2">
            <Search className="h-4 w-4" />
            Aplicar filtros
          </Boton>
        </TarjetaContenido>
      </Tarjeta>

      <Tarjeta className="border border-border shadow-sm dark:border-border">
        <TarjetaContenido className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-sm text-muted-foreground dark:text-muted-foreground">Cargando auditoria...</div>
          ) : error ? (
            <div className="p-12 text-center text-sm text-red-600 dark:text-red-400">No se pudo cargar la auditoria.</div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground dark:text-muted-foreground">No hay registros para estos filtros.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm dark:divide-border">
                <thead className="bg-muted dark:bg-card">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground dark:text-muted-foreground">Fecha</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground dark:text-muted-foreground">Actor</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground dark:text-muted-foreground">Accion</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground dark:text-muted-foreground">Entidad</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground dark:text-muted-foreground">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-border">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted dark:hover:bg-card/60">
                      <td className="whitespace-nowrap px-4 py-3 text-foreground dark:text-foreground">
                        {formatearFechaHora(log.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-foreground dark:text-foreground">
                        <div className="font-medium">
                          {log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : log.actorId}
                        </div>
                        <div className="text-xs text-muted-foreground dark:text-muted-foreground">{log.actorRole}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground dark:text-foreground">
                        <div>{log.entity}</div>
                        <div className="max-w-[180px] truncate text-xs text-muted-foreground dark:text-muted-foreground">{log.entityId}</div>
                      </td>
                      <td className="max-w-[320px] px-4 py-3 text-xs text-muted-foreground dark:text-muted-foreground">
                        {log.payload ? JSON.stringify(log.payload).slice(0, 180) : 'Sin payload'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TarjetaContenido>
      </Tarjeta>

      {pagination ? (
        <div className="flex items-center justify-between text-sm text-muted-foreground dark:text-muted-foreground">
          <span>
            Pagina {pagination.page} de {pagination.totalPages || 1} · {pagination.total} registros
          </span>
          <div className="flex gap-2">
            <Boton
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrev}
              onClick={() => updateFilter('page', Math.max(1, (filters.page ?? 1) - 1))}
            >
              Anterior
            </Boton>
            <Boton
              variant="outline"
              size="sm"
              disabled={!pagination.hasNext}
              onClick={() => updateFilter('page', (filters.page ?? 1) + 1)}
            >
              Siguiente
            </Boton>
          </div>
        </div>
      ) : null}
    </div>
  );
}
