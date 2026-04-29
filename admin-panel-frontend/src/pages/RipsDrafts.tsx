import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { Download, FileJson, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '@/services/admin.service';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { RipsDraft, RipsDraftFilters, RipsDraftStatus } from '@/types';

const statusOptions: Array<RipsDraftStatus | ''> = ['', 'DRAFT', 'VALIDATED', 'EXPORTED', 'FAILED'];

const statusClass: Record<RipsDraftStatus, string> = {
  DRAFT: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  VALIDATED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
  EXPORTED: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  FAILED: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
};

const formatDateTime = (value: string) =>
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">RIPS</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Borradores internos para validacion y export JSON. No transmite al MUV.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => refetch()} isLoading={isFetching}>
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
          <Button onClick={() => exportMutation.mutate()} isLoading={exportMutation.isPending}>
            <Download className="h-4 w-4" />
            Exportar JSON
          </Button>
        </div>
      </div>

      <Card className="border border-gray-200 shadow-sm dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileJson className="h-5 w-5 text-blue-600" />
            Filtros RIPS
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <select
            value={filters.status ?? ''}
            onChange={(event) => updateFilter('status', event.target.value as RipsDraftStatus | '')}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            {statusOptions.map((status) => (
              <option key={status || 'all'} value={status}>
                {status || 'Todos los estados'}
              </option>
            ))}
          </select>
          <Input
            type="date"
            value={filters.dateFrom ?? ''}
            onChange={(event) => updateFilter('dateFrom', event.target.value)}
          />
          <Input
            type="date"
            value={filters.dateTo ?? ''}
            onChange={(event) => updateFilter('dateTo', event.target.value)}
          />
          <Button variant="outline" onClick={() => refetch()}>
            Aplicar filtros
          </Button>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 shadow-sm dark:border-gray-700">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-sm text-gray-500 dark:text-gray-400">Generando borradores...</div>
          ) : error ? (
            <div className="p-12 text-center text-sm text-red-600 dark:text-red-400">No se pudo cargar RIPS.</div>
          ) : drafts.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-500 dark:text-gray-400">No hay borradores para estos filtros.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Generado</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Cita</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Paciente</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Servicio</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Estado</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Errores</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {drafts.map((draft) => (
                    <tr key={draft.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-200">
                        {formatDateTime(draft.generatedAt)}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                        <div className="max-w-[160px] truncate">{draft.appointmentId}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {draft.appointment?.status ?? 'Sin estado'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                        {draft.appointment?.patient?.user?.firstName} {draft.appointment?.patient?.user?.lastName}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                        {draft.appointment?.service?.name ?? 'Sin servicio'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[draft.status]}`}>
                          {draft.status}
                        </span>
                      </td>
                      <td className="max-w-[260px] px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                        {draft.errors?.length ? draft.errors.join(', ') : 'Sin errores'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {pagination ? (
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
          <span>
            Pagina {pagination.page} de {pagination.totalPages || 1} · {pagination.total} borradores
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrev}
              onClick={() => updateFilter('page', Math.max(1, (filters.page ?? 1) - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNext}
              onClick={() => updateFilter('page', (filters.page ?? 1) + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
