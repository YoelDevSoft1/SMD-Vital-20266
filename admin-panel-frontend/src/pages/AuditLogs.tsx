import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { AlertCircle, FileSearch, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '@/services/admin.service';
import { Alerta } from '@/components/ui/Alerta';
import { Boton } from '@/components/ui/Boton';
import { Tarjeta, TarjetaContenido, TarjetaEncabezado, TarjetaTitulo } from '@/components/ui/Tarjeta';
import { Entrada } from '@/components/ui/Entrada';
import { EsqueletoTabla } from '@/components/ui/Esqueleto';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { PickerSelect, type PickerSelectOption } from '@/components/ui/PickerSelect';
import type { AuditLogFilters, AuditLogEntry, UserRole } from '@/types';

const ROLE_OPTIONS: Array<UserRole | ''> = ['', 'ADMIN', 'SUPER_ADMIN', 'DOCTOR', 'NURSE', 'PATIENT'];
const ENTITY_OPTIONS = ['', 'APPOINTMENT', 'ENCOUNTER', 'MEDICAL_RECORD', 'PRESCRIPTION', 'PAYMENT', 'USER', 'SERVICE', 'REVIEW', 'NOTIFICATION'];
const ACTION_OPTIONS = ['', 'CREATE', 'UPDATE', 'DELETE', 'COMPLETE', 'SEND_EMAIL', 'DOWNLOAD', 'LOGIN', 'LOGOUT'];

const ROLE_LABELS: Record<string, string> = {
  '': 'Todos los roles',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super Admin',
  DOCTOR: 'Médico',
  NURSE: 'Enfermero/a',
  PATIENT: 'Paciente',
};

const ENTITY_LABELS: Record<string, string> = {
  '': 'Todas las entidades',
  APPOINTMENT: 'Cita',
  ENCOUNTER: 'Atención',
  MEDICAL_RECORD: 'Historia clínica',
  PRESCRIPTION: 'Receta',
  PAYMENT: 'Pago',
  USER: 'Usuario',
  SERVICE: 'Servicio',
  REVIEW: 'Reseña',
  NOTIFICATION: 'Notificación',
};

const ACTION_LABELS: Record<string, string> = {
  '': 'Todas las acciones',
  CREATE: 'Crear',
  UPDATE: 'Actualizar',
  DELETE: 'Eliminar',
  COMPLETE: 'Completar',
  SEND_EMAIL: 'Enviar correo',
  DOWNLOAD: 'Descargar',
  LOGIN: 'Iniciar sesión',
  LOGOUT: 'Cerrar sesión',
};

const OPCIONES_ROL: PickerSelectOption[] = ROLE_OPTIONS.map((role) => ({
  value: role,
  label: ROLE_LABELS[role] ?? role,
}));

const OPCIONES_ENTIDAD: PickerSelectOption[] = ENTITY_OPTIONS.map((entity) => ({
  value: entity,
  label: ENTITY_LABELS[entity] ?? entity,
}));

const OPCIONES_ACCION: PickerSelectOption[] = ACTION_OPTIONS.map((action) => ({
  value: action,
  label: ACTION_LABELS[action] ?? action,
}));

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

  // Toast on query error (in addition to inline error state)
  useEffect(() => {
    if (error) {
      toast.error('No se pudo cargar la auditoría');
    }
  }, [error]);

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

      <Tarjeta className="sticky top-16 z-20 border border-border shadow-sm dark:border-border dark:bg-card/95">
        <TarjetaEncabezado>
          <TarjetaTitulo className="flex items-center gap-2 text-lg text-foreground dark:text-foreground">
            <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Filtros de auditoria
          </TarjetaTitulo>
        </TarjetaEncabezado>
        <TarjetaContenido className="grid gap-3 md:grid-cols-4">
          <Entrada
            value={filters.search ?? ''}
            onChange={(event) => updateFilter('search', event.target.value)}
            placeholder="Buscar actor o entidad"
          />
          <PickerSelect
            value={filters.actorRole ?? ''}
            onChange={(v) => updateFilter('actorRole', v as UserRole | '')}
            options={OPCIONES_ROL}
            variant="glass"
            title="Filtrar por rol"
          />
          <PickerSelect
            value={filters.entity ?? ''}
            onChange={(v) => updateFilter('entity', v)}
            options={OPCIONES_ENTIDAD}
            variant="glass"
            title="Filtrar por entidad"
          />
          <PickerSelect
            value={filters.action ?? ''}
            onChange={(v) => updateFilter('action', v)}
            options={OPCIONES_ACCION}
            variant="glass"
            title="Filtrar por acción"
          />
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

      <Tarjeta className="border border-border shadow-sm dark:border-border dark:bg-card">
        <TarjetaContenido className="p-0">
          {isLoading ? (
            <div className="p-4 sm:p-6">
              <EsqueletoTabla rows={8} columns={5} />
            </div>
          ) : error ? (
            <div className="p-4 sm:p-6">
              <Alerta
                variant="danger"
                title="No se pudo cargar la auditoría"
                icon={AlertCircle}
                action={
                  <Boton variant="outline" onClick={() => refetch()}>
                    <RefreshCw className="h-4 w-4" />
                    Reintentar
                  </Boton>
                }
              >
                Verifica tu conexión o vuelve a intentarlo en unos segundos.
              </Alerta>
            </div>
          ) : logs.length === 0 ? (
            <EstadoVacio
              icon={FileSearch}
              title="No hay registros"
              description="No se encontraron registros para los filtros aplicados."
              size="md"
            />
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
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
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
