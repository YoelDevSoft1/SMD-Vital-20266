import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { AlertCircle, Download, FileJson, FileText, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '@/services/admin.service';
import { Alerta } from '@/components/ui/Alerta';
import { Boton } from '@/components/ui/Boton';
import { Tarjeta, TarjetaContenido, TarjetaEncabezado, TarjetaTitulo } from '@/components/ui/Tarjeta';
import { Entrada } from '@/components/ui/Entrada';
import { EsqueletoTabla } from '@/components/ui/Esqueleto';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import type { RipsDraft, RipsDraftFilters, RipsDraftStatus } from '@/types';

const statusOptions: Array<RipsDraftStatus | ''> = ['', 'DRAFT', 'VALIDATED', 'EXPORTED', 'FAILED'];

const statusClass: Record<RipsDraftStatus, string> = {
  DRAFT: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  VALIDATED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
  EXPORTED: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  FAILED: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
};

const formatearFechaHora = (value: string) =>
  new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

export default function RipsDrafts() {
  const initialFilters = useMemo<RipsDraftFilters>(() => {
    const today = new Date();
    return {
      page: 1,
      limit: 25,
      dateFrom: format(subDays(today, 30), 'yyyy-MM-dd'),
      dateTo: format(today, 'yyyy-MM-dd'),
    };
  }, []);

  const [filters, setFilters] = useState<RipsDraftFilters>(initialFilters);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['rips-drafts', filters],
    queryFn: () => adminService.getRipsDrafts(filters),
    staleTime: 30_000,
  });

  const exportMutation = useMutation({
    mutationFn: () => adminService.exportRipsDrafts(filters),
    onSuccess: (response) => {
      const exported = response.data.data;
      if (!exported) return;
      const blob = new Blob([JSON.stringify(exported.data, null, 2)], {
        type: 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `smd-vital-rips-${exported.exportedAt.slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${exported.count} borradores RIPS exportados`);
      refetch();
    },
    onError: () => {
      toast.error('No se pudo exportar RIPS');
    },
  });

  const payload = data?.data?.data;
  const drafts: RipsDraft[] = payload?.data ?? [];
  const pagination = payload?.pagination;

  // Toast on query error (in addition to inline error state)
  useEffect(() => {
    if (error) {
      toast.error('No se pudo cargar RIPS');
    }
  }, [error]);

  const updateFilter = <K extends keyof RipsDraftFilters>(key: K, value: RipsDraftFilters[K]) => {
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
          <h1 className="text-3xl font-bold text-foreground dark:text-foreground">RIPS</h1>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
            Borradores internos para validacion y export JSON. No transmite al MUV.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Boton variant="outline" onClick={() => refetch()} isLoading={isFetching}>
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Boton>
          <Boton onClick={() => exportMutation.mutate()} isLoading={exportMutation.isPending}>
            <Download className="h-4 w-4" />
            Exportar JSON
          </Boton>
        </div>
      </div>

      <Tarjeta className="sticky top-16 z-20 border border-border shadow-sm dark:border-border dark:bg-card/95">
        <TarjetaEncabezado>
          <TarjetaTitulo className="flex items-center gap-2 text-lg text-foreground dark:text-foreground">
            <FileJson className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Filtros RIPS
          </TarjetaTitulo>
        </TarjetaEncabezado>
        <TarjetaContenido className="grid gap-3 md:grid-cols-4">
          <select
            value={filters.status ?? ''}
            onChange={(event) => updateFilter('status', event.target.value as RipsDraftStatus | '')}
            className="h-11 rounded-lg border border-border bg-white px-3 text-sm text-foreground dark:border-border dark:bg-card dark:text-foreground"
          >
            {statusOptions.map((status) => (
              <option key={status || 'all'} value={status}>
                {status || 'Todos los estados'}
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
          <Boton variant="outline" onClick={() => refetch()}>
            Aplicar filtros
          </Boton>
        </TarjetaContenido>
      </Tarjeta>

      <Tarjeta className="border border-border shadow-sm dark:border-border dark:bg-card">
        <TarjetaContenido className="p-0">
          {isLoading ? (
            <div className="p-4 sm:p-6">
              <EsqueletoTabla rows={8} columns={6} />
            </div>
          ) : error ? (
            <div className="p-4 sm:p-6">
              <Alerta
                variant="danger"
                title="No se pudo cargar RIPS"
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
          ) : drafts.length === 0 ? (
            <EstadoVacio
              icon={FileText}
              title="Sin borradores RIPS"
              description="No hay borradores para los filtros aplicados."
              size="md"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm dark:divide-border">
                <thead className="bg-muted dark:bg-card">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground dark:text-muted-foreground">Generado</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground dark:text-muted-foreground">Cita</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground dark:text-muted-foreground">Paciente</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground dark:text-muted-foreground">Servicio</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground dark:text-muted-foreground">Estado</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground dark:text-muted-foreground">Errores</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-border">
                  {drafts.map((draft) => (
                    <tr key={draft.id} className="hover:bg-muted dark:hover:bg-card/60">
                      <td className="whitespace-nowrap px-4 py-3 text-foreground dark:text-foreground">
                        {formatearFechaHora(draft.generatedAt)}
                      </td>
                      <td className="px-4 py-3 text-foreground dark:text-foreground">
                        <div className="max-w-[160px] truncate">{draft.appointmentId}</div>
                        <div className="text-xs text-muted-foreground dark:text-muted-foreground">
                          {draft.appointment?.status ?? 'Sin estado'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-foreground dark:text-foreground">
                        {draft.appointment?.patient?.user?.firstName} {draft.appointment?.patient?.user?.lastName}
                      </td>
                      <td className="px-4 py-3 text-foreground dark:text-foreground">
                        {draft.appointment?.service?.name ?? 'Sin servicio'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[draft.status]}`}>
                          {draft.status}
                        </span>
                      </td>
                      <td className="max-w-[260px] px-4 py-3 text-xs text-muted-foreground dark:text-muted-foreground">
                        {draft.errors?.length ? draft.errors.join(', ') : 'Sin errores'}
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
            Pagina {pagination.page} de {pagination.totalPages || 1} · {pagination.total} borradores
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
