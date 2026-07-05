/**
 * MyCommissions.tsx
 *
 * Vista para AGENT (asesor / call center).
 *
 * El asesor necesita ver:
 *   1. Sus comisiones acumuladas (por pagar / ganadas / recibidas)
 *   2. Citas que agendó hoy + próximas
 *   3. Acción rápida: "Agendar nueva cita"
 *
 * Refactor: usa el design system completo (Encabezado, TarjetaEstadistica, Insignia,
 * EstadoVacio, GrupoFiltros, formatearCOP, obtenerMetaEstadoAck).
 */

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Inbox,
  MapPin,
  Phone,
  Plus,
} from 'lucide-react';

import billingService, { type Appointment } from '@/services/billing.service';
import { Tarjeta, TarjetaContenido, TarjetaEncabezado, TarjetaTitulo } from '@/components/ui/Tarjeta';
import { Boton } from '@/components/ui/Boton';
import { Esqueleto } from '@/components/ui/Esqueleto';
import { Encabezado } from '@/components/ui/Encabezado';
import { TarjetaEstadistica } from '@/components/ui/TarjetaEstadistica';
import { Insignia } from '@/components/ui/Insignia';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { GrupoFiltros } from '@/components/ui/GrupoFiltros';
import CreateAppointmentForm from '@/components/CreateAppointmentForm';
import { formatearCOP, formatearFecha, formatearHora } from '@/utils/formato';
import {
  OPCIONES_FILTRO_ESTADO_ACK,
  obtenerMetaEstadoAck,
  obtenerMetaEstadoCita,
} from '@/utils/estados';

const DEFAULT_FILTER: 'all' | 'PENDING' | 'PAID' | 'ACKNOWLEDGED' = 'all';

export default function MyCommissions() {
  const [filter, setFilter] = useState<typeof DEFAULT_FILTER>(DEFAULT_FILTER);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: acksData, isLoading } = useQuery({
    queryKey: ['agent-acks', filter],
    queryFn: () =>
      billingService.getMyAcknowledgements(filter === 'all' ? undefined : { status: filter }),
    refetchInterval: 30_000,
  });

  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const { data: aptData, isLoading: aptLoading } = useQuery({
    queryKey: ['agent-appointments'],
    queryFn: () => billingService.getMyAppointments({ dateFrom: monthAgo }),
  });

  const totals = acksData?.totals ?? { PENDING: 0, PAID: 0, ACKNOWLEDGED: 0 };
  const totalGanado = (totals.PAID ?? 0) + (totals.ACKNOWLEDGED ?? 0);
  const acks = acksData?.acknowledgements ?? [];
  const appointments: Appointment[] = aptData?.appointments ?? [];

  const todayApts = useMemo(
    () => appointments.filter((a) => a.scheduledAt.slice(0, 10) === today),
    [appointments, today],
  );

  const upcomingApts = useMemo(
    () =>
      appointments
        .filter(
          (a) =>
            a.scheduledAt > new Date().toISOString() &&
            a.scheduledAt.slice(0, 10) !== today,
        )
        .slice(0, 5),
    [appointments, today],
  );

  return (
    <div className="space-y-6">
      <Encabezado
        title="Mi panel"
        subtitle="Comisiones y servicios que agendé. Refresca cada 30 s."
        actions={
          <Boton
            onClick={() => setShowCreateForm(true)}
            leftIcon={<Plus className="h-4 w-4" />}
            className="w-full bg-slate-950 text-white shadow-soft-md hover:bg-slate-800 sm:w-auto dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            <span className="hidden sm:inline">Agendar cita</span>
            <span className="sm:hidden">Agendar</span>
          </Boton>
        }
      />

      {/* Resumen financiero */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        <TarjetaEstadistica
          label="Pendiente"
          value={formatearCOP(totals.PENDING)}
          hint={`${acks.filter((a) => a.status === 'PENDING').length} servicios`}
          icon={Clock}
          color="warning"
          loading={isLoading}
        />
        <TarjetaEstadistica
          label="Ganado (total)"
          value={formatearCOP(totalGanado)}
          hint="pagado + recibido"
          icon={DollarSign}
          color="info"
          loading={isLoading}
        />
        <TarjetaEstadistica
          label="Confirmado"
          value={formatearCOP(totals.ACKNOWLEDGED)}
          hint="en mi bolsillo"
          icon={CheckCircle2}
          color="success"
          loading={isLoading}
        />
      </div>

      {/* Citas agendadas hoy */}
      <Tarjeta>
        <TarjetaEncabezado>
          <TarjetaTitulo className="flex flex-wrap items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-info" aria-hidden="true" />
            Citas que agendé hoy
            <Insignia variant="info" size="sm">
              {todayApts.length}
            </Insignia>
          </TarjetaTitulo>
        </TarjetaEncabezado>
        <TarjetaContenido>
          {aptLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg border border-border p-3"
                >
                  <div className="flex-1 space-y-1.5">
                    <Esqueleto className="h-4 w-2/5" />
                    <Esqueleto className="h-3 w-3/5" />
                  </div>
                  <Esqueleto className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : todayApts.length === 0 ? (
            <EstadoVacio
              icon={Calendar}
              title="No has agendado nada para hoy"
              description="Usa el botón superior para registrar una nueva cita."
            />
          ) : (
            <ul className="space-y-2">
              {todayApts.map((apt) => (
                <li key={apt.id}>
                  <AgentAppointmentRow apt={apt} />
                </li>
              ))}
            </ul>
          )}
        </TarjetaContenido>
      </Tarjeta>

      {/* Próximas citas */}
      {upcomingApts.length > 0 ? (
        <Tarjeta>
          <TarjetaEncabezado>
            <TarjetaTitulo className="text-base">Próximas citas</TarjetaTitulo>
          </TarjetaEncabezado>
          <TarjetaContenido>
            <ul className="space-y-2">
              {upcomingApts.map((apt) => (
                <li key={apt.id}>
                  <AgentAppointmentRow apt={apt} />
                </li>
              ))}
            </ul>
          </TarjetaContenido>
        </Tarjeta>
      ) : null}

      {/* Lista de comisiones */}
      <Tarjeta>
        <TarjetaEncabezado>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TarjetaTitulo className="text-base">Mis comisiones</TarjetaTitulo>
            <GrupoFiltros
              options={OPCIONES_FILTRO_ESTADO_ACK}
              value={filter}
              onChange={(v) => setFilter(v)}
              ariaLabel="Filtrar comisiones por estado"
            />
          </div>
        </TarjetaEncabezado>
        <TarjetaContenido>
          {isLoading ? (
            <div className="space-y-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-md border border-border p-3"
                >
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Esqueleto className="h-4 w-20" />
                      <Esqueleto className="h-3 w-16 rounded-full" />
                    </div>
                    <Esqueleto className="h-3 w-3/5" />
                    <Esqueleto className="h-2.5 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : acks.length === 0 ? (
            <EstadoVacio
              icon={Inbox}
              title="Sin comisiones para mostrar"
              description="Cuando se liquiden los servicios que agendaste, aparecerán aquí."
            />
          ) : (
            <ul className="space-y-1.5">
              {acks.map((ack) => {
                const meta = obtenerMetaEstadoAck(ack.status);
                return (
                  <li
                    key={ack.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold tabular-nums text-foreground">
                          {formatearCOP(ack.amount)}
                        </span>
                        <Insignia variant={meta.variant} size="sm">
                          {meta.etiqueta}
                        </Insignia>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {ack.appointment?.service?.name} ·{' '}
                        {ack.appointment?.patient?.user?.firstName}{' '}
                        {ack.appointment?.patient?.user?.lastName}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {ack.appointment?.scheduledAt &&
                          formatearFecha(ack.appointment.scheduledAt)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </TarjetaContenido>
      </Tarjeta>

      {showCreateForm ? (
        <CreateAppointmentForm
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
        />
      ) : null}
    </div>
  );
}

function AgentAppointmentRow({ apt }: { apt: Appointment }) {
  const status = obtenerMetaEstadoCita(apt.status);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
            {formatearHora(apt.scheduledAt)}
          </span>
          <span className="text-sm text-foreground">{apt.service?.name}</span>
          <Insignia variant={status.variant} size="sm">
            {status.etiqueta}
          </Insignia>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {apt.patient?.user?.phone ? (
            <span className="inline-flex items-center gap-1">
              <Phone className="h-3 w-3" aria-hidden="true" />
              {apt.patient.user.phone}
            </span>
          ) : null}
          {apt.address ? (
            <span className="inline-flex min-w-0 items-center gap-1 truncate">
              <MapPin className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">{apt.address}</span>
            </span>
          ) : null}
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold tabular-nums text-success">
          {formatearCOP(apt.totalPrice)}
        </p>
        <p className="text-[10px] text-muted-foreground">
          Mi comisión:{' '}
          <span className="font-semibold text-foreground">
            {formatearCOP(apt.marginSnapshot?.agentAmount ?? 0)}
          </span>
        </p>
      </div>
    </div>
  );
}
