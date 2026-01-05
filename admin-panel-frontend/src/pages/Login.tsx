import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { getHomePath } from '@/utils/roles';
import toast from 'react-hot-toast';
import {
  Loader2,
  Stethoscope,
  HeartPulse,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (response) => {
      const { user, accessToken } = response.data.data;

      console.debug('Login Success - Token received:', {
        tokenLength: accessToken.length,
        tokenStart: accessToken.substring(0, 20) + '...',
        tokenEnd: '...' + accessToken.substring(accessToken.length - 20),
        isJWTFormat: accessToken.split('.').length === 3,
        user: user.email,
      });

      setAuth(user, accessToken);
      toast.success('¡Bienvenido de nuevo!');
      navigate(getHomePath(user.role));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Credenciales inválidas');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  const benefits = useMemo(
    () => [
      {
        icon: ShieldCheck,
        title: 'Acceso Seguro',
        description: 'Autenticación robusta para proteger los datos sensibles de tus pacientes.',
      },
      {
        icon: HeartPulse,
        title: 'Gestión Integral',
        description: 'Administra servicios, doctores y citas desde un panel centralizado.',
      },
      {
        icon: Sparkles,
        title: 'Experiencia Renovada',
        description: 'Interfaz moderna y clara para tomar decisiones rápidas en tu operación médica.',
      },
    ],
    []
  );
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020617]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-22%] top-[-20%] h-[420px] w-[420px] rounded-full bg-cyan-500/25 blur-[160px]" />
        <div className="absolute right-[-15%] top-1/4 h-[520px] w-[520px] rounded-full bg-blue-500/20 blur-[200px]" />
        <div className="absolute left-1/2 bottom-[-28%] h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-sky-400/20 blur-[220px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_52%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(14,165,233,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.05),rgba(15,23,42,0.92))]" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-10">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="order-2 space-y-10 text-white/90 lg:order-1 lg:space-y-12">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur">
              <Stethoscope className="h-5 w-5 text-cyan-300" />
              <span className="text-sm tracking-wide text-white/80">
                Plataforma médica inteligente y segura
              </span>
            </div>

            <div>
              <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
                Gestión clínica intuitiva para equipos comprometidos
              </h1>
              <p className="mt-4 text-base text-white/70 sm:text-lg">
                Monitorea productividad, coordina citas y toma decisiones confiables con un panel
                diseñado para profesionales de la salud.
              </p>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {benefits.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur transition duration-300 hover:border-cyan-200/60 hover:bg-white/10"
                >
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
                    <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-cyan-400/20 via-transparent to-sky-500/30 blur-3xl" />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/10" />
                  </div>
                  <div className="relative flex gap-4">
                    <div className="mt-1 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-200 shadow-inner shadow-cyan-500/20">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <dt className="text-base font-semibold text-white">{title}</dt>
                      <dd className="mt-1 text-sm text-white/70">{description}</dd>
                    </div>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative">
              <div className="absolute inset-0 -translate-y-5 scale-[0.97] rounded-[36px] bg-gradient-to-br from-white/20 via-cyan-200/10 to-transparent opacity-60 blur-3xl" />
              <div className="relative overflow-hidden rounded-[32px] border border-white/20 bg-white/10 p-8 shadow-[0_45px_140px_-50px_rgba(56,189,248,0.65)] backdrop-blur-2xl sm:p-10">
                <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[32px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-cyan-100/5 to-transparent" />
                  <div className="absolute -left-24 top-16 h-56 w-56 rounded-full bg-cyan-400/25 blur-3xl" />
                  <div className="absolute right-[-30%] top-[-35%] h-72 w-72 rounded-full bg-blue-600/30 blur-[140px]" />
                  <div className="absolute bottom-[-40%] left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-400/20 blur-[140px]" />
                  <div className="absolute left-1/2 top-0 h-36 w-48 -translate-x-1/2 -translate-y-1/2 rotate-[32deg] bg-white/25 blur-3xl opacity-70" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.24),rgba(255,255,255,0)_55%)] opacity-40" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(14,165,233,0.18),transparent_65%)] opacity-60" />
                </div>

                <div className="relative z-10 flex flex-col">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-[0_10px_40px_rgba(56,189,248,0.35)]">
                      <div className="pointer-events-none absolute -inset-1 rounded-[18px] bg-gradient-to-br from-cyan-300/30 via-transparent to-white/20 opacity-70 blur-xl" />
                      <Stethoscope className="relative h-9 w-9 text-cyan-200" />
                    </div>
                    <h2 className="mt-6 text-3xl font-semibold text-white sm:text-3xl">SMD Vital</h2>
                    <p className="mt-2 max-w-sm text-sm text-white/60">
                      Panel de administración clínico con experiencia inmersiva y visualmente refinada.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="mt-10 space-y-6">
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium text-white/80">
                        Correo electrónico
                      </label>
                      <div className="group relative rounded-2xl border border-white/15 bg-white/5">
                        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-white/5 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100" />
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="relative z-10 w-full rounded-2xl bg-transparent px-4 py-3.5 text-white placeholder:text-white/40 focus:outline-none focus-visible:ring-0"
                          placeholder="admin@smdvital.com"
                          autoComplete="email"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="password" className="text-sm font-medium text-white/80">
                        Contraseña
                      </label>
                      <div className="group relative rounded-2xl border border-white/15 bg-white/5">
                        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-white/5 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100" />
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="relative z-10 w-full rounded-2xl bg-transparent px-4 py-3.5 text-white placeholder:text-white/40 focus:outline-none focus-visible:ring-0"
                          placeholder="Ingresa tu contraseña"
                          autoComplete="current-password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute inset-y-0 right-4 z-10 flex items-center text-white/60 transition hover:text-white"
                          title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
                      <div className="inline-flex items-center gap-2">
                        <span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
                        Sistema operativo estable
                      </div>
                      <Link
                        to="/register"
                        className="font-medium text-cyan-200 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                      >
                        Crear cuenta
                      </Link>
                    </div>

                    <button
                      type="submit"
                      disabled={loginMutation.isPending}
                      className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 px-4 py-3.5 text-base font-semibold text-white shadow-[0_30px_80px_-30px_rgba(14,165,233,0.9)] transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 enabled:hover:brightness-[1.08] disabled:cursor-not-allowed disabled:opacity-75"
                    >
                      <span className="absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-50">
                        <span className="absolute inset-0 bg-gradient-to-r from-white/25 via-transparent to-white/20" />
                      </span>
                      <span className="pointer-events-none absolute -left-full top-0 h-full w-1/3 bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-0 transition duration-700 group-hover:left-full group-hover:opacity-80" />
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Iniciando sesión...
                        </>
                      ) : (
                        'Acceder al panel'
                      )}
                    </button>
                  </form>

                  <div className="mt-10 space-y-5 border-t border-white/10 pt-6 text-center text-xs text-white/60">
                    <p>Acceso exclusivo para personal autorizado de SMD Vital.</p>
                    <p>
                      Soporte prioritario:{' '}
                      <a
                        href="mailto:soporte@smdvital.com"
                        className="font-semibold text-cyan-200 transition hover:text-white"
                      >
                        soporte@smdvital.com
                      </a>
                    </p>
                    <p>SMD Vital · Médico a Domicilio · © {currentYear}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
