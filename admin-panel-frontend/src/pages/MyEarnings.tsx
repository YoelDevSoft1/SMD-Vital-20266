/**
 * MyEarnings.tsx
 *
 * Vista DOCTOR / NURSE — Tus servicios, comisiones y pagos.
 *
 *  - Resumen: por pagar / pagado / recibido / en disputa
 *  - Servicios de hoy
 *  - Lista de acknowledgements con acción 1-tap (Confirmar / Disputar)
 *
 * Refactor: usa el design system (Encabezado, TarjetaEstadistica, Insignia, EstadoVacio,
 * Modal, GrupoFiltros, formatearCOP, obtenerMetaEstadoAck).
 */

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Inbox,
} from 'lucide-react';
import toast from 'react-hot-toast';

import billingService, {
  type Acknowledgement,
} from '@/services/billing.service';
import { Tarjeta, TarjetaContenido, TarjetaEncabezado, TarjetaTitulo } from '@/components/ui/Tarjeta';
import { Boton } from '@/components/ui/Boton';
import { Entrada } from '@/components/ui/Entrada';
import { Etiqueta } from '@/components/ui/Etiqueta';
import { Esqueleto } from '@/components/ui/Esqueleto';
import { Modal } from '@/components/ui/Modal';
import { Encabezado } from '@/components/ui/Encabezado';
import { TarjetaEstadistica } from '@/components/ui/TarjetaEstadistica';
import { Insignia } from '@/components/ui/Insignia';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { GrupoFiltros } from '@/components/ui/GrupoFiltros';
import { Alerta } from '@/components/ui/Alerta';
import { formatearCOP, formatearFecha, formatearHora } from '@/utils/formato';
import {
  OPCIONES_FILTRO_ESTADO_ACK,
  obtenerMetaEstadoAck,
  obtenerMetaEstadoCita,
} from '@/utils/estados';

const DEFAULT_FILTER: 'all' | 'PENDING' | 'PAID' | 'ACKNOWLEDGED' = 'all';

export default function MyEarnings() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<typeof DEFAULT_FILTER>(DEFAULT_FILTER);
  const [disputeTarget, setDisputeTarget] = useState<Acknowledgement | null>(null);

  const { data: acksData, isLoading: acksLoading } = useQuery({
    queryKey: ['my-acks', filter],
    queryFn: () =>
      billingService.getMyAcknowledgements(filter === 'all' ? undefined : { status: filter }),
    refetchInterval: 30_000,
  });

  const today = new Date().toISOString().slice(0, 10);
  const weekFromNow = new Date(Date.now() + 7 * 86_400_000).toISOString();
  const { data: aptData, isLoading: aptLoading } = useQuery({
    queryKey: ['my-appointments'],
    queryFn: () =>
      billingService.getMyAppointments({ dateFrom: today, dateTo: weekFromNow }),
  });

  const ackMutation = useMutation({
    mutationFn: (ackId: string) => billingService.acknowledgeReceipt(ackId),
    onSuccess: () => {
      toast.success('Recepción confirmada');
      queryClient.invalidateQueries({ queryKey: ['my-acks'] });
    },
    onError: (e: unknown) =>
      toast.error(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'No se pudo confirmar',
      ),
  });

  const disputeMutation = useMutation({
    mutationFn: ({ ackId, reason }: { ackId: string; reason: string }) =>
      billingService.disputeAcknowledgement(ackId, reason),
    onSuccess: () => {
      toast.success('Disputa registrada');
      queryClient.invalidateQueries({ queryKey: ['my-acks'] });
    },
    onError: (e: unknown) =>
      toast.error(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Error',
      ),
  });

  const totals = acksData?.totals ?? {
    PENDING: 0,
    PAID: 0,
    ACKNOWLEDGED: 0,
    DISPUTED: 0,
    total: 0,
  };
  const acks = acksData?.acknowledgements ?? [];
  const appointments = aptData?.appointments ?? [];
  const todayApts = useMemo(
    () => appointments.filter((a) => a.scheduledAt.slice(0, 10) === today),
    [appointments, today],
  );

  return (
    <div className="space-y-6">
      <Encabezado
        title="Mi actividad"
        subtitle="Tus servicios, comisiones y pagos. Refresca cada 30 s."
      />

      {/* Resumen financiero */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <TarjetaEstadistica
          label="Por pagar"
          value={formatearCOP(totals.PENDING)}
          hint={`${acks.filter((a) => a.status === 'PENDING').length} servicios`}
          icon={Clock}
          color="warning"
          loading={acksLoading}
        />
        <TarjetaEstadistica
          label="Pagado · por confirmar"
          value={formatearCOP(totals.PAID)}
          hint={`${acks.filter((a) => a.status === 'PAID').length} por confirmar`}
          icon={DollarSign}
          color="info"
          loading={acksLoading}
        />
        <TarjetaEstadistica
          label="Recibido total"
          value={formatearCOP(totals.ACKNOWLEDGED)}
          icon={CheckCircle2}
          color="success"
          loading={acksLoading}
        />
        <TarjetaEstadistica
          label="En disputa"
          value={formatearCOP(totals.DISPUTED ?? 0)}
          hint={totals.DISPUTED ? 'Caso open' : undefined}
          icon={AlertTriangle}
          color={totals.DISPUTED ? 'danger' : 'neutral'}
          loading={acksLoading}
        />
      </div>

      {/* Servicios de hoy */}
      <Tarjeta>
        <TarjetaEncabezado>
          <TarjetaTitulo className="flex flex-wrap items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-info" aria-hidden="true" />
            Mis servicios de hoy
            <Insignia variant="info" size="sm">
              {todayApts.length}
            </Insignia>
          </TarjetaTitulo>
        </TarjetaEncabezado>
        <TarjetaContenido>
          {aptLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg border border-border p-3"
                >
                  <Esqueleto className="h-5 w-12 rounded" />
                  <div className="flex-1 space-y-2">
                    <Esqueleto className="h-4 w-1/2" />
                    <Esqueleto className="h-3 w-2/3" />
                  </div>
                  <div className="space-y-1.5 text-right">
                    <Esqueleto className="ml-auto h-4 w-16" />
                    <Esqueleto className="ml-auto h-3 w-12" />
                  </div>
                </div>
              ))}
            </div>
          ) : todayApts.length === 0 ? (
            <EstadoVacio
              icon={Calendar}
              title="No tienes servicios hoy"
              description="Tu agenda está libre. Descansa o revisa la lista de pagos."
            />
          ) : (
            <ul className="space-y-2">
              {todayApts.map((apt) => {
                const status = obtenerMetaEstadoCita(apt.status);
                return (
                  <li
                    key={apt.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                          {formatearHora(apt.scheduledAt)}
                        </span>
                        <span className="text-sm text-foreground">
                          {apt.service?.name ?? 'Servicio'}
                        </span>
                        <Insignia variant={status.variant} size="sm">
                          {status.label}
                        </Insignia>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {apt.patient?.user?.firstName} {apt.patient?.user?.lastName}
                        {' · '}
                        {apt.address}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums text-success">
                        {formatearCOP(apt.totalPrice)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Tu pago:{' '}
                        <span className="font-semibold text-foreground">
                          {formatearCOP(apt.marginSnapshot?.professionalAmount ?? 0)}
                        </span>
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </TarjetaContenido>
      </Tarjeta>

      {/* Lista de acks con acción 1-tap */}
      <Tarjeta>
        <TarjetaEncabezado>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TarjetaTitulo className="text-base">Mis pagos</TarjetaTitulo>
            <GrupoFiltros
              options={OPCIONES_FILTRO_ESTADO_ACK}
              value={filter}
              onChange={(v) => setFilter(v)}
              ariaLabel="Filtrar pagos por estado"
            />
          </div>
        </TarjetaEncabezado>
        <TarjetaContenido>
          {acksLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg border border-border p-3"
                >
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Esqueleto className="h-4 w-20" />
                      <Esqueleto className="h-3 w-16 rounded-full" />
                    </div>
                    <Esqueleto className="h-3 w-3/5" />
                    <Esqueleto className="h-2.5 w-1/3" />
                  </div>
                  <div className="flex gap-1.5">
                    <Esqueleto className="h-7 w-20 rounded-md" />
                    <Esqueleto className="h-7 w-16 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : acks.length === 0 ? (
            <EstadoVacio
              icon={Inbox}
              title="Sin pagos para mostrar"
              description="Cuando recibas pagos por tus servicios, aparecerán aquí."
            />
          ) : (
            <ul className="space-y-2">
              {acks.map((ack) => (
                <AckRow
                  key={ack.id}
                  ack={ack}
                  onAcknowledge={() => ackMutation.mutate(ack.id)}
                  onDispute={() => setDisputeTarget(ack)}
                  loading={ackMutation.isPending || disputeMutation.isPending}
                />
              ))}
            </ul>
          )}
        </TarjetaContenido>
      </Tarjeta>

      <DisputeModal
        ack={disputeTarget}
        onClose={() => setDisputeTarget(null)}
        onSubmit={(reason) => {
          if (!disputeTarget) return;
          disputeMutation.mutate(
            { ackId: disputeTarget.id, reason },
            {
              onSuccess: () => setDisputeTarget(null),
            },
          );
        }}
        loading={disputeMutation.isPending}
      />
    </div>
  );
}

/* ============================================================
   AckRow
   ============================================================ */

function AckRow({
  ack,
  onAcknowledge,
  onDispute,
  loading,
}: {
  ack: Acknowledgement;
  onAcknowledge: () => void;
  onDispute: () => void;
  loading: boolean;
}) {
  const meta = obtenerMetaEstadoAck(ack.status);
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {formatearCOP(ack.amount)}
          </span>
          <Insignia variant={meta.variant} size="sm">
            {meta.etiqueta}
          </Insignia>
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {ack.appointment?.service?.name} ·{' '}
          {ack.appointment?.patient?.user?.firstName}{' '}
          {ack.appointment?.patient?.user?.lastName}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {ack.appointment?.scheduledAt && formatearFecha(ack.appointment.scheduledAt)}
        </p>
      </div>
      {ack.status === 'PAID' ? (
        <div className="flex gap-1.5">
          <Boton
            size="sm"
            variant="success"
            onClick={onAcknowledge}
            isLoading={loading}
            leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
          >
            Confirmar
          </Boton>
          <Boton size="sm" variant="outline" onClick={onDispute} disabled={loading}>
            No recibí
          </Boton>
        </div>
      ) : null}
    </li>
  );
}

/* ============================================================
   Dispute modal (proper accessible dialog with Etiqueta)
   ============================================================ */

function DisputeModal({
  ack,
  onClose,
  onSubmit,
  loading,
}: {
  ack: Acknowledgement | null;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState('');

  // Reset reason whenever a new ack is set
  useMemo(() => {
    setReason('');
  }, [ack?.id]);

  const tooShort = reason.trim().length < 5;
  const canSubmit = !tooShort && !loading;

  return (
    <Modal
      open={Boolean(ack)}
      onClose={onClose}
      title="Reportar pago no recibido"
      description={
        ack
          ? `${formatearCOP(ack.amount)} — ${ack.appointment?.service?.name ?? ''}`
          : ''
      }
      size="md"
      variant="glass"
      footer={
        <>
          <Boton variant="outline" onClick={onClose}>
            Cancelar
          </Boton>
          <Boton
            variant="danger"
            onClick={() => canSubmit && onSubmit(reason.trim())}
            disabled={!canSubmit}
            isLoading={loading}
            leftIcon={<AlertTriangle className="h-4 w-4" />}
          >
            Enviar reporte
          </Boton>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <Etiqueta htmlFor="dispute-reason">¿Qué pasó?</Etiqueta>
          <Entrada
            id="dispute-reason"
            placeholder="Mínimo 5 caracteres"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {reason.trim().length}/500 · {tooShort ? 'faltan ' + (5 - reason.trim().length) : 'ok'}
          </p>
        </div>
        <Alerta variant="warning" title="Esto abrirá una disputa">
          El equipo de liquidaciones revisará tu caso y se pondrá en contacto.
          Usa este botón solo cuando realmente no hayas recibido el pago.
        </Alerta>
      </div>
    </Modal>
  );
}