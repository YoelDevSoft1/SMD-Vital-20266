import { useState } from 'react';
import { formatearFechaHora, formatearFecha } from '@/utils/dateFormat';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Calendar, FileDown, FileText, RefreshCw, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { clinicalService } from '@/services/clinical.service';
import { Tarjeta, TarjetaContenido, TarjetaEncabezado, TarjetaTitulo } from '@/components/ui/Tarjeta';
import { Boton } from '@/components/ui/Boton';
import { EsqueletoLista } from '@/components/ui/Esqueleto';
import { Alerta } from '@/components/ui/Alerta';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
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
  const documentDeliveries = history?.documentDeliveries ?? [];

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
          <h1 className="text-3xl font-bold text-foreground dark:text-foreground">Mi historial</h1>
        </div>
        <Alerta
          variant="danger"
          title="No se pudo cargar tu historial"
          icon={AlertCircle}
          action={
            <Boton variant="outline" onClick={() => refetch()}>
              Reintentar
            </Boton>
          }
        >
          Verifica tu conexión o vuelve a intentarlo en unos segundos.
        </Alerta>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground dark:text-foreground">Mi historial</h1>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
            Consulta tus citas y documentos clinicos descargables.
          </p>
        </div>
        <Boton
          variant="outline"
          onClick={() => refetch()}
          isLoading={isFetching}
          className="dark:text-foreground dark:border-border dark:hover:bg-muted"
        >
          <RefreshCw className={isFetching ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          Actualizar
        </Boton>
      </div>

      <Tarjeta className="border border-border shadow-sm dark:border-border">
        <TarjetaEncabezado>
          <TarjetaTitulo className="text-lg font-semibold text-foreground dark:text-foreground">
            Historial de citas
          </TarjetaTitulo>
        </TarjetaEncabezado>
        <TarjetaContenido className="p-0">
          {isLoading ? (
            <EsqueletoLista rows={4} />
          ) : appointments.length === 0 ? (
            <EstadoVacio
              icon={Calendar}
              title="No tienes citas registradas"
              description="Cuando agendes tu primera cita, aparecerá aquí con todos los detalles."
            />
          ) : (
            <ul className="divide-y divide-border dark:divide-border">
              {appointments.map((appointment) => (
                <li
                  key={appointment.id}
                  className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between sm:p-6"
                >
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground dark:text-foreground">
                      {appointment.service?.name || 'Servicio no definido'}
                    </h3>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                      {formatearFechaHora(appointment.scheduledAt)} · Dr.{' '}
                      {appointment.doctor?.user?.firstName} {appointment.doctor?.user?.lastName}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                    {appointment.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </TarjetaContenido>
      </Tarjeta>

      <Tarjeta className="border border-border shadow-sm dark:border-border">
        <TarjetaEncabezado>
          <TarjetaTitulo className="text-lg font-semibold text-foreground dark:text-foreground">
            Historias medicas
          </TarjetaTitulo>
        </TarjetaEncabezado>
        <TarjetaContenido className="p-0">
          {isLoading ? (
            <EsqueletoLista rows={3} />
          ) : medicalRecords.length === 0 ? (
            <EstadoVacio
              icon={FileText}
              title="Aún no tienes historias clínicas"
              description="Cuando un profesional genere tu primera historia clínica, aparecerá aquí."
            />
          ) : (
            <ul className="divide-y divide-border dark:divide-border">
              {medicalRecords.map((record) => {
                const canDownload = Boolean(record.pdfPath);
                return (
                  <li
                    key={record.id}
                    className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between sm:p-6"
                  >
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-foreground dark:text-foreground">
                        {record.title}
                      </h3>
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                        {record.doctor?.user?.firstName} {record.doctor?.user?.lastName} ·{' '}
                        {formatearFecha(record.createdAt)}
                      </p>
                    </div>
                    <Boton
                      variant="outline"
                      size="md"
                      onClick={() =>
                        handleDownload('record', record.id, `historia-${record.id}.pdf`)
                      }
                      disabled={downloadingId === record.id || !canDownload}
                      className="dark:text-foreground dark:border-border dark:hover:bg-muted"
                    >
                      <FileDown className="h-4 w-4" />
                      {canDownload ? 'Descargar' : 'No disponible'}
                    </Boton>
                  </li>
                );
              })}
            </ul>
          )}
        </TarjetaContenido>
      </Tarjeta>

      <Tarjeta className="border border-border shadow-sm dark:border-border">
        <TarjetaEncabezado>
          <TarjetaTitulo className="text-lg font-semibold text-foreground dark:text-foreground">
            Formulas medicas
          </TarjetaTitulo>
        </TarjetaEncabezado>
        <TarjetaContenido className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-sm text-muted-foreground dark:text-muted-foreground">
              Cargando formulas...
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground dark:text-muted-foreground">
              No hay formulas medicas registradas.
            </div>
          ) : (
            <div className="divide-y divide-border dark:divide-border">
              {prescriptions.map((prescription) => {
                const canDownload = Boolean(prescription.pdfPath);
                return (
                  <div
                    key={prescription.id}
                    className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <h3 className="text-sm font-semibold text-foreground dark:text-foreground">
                        Formula del {formatearFecha(prescription.createdAt)}
                      </h3>
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                        {prescription.doctor?.user?.firstName} {prescription.doctor?.user?.lastName}
                      </p>
                      {prescription.items?.length ? (
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                          {prescription.items.map((item) => item.medication).join(', ')}
                        </p>
                      ) : null}
                    </div>
                    <Boton
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleDownload('prescription', prescription.id, `formula-${prescription.id}.pdf`)
                      }
                      disabled={downloadingId === prescription.id || !canDownload}
                      className="dark:text-foreground dark:border-border dark:hover:bg-muted"
                    >
                      <FileDown className="h-4 w-4" />
                      {canDownload ? 'Descargar' : 'No disponible'}
                    </Boton>
                  </div>
                );
              })}
            </div>
          )}
        </TarjetaContenido>
      </Tarjeta>

      <Tarjeta className="border border-border shadow-sm dark:border-border">
        <TarjetaEncabezado>
          <TarjetaTitulo className="text-lg font-semibold text-foreground dark:text-foreground">
            Envio de documentos
          </TarjetaTitulo>
        </TarjetaEncabezado>
        <TarjetaContenido className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-sm text-muted-foreground dark:text-muted-foreground">
              Cargando envios...
            </div>
          ) : documentDeliveries.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground dark:text-muted-foreground">
              No hay envios registrados.
            </div>
          ) : (
            <div className="divide-y divide-border dark:divide-border">
              {documentDeliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="text-sm font-semibold text-foreground dark:text-foreground">
                      {delivery.email}
                    </h3>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                      {formatearFechaHora(delivery.createdAt)}
                      {delivery.lastError ? ` · ${delivery.lastError}` : ''}
                    </p>
                  </div>
                  <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground dark:border-border dark:text-foreground">
                    {delivery.status}
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

function getFileNameFromHeader(headerValue?: string) {
  if (!headerValue) {
    return null;
  }
  const match = /filename=\"?([^\";]+)\"?/i.exec(headerValue);
  return match?.[1] ?? null;
}

