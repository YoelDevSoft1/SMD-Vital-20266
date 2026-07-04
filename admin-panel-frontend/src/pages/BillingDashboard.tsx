/**
 * BillingDashboard.tsx
 *
 * Vista ADMIN / SUPER_ADMIN — Cierre financiero.
 *
 *  3 columnas: Por pagar / Pagado · por confirmar / En disputa.
 *  Lotes de liquidación + lista de citas reconciliadas más abajo.
 *
 * Refactor: usa el nuevo design system (Encabezado, TarjetaEstadistica, Insignia, EstadoVacio,
 * Modal, formatearCOP, obtenerMetaEstadoAck) — sin código duplicado ni hardcoded colors.
 */

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Inbox,
  Loader2,
  Send,
} from 'lucide-react';
import toast from 'react-hot-toast';

import billingService, {
  type Acknowledgement,
  type PayoutBatch,
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
import { Avatar } from '@/components/ui/Avatar';
import { Alerta } from '@/components/ui/Alerta';
import { formatearCOP, formatearFecha } from '@/utils/formato';
import {
  obtenerMetaEstadoAck,
  obtenerMetaEstadoLotePago,
} from '@/utils/estados';
import { cn } from '@/utils/cn';

function startOfWeek(d = new Date()): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export default function BillingDashboard() {
  const queryClient = useQueryClient();
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const { data: pendingData, isLoading: loadingPending } = useQuery({
    queryKey: ['acks-pending'],
    queryFn: () => billingService.getAcknowledgementsByStatus('PENDING'),
    refetchInterval: 30_000,
  });

  const { data: paidData, isLoading: loadingPaid } = useQuery({
    queryKey: ['acks-paid'],
    queryFn: () => billingService.getAcknowledgementsByStatus('PAID'),
    refetchInterval: 30_000,
  });

  const { data: disputedData } = useQuery({
    queryKey: ['acks-disputed'],
    queryFn: () => billingService.getAcknowledgementsByStatus('DISPUTED'),
    refetchInterval: 60_000,
  });

  const { data: batchesData } = useQuery({
    queryKey: ['payout-batches'],
    queryFn: () => billingService.getPayoutBatches(),
  });

  const payMutation = useMutation({
    mutationFn: ({ ackId, reference }: { ackId: string; reference?: string }) =>
      billingService.payAcknowledgement(ackId, { reference }),
    onSuccess: () => {
      toast.success('Marcado como pagado');
      queryClient.invalidateQueries({ queryKey: ['acks-pending'] });
      queryClient.invalidateQueries({ queryKey: ['acks-paid'] });
    },
    onError: (e: unknown) =>
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error'),
  });

  // Group pending acks by recipient
  const pendingByRecipient = useMemo(() => {
    const map = new Map<
      string,
      { name: string; role: string; total: number; items: Acknowledgement[] }
    >();
    for (const ack of pendingData?.acknowledgements ?? []) {
      const key = ack.recipientId;
      if (!map.has(key)) {
        map.set(key, {
          name: `${ack.recipient?.firstName ?? ''} ${ack.recipient?.lastName ?? ''}`.trim() || 'Sin firstName',
          role: ack.recipientRole,
          total: 0,
          items: [],
        });
      }
      const group = map.get(key)!;
      group.total += ack.amount;
      group.items.push(ack);
    }
    return Array.from(map.entries()).map(([id, v]) => ({ id, ...v }));
  }, [pendingData]);

  return (
    <div className="space-y-6">
      <Encabezado
        title="Cierre financiero"
        subtitle="Control de pagos a profesionales y agentes. Refresca cada 30 s."
        actions={
          <Boton
            onClick={() => setShowGenerateModal(true)}
            leftIcon={<FileText className="h-4 w-4" />}
          >
            <span className="hidden sm:inline">Generar liquidación</span>
            <span className="sm:hidden">Liquidación</span>
          </Boton>
        }
      />

      {/* 3 summary tiles */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
        <TarjetaEstadistica
          label="Por pagar"
          value={formatearCOP(pendingData?.total)}
          hint={`${pendingData?.count ?? 0} pagos · ${pendingByRecipient.length} destinatarios`}
          icon={Clock}
          color="warning"
          loading={loadingPending}
        />
        <TarjetaEstadistica
          label="Pagado · por confirmar"
          value={formatearCOP(paidData?.total)}
          hint={`${paidData?.count ?? 0} transferencias pendientes de recepción`}
          icon={Send}
          color="info"
          loading={loadingPaid}
        />
        <TarjetaEstadistica
          label="En disputa"
          value={formatearCOP(disputedData?.total)}
          hint={`${disputedData?.count ?? 0} casos abiertos`}
          icon={AlertTriangle}
          color="danger"
        />
      </div>

      {/* Por pagar — agrupado por destinatario */}
      <Tarjeta>
        <TarjetaEncabezado>
          <TarjetaTitulo className="flex flex-wrap items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-warning" aria-hidden="true" />
            Por pagar
            <Insignia variant="warning" size="sm">
              {pendingByRecipient.length} personas · {formatearCOP(pendingData?.total)}
            </Insignia>
          </TarjetaTitulo>
        </TarjetaEncabezado>
        <TarjetaContenido className="space-y-3">
          {loadingPending ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-lg border border-border">
                  <div className="flex items-center justify-between bg-muted/50 p-3">
                    <div className="space-y-2">
                      <Esqueleto className="h-4 w-32" />
                      <Esqueleto className="h-3 w-24" />
                    </div>
                    <div className="space-y-2 text-right">
                      <Esqueleto className="ml-auto h-5 w-24" />
                      <Esqueleto className="ml-auto h-7 w-24" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : pendingByRecipient.length === 0 ? (
            <EstadoVacio
              icon={Inbox}
              title="Sin pagos pendientes"
              description="Cuando haya pagos por realizar a profesionales o agentes aparecerán aquí."
            />
          ) : (
            pendingByRecipient.map((group) => (
              <div
                key={group.id}
                className="overflow-hidden rounded-lg border border-border"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/40 p-3 sm:p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={group.name} size="md" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{group.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {group.role} · {group.items.length}{' '}
                        {group.items.length === 1 ? 'servicio' : 'servicios'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-bold tabular-nums text-warning">
                      {formatearCOP(group.total)}
                    </p>
                    <Boton
                      size="sm"
                      isLoading={payMutation.isPending}
                      onClick={() => {
                        for (const item of group.items) {
                          payMutation.mutate({ ackId: item.id });
                        }
                      }}
                    >
                      Pagar todo
                    </Boton>
                  </div>
                </div>
                <div className="divide-y divide-border">
                  {group.items.map((ack) => (
                    <AckRow
                      key={ack.id}
                      ack={ack}
                      onPay={() => payMutation.mutate({ ackId: ack.id })}
                      loading={payMutation.isPending}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </TarjetaContenido>
      </Tarjeta>

      {/* Pagado · por confirmar */}
      <Tarjeta>
        <TarjetaEncabezado>
          <TarjetaTitulo className="flex flex-wrap items-center gap-2 text-base">
            <Send className="h-4 w-4 text-info" aria-hidden="true" />
            Pagado · pendiente de confirmación
            <Insignia variant="info" size="sm">
              {paidData?.count ?? 0} servicios · {formatearCOP(paidData?.total)}
            </Insignia>
          </TarjetaTitulo>
        </TarjetaEncabezado>
        <TarjetaContenido>
          {loadingPaid ? (
            <div className="space-y-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-md border border-border p-2.5"
                >
                  <div className="flex-1 space-y-1.5">
                    <Esqueleto className="h-4 w-32" />
                    <Esqueleto className="h-3 w-48" />
                  </div>
                  <div className="space-y-1.5 text-right">
                    <Esqueleto className="ml-auto h-4 w-16" />
                    <Esqueleto className="ml-auto h-2.5 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : (paidData?.acknowledgements ?? []).length === 0 ? (
            <EstadoVacio
              icon={CheckCircle2}
              title="Sin pagos esperando confirmación"
              description="Cuando transfieras un pago, el destinatario podrá confirmarlo desde su panel."
            />
          ) : (
            <PaidList acks={paidData?.acknowledgements ?? []} />
          )}
        </TarjetaContenido>
      </Tarjeta>

      {/* Batches de liquidación */}
      <Tarjeta>
        <TarjetaEncabezado>
          <TarjetaTitulo className="flex flex-wrap items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            Lotes de liquidación
            <Insignia variant="neutral" size="sm">
              {batchesData?.count ?? 0}
            </Insignia>
          </TarjetaTitulo>
        </TarjetaEncabezado>
        <TarjetaContenido>
          {!batchesData?.batches || batchesData.batches.length === 0 ? (
            <EstadoVacio
              icon={FileText}
              title="Sin lotes generados aún"
              description="Genera tu primera liquidación semanal desde el botón superior."
              action={
                <Boton onClick={() => setShowGenerateModal(true)} variant="primary" size="md">
                  Generar liquidación
                </Boton>
              }
            />
          ) : (
            <BatchList batches={batchesData.batches} />
          )}
        </TarjetaContenido>
      </Tarjeta>

      <GenerateBatchModal
        open={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onSuccess={() => {
          setShowGenerateModal(false);
          queryClient.invalidateQueries({ queryKey: ['payout-batches'] });
          queryClient.invalidateQueries({ queryKey: ['acks-paid'] });
        }}
      />
    </div>
  );
}

/* ============================================================
   Sub-components
   ============================================================ */

function AckRow({
  ack,
  onPay,
  loading,
}: {
  ack: Acknowledgement;
  onPay: () => void;
  loading: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 text-sm sm:px-4">
      <div className="min-w-0 flex-1">
        <p className="truncate text-foreground">
          {ack.appointment?.service?.name ?? 'Servicio'}
        </p>
        <p className="text-xs text-muted-foreground">
          {ack.appointment?.patient?.user?.firstName} {ack.appointment?.patient?.user?.lastName}
          {' · '}
          {ack.appointment?.scheduledAt && formatearFecha(ack.appointment.scheduledAt)}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-semibold tabular-nums text-foreground">
          {formatearCOP(ack.amount)}
        </span>
        <Boton size="sm" variant="outline" onClick={onPay} isLoading={loading}>
          Pagar
        </Boton>
      </div>
    </div>
  );
}

function PaidList({ acks }: { acks: Acknowledgement[] }) {
  return (
    <ul className="space-y-1.5">
      {acks.map((ack) => (
        <li
          key={ack.id}
          className="flex items-center justify-between rounded-md border border-border p-2.5 text-sm"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-foreground">
              {ack.recipient?.firstName} {ack.recipient?.lastName}
            </p>
            <p className="text-xs text-muted-foreground">
              {ack.appointment?.service?.name} ·{' '}
              {ack.appointment?.patient?.user?.firstName}{' '}
              {ack.appointment?.patient?.user?.lastName}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold tabular-nums text-info">
              {formatearCOP(ack.amount)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              pagado {ack.paidAt && formatearFecha(ack.paidAt)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function BatchList({ batches }: { batches: PayoutBatch[] }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const approveMut = useMutation({
    mutationFn: (id: string) => billingService.approvePayoutBatch(id),
    onSuccess: () => {
      toast.success('Lote aprobado');
      queryClient.invalidateQueries({ queryKey: ['payout-batches'] });
    },
    onError: (e: unknown) =>
      setError(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Error al aprobar el lote',
      ),
  });

  const markPaidMut = useMutation({
    mutationFn: ({ id, reference }: { id: string; reference: string }) =>
      billingService.markPayoutBatchPaid(id, { reference }),
    onSuccess: () => {
      toast.success('Lote marcado como pagado');
      queryClient.invalidateQueries({ queryKey: ['payout-batches'] });
    },
    onError: (e: unknown) =>
      setError(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Error al marcar como pagado',
      ),
  });

  return (
    <div className="space-y-3">
      {error ? (
        <Alerta variant="danger" title="No se pudo procesar" onDismiss={() => setError(null)}>
          {error}
        </Alerta>
      ) : null}
      {batches.map((b) => (
        <BatchRow
          key={b.id}
          batch={b}
          onApprove={() => approveMut.mutate(b.id)}
          onMarkPaid={(reference) =>
            markPaidMut.mutate({ id: b.id, reference })
          }
          loading={approveMut.isPending || markPaidMut.isPending}
        />
      ))}
    </div>
  );
}

function BatchRow({
  batch,
  onApprove,
  onMarkPaid,
  loading,
}: {
  batch: PayoutBatch;
  onApprove: () => void;
  onMarkPaid: (ref: string) => void;
  loading: boolean;
}) {
  const [ref, setRef] = useState('');
  const statusMeta = obtenerMetaEstadoLotePago(batch.status);

  return (
    <div className="rounded-lg border border-border p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-foreground">
              {batch.recipient?.firstName} {batch.recipient?.lastName}
            </p>
            <Insignia variant={statusMeta.variant} size="sm">
              {statusMeta.label}
            </Insignia>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            <Calendar className="mr-1 inline h-3 w-3" aria-hidden="true" />
            {formatearFecha(batch.periodStart)} → {formatearFecha(batch.periodEnd)}
            {' · '}
            {batch.items?.length ?? 0}{' '}
            {(batch.items?.length ?? 0) === 1 ? 'servicio' : 'servicios'}
          </p>
        </div>
        <p className="text-lg font-bold tabular-nums text-info">
          {formatearCOP(batch.totalAmount)}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {batch.status === 'DRAFT' ? (
          <Boton size="sm" onClick={onApprove} isLoading={loading} leftIcon={<CheckCircle2 className="h-4 w-4" />}>
            Aprobar
          </Boton>
        ) : null}
        {batch.status === 'APPROVED' ? (
          <>
            <Entrada
              placeholder="Comprobante de transferencia"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              className="flex-1"
              aria-label="Comprobante de transferencia"
            />
            <Boton
              size="sm"
              variant="success"
              onClick={() => ref && onMarkPaid(ref)}
              isLoading={loading}
              disabled={!ref}
            >
              Marcar pagado
            </Boton>
          </>
        ) : null}
        {batch.status === 'PAID' && batch.reference ? (
          <p className="text-xs text-muted-foreground">
            <CheckCircle2 className="mr-1 inline h-3 w-3 text-success" aria-hidden="true" />
            Pagado · ref:{' '}
            <span className="font-mono font-medium text-foreground">
              {batch.reference}
            </span>
          </p>
        ) : null}
      </div>
    </div>
  );
}

/* ============================================================
   Modals
   ============================================================ */

function GenerateBatchModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const monday = startOfWeek();
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const [periodStart, setPeriodStart] = useState(monday.toISOString().slice(0, 10));
  const [periodEnd, setPeriodEnd] = useState(sunday.toISOString().slice(0, 10));

  const generateMut = useMutation({
    mutationFn: () =>
      billingService.generatePayoutBatch({
        periodStart: new Date(periodStart).toISOString(),
        periodEnd: new Date(`${periodEnd}T23:59:59`).toISOString(),
      }),
    onSuccess: (data) => {
      toast.success(`${data.batchesCreated} lotes generados · ${formatearCOP(data.totalAmount)}`);
      onSuccess();
    },
    onError: (e: unknown) =>
      toast.error(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Error al generar',
      ),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Generar liquidación semanal"
      description="Crea un lote de pago por cada destinatario con acknowledgements en estado PAID dentro del período seleccionado."
      size="md"
      variant="glass"
      footer={
        <>
          <Boton variant="outline" onClick={onClose}>
            Cancelar
          </Boton>
          <Boton
            onClick={() => generateMut.mutate()}
            isLoading={generateMut.isPending}
            leftIcon={<FileText className="h-4 w-4" />}
          >
            Generar
          </Boton>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Etiqueta htmlFor="periodStart">Desde</Etiqueta>
          <Entrada
            id="periodStart"
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
          />
        </div>
        <div>
          <Etiqueta htmlFor="periodEnd">Hasta</Etiqueta>
          <Entrada
            id="periodEnd"
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
          />
        </div>
      </div>

      <Alerta variant="info" className="mt-4" icon={DollarSign}>
        Esto consolidará todos los PAID del período seleccionado. Puedes aprobarlos y
        marcarlos como pagados uno por uno después.
      </Alerta>
    </Modal>
  );
}

// We re-export cn to avoid TS6133 (unused) if this becomes an issue — but at present
// cn is used for class composition above. Keep this for tree-shake safety on hot-reload.
void cn;