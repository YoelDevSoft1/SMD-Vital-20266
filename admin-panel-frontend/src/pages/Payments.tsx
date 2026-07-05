import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CreditCard,
  DollarSign,
  Plus,
  Eye,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
} from 'lucide-react';

import { Boton } from '@/components/ui/Boton';
import { Insignia } from '@/components/ui/Insignia';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Encabezado } from '@/components/ui/Encabezado';
import { TarjetaEstadistica } from '@/components/ui/TarjetaEstadistica';
import { Avatar } from '@/components/ui/Avatar';
import { Tarjeta, TarjetaContenido, TarjetaEncabezado, TarjetaTitulo } from '@/components/ui/Tarjeta';
import { Esqueleto } from '@/components/ui/Esqueleto';
import { adminService } from '@/services/admin.service';
import { formatearCOP, formatearFechaHora } from '@/utils/formato';
import { obtenerMetaEstadoPago } from '@/utils/estados';
import { cn } from '@/utils/cn';

import PaymentsModal from '@/components/PaymentsModal';
import PaymentDetailsView from '@/components/PaymentDetailsView';
import CreatePaymentForm from '@/components/CreatePaymentForm';
import RevenueChart from '@/components/RevenueChart';
import PaymentMethodsChart from '@/components/PaymentMethodsChart';
import { useRevenueData } from '@/hooks/useRevenueData';

export default function Payments() {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState<unknown>(null);

  // Pagos recientes
  const { data: pagosRecientesData, isLoading: cargandoRecientes } = useQuery({
    queryKey: ['recent-payments'],
    queryFn: () => adminService.getPayments({ page: 1, limit: 5 }),
  });

  // Todos los pagos (para estadísticas)
  const { data: todosPagosData, isLoading: cargandoTodos } = useQuery({
    queryKey: ['all-payments-stats'],
    queryFn: () => adminService.getPayments({ page: 1, limit: 1000 }),
  });

  // Stats del dashboard (para ingresos)
  const { data: datosDashboard } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => adminService.getDashboard(),
  });

  // Datos de revenue para gráfico
  const { data: datosAnalytics, isLoading: cargandoIngresos } = useRevenueData();

  // Cálculos
  const todosPagos: any[] = todosPagosData?.data?.data?.data ?? [];
  const totalPagos = todosPagosData?.data?.data?.pagination?.total ?? todosPagos.length;
  const completados = todosPagos.filter((p) => p.status === 'COMPLETED').length;
  const pendientes = todosPagos.filter((p) => p.status === 'PENDING').length;

  // Ingresos: del dashboard si está, si no calculado de pagos completados
  const ingresosCalculados = todosPagos
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + (p.amount ?? 0), 0);
  const ingresosTotales = datosDashboard?.data?.data?.overview?.totalRevenue ?? ingresosCalculados;

  // Datos del gráfico de métodos de pago
  const datosMetodosPago = (() => {
    if (!todosPagos.length) return undefined;
    const methodCounts = todosPagos.reduce<Record<string, number>>((acc, p) => {
      const metodo = p.method ?? 'OTRO';
      acc[metodo] = (acc[metodo] ?? 0) + 1;
      return acc;
    }, {});
    const etiquetas = Object.keys(methodCounts);
    const data = Object.values(methodCounts);
    const colores = [
      'rgba(59, 130, 246, 0.8)',
      'rgba(34, 197, 94, 0.8)',
      'rgba(168, 85, 247, 0.8)',
      'rgba(249, 115, 22, 0.8)',
      'rgba(239, 68, 68, 0.8)',
      'rgba(107, 114, 128, 0.8)',
    ];
    const bordes = [
      'rgb(59, 130, 246)',
      'rgb(34, 197, 94)',
      'rgb(168, 85, 247)',
      'rgb(249, 115, 22)',
      'rgb(239, 68, 68)',
      'rgb(107, 114, 128)',
    ];
    return {
      labels: etiquetas,
      datasets: [
        {
          label: 'Cantidad de pagos',
          data,
          backgroundColor: colores.slice(0, etiquetas.length),
          borderColor: bordes.slice(0, etiquetas.length),
          borderWidth: 1,
        },
      ],
    };
  })();

  const pagos: any[] = pagosRecientesData?.data?.data?.data ?? [];

  return (
    <div className="space-y-6">
      <Encabezado
        title="Gestión de Pagos"
        subtitle="Administra todos los pagos del sistema."
        actions={
          <>
            <Boton
              variant="outline"
              onClick={() => setMostrarModal(true)}
              leftIcon={<BarChart3 className="h-4 w-4" />}
            >
              Ver todos
            </Boton>
            <Boton
              onClick={() => setMostrarFormulario(true)}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Nuevo pago
            </Boton>
          </>
        }
      />

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <TarjetaEstadistica
          label="Total pagos"
          value={formatearNumero(totalPagos)}
          icon={CreditCard}
          color="brand"
          loading={cargandoTodos}
        />
        <TarjetaEstadistica
          label="Completados"
          value={formatearNumero(completados)}
          icon={CheckCircle}
          color="success"
          loading={cargandoTodos}
        />
        <TarjetaEstadistica
          label="Pendientes"
          value={formatearNumero(pendientes)}
          icon={Clock}
          color="warning"
          loading={cargandoTodos}
        />
        <TarjetaEstadistica
          label="Ingresos totales"
          value={formatearCOP(ingresosTotales)}
          icon={DollarSign}
          color="info"
          loading={cargandoTodos}
        />
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Tarjeta>
          <TarjetaEncabezado className="flex flex-row items-center justify-between">
            <TarjetaTitulo className="text-base">Ingresos por mes</TarjetaTitulo>
            <BarChart3 className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          </TarjetaEncabezado>
          <TarjetaContenido>
            {cargandoIngresos ? (
              <div className="h-64">
                <Esqueleto className="h-full w-full" />
              </div>
            ) : (
              <RevenueChart
                data={
                  (datosAnalytics as { revenue?: { labels: string[]; datasets: { label: string; data: number[]; borderColor: string; backgroundColor: string; fill: boolean }[] } } | undefined)
                    ?.revenue
                }
              />
            )}
          </TarjetaContenido>
        </Tarjeta>

        <Tarjeta>
          <TarjetaEncabezado className="flex flex-row items-center justify-between">
            <TarjetaTitulo className="text-base">Métodos de pago</TarjetaTitulo>
            <PieChart className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          </TarjetaEncabezado>
          <TarjetaContenido>
            {cargandoTodos ? (
              <div className="h-64">
                <Esqueleto className="h-full w-full" />
              </div>
            ) : (
              <PaymentMethodsChart data={datosMetodosPago} />
            )}
          </TarjetaContenido>
        </Tarjeta>
      </div>

      {/* Pagos recientes */}
      <Tarjeta>
        <TarjetaEncabezado className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TarjetaTitulo className="text-base">Pagos recientes</TarjetaTitulo>
          <Boton
            variant="outline"
            size="sm"
            onClick={() => setMostrarModal(true)}
            leftIcon={<BarChart3 className="h-4 w-4" />}
          >
            Ver todos los pagos
          </Boton>
        </TarjetaEncabezado>
        <TarjetaContenido>
          {cargandoRecientes ? (
            <ul className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <Esqueleto className="h-9 w-9 flex-shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Esqueleto className="h-4 w-1/3" />
                    <Esqueleto className="h-3 w-1/2" />
                  </div>
                  <Esqueleto className="h-5 w-16" />
                </li>
              ))}
            </ul>
          ) : pagos.length === 0 ? (
            <EstadoVacio
              icon={CreditCard}
              title="Sin pagos registrados"
              description="Cuando se registren pagos en el sistema aparecerán aquí."
              action={
                <Boton
                  onClick={() => setMostrarFormulario(true)}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Registrar primer pago
                </Boton>
              }
            />
          ) : (
            <ul className="space-y-2">
              {pagos.slice(0, 5).map((pago) => {
                const metaEstado = obtenerMetaEstadoPago(pago.status);
                const IconoEstado = metaEstado.icon;
                const pacienteNombre =
                  `${pago.appointment?.patient?.user?.firstName ?? ''} ${pago.appointment?.patient?.user?.lastName ?? ''}`.trim();
                return (
                  <li
                    key={pago.id}
                    className={cn(
                      'flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3',
                      'motion-safe:transition-colors hover:bg-muted/50',
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={pacienteNombre} size="md" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {pacienteNombre || 'Paciente'}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {pago.appointment?.service?.name ?? 'Servicio'}
                        </p>
                        <p className="text-xs text-muted-foreground/80">
                          {formatearFechaHora(pago.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-semibold tabular-nums text-foreground">
                          {formatearCOP(pago.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">{pago.method}</p>
                      </div>
                      <Insignia variant={metaEstado.variant} size="sm" icon={IconoEstado}>
                        {metaEstado.etiqueta}
                      </Insignia>
                      <Boton
                        variant="outline"
                        size="sm"
                        onClick={() => setPagoSeleccionado(pago)}
                        aria-label="Ver detalles del pago"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Boton>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </TarjetaContenido>
      </Tarjeta>

      {/* Modales */}
      <PaymentsModal
        isOpen={mostrarModal}
        onClose={() => setMostrarModal(false)}
      />

      <CreatePaymentForm
        isOpen={mostrarFormulario}
        onClose={() => setMostrarFormulario(false)}
      />

      {pagoSeleccionado ? (
        <PaymentDetailsView
          payment={pagoSeleccionado as Parameters<typeof PaymentDetailsView>[0]['payment']}
          onClose={() => setPagoSeleccionado(null)}
          onEdit={() => {
            setPagoSeleccionado(null);
            setMostrarFormulario(true);
          }}
        />
      ) : null}
    </div>
  );
}

function formatearNumero(n: number): string {
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(n);
}