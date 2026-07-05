import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authService, type RegisterCredentials } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { obtenerRutaInicio } from '@/utils/roles';
import { Boton } from '@/components/ui/Boton';
import { Entrada } from '@/components/ui/Entrada';
import { Etiqueta } from '@/components/ui/Etiqueta';
import { Alerta } from '@/components/ui/Alerta';
import { Insignia } from '@/components/ui/Insignia';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ShieldCheck, Sparkles, Stethoscope, Users } from 'lucide-react';

interface ErroresFormulario {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function Register() {
  const [formData, setDatos] = useState<RegisterCredentials>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [confirmPassword, setConfirmarContrasena] = useState('');
  const [showPassword, setMostrarContrasena] = useState(false);
  const [showConfirmPassword, setMostrarConfirmar] = useState(false);
  const [errores, setErrores] = useState<ErroresFormulario>({});

  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const registroMutacion = useMutation({
    mutationFn: authService.register,
    onSuccess: (response) => {
      const { user, accessToken, refreshToken } = response.data.data;
      setAuth(user, accessToken, refreshToken);
      toast.success('Registro exitoso. Bienvenido a SMD Vital.');
      navigate(obtenerRutaInicio(user.role));
    },
    onError: (e: unknown) =>
      toast.error(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Error al crear la cuenta',
      ),
  });

  const benefits = useMemo(
    () => [
      {
        icon: ShieldCheck,
        title: 'Acceso seguro',
        description: 'Protege tu información clínica con una cuenta verificada.',
      },
      {
        icon: Users,
        title: 'Atención conectada',
        description: 'Mantente al día con el equipo médico y tus citas.',
      },
      {
        icon: Sparkles,
        title: 'Historial centralizado',
        description: 'Accede a tus registros y documentos clínicos en un solo lugar.',
      },
    ],
    [],
  );

  const validateForm = (): boolean => {
    const newErrors: ErroresFormulario = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'El nombre es obligatorio';
    if (!formData.lastName.trim()) newErrors.lastName = 'El apellido es obligatorio';

    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El correo electrónico no es válido';
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

    setErrores(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) registroMutacion.mutate(formData);
  };

  const handleInputChange = (campo: keyof RegisterCredentials, valor: string) => {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
    // Limpiar error del campo cuando el usuario empieza a corregir
    const mapaErrores: Record<keyof RegisterCredentials, keyof ErroresFormulario> = {
      firstName: 'firstName',
      lastName: 'lastName',
      email: 'email',
      password: 'password',
      phone: 'confirmPassword',
    };
    const errorKey = mapaErrores[campo];
    if (errores[errorKey]) {
      setErrores((prev) => ({ ...prev, [errorKey]: undefined }));
    }
  };

  return (
    <main className="relative min-h-dvh overflow-hidden bg-slate-950 text-foreground">
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
        className="pointer-events-none absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-info/15 blur-3xl"
      />

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-6xl flex-col items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
        <div className="grid w-full items-center gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Columna marketing */}
          <section className="order-2 space-y-8 text-white lg:order-1">
            <Insignia
              variant="success"
              size="md"
              icon={Users}
              className="border-success/30 bg-success-muted text-success"
            >
              Crea tu cuenta de paciente en minutos
            </Insignia>

            <div className="space-y-4">
              <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
                Tu salud organizada en un solo panel
              </h1>
              <p className="max-w-lg text-base text-white/70 sm:text-lg">
                Registra tu cuenta para ver tus citas, resultados y documentos clínicos.
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
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-success-muted text-success ring-1 ring-success/30"
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

          {/* Formulario */}
          <section className="order-1 lg:order-2">
            <div className="mx-auto w-full max-w-lg rounded-2xl border border-white/10 bg-card/95 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
              <div className="flex flex-col items-center text-center">
                <div
                  aria-hidden="true"
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-success to-emerald-700 text-white shadow-soft-md"
                >
                  <Stethoscope className="h-7 w-7" aria-hidden="true" />
                </div>
                <h2 className="mt-5 text-2xl font-semibold text-foreground">
                  Crear cuenta de paciente
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Completa tus formData y accede a tus servicios de salud.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Etiqueta htmlFor="firstName" required>
                      Nombre
                    </Etiqueta>
                    <Entrada
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="Tu firstName"
                      autoComplete="given-name"
                      error={errores.firstName}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Etiqueta htmlFor="lastName" required>
                      Apellido
                    </Etiqueta>
                    <Entrada
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Tu lastName"
                      autoComplete="family-name"
                      error={errores.lastName}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Etiqueta htmlFor="email" required>
                    Correo electrónico
                  </Etiqueta>
                  <Entrada
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="paciente@smdvital.com"
                    autoComplete="email"
                    error={errores.email}
                  />
                </div>

                <div className="space-y-1.5">
                  <Etiqueta htmlFor="phone">Teléfono (opcional)</Etiqueta>
                  <Entrada
                    id="phone"
                    type="tel"
                    value={formData.phone ?? ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+57 300 123 4567"
                    autoComplete="tel"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Etiqueta htmlFor="password" required>
                      Contraseña
                    </Etiqueta>
                    <div className="relative">
                      <Entrada
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                        autoComplete="new-password"
                        error={errores.password}
                        className="pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarContrasena((p) => !p)}
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Etiqueta htmlFor="confirmPassword" required>
                      Confirmar contraseña
                    </Etiqueta>
                    <div className="relative">
                      <Entrada
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmarContrasena(e.target.value);
                          if (errores.confirmPassword) {
                            setErrores((prev) => ({ ...prev, confirmPassword: undefined }));
                          }
                        }}
                        placeholder="Repite tu contraseña"
                        autoComplete="new-password"
                        error={errores.confirmPassword}
                        className="pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarConfirmar((p) => !p)}
                        aria-label={
                          showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                        }
                        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <Alerta variant="info">
                  Tu contraseña debe tener mínimo 8 caracteres e incluir mayúsculas, minúsculas y un número.
                </Alerta>

                <Boton
                  type="submit"
                  isLoading={registroMutacion.isPending}
                  leftIcon={
                    !registroMutacion.isPending ? <ShieldCheck className="h-4 w-4" /> : undefined
                  }
                  variant="success"
                  size="lg"
                  className="w-full"
                >
                  {registroMutacion.isPending ? 'Creando cuenta…' : 'Crear acceso seguro'}
                </Boton>
              </form>

              <footer className="mt-6 space-y-2 border-t border-border pt-5 text-center text-xs text-muted-foreground">
                <p>
                  ¿Ya tienes una cuenta?{' '}
                  <Link
                    to="/login"
                    className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300"
                  >
                    Iniciar sesión
                  </Link>
                </p>
                <p>
                  Asistencia inmediata:{' '}
                  <a
                    href="mailto:soporte@smdvital.com"
                    className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300"
                  >
                    soporte@smdvital.com
                  </a>
                </p>
              </footer>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}