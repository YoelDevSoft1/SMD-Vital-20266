/**
 * CreateAppointmentForm — wizard de 3 pasos para crear/editar citas.
 *
 * Por qué se reescribió:
 *  - El original apilaba 9 campos obligatorios sin indicador de progreso ni
 *    manera de volver atrás. En mobile eso bloqueaba al agente en el momento
 *    exacto donde necesita velocidad.
 *  - Usaba `<select>` nativos, que en iOS abren el picker del sistema y
 *    rompen el feel nativo.
 *  - El contenedor scrollable no cubría el bloque de slots, así que
 *    los slots quedaban cortados y el botón "Crear" parcialmente oculto
 *    por el bottom tab bar del navegador.
 *
 * Decisiones de diseño (componente checkpoint):
 *  - Wizard de 3 pasos: (1) Quién y qué, (2) Cuándo y dónde, (3) Confirmar.
 *  - BottomPicker en lugar de <select>: search input + list + drag handle.
 *  - TimeGrid agrupado por bloque (mañana / descanso / tarde) con
 *    tap-and-vibrate (8ms) y ring dorado en el seleccionado.
 *  - Sticky CTA inferior con micro-card "Tu selección" arriba.
 *  - scrollIntoView al primer campo con error al fallar validación.
 *  - Todo dentro de ModalCristal: focus trap, ESC, body-scroll-lock,
 *    safe-area-inset-top/bottom, full-screen en mobile.
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  localInputToColombiaISO,
  utcToColombiaInputValue,
  obtenerProximosDias,
  etiquetaCortaFecha,
} from '@/utils/dateFormat';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  DollarSign,
  FileText,
  Loader2,
  MapPin,
  Stethoscope,
  Sun,
  Sunrise,
  Sunset,
  User,
  UserPlus,
  X,
  Zap,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/utils/cn';
import { adminService } from '@/services/admin.service';
import billingService from '@/services/billing.service';
import { useAuthStore } from '@/store/auth.store';
import { ModalCristal } from '@/components/ui/ModalCristal';
import { BottomPicker } from '@/components/ui/BottomPicker';
import type { AvailabilitySlot, Doctor, Patient, Service } from '@/types';

interface CreateAppointmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: any;
}

interface AppointmentFormData {
  patientId: string;
  doctorId: string;
  serviceId: string;
  scheduledAt: string;
  duration: number;
  notes: string;
  diagnosis: string;
  prescription: string;
  totalPrice: number;
  address: string;
  city: string;
  isUrgent: boolean;
  coordinates: { lat: number; lng: number };
}

interface NewPatientData {
  firstName: string;
  lastName: string;
  documentId: string;
  phone: string;
}

type WizardStep = 1 | 2 | 3;

const durationOptions = [
  { value: 15, label: '15 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1.5 horas' },
  { value: 120, label: '2 horas' },
];

const bogotaLocalities = [
  'Usaquén',
  'Chapinero',
  'Santa Fe',
  'San Cristóbal',
  'Usme',
  'Tunjuelito',
  'Bosa',
  'Kennedy',
  'Fontibón',
  'Engativá',
  'Suba',
  'Barrios Unidos',
  'Teusaquillo',
  'Los Mártires',
  'Antonio Nariño',
  'Puente Aranda',
  'La Candelaria',
  'Rafael Uribe Uribe',
  'Ciudad Bolívar',
  'Sumapaz',
];

// Tope por hora para agrupar slots en bloques. Solo la franja visible del
// backend se renderiza, así que AM = antes de 12:00, descanso = 12:00-14:00,
// PM = 14:00 o más. Si el backend no devuelve horas de almuerzo, el bloque
// simplemente aparece sin items.
const BLOCK_BREAKFAST_END = 12 * 60;
const BLOCK_LUNCH_END = 14 * 60;

const STEP_META: Record<
  WizardStep,
  { label: string; subtitle: string; helper: string }
> = {
  1: {
    label: 'Quién y qué',
    subtitle: 'Paciente, servicio y médico',
    helper: 'Empieza por aquí — sin esto no avanzamos.',
  },
  2: {
    label: 'Cuándo y dónde',
    subtitle: 'Fecha, hora, dirección',
    helper: 'Toca un bloque y un horario disponible.',
  },
  3: {
    label: 'Confirmar',
    subtitle: 'Revisa y crea la cita',
    helper: 'Un último vistazo antes de guardar.',
  },
};

function extraerListaPaginada<T>(response: unknown): T[] {
  const axiosData = (response as { data?: unknown } | undefined)?.data;
  const payload = (axiosData as { data?: unknown } | undefined)?.data ?? axiosData;

  if (Array.isArray(payload)) return payload as T[];

  const nestedData = (payload as { data?: unknown } | undefined)?.data;
  if (Array.isArray(nestedData)) return nestedData as T[];

  return [];
}

function obtenerClaveServicio(service: Service): string {
  return service.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^c\.\s*/, 'control ')
    .replace(/^s\.\s*/, 'suero ')
    .replace(/\bresp\.\s*/g, 'respiratoria ')
    .replace(/\bresp\b/g, 'respiratoria')
    .replace(/\bde\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function deduplicarServicios(services: Service[]): Service[] {
  const byKey = new Map<string, Service>();

  for (const service of services) {
    const key = obtenerClaveServicio(service);
    const current = byKey.get(key);
    if (!current) {
      byKey.set(key, service);
      continue;
    }

    const currentScore = current.name.length + (current.description?.length ?? 0);
    const nextScore = service.name.length + (service.description?.length ?? 0);
    if (nextScore > currentScore) byKey.set(key, service);
  }

  return Array.from(byKey.values()).sort((left, right) =>
    left.name.localeCompare(right.name, 'es'),
  );
}

function horaAMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function grupoDeHora(hora: string): 'morning' | 'lunch' | 'afternoon' {
  const mins = horaAMinutos(hora);
  if (mins < BLOCK_BREAKFAST_END) return 'morning';
  if (mins < BLOCK_LUNCH_END) return 'lunch';
  return 'afternoon';
}

/**
 * Heurística de "vibrar" en iOS/Android al tocar un slot. En escritorio no
 * hace nada (la API devuelve false). Es una micro-señal háptica que ayuda
 * a confirmar el tap como app nativa.
 */
function hapticTactil(ms = 8) {
  if (typeof navigator === 'undefined') return;
  if (typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(ms);
  } catch {
    /* ignore */
  }
}

export default function CreateAppointmentForm({
  isOpen,
  onClose,
  appointment,
}: CreateAppointmentFormProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAgent = user?.role === 'AGENT';

  const [step, setStep] = useState<WizardStep>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<WizardStep>>(
    new Set(),
  );

  const [isNewPatient, setIsNewPatient] = useState(false);
  const [newPatientData, setNewPatientData] = useState<NewPatientData>({
    firstName: '',
    lastName: '',
    documentId: '',
    phone: '',
  });
  const [newPatientErrors, setNewPatientErrors] = useState<Partial<NewPatientData>>({});

  const [formData, setFormData] = useState<AppointmentFormData>({
    patientId: '',
    doctorId: '',
    serviceId: '',
    scheduledAt: '',
    duration: 30,
    notes: '',
    diagnosis: '',
    prescription: '',
    totalPrice: 0,
    address: '',
    city: '',
    isUrgent: false,
    coordinates: { lat: 0, lng: 0 },
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeStatus, setGeocodeStatus] = useState('');

  // Pickers abiertos en cada paso.
  const [pickerTarget, setPickerTarget] = useState<
    null | 'patient' | 'doctor' | 'service' | 'city'
  >(null);

  // Refs para hacer scrollIntoView al primer campo con error.
  const bodyRef = useRef<HTMLDivElement>(null);
  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const setFieldRef = (key: string) => (node: HTMLDivElement | null) => {
    fieldRefs.current[key] = node;
  };

  const selectedDate = formData.scheduledAt
    ? formData.scheduledAt.slice(0, 10)
    : '';
  const selectedTime = formData.scheduledAt
    ? formData.scheduledAt.slice(11, 16)
    : '';

  // ── Queries ───────────────────────────────────────────────────────────
  const { data: doctorsData } = useQuery({
    queryKey: ['doctors-for-appointment'],
    queryFn: () => adminService.getDoctors({ page: 1, limit: 100 }),
    enabled: !isAgent && isOpen,
  });

  const { data: patientsData } = useQuery({
    queryKey: ['patients-for-appointment'],
    queryFn: () => adminService.getPatients({ page: 1, limit: 100 }),
    enabled: !isAgent && isOpen,
  });

  const { data: servicesData } = useQuery({
    queryKey: ['services-for-appointment'],
    queryFn: () => adminService.getServices({ page: 1, limit: 100 }),
    enabled: !isAgent && isOpen,
  });

  const { data: bookingOptionsData } = useQuery({
    queryKey: ['agent-booking-options'],
    queryFn: () => billingService.getBookingOptions(),
    enabled: isAgent && isOpen,
  });

  const { data: availabilityData, isFetching: isFetchingAvailability } = useQuery<any>({
    queryKey: [
      'doctor-daily-availability',
      formData.doctorId,
      formData.serviceId,
      selectedDate,
      formData.duration,
      isAgent,
    ],
    queryFn: async () => {
      if (isAgent) {
        const result = await billingService.getAvailableSlots(
          formData.doctorId,
          formData.serviceId,
          selectedDate,
        );
        return {
          data: {
            data: {
              slots: result.slots.map((slot: any) => ({
                startTime: new Date(slot.start).toTimeString().slice(0, 5),
                endTime: new Date(slot.end).toTimeString().slice(0, 5),
                isAvailable: slot.isAvailable ?? true,
                reason: slot.reason,
              })),
            },
          },
        };
      }

      return adminService.getDoctorDailyAvailability(
        formData.doctorId,
        selectedDate,
        formData.duration,
      );
    },
    enabled: Boolean(
      formData.doctorId && selectedDate && (!isAgent || formData.serviceId),
    ),
    staleTime: 15_000,
  });

  const availability = availabilityData?.data?.data;
  const availableSlots: AvailabilitySlot[] = availability?.slots ?? [];

  const doctors = useMemo(
    () =>
      isAgent
        ? ((bookingOptionsData?.data?.doctors ?? []) as Doctor[])
        : extraerListaPaginada<Doctor>(doctorsData),
    [bookingOptionsData, doctorsData, isAgent],
  );
  const patients = useMemo(
    () =>
      isAgent
        ? ((bookingOptionsData?.data?.patients ?? []) as Patient[])
        : extraerListaPaginada<Patient>(patientsData),
    [bookingOptionsData, isAgent, patientsData],
  );
  const services = useMemo(
    () =>
      deduplicarServicios(
        isAgent
          ? ((bookingOptionsData?.data?.services ?? []) as Service[])
          : extraerListaPaginada<Service>(servicesData),
      ),
    [bookingOptionsData, isAgent, servicesData],
  );

  const selectedPatient = useMemo(
    () => patients.find((p: Patient) => p.id === formData.patientId) ?? null,
    [formData.patientId, patients],
  );
  const selectedDoctor = useMemo(
    () => doctors.find((d: Doctor) => d.id === formData.doctorId) ?? null,
    [formData.doctorId, doctors],
  );
  const selectedService = useMemo(
    () => services.find((s) => s.id === formData.serviceId) ?? null,
    [formData.serviceId, services],
  );

  // ── Mutations ─────────────────────────────────────────────────────────
  const quickPatientMutation = useMutation<any, any, NewPatientData>({
    mutationFn: (data: NewPatientData) =>
      isAgent
        ? billingService.createQuickPatient(data)
        : adminService.createQuickPatient(data),
  });

  const appointmentMutation = useMutation<any, any, any>({
    mutationFn: (data: any) => {
      if (isAgent && !appointment) return billingService.createAppointment(data);
      if (appointment) return adminService.updateAppointment(appointment.id, data);
      return adminService.createAppointment(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['agent-appointments'] });
      toast.success(appointment ? 'Cita actualizada' : 'Cita creada');
      onClose();
    },
    onError: (error: any) => {
      const response = error.response?.data;
      const fieldErrors = response?.error?.fieldErrors;
      const formErrors = response?.error?.formErrors;
      const zodMessages = [
        ...Object.entries(fieldErrors || {}).flatMap(([field, messages]) =>
          Array.isArray(messages)
            ? messages.map((message) => `${field}: ${message}`)
            : [],
        ),
        ...(Array.isArray(formErrors) ? formErrors : []),
      ];
      toast.error(
        zodMessages.length > 0
          ? zodMessages.join('\n')
          : response?.message || 'Error al procesar la cita',
      );
    },
  });

  // ── Reset al abrir / cerrar ────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    if (appointment) {
      setFormData({
        patientId: appointment.patientId || '',
        doctorId: appointment.doctorId || '',
        serviceId: appointment.serviceId || '',
        scheduledAt: appointment.scheduledAt
          ? utcToColombiaInputValue(appointment.scheduledAt)
          : '',
        duration: appointment.duration || 30,
        notes: appointment.notes || '',
        diagnosis: appointment.diagnosis || '',
        prescription: appointment.prescription || '',
        totalPrice: appointment.totalPrice || 0,
        address: appointment.address || '',
        city: appointment.city || '',
        isUrgent: appointment.isUrgent || false,
        coordinates: appointment.coordinates || { lat: 0, lng: 0 },
      });
      setCompletedSteps(new Set([1, 2, 3]));
      setStep(3);
    } else {
      setFormData({
        patientId: '',
        doctorId: '',
        serviceId: '',
        scheduledAt: '',
        duration: 30,
        notes: '',
        diagnosis: '',
        prescription: '',
        totalPrice: 0,
        address: '',
        city: '',
        isUrgent: false,
        coordinates: { lat: 0, lng: 0 },
      });
      setCompletedSteps(new Set());
      setStep(1);
    }
    setErrors({});
    setIsNewPatient(false);
    setNewPatientData({ firstName: '', lastName: '', documentId: '', phone: '' });
    setNewPatientErrors({});
    setPickerTarget(null);
  }, [isOpen, appointment]);

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleInputChange = (field: keyof AppointmentFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field as string];
        return next;
      });
    }
  };

  const handleServiceChange = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    setFormData((prev) => ({
      ...prev,
      serviceId,
      duration: service?.duration ?? prev.duration,
      totalPrice: service?.basePrice ?? prev.totalPrice,
    }));
    if (errors.serviceId) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.serviceId;
        return next;
      });
    }
  };

  const handleSlotSelect = (slot: AvailabilitySlot) => {
    if (!selectedDate || !slot.isAvailable) return;
    hapticTactil(8);
    handleInputChange('scheduledAt', `${selectedDate}T${slot.startTime}`);
  };

  const handleDateChipSelect = (date: string) => {
    const currentTime = formData.scheduledAt?.slice(11, 16) || '';
    handleInputChange('scheduledAt', currentTime ? `${date}T${currentTime}` : `${date}T`);
  };

  const handlePatientChange = (patientId: string) => {
    const next = patients.find((p: Patient) => p.id === patientId) ?? null;
    setFormData((prev) => ({
      ...prev,
      patientId,
      address: next?.address && next.address.trim() ? next.address : prev.address,
      city: next?.city && next.city.trim() ? next.city : prev.city,
    }));
    if (errors.patientId) {
      setErrors((prev) => {
        const next2 = { ...prev };
        delete next2.patientId;
        return next2;
      });
    }
  };

  const geocodeAddress = useCallback(
    async (showToast = false) => {
      if (!formData.address.trim() || !formData.city.trim()) {
        if (showToast) {
          toast.error('Completa dirección y localidad para ubicar en el mapa');
        }
        return;
      }

      setIsGeocoding(true);
      setGeocodeStatus('Buscando coordenadas...');

      try {
        const query = `${formData.address}, ${formData.city}, Bogotá, Colombia`;
        const params = new URLSearchParams({
          q: query,
          format: 'json',
          addressdetails: '1',
          limit: '1',
          countrycodes: 'co',
        });
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?${params.toString()}`,
          { headers: { Accept: 'application/json' } },
        );

        if (!response.ok) {
          throw new Error('No se pudo consultar el geocodificador');
        }

        const results = (await response.json()) as Array<{
          lat: string;
          lon: string;
          display_name?: string;
        }>;
        const firstResult = results[0];
        if (!firstResult) {
          setGeocodeStatus('No se encontraron coordenadas para esa dirección.');
          if (showToast) {
            toast.error('No encontré esa dirección. Ajusta dirección/localidad.');
          }
          return;
        }

        const lat = Number(firstResult.lat);
        const lng = Number(firstResult.lon);
        if (Number.isNaN(lat) || Number.isNaN(lng)) {
          throw new Error('Respuesta de coordenadas inválida');
        }

        handleInputChange('coordinates', { lat, lng });
        setGeocodeStatus(
          firstResult.display_name
            ? `Ubicado: ${firstResult.display_name}`
            : 'Coordenadas encontradas',
        );
        if (showToast) toast.success('Coordenadas encontradas');
      } catch {
        setGeocodeStatus('No se pudieron obtener coordenadas.');
        if (showToast) toast.error('No se pudieron obtener coordenadas');
      } finally {
        setIsGeocoding(false);
      }
    },
    [formData.address, formData.city],
  );

  useEffect(() => {
    if (!formData.address.trim() || !formData.city.trim()) {
      setGeocodeStatus('');
      return;
    }
    const timeout = window.setTimeout(() => geocodeAddress(false), 900);
    return () => window.clearTimeout(timeout);
  }, [formData.address, formData.city, geocodeAddress]);

  // ── Validación por paso ───────────────────────────────────────────────
  const validateStep = (target: WizardStep): boolean => {
    const newErrors: Record<string, string> = {};
    if (target === 1) {
      if (!isNewPatient && !formData.patientId) {
        newErrors.patientId = 'Selecciona un paciente';
      }
      if (!formData.serviceId) newErrors.serviceId = 'Selecciona un servicio';
      if (!formData.doctorId) newErrors.doctorId = 'Selecciona un doctor';
    } else if (target === 2) {
      if (
        !formData.scheduledAt ||
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(formData.scheduledAt)
      ) {
        newErrors.scheduledAt = 'Selecciona una fecha y una hora disponible';
      }
      if (!formData.address) newErrors.address = 'Ingresa la dirección';
      if (!formData.city) newErrors.city = 'Ingresa la localidad';
    } else if (target === 3) {
      if (formData.totalPrice <= 0) {
        newErrors.totalPrice = 'El precio debe ser mayor a 0';
      }
    }

    if (target === 1 && isNewPatient) {
      const npErrors: Partial<NewPatientData> = {};
      if (!newPatientData.firstName.trim()) npErrors.firstName = 'Requerido';
      if (!newPatientData.lastName.trim()) npErrors.lastName = 'Requerido';
      if (!newPatientData.documentId.trim()) npErrors.documentId = 'Requerido';
      if (!newPatientData.phone.trim()) npErrors.phone = 'Requerido';
      setNewPatientErrors(npErrors);
      if (Object.keys(npErrors).length > 0) {
        setErrors(newErrors);
        return false;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Tras fallar validación, hace scroll suave al PRIMER campo con error.
   * Esto evita el clásico "toco Crear y no veo qué pasa".
   */
  const scrollToFirstError = (keys: string[]) => {
    const root = bodyRef.current;
    if (!root) return;
    let target: HTMLElement | null = null;
    for (const key of keys) {
      const node = fieldRefs.current[key];
      if (node) {
        target = node;
        break;
      }
    }
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const focusable = target.querySelector<HTMLElement>(
      'button, [tabindex], input, textarea, select',
    );
    if (focusable) {
      window.setTimeout(() => focusable.focus({ preventScroll: true }), 250);
    }
  };

  const goNext = () => {
    if (!validateStep(step)) {
      const errKeys = Object.keys(errors);
      scrollToFirstError(errKeys.length ? errKeys : ['patientId']);
      return;
    }
    setCompletedSteps((prev) => new Set(prev).add(step));
    setStep((s) => (s < 3 ? ((s + 1) as WizardStep) : s));
    // Llevar el cuerpo al tope para que el siguiente paso se vea desde el inicio.
    // Sin esto el usuario ve el "tail" del paso anterior y se confunde.
    window.setTimeout(() => {
      bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 30);
  };

  const goPrev = () => {
    setStep((s) => (s > 1 ? ((s - 1) as WizardStep) : s));
  };

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      // Recoge qué campos fallaron
      const failedKeys: string[] = [];
      if (Object.keys(errors).length) failedKeys.push(...Object.keys(errors));
      if (!isNewPatient && !formData.patientId) failedKeys.push('patientId');
      if (!formData.doctorId) failedKeys.push('doctorId');
      if (!formData.serviceId) failedKeys.push('serviceId');
      if (!formData.scheduledAt) failedKeys.push('scheduledAt');
      if (!formData.address) failedKeys.push('address');
      if (!formData.city) failedKeys.push('city');
      if (formData.totalPrice <= 0) failedKeys.push('totalPrice');
      scrollToFirstError([...new Set(failedKeys)]);
      return;
    }

    const colombiaIso = localInputToColombiaISO(formData.scheduledAt);
    const scheduledAtISO = new Date(colombiaIso).toISOString();

    if (!appointment && new Date(scheduledAtISO) <= new Date()) {
      setErrors((prev) => ({
        ...prev,
        scheduledAt: 'La fecha y hora de la cita deben ser futuras',
      }));
      toast.error('No puedes crear una cita en una fecha u hora pasada');
      scrollToFirstError(['scheduledAt']);
      return;
    }

    let patientId = formData.patientId;

    if (isNewPatient) {
      try {
        const result = await quickPatientMutation.mutateAsync(newPatientData);
        patientId = result.data?.data?.id;
        if (!patientId) {
          toast.error('No se pudo crear el paciente');
          return;
        }
        queryClient.invalidateQueries({ queryKey: ['patients-for-appointment'] });
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Error creando el paciente');
        return;
      }
    }

    const hasCoordinates =
      Number(formData.coordinates.lat) !== 0 ||
      Number(formData.coordinates.lng) !== 0;
    const notes = [
      formData.notes.trim(),
      formData.isUrgent ? 'Prioridad: cita urgente.' : '',
    ]
      .filter(Boolean)
      .join('\n');

    const basePayload = {
      patientId,
      doctorId: formData.doctorId,
      serviceId: formData.serviceId,
      scheduledAt: scheduledAtISO,
      duration: Number(formData.duration),
      notes,
      totalPrice: Number(formData.totalPrice),
      address: formData.address.trim(),
      city: formData.city.trim(),
      coordinates: hasCoordinates
        ? {
            lat: Number(formData.coordinates.lat),
            lng: Number(formData.coordinates.lng),
          }
        : null,
    };
    const payload = appointment
      ? {
          ...basePayload,
          diagnosis: formData.diagnosis?.trim() || undefined,
          prescription: formData.prescription?.trim() || undefined,
        }
      : basePayload;

    appointmentMutation.mutate(payload);
  };

  // ── Picker items ──────────────────────────────────────────────────────
  const patientItems = useMemo(
    () =>
      patients.map((p: Patient) => ({
        value: p.id,
        label: `${p?.user?.firstName ?? ''} ${p?.user?.lastName ?? ''}`.trim() || 'Sin nombre',
        sublabel: p?.user?.phone || p?.user?.email || undefined,
      })),
    [patients],
  );
  const doctorItems = useMemo(
    () =>
      doctors.map((d: Doctor) => ({
        value: d.id,
        label: `Dr. ${d?.user?.firstName ?? ''} ${d?.user?.lastName ?? ''}`.trim(),
        sublabel: d.specialty || undefined,
      })),
    [doctors],
  );
  const serviceItems = useMemo(
    () =>
      services.map((s: Service) => ({
        value: s.id,
        label: s.name,
        sublabel: s.description
          ? `${s.duration} min · $${Number(s.basePrice).toLocaleString('es-CO')}`
          : undefined,
      })),
    [services],
  );
  const cityItems = useMemo(
    () =>
      bogotaLocalities.map((loc) => ({
        value: loc,
        label: loc,
        sublabel: 'Bogotá',
      })),
    [],
  );

  // ── Agrupar slots en bloques AM / descanso / PM ───────────────────────
  const slotGroups = useMemo(() => {
    const groups = {
      morning: [] as AvailabilitySlot[],
      lunch: [] as AvailabilitySlot[],
      afternoon: [] as AvailabilitySlot[],
    };
    for (const slot of availableSlots) {
      groups[grupoDeHora(slot.startTime)].push(slot);
    }
    return groups;
  }, [availableSlots]);

  // ── Render ────────────────────────────────────────────────────────────
  if (!isOpen) return null;

  const dateChips = obtenerProximosDias(7);
  const totalSlots = availableSlots.length;
  const freeSlots = availableSlots.filter((s) => s.isAvailable).length;

  return (
    <ModalCristal
      isOpen={isOpen}
      onClose={onClose}
      variant="solid"
      size="lg"
      closeOnOverlayClick
      withBlobs={false}
      containerClassName="max-h-[100dvh] sm:max-h-[92vh]"
    >
      <div className="flex h-full max-h-[100dvh] flex-col bg-white text-slate-900 sm:max-h-[92vh] dark:bg-slate-950 dark:text-white">
        {/* ── Header ───────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200/70 bg-white/85 px-5 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md dark:border-slate-800/70 dark:bg-slate-950/85">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                Paso {step} de 3
              </span>
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {STEP_META[step].label}
              </span>
            </div>
            <h2 className="mt-0.5 truncate text-base font-semibold text-slate-900 sm:text-lg dark:text-white">
              {appointment ? 'Editar cita' : 'Nueva cita'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors active:bg-slate-200 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:h-10 sm:w-10 dark:text-slate-400 dark:hover:bg-slate-800 dark:active:bg-slate-700 dark:hover:text-white"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>

        {/* ── Stepper visual ───────────────────────────────────────────── */}
        <StepperBar step={step} completed={completedSteps} />

        {/* ── Body scrollable ─────────────────────────────────────────── */}
        <div
          ref={bodyRef}
          // pb-32 en móvil deja espacio para el footer sticky (h-11 + safe-area + blur).
          // Sin esto el último campo queda parcialmente tapado por el CTA.
          className="flex-1 overflow-y-auto px-5 pb-32 pt-4 sm:px-6 sm:pb-6"
        >
          {/* ── Paso 1: Quién y qué ───────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <FieldBlock
                ref={setFieldRef('patient')}
                label="Paciente"
                required
                error={errors.patientId}
              >
                {!isNewPatient ? (
                  <div className="space-y-3">
                    <PickerField
                      placeholder="Selecciona un paciente"
                      value={formData.patientId}
                      selectedLabel={
                        selectedPatient
                          ? `${selectedPatient.user?.firstName ?? ''} ${selectedPatient.user?.lastName ?? ''}`.trim()
                          : null
                      }
                      selectedSubLabel={
                        selectedPatient
                          ? selectedPatient.user?.phone ||
                            selectedPatient.user?.email ||
                            undefined
                          : null
                      }
                      onClick={() => setPickerTarget('patient')}
                      hasError={Boolean(errors.patientId)}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewPatient(true);
                        setNewPatientErrors({});
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:border-blue-400 hover:bg-blue-50 dark:border-blue-800/60 dark:bg-slate-900 dark:text-blue-300 dark:hover:bg-slate-800/60"
                    >
                      <UserPlus className="h-3.5 w-3.5" aria-hidden />
                      Paciente nuevo
                    </button>
                  </div>
                ) : (
                  <NewPatientMiniForm
                    data={newPatientData}
                    errors={newPatientErrors}
                    onChange={setNewPatientData}
                    onCancel={() => {
                      setIsNewPatient(false);
                      setNewPatientErrors({});
                    }}
                  />
                )}
              </FieldBlock>

              <FieldBlock
                ref={setFieldRef('service')}
                label="Servicio"
                required
                error={errors.serviceId}
                hint={
                  selectedService
                    ? `${selectedService.duration} min · $${Number(selectedService.basePrice).toLocaleString('es-CO')}`
                    : undefined
                }
              >
                <PickerField
                  placeholder="Selecciona un servicio"
                  value={formData.serviceId}
                  selectedLabel={selectedService?.name ?? null}
                  selectedSubLabel={
                    selectedService?.description ?? null
                  }
                  onClick={() => setPickerTarget('service')}
                  hasError={Boolean(errors.serviceId)}
                />
              </FieldBlock>

              <FieldBlock
                ref={setFieldRef('doctor')}
                label="Médico"
                required
                error={errors.doctorId}
              >
                <PickerField
                  placeholder="Selecciona un médico"
                  value={formData.doctorId}
                  selectedLabel={
                    selectedDoctor
                      ? `Dr. ${selectedDoctor.user?.firstName ?? ''} ${selectedDoctor.user?.lastName ?? ''}`.trim()
                      : null
                  }
                  selectedSubLabel={selectedDoctor?.specialty ?? null}
                  onClick={() => setPickerTarget('doctor')}
                  hasError={Boolean(errors.doctorId)}
                />
              </FieldBlock>

              <p className="pt-2 text-center text-[11px] text-slate-400 dark:text-slate-500">
                Los horarios se muestran en hora Bogotá (UTC-5).
              </p>
            </div>
          )}

          {/* ── Paso 2: Cuándo y dónde ──────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-6">
              <FieldBlock
                ref={setFieldRef('scheduledAt')}
                label="Fecha"
                required
                error={errors.scheduledAt}
              >
                <DateChipStrip
                  chips={dateChips}
                  selected={selectedDate}
                  onSelect={handleDateChipSelect}
                />
              </FieldBlock>

              <FieldBlock
                label="Hora disponible"
                required={false}
                helper={
                  !formData.doctorId || !selectedDate
                    ? 'Pendiente: selecciona médico y fecha.'
                    : isFetchingAvailability
                      ? 'Buscando horarios disponibles...'
                      : totalSlots === 0
                        ? 'Este médico no tiene horarios disponibles para este día.'
                        : `${freeSlots} de ${totalSlots} libres · ${grupoDeHora(selectedTime) === 'morning' ? 'Mañana' : grupoDeHora(selectedTime) === 'lunch' ? 'Descanso' : 'Tarde'}`
                }
              >
                {formData.doctorId && selectedDate && totalSlots > 0 ? (
                  <TimeGrid
                    groups={slotGroups}
                    selectedTime={selectedTime}
                    onSelect={handleSlotSelect}
                  />
                ) : (
                  <EmptySlots
                    showHint={Boolean(formData.doctorId && selectedDate)}
                  />
                )}
                {formData.scheduledAt ? (
                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
                    <Check className="h-3.5 w-3.5" aria-hidden />
                    Seleccionada: {formData.scheduledAt.replace('T', ' ')}
                  </p>
                ) : null}
              </FieldBlock>

              <FieldBlock
                ref={setFieldRef('address')}
                label="Dirección"
                required
                error={errors.address}
                hint={
                  selectedPatient?.address
                    ? `Del paciente: ${selectedPatient.address}`
                    : undefined
                }
              >
                <textarea
                  id="address"
                  value={
                    formData.address === '__manual__' ? '' : formData.address
                  }
                  onChange={(e) =>
                    handleInputChange('address', e.target.value)
                  }
                  rows={2}
                  placeholder="Calle 123 #45-67, apto 301"
                  className={cn(
                    'w-full resize-none rounded-lg border bg-white px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 dark:bg-slate-900/60 dark:text-white',
                    errors.address
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/30'
                      : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/40 dark:border-slate-700',
                  )}
                />
                {selectedPatient?.address &&
                formData.address !== selectedPatient.address ? (
                  <button
                    type="button"
                    onClick={() =>
                      handleInputChange('address', selectedPatient.address || '')
                    }
                    className="mt-2 text-xs font-medium text-blue-600 hover:underline dark:text-blue-300"
                  >
                    Usar la dirección guardada del paciente
                  </button>
                ) : null}
              </FieldBlock>

              <FieldBlock
                ref={setFieldRef('city')}
                label="Localidad"
                required
                error={errors.city}
              >
                <PickerField
                  placeholder="Selecciona una localidad"
                  value={formData.city}
                  selectedLabel={formData.city || null}
                  selectedSubLabel="Bogotá"
                  onClick={() => setPickerTarget('city')}
                  hasError={Boolean(errors.city)}
                />
              </FieldBlock>

              {geocodeStatus ||
              formData.coordinates.lat !== 0 ||
              formData.coordinates.lng !== 0 ? (
                <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  {geocodeStatus ||
                    `${formData.coordinates.lat.toFixed(6)}, ${formData.coordinates.lng.toFixed(6)}`}
                </p>
              ) : null}
            </div>
          )}

          {/* ── Paso 3: Confirmar ───────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              <SelectionSummary
                date={selectedDate}
                time={selectedTime}
                doctor={selectedDoctor}
                service={selectedService}
                patient={selectedPatient}
                address={formData.address}
                city={formData.city}
              />

              <FieldBlock
                label="Duración"
                required={false}
                helper={`Prefijada del servicio. ${formData.duration} min.`}
              >
                <DurationPicker
                  options={durationOptions}
                  value={formData.duration}
                  onChange={(v) => handleInputChange('duration', v)}
                />
              </FieldBlock>

              <FieldBlock
                ref={setFieldRef('totalPrice')}
                label="Precio total"
                required
                error={errors.totalPrice}
              >
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={0.01}
                    value={formData.totalPrice || ''}
                    onChange={(e) =>
                      handleInputChange(
                        'totalPrice',
                        Number.parseFloat(e.target.value) || 0,
                      )
                    }
                    placeholder="0.00"
                    className={cn(
                      'w-full rounded-lg border bg-white pl-8 pr-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 dark:bg-slate-900/60 dark:text-white',
                      errors.totalPrice
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-500/30'
                        : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/40 dark:border-slate-700',
                    )}
                  />
                </div>
              </FieldBlock>

              <label
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                  formData.isUrgent
                    ? 'border-amber-400 bg-amber-50 dark:border-amber-500/70 dark:bg-amber-950/30'
                    : 'border-slate-200 bg-white hover:border-amber-200 dark:border-slate-700 dark:bg-slate-900/60',
                )}
              >
                <input
                  type="checkbox"
                  checked={formData.isUrgent}
                  onChange={(e) =>
                    handleInputChange('isUrgent', e.target.checked)
                  }
                  className="mt-0.5 h-5 w-5 rounded border-amber-400 text-amber-500 focus:ring-amber-500/40"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-900 dark:text-white">
                    <Zap
                      className="h-3.5 w-3.5 text-amber-500"
                      aria-hidden
                    />
                    Marcar como urgente
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Notifica al equipo de turno. No cambia el precio ni los
                    pagos.
                  </p>
                </div>
              </label>

              <FieldBlock label="Notas operativas (opcional)">
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  placeholder="Contexto para el equipo..."
                  className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-slate-700 dark:bg-slate-900/60 dark:text-white"
                />
              </FieldBlock>

              {(appointment || !isAgent) && (
                <details className="group rounded-xl border border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/40">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                    <span className="flex items-center gap-2">
                      <ChevronDown className="h-4 w-4 transition group-open:rotate-180" aria-hidden />
                      Diagnóstico y prescripción
                    </span>
                    <span className="text-xs text-slate-500 group-open:hidden">
                      Mostrar
                    </span>
                    <span className="hidden text-xs text-slate-500 group-open:inline">
                      Ocultar
                    </span>
                  </summary>
                  <div className="space-y-4 px-4 pb-4">
                    <textarea
                      value={formData.diagnosis}
                      onChange={(e) =>
                        handleInputChange('diagnosis', e.target.value)
                      }
                      rows={2}
                      placeholder="Diagnóstico médico..."
                      className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-slate-700 dark:bg-slate-900/60"
                    />
                    <textarea
                      value={formData.prescription}
                      onChange={(e) =>
                        handleInputChange('prescription', e.target.value)
                      }
                      rows={2}
                      placeholder="Medicamentos y tratamientos..."
                      className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-slate-700 dark:bg-slate-900/60"
                    />
                  </div>
                </details>
              )}
            </div>
          )}
        </div>

        {/* ── Footer sticky con CTA ──────────────────────────────────── */}
        <footer
          className={cn(
            'sticky bottom-0 z-10 flex flex-col-reverse gap-2 border-t border-slate-200/70 bg-white/90 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:flex-row sm:items-center sm:justify-between dark:border-slate-800/70 dark:bg-slate-950/90',
          )}
        >
          {step > 1 ? (
            <button
              type="button"
              onClick={goPrev}
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Atrás
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-lg px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={goNext}
              className={cn(
                'inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] sm:flex-1 sm:max-w-xs dark:bg-white dark:text-slate-900',
                'hover:bg-slate-800 dark:hover:bg-slate-100',
              )}
            >
              Siguiente
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={appointmentMutation.isPending}
              className={cn(
                'inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-5 text-sm font-semibold shadow-sm transition active:scale-[0.98] sm:max-w-xs',
                appointmentMutation.isPending
                  ? 'cursor-wait bg-blue-400 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700',
              )}
            >
              {appointmentMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Check className="h-4 w-4" aria-hidden />
              )}
              {appointmentMutation.isPending
                ? 'Guardando...'
                : appointment
                  ? 'Actualizar cita'
                  : 'Crear cita'}
            </button>
          )}
        </footer>

        {/* ── Pickers (BottomPicker compartido) ─────────────────────── */}
        <BottomPicker
          open={pickerTarget === 'patient'}
          onClose={() => setPickerTarget(null)}
          onSelect={(v) => handlePatientChange(v)}
          title="Selecciona un paciente"
          placeholder="Buscar por nombre o documento..."
          emptyText="No hay pacientes disponibles"
          items={patientItems}
          selectedValue={formData.patientId}
        />
        <BottomPicker
          open={pickerTarget === 'doctor'}
          onClose={() => setPickerTarget(null)}
          onSelect={(v) => handleInputChange('doctorId', v)}
          title="Selecciona un médico"
          placeholder="Buscar por nombre o especialidad..."
          emptyText="No hay médicos disponibles"
          items={doctorItems}
          selectedValue={formData.doctorId}
        />
        <BottomPicker
          open={pickerTarget === 'service'}
          onClose={() => setPickerTarget(null)}
          onSelect={(v) => handleServiceChange(v)}
          title="Selecciona un servicio"
          placeholder="Buscar tipo de atención..."
          emptyText="No hay servicios disponibles"
          items={serviceItems}
          selectedValue={formData.serviceId}
        />
        <BottomPicker
          open={pickerTarget === 'city'}
          onClose={() => setPickerTarget(null)}
          onSelect={(v) => handleInputChange('city', v)}
          title="Localidad"
          placeholder="Buscar localidad..."
          emptyText="No hay localidades"
          items={cityItems}
          selectedValue={formData.city}
        />
      </div>
    </ModalCristal>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Sub-componentes internos
// ─────────────────────────────────────────────────────────────────────────

const StepperBar = React.memo(function StepperBar({
  step,
  completed,
}: {
  step: WizardStep;
  completed: Set<WizardStep>;
}) {
  return (
    <div className="flex items-center gap-1 border-b border-slate-200/70 bg-white px-5 py-2 dark:border-slate-800/70 dark:bg-slate-950">
      {[1, 2, 3].map((n) => {
        const isActive = n === step;
        const isDone = completed.has(n as WizardStep) && !isActive;
        const isFuture = !isActive && !isDone;
        return (
          <div key={n} className="flex-1">
            <div
              className={cn(
                'h-1 w-full rounded-full transition-all duration-300',
                isActive
                  ? 'bg-blue-600'
                  : isDone
                    ? 'bg-emerald-500'
                    : 'bg-slate-200 dark:bg-slate-800',
              )}
            />
            <p
              className={cn(
                'mt-1 text-[10px] font-medium uppercase tracking-wider transition-colors',
                isActive
                  ? 'text-blue-700 dark:text-blue-300'
                  : isDone
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-slate-400 dark:text-slate-500',
                isFuture && 'opacity-60',
              )}
            >
              {n === 1 ? 'Quién' : n === 2 ? 'Cuándo' : 'Confirmar'}
            </p>
          </div>
        );
      })}
    </div>
  );
});

/**
 * Wrapper semántico alrededor de cada campo. Acepta ref para que
 * scrollIntoView pueda apuntar al bloque entero (no solo al input).
 */
const FieldBlock = React.forwardRef<HTMLDivElement, {
  label: string;
  required?: boolean;
  error?: string;
  helper?: string;
  hint?: string;
  children: React.ReactNode;
}>(function FieldBlock({ label, required, error, helper, hint, children }, ref) {
  return (
    <div ref={ref} className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          {label}
          {required ? (
            <span className="ml-0.5 text-red-500" aria-hidden>
              *
            </span>
          ) : null}
        </label>
      </div>
      {children}
      {hint && !error ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      ) : null}
      {helper && !error ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">{helper}</p>
      ) : null}
      {error ? (
        <p className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden />
          {error}
        </p>
      ) : null}
    </div>
  );
});

/**
 * DurationPicker — segmented control horizontal con snap-scroll.
 *
 * Por qué se creó (componente checkpoint):
 *  - Reemplaza un `<select>` nativo. En iOS Safari ese select abre el picker
 *    del sistema, que rompe el feel "app nativa" y desconecta al agente de
 *    su flujo.
 *  - iOS UISegmentedControl pattern: chips contiguos con la opción activa
 *    invertida. El fondo cambia de plateado a azul.
 *  - 6 opciones entran en 2 filas como mucho; en mobile hacemos scroll-x
 *    con scroll-snap para que se sienta elástico.
 */
function DurationPicker({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: number; label: string }>;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Duración de la cita"
      className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => {
              hapticTactil(6);
              onChange(option.value);
            }}
            className={cn(
              'inline-flex h-11 shrink-0 items-center justify-center rounded-full border px-4 text-sm font-medium transition active:scale-[0.96]',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
              isSelected
                ? 'border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800/60',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * PickerField — input button que abre un BottomPicker. Visualmente no es
 * un select nativo — evita el picker de iOS Safari y se siente como app.
 */
function PickerField({
  placeholder,
  value,
  selectedLabel,
  selectedSubLabel,
  onClick,
  hasError,
}: {
  placeholder: string;
  value: string;
  selectedLabel: string | null;
  selectedSubLabel: string | null;
  onClick: () => void;
  hasError: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex w-full min-h-[48px] items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2 text-left text-sm transition active:scale-[0.99]',
        hasError
          ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/30'
          : 'border-slate-300 hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-slate-700',
        'dark:bg-slate-900/60',
      )}
    >
      <div className="min-w-0 flex-1">
        {value && selectedLabel ? (
          <>
            <p className="truncate font-medium text-slate-900 dark:text-white">
              {selectedLabel}
            </p>
            {selectedSubLabel ? (
              <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                {selectedSubLabel}
              </p>
            ) : null}
          </>
        ) : (
          <span className="text-slate-400 dark:text-slate-500">{placeholder}</span>
        )}
      </div>
      <ChevronDown
        className="h-4 w-4 flex-shrink-0 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
        aria-hidden
      />
    </button>
  );
}

function DateChipStrip({
  chips,
  selected,
  onSelect,
}: {
  chips: Array<{ value: string; etiqueta: string }>;
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {chips.map((chip) => {
        const isSelected = chip.value === selected;
        const parts = chip.etiqueta.split(' ');
        const dayName = parts[0];
        const rest = parts.slice(1).join(' ') || chip.etiqueta;
        return (
          <button
            key={chip.value}
            type="button"
            onClick={() => onSelect(chip.value)}
            className={cn(
              'flex min-h-[60px] min-w-[68px] snap-start flex-col items-center justify-center rounded-xl border px-2.5 py-1.5 text-xs transition active:scale-[0.97]',
              isSelected
                ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:bg-slate-800/60',
            )}
          >
            <span className="text-[10px] font-medium uppercase tracking-wide opacity-80">
              {dayName}
            </span>
            <span className="mt-0.5 text-sm font-semibold">{rest}</span>
          </button>
        );
      })}
    </div>
  );
}

function TimeGrid({
  groups,
  selectedTime,
  onSelect,
}: {
  groups: { morning: AvailabilitySlot[]; lunch: AvailabilitySlot[]; afternoon: AvailabilitySlot[] };
  selectedTime: string;
  onSelect: (slot: AvailabilitySlot) => void;
}) {
  return (
    <div className="space-y-5">
      <SlotBlock
        icon={<Sunrise className="h-4 w-4 text-amber-500" aria-hidden />}
        label="Mañana"
        slots={groups.morning}
        selectedTime={selectedTime}
        onSelect={onSelect}
      />

      {groups.lunch.length > 0 ? (
        <SlotBlock
          icon={<Sun className="h-4 w-4 text-slate-400" aria-hidden />}
          label="Descanso"
          slots={groups.lunch}
          selectedTime={selectedTime}
          onSelect={onSelect}
        />
      ) : null}

      <SlotBlock
        icon={<Sunset className="h-4 w-4 text-indigo-500" aria-hidden />}
        label="Tarde"
        slots={groups.afternoon}
        selectedTime={selectedTime}
        onSelect={onSelect}
      />
    </div>
  );
}

function SlotBlock({
  icon,
  label,
  slots,
  selectedTime,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  slots: AvailabilitySlot[];
  selectedTime: string;
  onSelect: (slot: AvailabilitySlot) => void;
}) {
  if (slots.length === 0) return null;
  const free = slots.filter((s) => s.isAvailable).length;
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {icon}
        <span>{label}</span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {free} libres
        </span>
      </div>
      {/*
        Móvil: scroll-x con snap. Cada slot se vuelve un pill horizontal para
        que el agente deslice los horarios como si fuera un carrusel nativo.
        Desktop: grid 4 columnas para aprovechar el ancho.
      */}
      <div className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 sm:pb-0">
        {slots.map((slot) => {
          const isSelected = slot.startTime === selectedTime;
          if (!slot.isAvailable && !isSelected) {
            return (
              <div
                key={`${slot.startTime}-${slot.endTime}`}
                aria-disabled
                title={slot.reason}
                className="flex h-12 w-[68px] shrink-0 snap-start cursor-not-allowed items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-sm text-slate-400 sm:w-auto dark:border-slate-800 dark:bg-slate-900 dark:text-slate-600"
              >
                {slot.startTime}
              </div>
            );
          }
          return (
            <button
              key={`${slot.startTime}-${slot.endTime}`}
              type="button"
              onClick={() => onSelect(slot)}
              title={slot.reason}
              className={cn(
                'flex h-12 w-[68px] shrink-0 snap-start items-center justify-center rounded-lg border text-sm font-semibold transition active:scale-[0.94] sm:w-auto',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                isSelected
                  ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'border-slate-200 bg-white text-slate-800 hover:border-blue-300 hover:bg-blue-50/40 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-blue-500/60 dark:hover:bg-slate-800/80',
              )}
            >
              {slot.startTime}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EmptySlots({ showHint }: { showHint: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center dark:border-slate-700 dark:bg-slate-900/40">
      <Clock className="h-6 w-6 text-slate-400 dark:text-slate-500" aria-hidden />
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
        {showHint
          ? 'No hay disponibilidad'
          : 'Selecciona médico y fecha para ver horarios'}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {showHint
          ? 'Intenta con otra fecha o más tarde.'
          : 'Los slots se cargan automáticamente.'}
      </p>
    </div>
  );
}

function SelectionSummary({
  date,
  time,
  doctor,
  service,
  patient,
  address,
  city,
}: {
  date: string;
  time: string;
  doctor: Doctor | null;
  service: Service | null;
  patient: Patient | null;
  address: string;
  city: string;
}) {
  const fecha = useMemo(() => {
    if (!date) return null;
    try {
      const [y, m, d] = date.split('-').map(Number);
      const dd = new Date(y, (m ?? 1) - 1, d ?? 1);
      return new Intl.DateTimeFormat('es-CO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(dd);
    } catch {
      return null;
    }
  }, [date]);

  const bloque = time ? grupoDeHora(time) : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/60">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Tu selección
        </h3>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
            bloque === 'morning'
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
              : bloque === 'lunch'
                ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                : bloque === 'afternoon'
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
          )}
        >
          {bloque === 'morning'
            ? 'Mañana'
            : bloque === 'lunch'
              ? 'Descanso'
              : bloque === 'afternoon'
                ? 'Tarde'
                : 'Sin hora'}
        </span>
      </div>
      <dl className="space-y-2.5 text-sm">
        <SummaryRow
          icon={<Calendar className="h-4 w-4 text-slate-400" />}
          label="Fecha"
          value={fecha ? `${fecha} · ${time || '—'}` : '—'}
        />
        <SummaryRow
          icon={<User className="h-4 w-4 text-slate-400" />}
          label="Paciente"
          value={
            patient
              ? `${patient.user?.firstName ?? ''} ${patient.user?.lastName ?? ''}`.trim()
              : '—'
          }
        />
        <SummaryRow
          icon={<Stethoscope className="h-4 w-4 text-slate-400" />}
          label="Médico"
          value={
            doctor
              ? `Dr. ${doctor.user?.firstName ?? ''} ${doctor.user?.lastName ?? ''}`.trim()
              : '—'
          }
          subvalue={doctor?.specialty}
        />
        <SummaryRow
          icon={<FileText className="h-4 w-4 text-slate-400" />}
          label="Servicio"
          value={service?.name ?? '—'}
          subvalue={
            service
              ? `${service.duration} min · $${Number(service.basePrice).toLocaleString('es-CO')}`
              : undefined
          }
        />
        {(address || city) && (
          <SummaryRow
            icon={<MapPin className="h-4 w-4 text-slate-400" />}
            label="Dirección"
            value={address ? (city ? `${address}, ${city}` : address) : city || '—'}
          />
        )}
      </dl>
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
  subvalue,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subvalue?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
          {value}
        </p>
        {subvalue ? (
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            {subvalue}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function NewPatientMiniForm({
  data,
  errors,
  onChange,
  onCancel,
}: {
  data: NewPatientData;
  errors: Partial<NewPatientData>;
  onChange: (next: NewPatientData) => void;
  onCancel: () => void;
}) {
  const update = (key: keyof NewPatientData, value: string) =>
    onChange({ ...data, [key]: value });
  return (
    <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-900/60 dark:bg-blue-950/20">
      <div className="grid grid-cols-2 gap-2">
        <InputMini
          label="Nombre"
          required
          placeholder="Nombre"
          value={data.firstName}
          error={errors.firstName}
          onChange={(v) => update('firstName', v)}
        />
        <InputMini
          label="Apellido"
          required
          placeholder="Apellido"
          value={data.lastName}
          error={errors.lastName}
          onChange={(v) => update('lastName', v)}
        />
        <InputMini
          label="Cédula"
          required
          placeholder="1234567890"
          value={data.documentId}
          error={errors.documentId}
          onChange={(v) => update('documentId', v)}
        />
        <InputMini
          label="Teléfono"
          required
          placeholder="+57 300 000 0000"
          value={data.phone}
          error={errors.phone}
          onChange={(v) => update('phone', v)}
        />
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        ← Volver a seleccionar paciente
      </button>
    </div>
  );
}

function InputMini({
  label,
  required,
  placeholder,
  value,
  error,
  onChange,
}: {
  label: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  error?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required ? (
          <span className="ml-0.5 text-red-500" aria-hidden>
            *
          </span>
        ) : null}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        className={cn(
          'w-full rounded-lg border bg-white px-3 py-2.5 text-base focus:outline-none focus:ring-2 dark:bg-slate-900/60 dark:text-white',
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-500/30'
            : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/40 dark:border-slate-700',
        )}
      />
    </div>
  );
}
