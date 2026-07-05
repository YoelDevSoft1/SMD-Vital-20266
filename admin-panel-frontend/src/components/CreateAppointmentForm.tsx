import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { localInputToColombiaISO, utcToColombiaInputValue, obtenerProximosDias, etiquetaCortaFecha } from '@/utils/dateFormat';
import { X, Calendar, Clock, User, Stethoscope, MapPin, DollarSign, FileText, UserPlus, ChevronDown, AlertCircle } from 'lucide-react';
import { Boton } from '@/components/ui/Boton';
import { Entrada } from '@/components/ui/Entrada';
import { Etiqueta } from '@/components/ui/Etiqueta';
import { Interruptor } from '@/components/ui/Interruptor';
import { toast } from 'react-hot-toast';
import { adminService } from '@/services/admin.service';
import billingService from '@/services/billing.service';
import { useAuthStore } from '@/store/auth.store';
import type { AvailabilitySlot, Doctor, Patient, Service } from '@/types';

interface CreateAppointmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: any; // For editing
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
  coordinates: {
    lat: number;
    lng: number;
  };
}

const statusOptions = [
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'CONFIRMED', label: 'Confirmada' },
  { value: 'IN_PROGRESS', label: 'En Progreso' },
  { value: 'COMPLETED', label: 'Completada' },
  { value: 'CANCELLED', label: 'Cancelada' },
  { value: 'NO_SHOW', label: 'No Asistió' },
  { value: 'RESCHEDULED', label: 'Reprogramada' }
];

const durationOptions = [
  { value: 15, label: '15 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1.5 horas' },
  { value: 120, label: '2 horas' }
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

function extraerListaPaginada<T>(response: unknown): T[] {
  const axiosData = (response as { data?: unknown } | undefined)?.data;
  const payload = (axiosData as { data?: unknown } | undefined)?.data ?? axiosData;

  if (Array.isArray(payload)) {
    return payload as T[];
  }

  const nestedData = (payload as { data?: unknown } | undefined)?.data;
  if (Array.isArray(nestedData)) {
    return nestedData as T[];
  }

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
    if (nextScore > currentScore) {
      byKey.set(key, service);
    }
  }

  return Array.from(byKey.values()).sort((left, right) =>
    left.name.localeCompare(right.name, 'es')
  );
}

interface NewPatientData {
  firstName: string;
  lastName: string;
  documentId: string;
  phone: string;
}

/**
 * Estilo unificado para los <select> nativos. appearance-none quita el chrome
 * del navegador y agregamos un chevron via background-image SVG inline para que
 * se vea consistente con el resto del form (incluido dark mode).
 */
const selectClassName = (hasError: boolean) =>
  [
    'appearance-none w-full min-h-[44px] rounded-lg border bg-white pl-4 pr-10 py-2.5 text-sm',
    'text-slate-900',
    'focus:outline-none focus:ring-2 focus:ring-offset-1',
    'transition-all duration-200',
    hasError
      ? 'border-red-500/70 focus:border-red-500 focus:ring-red-500/30'
      : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/30',
    "dark:bg-slate-800/80 dark:text-white dark:border-slate-600/80",
    'dark:focus:border-blue-500 dark:focus:ring-blue-500/40',
    // chevron SVG inline (apunta hacia abajo)
    "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2364748b%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22/></svg>')]",
    "dark:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23cbd5e1%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22/></svg>')]",
    'bg-no-repeat bg-[right_0.75rem_center]',
  ].join(' ');

export default function CreateAppointmentForm({ isOpen, onClose, appointment }: CreateAppointmentFormProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAgent = user?.role === 'AGENT';
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
    coordinates: { lat: 0, lng: 0 }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeStatus, setGeocodeStatus] = useState('');
  const selectedDate = formData.scheduledAt ? formData.scheduledAt.slice(0, 10) : '';

  // Fetch data for dropdowns
  const { data: doctorsData } = useQuery({
    queryKey: ['doctors-for-appointment'],
    queryFn: () => adminService.getDoctors({ page: 1, limit: 100 }),
    enabled: !isAgent,
  });

  const { data: patientsData } = useQuery({
    queryKey: ['patients-for-appointment'],
    queryFn: () => adminService.getPatients({ page: 1, limit: 100 }),
    enabled: !isAgent,
  });

  const { data: servicesData } = useQuery({
    queryKey: ['services-for-appointment'],
    queryFn: () => adminService.getServices({ page: 1, limit: 100 }),
    enabled: !isAgent,
  });

  const { data: bookingOptionsData } = useQuery({
    queryKey: ['agent-booking-options'],
    queryFn: () => billingService.getBookingOptions(),
    enabled: isAgent,
  });

  const { data: availabilityData, isFetching: isFetchingAvailability } = useQuery<any>({
    queryKey: ['doctor-daily-availability', formData.doctorId, formData.serviceId, selectedDate, formData.duration, isAgent],
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
              slots: result.slots.map((slot) => ({
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
        formData.duration
      );
    },
    enabled: Boolean(formData.doctorId && selectedDate && (!isAgent || formData.serviceId)),
    staleTime: 15_000,
  });

  const availability = availabilityData?.data?.data;
  const availableSlots: AvailabilitySlot[] = availability?.slots ?? [];
  const doctors = useMemo(
    () => isAgent
      ? ((bookingOptionsData?.data?.doctors ?? []) as Doctor[])
      : extraerListaPaginada<Doctor>(doctorsData),
    [bookingOptionsData, doctorsData, isAgent],
  );
  const patients = useMemo(
    () => isAgent
      ? ((bookingOptionsData?.data?.patients ?? []) as Patient[])
      : extraerListaPaginada<Patient>(patientsData),
    [bookingOptionsData, isAgent, patientsData],
  );
  const services = useMemo(
    () => deduplicarServicios(
      isAgent
        ? ((bookingOptionsData?.data?.services ?? []) as Service[])
        : extraerListaPaginada<Service>(servicesData)
    ),
    [bookingOptionsData, isAgent, servicesData],
  );
  const selectedService = useMemo(() => {
    return services.find((service) => service.id === formData.serviceId);
  }, [formData.serviceId, services]);

  const quickPatientMutation = useMutation<any, any, NewPatientData>({
    mutationFn: (data: NewPatientData) =>
      isAgent ? billingService.createQuickPatient(data) : adminService.createQuickPatient(data),
  });

  // Create/Update mutation
  const appointmentMutation = useMutation<any, any, any>({
    mutationFn: (data: any) => {
      if (isAgent && !appointment) {
        return billingService.createAppointment(data);
      }
      if (appointment) {
        return adminService.updateAppointment(appointment.id, data);
      } else {
        return adminService.createAppointment(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['agent-appointments'] });
      toast.success(appointment ? 'Cita actualizada' : 'Cita creada');
      onClose();
    },
onError: (error: any) => {
  const response = error.response?.data;

  console.error('ERROR CREANDO/ACTUALIZANDO CITA:', response || error);

  const fieldErrors = response?.error?.fieldErrors;
  const formErrors = response?.error?.formErrors;

  const zodMessages = [
    ...Object.entries(fieldErrors || {}).flatMap(([field, messages]) =>
      Array.isArray(messages)
        ? messages.map(message => `${field}: ${message}`)
        : []
    ),
    ...(Array.isArray(formErrors) ? formErrors : []),
  ];

  toast.error(
    zodMessages.length > 0
      ? zodMessages.join('\n')
      : response?.message || 'Error al procesar la cita'
  );
}
  });

  useEffect(() => {
    if (appointment) {
      setFormData({
        patientId: appointment.patientId || '',
        doctorId: appointment.doctorId || '',
        serviceId: appointment.serviceId || '',
        scheduledAt: appointment.scheduledAt ? utcToColombiaInputValue(appointment.scheduledAt) : '',
        duration: appointment.duration || 30,
        notes: appointment.notes || '',
        diagnosis: appointment.diagnosis || '',
        prescription: appointment.prescription || '',
        totalPrice: appointment.totalPrice || 0,
        address: appointment.address || '',
        city: appointment.city || '',
        isUrgent: appointment.isUrgent || false,
        coordinates: appointment.coordinates || { lat: 0, lng: 0 }
      });
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
        coordinates: { lat: 0, lng: 0 }
      });
    }
  }, [appointment]);

  const handleInputChange = (field: keyof AppointmentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleServiceChange = (serviceId: string) => {
    const service = services.find((item) => item.id === serviceId);

    setFormData(prev => ({
      ...prev,
      serviceId,
      duration: service?.duration ?? prev.duration,
      totalPrice: service?.basePrice ?? prev.totalPrice,
    }));
    if (errors.serviceId) {
      setErrors(prev => ({ ...prev, serviceId: '' }));
    }
  };

  const handleDateChange = (date: string) => {
    if (!date) {
      handleInputChange('scheduledAt', '');
      return;
    }
    const currentTime = formData.scheduledAt?.slice(11, 16) || '';
    handleInputChange('scheduledAt', currentTime ? `${date}T${currentTime}` : `${date}T`);
  };

  const handleSlotSelect = (slot: AvailabilitySlot) => {
    if (!selectedDate || !slot.isAvailable) return;
    handleInputChange('scheduledAt', `${selectedDate}T${slot.startTime}`);
  };

  const selectedPatient = useMemo(
    () => patients.find((patient: Patient) => patient.id === formData.patientId) ?? null,
    [formData.patientId, patients]
  );

  const handlePatientChange = (patientId: string) => {
    const next = patients.find((patient: Patient) => patient.id === patientId) ?? null;
    setFormData((prev) => ({
      ...prev,
      patientId,
      // Auto-rellenar desde el registro del paciente cuando existe; editable después.
      address: next?.address && next.address.trim() ? next.address : prev.address,
      city: next?.city && next.city.trim() ? next.city : prev.city,
    }));
    if (errors.patientId) {
      setErrors((prev) => ({ ...prev, patientId: '' }));
    }
  };

  const handleDateChipSelect = (date: string) => {
    const currentTime = formData.scheduledAt?.slice(11, 16) || '';
    handleInputChange('scheduledAt', currentTime ? `${date}T${currentTime}` : `${date}T`);
  };

  const geocodeAddress = async (showToast = false) => {
    if (!formData.address.trim() || !formData.city.trim()) {
      if (showToast) {
        toast.error('Completa direccion y localidad para ubicar en el mapa');
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
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('No se pudo consultar el geocodificador');
      }

      const results = await response.json() as Array<{ lat: string; lon: string; display_name?: string }>;
      const firstResult = results[0];
      if (!firstResult) {
        setGeocodeStatus('No se encontraron coordenadas para esa direccion.');
        if (showToast) toast.error('No encontre esa direccion. Ajusta direccion/localidad.');
        return;
      }

      const lat = Number(firstResult.lat);
      const lng = Number(firstResult.lon);
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        throw new Error('Respuesta de coordenadas invalida');
      }

      handleInputChange('coordinates', { lat, lng });
      setGeocodeStatus(firstResult.display_name ? `Ubicado: ${firstResult.display_name}` : 'Coordenadas encontradas');
      if (showToast) toast.success('Coordenadas encontradas');
    } catch (error) {
      setGeocodeStatus('No se pudieron obtener coordenadas.');
      if (showToast) toast.error('No se pudieron obtener coordenadas');
    } finally {
      setIsGeocoding(false);
    }
  };

  useEffect(() => {
    if (!formData.address.trim() || !formData.city.trim()) {
      setGeocodeStatus('');
      return;
    }

    const timeout = window.setTimeout(() => {
      geocodeAddress(false);
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [formData.address, formData.city]);

  const validateNewPatient = (): boolean => {
    const errors: Partial<NewPatientData> = {};
    if (!newPatientData.firstName.trim()) errors.firstName = 'Requerido';
    if (!newPatientData.lastName.trim()) errors.lastName = 'Requerido';
    if (!newPatientData.documentId.trim()) errors.documentId = 'Requerido';
    if (!newPatientData.phone.trim()) errors.phone = 'Requerido';
    setNewPatientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!isNewPatient && !formData.patientId) newErrors.patientId = 'Selecciona un paciente';
    if (!formData.doctorId) newErrors.doctorId = 'Selecciona un doctor';
    if (!formData.serviceId) newErrors.serviceId = 'Selecciona un servicio';
    if (!formData.scheduledAt || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(formData.scheduledAt)) {
      newErrors.scheduledAt = 'Selecciona una fecha y una hora disponible';
    }
    if (!formData.address) newErrors.address = 'Ingresa la dirección';
    if (!formData.city) newErrors.city = 'Ingresa la localidad';
    if (formData.totalPrice <= 0) newErrors.totalPrice = 'El precio debe ser mayor a 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (isNewPatient && !validateNewPatient()) return;
  if (!validateForm()) return;

  const colombiaIso = localInputToColombiaISO(formData.scheduledAt);
  const scheduledAtISO = new Date(colombiaIso).toISOString();

  if (!appointment && new Date(scheduledAtISO) <= new Date()) {
    setErrors(prev => ({
      ...prev,
      scheduledAt: 'La fecha y hora de la cita deben ser futuras',
    }));
    toast.error('No puedes crear una cita en una fecha u hora pasada');
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
      console.error('Error creando paciente:', error.response?.data || error);
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

  console.log('PAYLOAD CITA:', payload);

  appointmentMutation.mutate(payload);
};
  const handleClose = () => {
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
      coordinates: { lat: 0, lng: 0 }
    });
    setErrors({});
    setIsNewPatient(false);
    setNewPatientData({ firstName: '', lastName: '', documentId: '', phone: '' });
    setNewPatientErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4">
      <div className="relative z-[1201] flex h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-xl dark:bg-slate-950 sm:h-auto sm:max-h-[92vh] sm:max-w-4xl sm:rounded-lg">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950 sm:p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
            {appointment ? 'Editar Cita' : 'Nueva Cita'}
          </h2>
          <Boton variant="ghost" onClick={handleClose} className="h-10 w-10 p-0">
            <X className="w-6 h-6" />
          </Boton>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:space-y-6 sm:p-6">
          <div className="space-y-3">
            {/* Paciente */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Etiqueta className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Paciente *</span>
                </Etiqueta>
                <button
                  type="button"
                  onClick={() => {
                    setIsNewPatient(!isNewPatient);
                    setNewPatientErrors({});
                  }}
                  className={`flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    isNewPatient
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50 dark:bg-slate-900 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-slate-800'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {isNewPatient ? 'Cancelar nuevo' : 'Nuevo paciente'}
                </button>
              </div>

              {isNewPatient ? (
                <div className="grid grid-cols-1 gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30 sm:grid-cols-2 sm:p-4">
                  <div>
                    <Etiqueta htmlFor="np-firstName" className="text-xs">Nombre *</Etiqueta>
                    <Entrada
                      id="np-firstName"
                      value={newPatientData.firstName}
                      onChange={(e) => setNewPatientData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Nombre"
                      className={newPatientErrors.firstName ? 'border-red-500' : ''}
                    />
                    {newPatientErrors.firstName && <p className="text-red-500 text-xs mt-0.5">{newPatientErrors.firstName}</p>}
                  </div>
                  <div>
                    <Etiqueta htmlFor="np-lastName" className="text-xs">Apellido *</Etiqueta>
                    <Entrada
                      id="np-lastName"
                      value={newPatientData.lastName}
                      onChange={(e) => setNewPatientData(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Apellido"
                      className={newPatientErrors.lastName ? 'border-red-500' : ''}
                    />
                    {newPatientErrors.lastName && <p className="text-red-500 text-xs mt-0.5">{newPatientErrors.lastName}</p>}
                  </div>
                  <div>
                    <Etiqueta htmlFor="np-documentId" className="text-xs">Cédula *</Etiqueta>
                    <Entrada
                      id="np-documentId"
                      value={newPatientData.documentId}
                      onChange={(e) => setNewPatientData(prev => ({ ...prev, documentId: e.target.value }))}
                      placeholder="Número de cédula"
                      className={newPatientErrors.documentId ? 'border-red-500' : ''}
                    />
                    {newPatientErrors.documentId && <p className="text-red-500 text-xs mt-0.5">{newPatientErrors.documentId}</p>}
                  </div>
                  <div>
                    <Etiqueta htmlFor="np-phone" className="text-xs">Teléfono *</Etiqueta>
                    <Entrada
                      id="np-phone"
                      value={newPatientData.phone}
                      onChange={(e) => setNewPatientData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+57 300 000 0000"
                      className={newPatientErrors.phone ? 'border-red-500' : ''}
                    />
                    {newPatientErrors.phone && <p className="text-red-500 text-xs mt-0.5">{newPatientErrors.phone}</p>}
                  </div>
                </div>
              ) : (
                <>
                  <select
                    id="patientId"
                    value={formData.patientId}
                    onChange={(e) => handlePatientChange(e.target.value)}
                    className={selectClassName(Boolean(errors.patientId))}
                  >
                    <option value="">Selecciona un paciente</option>
                    {patients.map((patient: Patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient?.user?.firstName} {patient?.user?.lastName} - {patient?.user?.phone || patient?.user?.email}
                      </option>
                    ))}
                  </select>
                  {errors.patientId && <p className="text-red-500 text-sm mt-1">{errors.patientId}</p>}
                </>
              )}
            </div>

            {/* Servicio */}
            <div>
              <Etiqueta htmlFor="serviceId" className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Servicio *</span>
              </Etiqueta>
              <select
                id="serviceId"
                value={formData.serviceId}
                onChange={(e) => handleServiceChange(e.target.value)}
                className={selectClassName(Boolean(errors.serviceId))}
              >
                <option value="">Selecciona un servicio</option>
                {services.map((service: Service) => (
                  <option key={service.id} value={service.id}>
                    {service?.name} - {service?.description}
                  </option>
                ))}
              </select>
              {errors.serviceId && <p className="text-red-500 text-sm mt-1">{errors.serviceId}</p>}
              {selectedService && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {selectedService.duration} min · ${Number(selectedService.basePrice).toLocaleString('es-CO')}
                </p>
              )}
            </div>

            {/* Doctor */}
            <div>
              <Etiqueta htmlFor="doctorId" className="flex items-center space-x-2">
                <Stethoscope className="w-4 h-4" />
                <span>Doctor *</span>
              </Etiqueta>
              <select
                id="doctorId"
                value={formData.doctorId}
                onChange={(e) => handleInputChange('doctorId', e.target.value)}
                className={selectClassName(Boolean(errors.doctorId))}
              >
                <option value="">Selecciona un doctor</option>
                {doctors.map((doctor: Doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    Dr. {doctor?.user?.firstName} {doctor?.user?.lastName} - {doctor?.specialty}
                  </option>
                ))}
              </select>
              {errors.doctorId && <p className="text-red-500 text-sm mt-1">{errors.doctorId}</p>}
            </div>

            {/* Fecha — chips de los próximos 7 días */}
            <div>
              <Etiqueta className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Fecha *</span>
              </Etiqueta>
              <div className="-mx-1 mt-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
                {obtenerProximosDias(7).map((dia) => {
                  const selected = selectedDate === dia.value;
                  return (
                    <button
                      key={dia.value}
                      type="button"
                      onClick={() => handleDateChipSelect(dia.value)}
                      className={`flex min-h-[56px] min-w-[64px] flex-col items-center justify-center rounded-lg border px-2 py-1.5 text-xs transition ${
                        selected
                          ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50/40 dark:border-slate-600/80 dark:bg-slate-800/60 dark:text-slate-100 dark:hover:border-blue-500/60 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-[10px] font-medium uppercase tracking-wide opacity-80">
                        {dia.etiqueta.split(' ')[0]}
                      </span>
                      <span className="text-sm font-semibold">
                        {dia.etiqueta.split(' ').slice(1).join(' ') || dia.etiqueta}
                      </span>
                    </button>
                  );
                })}
              </div>
              {errors.scheduledAt && (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.scheduledAt}
                </p>
              )}
            </div>

            {/* Dirección */}
            <div>
              <Etiqueta htmlFor="address" className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>Dirección *</span>
              </Etiqueta>
              {selectedPatient?.address ? (
                <select
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className={selectClassName(Boolean(errors.address))}
                >
                  <option value="">Selecciona una opción</option>
                  <option value={selectedPatient.address}>
                    Usar guardada · {selectedPatient.address}
                  </option>
                  <option value="__manual__">+ Ingresar otra dirección</option>
                </select>
              ) : null}
              {(formData.address === '__manual__' || !selectedPatient?.address) && (
                <Entrada
                  id="address-input"
                  value={formData.address === '__manual__' ? '' : formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className={errors.address ? 'mt-2 border-red-500' : 'mt-2'}
                  placeholder="Calle 123 #45-67"
                />
              )}
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
            </div>

            {/* Localidad */}
            <div>
              <Etiqueta htmlFor="city" className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>Localidad *</span>
              </Etiqueta>
              <select
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className={selectClassName(Boolean(errors.city))}
              >
                <option value="">Selecciona una localidad</option>
                {bogotaLocalities.map((locality) => (
                  <option key={locality} value={locality}>
                    {locality}
                  </option>
                ))}
              </select>
              {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
            </div>

            {/* Urgente */}
            <div className="flex items-center space-x-2 pt-1">
              <Interruptor
                id="isUrgent"
                checked={formData.isUrgent}
                onCheckedChange={(checked) => handleInputChange('isUrgent', checked)}
              />
              <Etiqueta htmlFor="isUrgent" className="!mb-0 cursor-pointer">Marcar como urgente</Etiqueta>
            </div>
          </div>
          </div>

          {/* Slots disponibles */}
          <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3 dark:border-blue-900 dark:bg-blue-950/30 sm:p-4">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Hora disponible</h3>
                <p className="text-xs text-gray-600 dark:text-slate-400">
                  Toca un slot para reservar. Si no ves opciones, completa doctor y fecha.
                </p>
              </div>
              {isFetchingAvailability && <span className="text-xs text-blue-700">Cargando...</span>}
            </div>

            {/* Estado: pendiente seleccionar doctor/fecha */}
            {!formData.doctorId || !selectedDate ? (
              <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                Pendiente seleccionar doctor y fecha.
              </p>
            ) : isFetchingAvailability ? (
              <p className="mb-3 text-xs text-blue-700 dark:text-blue-300">
                Buscando horarios disponibles...
              </p>
            ) : availableSlots.length === 0 ? (
              /* Estado: sin slots. Para el admin tambien mostramos si el doctor
                 no tiene bloques de availability ese dia (avisa al operador
                 que registre disponibilidad). Para el agente mostramos solo
                 "sin slots" para no exponer informacion de administracion. */
              <div className="mb-3 space-y-1">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Este medico no tiene horarios disponibles para este dia.
                </p>
                {!isAgent && availability?.availability?.length === 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    El doctor tampoco registro bloques de disponibilidad para esta fecha.
                  </p>
                )}
              </div>
            ) : (
              <>
                {/* Solo el admin ve los bloques de disponibilidad que el doctor registro.
                    Para el agente, los slots ya vienen calculados por el backend. */}
                {!isAgent && availability?.availability?.length ? (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {availability.availability.map((block) => (
                      <span
                        key={block.id}
                        className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-medium text-blue-800 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-200"
                      >
                        {block.startTime} - {block.endTime}
                      </span>
                    ))}
                  </div>
                ) : null}
                <p className="mb-3 text-xs font-medium text-blue-800 dark:text-blue-200">
                  {availableSlots.length} slot(s) disponible(s)
                </p>
              </>
            )}

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {availableSlots.map((slot) => {
                const selected = formData.scheduledAt.endsWith(`T${slot.startTime}`);
                return (
                  <button
                    key={`${slot.startTime}-${slot.endTime}`}
                    type="button"
                    disabled={!slot.isAvailable}
                    onClick={() => handleSlotSelect(slot)}
                    className={`min-h-11 rounded-md border px-2 py-2 text-xs font-medium transition ${
                      selected
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : slot.isAvailable
                          ? 'border-gray-200 bg-white text-gray-800 hover:border-blue-400 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
                          : 'border-gray-100 bg-gray-100 text-gray-400 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-500'
                    }`}
                    title={slot.reason}
                  >
                    {slot.startTime}
                  </button>
                );
              })}
            </div>

            {formData.scheduledAt && (
              <p className="mt-3 text-xs font-medium text-gray-700 dark:text-slate-300">
                Hora seleccionada: {formData.scheduledAt.replace('T', ' ')}
              </p>
            )}
          </div>

          {/* Detalles opcionales — todo lo no esencial en una sola sección colapsable */}
          <details className="group rounded-lg border border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-900/40">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200">
              <span className="flex items-center gap-2">
                <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
                Avanzado (duracion, precio, notas clinicas)
              </span>
              <span className="text-xs text-muted-foreground group-open:hidden">Mostrar</span>
              <span className="text-xs text-muted-foreground hidden group-open:inline">Ocultar</span>
            </summary>
            <div className="space-y-3 px-4 pb-4">
              {/* Duración + Precio (derivados del servicio) */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Etiqueta htmlFor="duration" className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Duracion</span>
                  </Etiqueta>
                  <select
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                    className={selectClassName(false)}
                  >
                    {durationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Prefijada del servicio seleccionado.
                  </p>
                </div>
                <div>
                  <Etiqueta htmlFor="totalPrice" className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4" />
                    <span>Precio total</span>
                  </Etiqueta>
                  <Entrada
                    id="totalPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    forceColorScheme="dark"
                    value={formData.totalPrice}
                    onChange={(e) => handleInputChange('totalPrice', parseFloat(e.target.value) || 0)}
                    className={errors.totalPrice ? 'border-red-500' : ''}
                    placeholder="0.00"
                  />
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Prefijado del servicio. Modifica solo si hay cambio acordado.
                  </p>
                </div>
              </div>

              {/* Ubicación en mapa (lat/lng opcionales) */}
              <div className="rounded-md border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800/60">
                <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Ubicacion en mapa</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Se calcula automaticamente con direccion y localidad.
                    </p>
                  </div>
                  <Boton
                    type="button"
                    variant="outline"
                    onClick={() => geocodeAddress(true)}
                    disabled={isGeocoding || !formData.address || !formData.city}
                    className="w-full sm:w-auto"
                  >
                    <MapPin className="h-4 w-4" />
                    {isGeocoding ? 'Ubicando...' : 'Ubicar'}
                  </Boton>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <Etiqueta htmlFor="latitude-advanced">Latitud</Etiqueta>
                    <Entrada
                      id="latitude-advanced"
                      type="number"
                      step="0.000001"
                      forceColorScheme="dark"
                      value={formData.coordinates.lat}
                      onChange={(e) =>
                        handleInputChange('coordinates', {
                          ...formData.coordinates,
                          lat: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="4.711000"
                    />
                  </div>
                  <div>
                    <Etiqueta htmlFor="longitude-advanced">Longitud</Etiqueta>
                    <Entrada
                      id="longitude-advanced"
                      type="number"
                      step="0.000001"
                      forceColorScheme="dark"
                      value={formData.coordinates.lng}
                      onChange={(e) =>
                        handleInputChange('coordinates', {
                          ...formData.coordinates,
                          lng: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="-74.072100"
                    />
                  </div>
                </div>
                {(geocodeStatus || formData.coordinates.lat !== 0 || formData.coordinates.lng !== 0) && (
                  <p className="mt-2 font-mono text-xs text-slate-600 dark:text-slate-300">
                    {formData.coordinates.lat.toFixed(6)}, {formData.coordinates.lng.toFixed(6)}
                  </p>
                )}
              </div>

              {/* Notas / Diagnóstico / Prescripción — solo doctor y modo edición */}
              {(appointment || !isAgent) && (
                <>
                  <div>
                    <Etiqueta htmlFor="notes">Notas operativas</Etiqueta>
                    <textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      className="min-h-20 w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100"
                      rows={2}
                      placeholder="Contexto adicional para el equipo..."
                    />
                  </div>
                  <div>
                    <Etiqueta htmlFor="diagnosis">Diagnostico medico</Etiqueta>
                    <textarea
                      id="diagnosis"
                      value={formData.diagnosis}
                      onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                      className="min-h-20 w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100"
                      rows={2}
                      placeholder="Diagnostico..."
                    />
                  </div>
                  <div>
                    <Etiqueta htmlFor="prescription">Prescripcion</Etiqueta>
                    <textarea
                      id="prescription"
                      value={formData.prescription}
                      onChange={(e) => handleInputChange('prescription', e.target.value)}
                      className="min-h-20 w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100"
                      rows={2}
                      placeholder="Medicamentos y tratamientos..."
                    />
                  </div>
                </>
              )}
            </div>
          </details>

          {/* Botones */}
          <div className="sticky bottom-0 z-10 flex flex-col-reverse gap-3 border-t border-gray-200 bg-white/95 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:flex-row sm:justify-end sm:p-6 sm:shadow-none">
            <Boton type="button" variant="outline" onClick={handleClose} className="w-full sm:w-auto">
              Cancelar
            </Boton>
            <Boton type="submit" disabled={appointmentMutation.isPending} className="w-full sm:w-auto">
              {appointmentMutation.isPending ? 'Guardando...' : (appointment ? 'Actualizar' : 'Crear')}
            </Boton>
          </div>
        </form>
      </div>
    </div>
  );
}
