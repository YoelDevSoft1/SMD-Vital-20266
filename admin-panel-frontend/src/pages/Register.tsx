import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authService, RegisterCredentials } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';
import {
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserPlus,
  Users,
  ChevronDown,
} from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState<RegisterCredentials>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'ADMIN',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (response) => {
      const { user, accessToken } = response.data.data;
      setAuth(user, accessToken);
      toast.success('Registro exitoso. Bienvenido al panel de administración.');
      navigate('/');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al crear la cuenta';
      toast.error(message);
    },
  });

  const highlights = useMemo(
    () => [
      {
        icon: ShieldCheck,
        title: 'Accesos verificados',
        description: 'Roles y permisos granulares para resguardar la información clínica crítica.',
      },
      {
        icon: Users,
        title: 'Colaboración coordinada',
        description: 'Asigna tareas y monitorea el rendimiento del equipo desde un mismo panel.',
      },
      {
        icon: Sparkles,
        title: 'Experiencia intuitiva',
        description: 'Flujos guiados y métricas claras para tomar decisiones con rapidez.',
      },
    ],
    []
  );

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        'La contraseña debe contener al menos una mayúscula, una minúscula y un número';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (!formData.role) {
      newErrors.role = 'Selecciona un rol';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      registerMutation.mutate(formData);
    }
  };

  const handleInputChange = (field: keyof RegisterCredentials, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020617]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="glass-blob absolute -left-24 -top-32 h-[420px] w-[420px] rounded-full bg-cyan-500/14 blur-[180px] mix-blend-screen" />
        <div className="glass-blob glass-blob--reverse absolute right-[-10%] top-1/5 h-[520px] w-[520px] rounded-full bg-sky-400/16 blur-[210px] mix-blend-screen" />
        <div className="glass-blob glass-blob--slow absolute left-1/2 bottom-[-220px] h-[420px] w-[520px] -translate-x-1/2 rounded-full bg-blue-500/18 blur-[230px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.1),transparent_70%)]" />
        <div className="absolute inset-x-0 bottom-[-180px] h-[360px] bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-10">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-2">
          <div className="order-2 space-y-8 text-white/90 lg:order-1 lg:max-w-xl lg:space-y-12">
            <div className="inline-flex w-full max-w-xs items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur">
              <UserPlus className="h-5 w-5 text-cyan-300" />
              <span className="text-sm tracking-wide text-white/80">
                Convierte a tu equipo en administradores confiables
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
                Suma talento a un panel administrativo transparente y seguro
              </h1>
              <p className="text-base text-white/70 sm:text-lg">
                Establece accesos de alto nivel, ejecuta operaciones críticas y brinda seguimiento
                oportuno a tus pacientes desde una experiencia unificada.
              </p>
            </div>

            <dl className="space-y-4">
              {highlights.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur transition duration-300 hover:border-cyan-200/60 hover:bg-white/10"
                >
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
                    <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-cyan-400/18 via-transparent to-blue-500/25 blur-3xl" />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/12 via-transparent to-white/10" />
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

          <div className="order-1 lg:order-2 lg:justify-self-end">
            <div className="relative">
              <div className="absolute inset-0 -translate-y-5 scale-[0.97] rounded-[36px] bg-gradient-to-br from-white/16 via-cyan-200/8 to-transparent opacity-60 blur-3xl" />
              <div className="relative overflow-hidden rounded-[32px] border border-white/20 bg-white/12 p-8 shadow-[0_45px_140px_-60px_rgba(56,189,248,0.45)] backdrop-blur-2xl sm:p-10">
                <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[32px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/18 via-cyan-100/6 to-transparent" />
                  <div className="absolute -left-24 top-16 h-56 w-56 rounded-full bg-cyan-400/18 blur-3xl" />
                  <div className="absolute right-[-30%] top-[-35%] h-72 w-72 rounded-full bg-blue-600/20 blur-[140px]" />
                  <div className="absolute bottom-[-42%] left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-sky-500/18 blur-[150px]" />
                  <div className="absolute left-1/2 top-0 h-36 w-48 -translate-x-1/2 -translate-y-1/2 rotate-[28deg] bg-white/22 blur-3xl opacity-50" />
                  <div className="absolute inset-y-[-40%] left-[-40%] w-[180%] rotate-[18deg] bg-gradient-to-r from-transparent via-white/12 to-transparent opacity-18" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),rgba(255,255,255,0)_55%)] opacity-30" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(59,130,246,0.15),transparent_65%)] opacity-40" />
                </div>

                <div className="relative z-10 flex flex-col">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-[0_10px_40px_rgba(236,72,153,0.35)]">
                    <div className="pointer-events-none absolute -inset-1 rounded-[18px] bg-gradient-to-br from-cyan-300/30 via-transparent to-white/18 opacity-70 blur-xl" />
                      <Stethoscope className="relative h-9 w-9 text-cyan-200" />
                    </div>
                    <h2 className="mt-6 text-3xl font-semibold text-white sm:text-3xl">
                      Crear cuenta administrativa
                    </h2>
                    <p className="mt-2 max-w-sm text-sm text-white/60">
                      Acceso exclusivo para perfiles autorizados. Configura permisos avanzados desde
                      el primer inicio.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="mt-10 space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label htmlFor="firstName" className="text-sm font-medium text-white/80">
                          Nombre
                        </label>
                        <div className="group relative rounded-2xl border border-white/10 bg-slate-950/60">
                          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/15 via-cyan-400/10 to-transparent opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100" />
                          <input
                            id="firstName"
                            value={formData.firstName}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            className="relative z-10 w-full rounded-2xl bg-transparent px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus-visible:ring-0"
                            placeholder="Tu nombre"
                            autoComplete="given-name"
                          />
                        </div>
                        {errors.firstName && <p className="text-xs text-rose-300">{errors.firstName}</p>}
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="lastName" className="text-sm font-medium text-white/80">
                          Apellido
                        </label>
                        <div className="group relative rounded-2xl border border-white/10 bg-slate-950/60">
                          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/15 via-cyan-400/10 to-transparent opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100" />
                          <input
                            id="lastName"
                            value={formData.lastName}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                            className="relative z-10 w-full rounded-2xl bg-transparent px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus-visible:ring-0"
                            placeholder="Tu apellido"
                            autoComplete="family-name"
                          />
                        </div>
                        {errors.lastName && <p className="text-xs text-rose-300">{errors.lastName}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium text-white/80">
                        Correo corporativo
                      </label>
                      <div className="group relative rounded-2xl border border-white/10 bg-slate-950/60">
                        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/15 via-cyan-400/10 to-transparent opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100" />
                        <input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="relative z-10 w-full rounded-2xl bg-transparent px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus-visible:ring-0"
                          placeholder="admin@smdvital.com"
                          autoComplete="email"
                        />
                      </div>
                      {errors.email && <p className="text-xs text-rose-300">{errors.email}</p>}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-[1.1fr,0.9fr]">
                      <div className="space-y-2">
                        <label htmlFor="phone" className="text-sm font-medium text-white/80">
                          Teléfono (opcional)
                        </label>
                        <div className="group relative rounded-2xl border border-white/10 bg-slate-950/60">
                          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/15 via-cyan-400/10 to-transparent opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100" />
                          <input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className="relative z-10 w-full rounded-2xl bg-transparent px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus-visible:ring-0"
                            placeholder="+57 300 123 4567"
                            autoComplete="tel"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="role" className="text-sm font-medium text-white/80">
                          Rol asignado
                        </label>
                        <div className="group relative rounded-2xl border border-white/10 bg-slate-950/60">
                          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/15 via-blue-400/10 to-transparent opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100" />
                          <select
                            id="role"
                            value={formData.role}
                            onChange={(e) =>
                              handleInputChange('role', e.target.value as 'ADMIN' | 'SUPER_ADMIN')
                            }
                            className="relative z-10 w-full appearance-none rounded-2xl bg-transparent px-4 py-3 pr-10 text-white focus:outline-none focus-visible:ring-0"
                          >
                            <option className="bg-slate-900 text-white" value="ADMIN">
                              Administrador
                            </option>
                            <option className="bg-slate-900 text-white" value="SUPER_ADMIN">
                              Super Administrador
                            </option>
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-white/60 transition group-focus-within:text-white" />
                        </div>
                        {errors.role && <p className="text-xs text-rose-300">{errors.role}</p>}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium text-white/80">
                          Contraseña
                        </label>
                        <div className="group relative rounded-2xl border border-white/10 bg-slate-950/60">
                          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/15 via-cyan-400/10 to-transparent opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100" />
                          <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            className="relative z-10 w-full rounded-2xl bg-transparent px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus-visible:ring-0"
                            placeholder="Mínimo 8 caracteres seguros"
                            autoComplete="new-password"
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
                        {errors.password && <p className="text-xs text-rose-300">{errors.password}</p>}
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="confirmPassword" className="text-sm font-medium text-white/80">
                          Confirmar contraseña
                        </label>
                        <div className="group relative rounded-2xl border border-white/10 bg-slate-950/60">
                          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/15 via-cyan-400/10 to-transparent opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100" />
                          <input
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="relative z-10 w-full rounded-2xl bg-transparent px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus-visible:ring-0"
                            placeholder="Repite tu contraseña"
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            className="absolute inset-y-0 right-4 z-10 flex items-center text-white/60 transition hover:text-white"
                            title={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                        {errors.confirmPassword && (
                          <p className="text-xs text-rose-300">{errors.confirmPassword}</p>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={registerMutation.isPending}
                      className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-white/90 px-4 py-3.5 text-base font-semibold text-slate-900 shadow-[0_25px_60px_-30px_rgba(15,23,42,0.45)] transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 enabled:hover:bg-white enabled:hover:text-slate-900/90 disabled:cursor-not-allowed disabled:opacity-75"
                    >
                      <span className="absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-50">
                        <span className="absolute inset-0 bg-gradient-to-r from-white/70 via-white/40 to-white/70" />
                      </span>
                      <span className="pointer-events-none absolute -left-full top-0 h-full w-1/3 bg-gradient-to-r from-transparent via-white/80 to-transparent opacity-0 transition duration-700 group-hover:left-full group-hover:opacity-60" />
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Creando cuenta...
                        </>
                      ) : (
                        'Crear acceso seguro'
                      )}
                    </button>
                  </form>

                  <div className="mt-10 space-y-4 border-t border-white/10 pt-6 text-center text-xs text-white/60">
                    <p>
                      ¿Ya tienes una cuenta?{' '}
                      <Link
                        to="/login"
                        className="font-semibold text-cyan-200 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                      >
                        Iniciar sesión
                      </Link>
                    </p>
                    <p>
                      Asistencia inmediata:{' '}
                      <a
                        href="mailto:soporte@smdvital.com"
                        className="font-semibold text-cyan-200 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                      >
                        soporte@smdvital.com
                      </a>
                    </p>
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
