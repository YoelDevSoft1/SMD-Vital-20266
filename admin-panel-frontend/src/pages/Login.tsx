import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { obtenerRutaInicio } from '@/utils/roles';
import { Boton } from '@/components/ui/Boton';
import { Entrada } from '@/components/ui/Entrada';
import { Etiqueta } from '@/components/ui/Etiqueta';
import { Insignia } from '@/components/ui/Insignia';
import { Alerta } from '@/components/ui/Alerta';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  Eye,
  EyeOff,
  HeartPulse,
  LogIn,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from 'lucide-react';

interface ErroresLogin {
  email?: string;
  password?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setMostrarContrasena] = useState(false);
  const [errores, setErrores] = useState<ErroresLogin>({});
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const loginMutacion = useMutation({
    mutationFn: authService.login,
    onSuccess: (response) => {
      const { user, accessToken, refreshToken } = response.data.data;
      setAuth(user, accessToken, refreshToken);
      toast.success(`¡Bienvenido${user.firstName ? `, ${user.firstName}` : ''}!`);
      navigate(obtenerRutaInicio(user.role));
    },
    onError: (e: unknown) => {
      const message =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Credenciales inválidas';
      setErrores({ email: undefined, password: message });
      toast.error(message);
    },
  });

  const validar = (): boolean => {
    const nuevosErrores: ErroresLogin = {};
    if (!email.trim()) {
      nuevosErrores.email = 'Ingresa tu correo electrónico';
    } else if (!EMAIL_RE.test(email.trim())) {
      nuevosErrores.email = 'El formato del correo no es válido';
    }
    if (!password) {
      nuevosErrores.password = 'Ingresa tu contraseña';
    }
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validar()) return;
    loginMutacion.mutate({ email, password });
  };

  const handleEmailChange = (valor: string) => {
    setEmail(valor);
    if (errores.email) setErrores((p) => ({ ...p, email: undefined }));
  };
  const handlePasswordChange = (valor: string) => {
    setPassword(valor);
    if (errores.password) setErrores((p) => ({ ...p, password: undefined }));
  };

  const benefits = useMemo(
    () => [
      {
        icon: ShieldCheck,
        title: 'Acceso seguro',
        description: 'Autenticación robusta para proteger los formData sensibles de tus pacientes.',
      },
      {
        icon: HeartPulse,
        title: 'Gestión integral',
        description: 'Administra servicios, doctores y citas desde un panel centralizado.',
      },
      {
        icon: Sparkles,
        title: 'Experiencia renovada',
        description: 'Interfaz moderna y clara para tomar decisiones rápidas en tu operación médica.',
      },
    ],
    [],
  );
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  return (
    <main
      id="smd-vital-login-page"
      className="relative min-h-dvh overflow-hidden bg-slate-950 text-foreground"
    >
      {/* Fondo sutil con un gradiente brand → info */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-info/20 blur-3xl"
      />

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-6xl flex-col items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
        <div className="grid w-full items-center gap-8 lg:grid-cols-[1fr_1fr] lg:gap-12">
          {/* Columna de marketing */}
          <section className="order-2 space-y-8 text-white lg:order-1 lg:space-y-10">
            <Insignia
              variant="info"
              size="md"
              icon={Stethoscope}
              className="border-info/30 bg-info-muted text-info [&_svg]:text-info"
            >
              Plataforma médica inteligente y segura
            </Insignia>

            <div className="space-y-4">
              <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">
                Gestión clínica intuitiva para equipos comprometidos
              </h1>
              <p className="max-w-lg text-base text-white/70 sm:text-lg">
                Monitorea productividad, coordina citas y toma decisiones confiables con un panel
                diseñado para profesionales de la salud.
              </p>
            </div>

            <ul className="space-y-3">
              {benefits.map(({ icon: Icono, title, description }) => (
                <li
                  key={title}
                  className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                >
                  <div
                    aria-hidden="true"
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-info-muted text-info ring-1 ring-info/30"
                  >
                    <Icono className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="mt-0.5 text-sm text-white/70">{description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Columna de formulario */}
          <section className="order-1 lg:order-2">
            <div className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-card/95 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
              <div className="flex flex-col items-center text-center">
                <div
                  aria-hidden="true"
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-info text-white shadow-soft-md"
                >
                  <Stethoscope className="h-7 w-7" aria-hidden="true" />
                </div>
                <h2 className="mt-5 text-2xl font-semibold text-foreground">SMD Vital</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Panel de administración clínico
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
                {loginMutacion.isError ? (
                  <Alerta variant="danger" icon={AlertCircle}>
                    {(loginMutacion.error as { response?: { data?: { message?: string } } })?.response
                      ?.data?.message ?? 'No pudimos validar tus credenciales. Inténtalo nuevamente.'}
                  </Alerta>
                ) : null}

                <div className="space-y-1.5">
                  <Etiqueta htmlFor="email" required>
                    Correo electrónico
                  </Etiqueta>
                  <Entrada
                    id="email"
                    type="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="admin@smdvital.com"
                    autoComplete="email"
                    required
                    error={errores.email}
                    aria-invalid={Boolean(errores.email) || undefined}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Etiqueta htmlFor="password" required>
                      Contraseña
                    </Etiqueta>
                    <Link
                      to="/recuperar-contrasena"
                      className="text-xs font-medium text-brand-600 hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card dark:text-brand-300 dark:hover:text-brand-200"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <div className="relative">
                    <Entrada
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      placeholder="Ingresa tu contraseña"
                      autoComplete="current-password"
                      required
                      error={errores.password}
                      aria-invalid={Boolean(errores.password) || undefined}
                      className="pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarContrasena((p) => !p)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      aria-pressed={showPassword}
                      className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 animate-pulse rounded-full bg-success"
                    />
                    Sistema operativo
                  </span>
                  <Link
                    to="/register"
                    className="font-medium text-brand-600 transition-colors hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card dark:text-brand-300 dark:hover:text-brand-200"
                  >
                    Crear cuenta
                  </Link>
                </div>

                <Boton
                  type="submit"
                  isLoading={loginMutacion.isPending}
                  leftIcon={!loginMutacion.isPending ? <LogIn className="h-4 w-4" /> : undefined}
                  size="lg"
                  className="w-full"
                  disabled={loginMutacion.isPending}
                >
                  {loginMutacion.isPending ? 'Iniciando sesión…' : 'Acceder al panel'}
                </Boton>
              </form>

              <footer className="mt-6 space-y-2 border-t border-border pt-5 text-center text-xs text-muted-foreground">
                <p>Acceso exclusivo para personal autorizado de SMD Vital.</p>
                <p>
                  Soporte prioritario:{' '}
                  <a
                    href="mailto:soporte@smdvital.com"
                    className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300"
                  >
                    soporte@smdvital.com
                  </a>
                </p>
                <p>SMD Vital · Médico a Domicilio · © {currentYear}</p>
              </footer>
            </div>

            <p className="mt-4 text-center text-xs text-white/50">
              Al continuar aceptas nuestras políticas de uso y tratamiento de datos clínicos
              según la normativa aplicable.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}