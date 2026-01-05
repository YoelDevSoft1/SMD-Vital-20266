import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, FileDown, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { clinicalService } from '@/services/clinical.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import type { PatientHistory as PatientHistoryType } from '@/types';

export default function PatientHistory() {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['patient-history'],
    queryFn: () => clinicalService.getPatientHistory(),
    staleTime: 30_000,
  });

  const history = data?.data?.data as PatientHistoryType | undefined;
  const appointments = history?.appointments ?? [];
  const medicalRecords = history?.medicalRecords ?? [];
  const prescriptions = history?.prescriptions ?? [];

  const handleDownload = async (type: 'record' | 'prescription', id: string, fallbackName: string) => {
    try {
      setDownloadingId(id);
      const response =
        type === 'record'
          ? await clinicalService.downloadMedicalRecord(id)
          : await clinicalService.downloadPrescription(id);

      const contentType = response.headers['content-type'] || 'application/pdf';
      const fileName = getFileNameFromHeader(response.headers['content-disposition']) || fallbackName;
      const blob = new Blob([response.data], { type: contentType });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'No se pudo descargar el documento');
    } finally {
      setDownloadingId(null);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mi historial</h1>
        </div>
        <Card className="border border-red-200 bg-red-50/60 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="flex flex-col gap-4 p-6 text-sm">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div>
                <h2 className="text-lg font-semibold text-red-700 dark:text-red-300">
                  No se pudo cargar tu historial
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mi historial</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Consulta tus citas y documentos clinicos descargables.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          isLoading={isFetching}
          className="dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
        >
          <RefreshCw className={isFetching ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          Actualizar
        </Button>
      </div>

      <Card className="border border-gray-200 shadow-sm dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Historial de citas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-sm text-gray-500 dark:text-gray-400">
              Cargando citas...
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-500 dark:text-gray-400">
              No hay citas registradas.
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
                      {appointment.service?.name || 'Servicio no definido'}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDateTime(appointment.scheduledAt)} · Dr.{' '}
                      {appointment.doctor?.user?.firstName} {appointment.doctor?.user?.lastName}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {appointment.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border border-gray-200 shadow-sm dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Historias medicas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-sm text-gray-500 dark:text-gray-400">
              Cargando historias...
            </div>
          ) : medicalRecords.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-500 dark:text-gray-400">
              No hay historias medicas registradas.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {medicalRecords.map((record) => {
                const canDownload = Boolean(record.pdfPath);
                return (
                  <div
                    key={record.id}
                    className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {record.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {record.doctor?.user?.firstName} {record.doctor?.user?.lastName} ·{' '}
                        {formatDate(record.createdAt)}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleDownload('record', record.id, `historia-${record.id}.pdf`)
                      }
                      disabled={downloadingId === record.id || !canDownload}
                      className="dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      <FileDown className="h-4 w-4" />
                      {canDownload ? 'Descargar' : 'No disponible'}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border border-gray-200 shadow-sm dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Formulas medicas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-sm text-gray-500 dark:text-gray-400">
              Cargando formulas...
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-500 dark:text-gray-400">
              No hay formulas medicas registradas.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {prescriptions.map((prescription) => {
                const canDownload = Boolean(prescription.pdfPath);
                return (
                  <div
                    key={prescription.id}
                    className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Formula del {formatDate(prescription.createdAt)}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {prescription.doctor?.user?.firstName} {prescription.doctor?.user?.lastName}
                      </p>
                      {prescription.items?.length ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {prescription.items.map((item) => item.medication).join(', ')}
                        </p>
                      ) : null}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleDownload('prescription', prescription.id, `formula-${prescription.id}.pdf`)
                      }
                      disabled={downloadingId === prescription.id || !canDownload}
                      className="dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      <FileDown className="h-4 w-4" />
                      {canDownload ? 'Descargar' : 'No disponible'}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function getFileNameFromHeader(headerValue?: string) {
  if (!headerValue) {
    return null;
  }
  const match = /filename=\"?([^\";]+)\"?/i.exec(headerValue);
  return match?.[1] ?? null;
}

function formatDateTime(dateString: string) {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}
