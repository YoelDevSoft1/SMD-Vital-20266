import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  CalendarCheck2,
  DollarSign,
  RefreshCw,
  ShieldCheck,
  Star,
  Stethoscope,
  Users,
} from 'lucide-react';

import { adminService } from '@/services/admin.service';
import type { DashboardStats } from '@/types';
import {
  TarjetaEstadisticaDashboard,
} from '@/components/dashboard/TarjetaEstadisticaDashboard';
import { EsqueletoDashboard } from '@/components/dashboard/EsqueletoDashboard';
import { Boton } from '@/components/ui/Boton';
import {
  Tarjeta,
  TarjetaContenido,
  TarjetaEncabezado,
  TarjetaTitulo,
} from '@/components/ui/Tarjeta';
import { Encabezado } from '@/components/ui/Encabezado';
import { Insignia } from '@/components/ui/Insignia';
import { Avatar } from '@/components/ui/Avatar';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Alerta } from '@/components/ui/Alerta';
import {
  formatearCOP,
  formatearNumero,
  formatearFechaHora,
} from '@/utils/formato';
import { obtenerMetaEstadoCita } from '@/utils/estados';
import { obtenerMetaRol } from '@/utils/roles';

export default function Dashboard() {
  const navigate = useNavigate();

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => adminService.getDashboard(),
    staleTime: 60_000,
  });

  const stats = data?.data?.data as DashboardStats | undefined;

  const tarjetasEstadistica = useMemo(() => {
    if (!stats) {
      return [
        {
          title: 'Usuarios totales',
          valor: '0',
          icon: Users,
          acento: 'blue' as const,
        },
        {
          title: 'Doctores verificados',
          valor: '0',
          icon: Stethoscope,
          acento: 'purple' as const,
        },
        {
          title: 'Citas registradas',
          valor: '0',
          icon: CalendarCheck2,
          acento: 'indigo' as const,
        },
        {
          title: 'Ingresos totales',
          valor: formatearCOP(0),
          icon: DollarSign,
          acento: 'emerald' as const,
        },
      ];
    }

    return [
      {
        title: 'Usuarios totales',
        valor: formatearNumero(stats.overview?.totalUsers ?? 0),
        icon: Users,
        acento: 'blue' as const,
        change: stats.growth?.users ?? 0,
        changeLabel: 'vs mes anterior',
        hint: `${formatearNumero(stats.overview?.activeUsers ?? 0)} activos`,
      },
      {
        title: 'Doctores verificados',
        valor: formatearNumero(stats.overview?.totalDoctors ?? 0),
        icon: Stethoscope,
        acento: 'purple' as const,
        hint: `${formatearNumero(stats.overview?.verifiedDoctors ?? 0)} disponibles`,
      },
      {
        title: 'Citas registradas',
        valor: formatearNumero(stats.overview?.totalAppointments ?? 0),
        icon: CalendarCheck2,
        acento: 'indigo' as const,
        change: stats.growth?.appointments ?? 0,
        changeLabel: 'vs mes anterior',
        hint: `${formatearNumero(stats.appointments?.completed ?? 0)} completadas`,
      },
      {
        title: 'Ingresos totales',
        valor: formatearCOP(stats.overview?.totalRevenue ?? 0),
        icon: DollarSign,
        acento: 'emerald' as const,
        hint: `Mes actual: ${formatearCOP(stats.overview?.monthlyRevenue ?? 0)}`,
      },
    ];
  }, [stats]);

  if (isLoading) return <EsqueletoDashboard />;

  if (error) {
    return (
      <Alerta
        variant="danger"
        title="No se pudo cargar el dashboard"
        action={
          <Boton variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </Boton>
        }
      >
        Verifica tu conexión o vuelve a intentarlo en unos segundos.
      </Alerta>
    );
  }

  if (!stats) {
    return (
      <Alerta variant="warning" title="Sin formData">
        No hay formData de dashboard disponibles por ahora.
      </Alerta>
    );
  }

  const totalCitas = stats?.appointments?.total ?? 0;
  const distribucionCitas = [
    {
      clave: 'pendientes',
      etiqueta: 'Pendientes',
      valor: stats?.appointments?.pending ?? 0,
      barra: 'bg-warning',
    },
    {
      clave: 'completadas',
      etiqueta: 'Completadas',
      valor: stats?.appointments?.completed ?? 0,
      barra: 'bg-success',
    },
    {
      clave: 'canceladas',
      etiqueta: 'Canceladas',
      valor: stats?.appointments?.cancelled ?? 0,
      barra: 'bg-danger',
    },
  ];

  const citasRecientes = stats?.recentActivity?.appointments?.slice(0, 5) ?? [];
  const usuariosRecientes = stats?.recentActivity?.users?.slice(0, 5) ?? [];
  const doctoresDestacados = stats?.topPerformers?.doctors?.slice(0, 5) ?? [];
  const serviciosDestacados = stats?.topPerformers?.services?.slice(0, 5) ?? [];

  return (
    <div className="space-y-6">
      <Encabezado
        title="Panel general"
        subtitle="Visión rápida de la operación y los indicadores clave de SMD Vital."
        actions={
          <>
            <Boton
              variant="outline"
              onClick={() => refetch()}
              isLoading={isFetching}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Actualizar
            </Boton>
            <Boton onClick={() => navigate('/analytics')} rightIcon={<ArrowRight className="h-4 w-4" />}>
              Explorar analíticas
            </Boton>
          </>
        }
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 lg:gap-4">
        {tarjetasEstadistica.map((tarjeta) => (
          <TarjetaEstadisticaDashboard key={tarjeta.title} {...tarjeta} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Tarjeta className="xl:col-span-2 dark:bg-card">
          <TarjetaEncabezado className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <TarjetaTitulo className="text-base text-foreground dark:text-foreground">
                Estado de las citas
              </TarjetaTitulo>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                Distribución de todas las citas registradas ({formatearNumero(totalCitas)}).
              </p>
            </div>
            <Insignia variant="info" size="md">
              Tasa de éxito {stats?.appointments?.completionRate?.toFixed(1) ?? 0}%
            </Insignia>
          </TarjetaEncabezado>
          <TarjetaContenido className="space-y-5">
            {distribucionCitas.map((item) => {
              const porcentaje =
                totalCitas > 0 ? (item.valor / totalCitas) * 100 : 0;
              return (
                <div key={item.clave} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground dark:text-foreground">{item.etiqueta}</span>
                    <span className="text-muted-foreground dark:text-muted-foreground tabular-nums">
                      {formatearNumero(item.valor)}{' '}
                      <span className="text-xs text-muted-foreground/70 dark:text-muted-foreground/70">
                        ({porcentaje.toFixed(1)}%)
                      </span>
                    </span>
                  </div>
                  <div
                    className="h-2 w-full overflow-hidden rounded-full bg-muted dark:bg-muted"
                    role="progressbar"
                    aria-valuenow={Math.round(porcentaje)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={item.etiqueta}
                  >
                    <div
                      className={`h-full ${item.barra} motion-safe:transition-all motion-safe:duration-500`}
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <Alerta variant="info" icon={ShieldCheck}>
              {formatearNumero(stats?.appointments?.completed ?? 0)} citas exitosas sobre{' '}
              {formatearNumero(totalCitas)} totales generan la tasa de éxito mostrada.
            </Alerta>
          </TarjetaContenido>
        </Tarjeta>

        <Tarjeta className="dark:bg-card">
          <TarjetaEncabezado>
            <TarjetaTitulo className="text-base text-foreground dark:text-foreground">Resumen financiero</TarjetaTitulo>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              Ingresos acumulados y facturación del mes en curso.
            </p>
          </TarjetaEncabezado>
          <TarjetaContenido className="space-y-5">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground dark:text-muted-foreground">
                Ingresos totales
              </p>
              <p className="text-3xl font-bold tabular-nums text-foreground dark:text-foreground">
                {formatearCOP(stats?.overview?.totalRevenue ?? 0)}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground dark:text-muted-foreground">Mes actual</span>
                <span className="font-semibold tabular-nums text-foreground dark:text-foreground">
                  {formatearCOP(stats?.overview?.monthlyRevenue ?? 0)}
                </span>
              </div>
              <BarraIngresos
                total={stats?.overview?.totalRevenue ?? 0}
                mensual={stats?.overview?.monthlyRevenue ?? 0}
              />
            </div>
            <Alerta variant="success" icon={Star}>
              Calificación promedio del servicio:{' '}
              <strong>{stats?.overview?.averageRating?.toFixed(1) ?? '0.0'} / 5</strong>
            </Alerta>
          </TarjetaContenido>
        </Tarjeta>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Tarjeta className="dark:bg-card">
          <TarjetaEncabezado>
            <TarjetaTitulo className="text-base text-foreground dark:text-foreground">Citas recientes</TarjetaTitulo>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              Últimas interacciones registradas con su estado actual.
            </p>
          </TarjetaEncabezado>
          <TarjetaContenido>
            {citasRecientes.length === 0 ? (
              <EstadoVacio
                icon={CalendarCheck2}
                title="Sin citas recientes"
                description="Las nuevas citas aparecerán aquí conforme se agenden."
                size="md"
              />
            ) : (
              <ul className="space-y-2">
                {citasRecientes.map((cita) => {
                  const metaEstado = obtenerMetaEstadoCita(cita.status);
                  const IconoEstado = metaEstado.icon;
                  return (
                    <li
                      key={cita.id}
                      className="flex flex-col gap-2 rounded-lg border border-border p-3 motion-safe:transition-colors hover:border-brand-200 hover:bg-brand-50/40 dark:hover:border-brand-500/30 dark:hover:bg-brand-500/5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-foreground dark:text-foreground">
                          {cita.patient?.user.firstName} {cita.patient?.user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                          Con {cita.doctor?.user.firstName} {cita.doctor?.user.lastName}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground dark:text-muted-foreground">
                          <Activity className="h-3 w-3 text-info" aria-hidden="true" />
                          {cita.service?.name ?? 'Servicio sin especificar'}
                        </span>
                        <Insignia variant={metaEstado.variant} size="sm" icon={IconoEstado}>
                          {metaEstado.etiqueta}
                        </Insignia>
                        <span className="text-xs text-muted-foreground/80 dark:text-muted-foreground/80">{formatearFechaHora(cita.createdAt)}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </TarjetaContenido>
        </Tarjeta>

        <Tarjeta className="dark:bg-card">
          <TarjetaEncabezado>
            <TarjetaTitulo className="text-base text-foreground dark:text-foreground">Nuevos usuarios</TarjetaTitulo>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              Cuentas creadas recientemente con su estado actual.
            </p>
          </TarjetaEncabezado>
          <TarjetaContenido>
            {usuariosRecientes.length === 0 ? (
              <EstadoVacio
                icon={Users}
                title="Aún no hay usuarios nuevos"
                description="Las cuentas recién creadas aparecerán aquí."
                size="md"
              />
            ) : (
              <ul className="space-y-2">
                {usuariosRecientes.map((usuario) => {
                  const metaRol = obtenerMetaRol(usuario.role);
                  const IconoRol = metaRol.icon;
                  const nombreCompleto = `${usuario.firstName} ${usuario.lastName}`;
                  return (
                    <li
                      key={usuario.id}
                      className="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/40 dark:hover:bg-muted/40"
                    >
                      <Avatar name={nombreCompleto} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="truncate font-medium text-foreground dark:text-foreground">{nombreCompleto}</p>
                          <Insignia variant={`role-${usuario.role.toLowerCase().replace('_', '-')}` as 'role-admin' | 'role-super' | 'role-doctor' | 'role-nurse' | 'role-patient' | 'role-agent'} size="sm" icon={IconoRol}>
                            {metaRol.etiqueta}
                          </Insignia>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground dark:text-muted-foreground">{usuario.email}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <Insignia variant={usuario.isActive ? 'success' : 'neutral'} size="sm">
                            {usuario.isActive ? 'Activo' : 'Inactivo'}
                          </Insignia>
                          <Insignia variant={usuario.isVerified ? 'info' : 'warning'} size="sm">
                            {usuario.isVerified ? 'Verificado' : 'Pendiente'}
                          </Insignia>
                          <span className="ml-auto text-xs text-muted-foreground dark:text-muted-foreground">{formatearFechaHora(usuario.createdAt)}</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </TarjetaContenido>
        </Tarjeta>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Tarjeta className="dark:bg-card">
          <TarjetaEncabezado>
            <TarjetaTitulo className="text-base text-foreground dark:text-foreground">Doctores destacados</TarjetaTitulo>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              Profesionales mejor valorados y con mayor volumen de citas.
            </p>
          </TarjetaEncabezado>
          <TarjetaContenido>
            {doctoresDestacados.length === 0 ? (
              <EstadoVacio
                icon={Stethoscope}
                title="Sin médicos destacados"
                description="Cuando haya actividad, verás aquí a los profesionales mejor valorados."
                size="md"
              />
            ) : (
              <ul className="space-y-2">
                {doctoresDestacados.map((doctor) => (
                  <li
                    key={doctor.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/40 dark:hover:bg-muted/40"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground dark:text-foreground">
                        {doctor.user.firstName} {doctor.user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground">{doctor.specialty}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Insignia variant="warning" size="sm" icon={Star}>
                        {doctor.rating?.toFixed(1) ?? 'N/A'}
                      </Insignia>
                      <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                        {doctor._count?.appointments ?? 0} citas ·{' '}
                        {doctor.isAvailable ? 'Disponible' : 'Ocupado'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TarjetaContenido>
        </Tarjeta>

        <Tarjeta className="dark:bg-card">
          <TarjetaEncabezado>
            <TarjetaTitulo className="text-base text-foreground dark:text-foreground">Servicios más demandados</TarjetaTitulo>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              Procedimientos o especialidades con mayor número de citas.
            </p>
          </TarjetaEncabezado>
          <TarjetaContenido>
            {serviciosDestacados.length === 0 ? (
              <EstadoVacio
                icon={Activity}
                title="Sin servicios destacados"
                description="Los servicios con más demanda aparecerán ordenados aquí."
                size="md"
              />
            ) : (
              <ul className="space-y-2">
                {serviciosDestacados.map((servicio) => (
                  <li
                    key={servicio.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/40 dark:hover:bg-muted/40"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground dark:text-foreground">{servicio.name}</p>
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground">{servicio.category}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                        {servicio._count?.appointments ?? 0} citas
                      </span>
                      <Insignia variant="success" size="sm">
                        {formatearCOP(servicio.basePrice)}
                      </Insignia>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TarjetaContenido>
        </Tarjeta>
      </div>
    </div>
  );
}

interface PropiedadesBarraIngresos {
  total: number;
  mensual: number;
}

function BarraIngresos({ total, mensual }: PropiedadesBarraIngresos) {
  const denom = total > 0 ? total : 1;
  const porcentaje = Math.min(100, Math.max(0, (mensual / denom) * 100));
  return (
    <div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={Math.round(porcentaje)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Porcentaje de ingresos del mes actual"
      >
        <div
          className="h-full bg-success motion-safe:transition-all motion-safe:duration-500"
          style={{ width: `${porcentaje}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {porcentaje.toFixed(1)}% de los ingresos totales se generó este mes.
      </p>
    </div>
  );
}