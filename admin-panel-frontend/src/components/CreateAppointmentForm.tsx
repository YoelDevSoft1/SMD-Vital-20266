import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { localInputToColombiaISO, utcToColombiaInputValue } from '@/utils/dateFormat';
import { X, Calendar, Clock, User, Stethoscope, MapPin, DollarSign, FileText, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/Switch';
import { toast } from 'react-hot-toast';
import { adminService } from '@/services/admin.service';
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

interface NewPatientData {
  firstName: string;
  lastName: string;
  documentId: string;
  phone: string;
}

export default function CreateAppointmentForm({ isOpen, onClose, appointment }: CreateAppointmentFormProps) {
  const queryClient = useQueryClient();
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
    queryFn: () => adminService.getDoctors({ page: 1, limit: 100 })
  });

  const { data: patientsData } = useQuery({
    queryKey: ['patients-for-appointment'],
    queryFn: () => adminService.getPatients({ page: 1, limit: 100 })
  });

  const { data: servicesData } = useQuery({
    queryKey: ['services-for-appointment'],
    queryFn: () => adminService.getServices({ page: 1, limit: 100 })
  });

  const { data: availabilityData, isFetching: isFetchingAvailability } = useQuery({
    queryKey: ['doctor-daily-availability', formData.doctorId, selectedDate, formData.duration],
    queryFn: () => adminService.getDoctorDailyAvailability(
      formData.doctorId,
      selectedDate,
      formData.duration
    ),
    enabled: Boolean(formData.doctorId && selectedDate),
    staleTime: 15_000,
  });

  const availability = availabilityData?.data?.data;
  const availableSlots = availability?.slots ?? [];
  const selectedService = useMemo(() => {
    return (servicesData?.data?.data?.data as Service[] | undefined)?.find(
      (service) => service.id === formData.serviceId
    );
  }, [formData.serviceId, servicesData]);

  const quickPatientMutation = useMutation({
    mutationFn: (data: NewPatientData) => adminService.createQuickPatient(data),
  });

  // Create/Update mutation
  const appointmentMutation = useMutation({
    mutationFn: (data: any) => {
      if (appointment) {
        return adminService.updateAppointment(appointment.id, data);
      } else {
        return adminService.createAppointment(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success(appointment ? 'Cita actualizada' : 'Cita creada');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al procesar la cita');
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
    const service = (servicesData?.data?.data?.data as Service[] | undefined)?.find(
      (item) => item.id === serviceId
    );

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
      } catch {
        toast.error('Error creando el paciente');
        return;
      }
    }

    const hasCoordinates = formData.coordinates.lat !== 0 || formData.coordinates.lng !== 0;
    appointmentMutation.mutate({
      ...formData,
      patientId,
      scheduledAt: localInputToColombiaISO(formData.scheduledAt),
      coordinates: hasCoordinates ? formData.coordinates : null,
    });
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
      <div className="relative z-[1201] flex h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-xl sm:h-auto sm:max-h-[92vh] sm:max-w-4xl sm:rounded-lg">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-4 sm:p-6">
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
            {appointment ? 'Editar Cita' : 'Nueva Cita'}
          </h2>
          <Button variant="ghost" onClick={handleClose} className="h-10 w-10 p-0">
            <X className="w-6 h-6" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:space-y-6 sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
            {/* Paciente */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <Label className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Paciente *</span>
                </Label>
                <button
                  type="button"
                  onClick={() => {
                    setIsNewPatient(!isNewPatient);
                    setNewPatientErrors({});
                  }}
                  className={`flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    isNewPatient
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {isNewPatient ? 'Cancelar nuevo' : 'Nuevo paciente'}
                </button>
              </div>

              {isNewPatient ? (
                <div className="grid grid-cols-1 gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 sm:grid-cols-2 sm:p-4">
                  <div>
                    <Label htmlFor="np-firstName" className="text-xs">Nombre *</Label>
                    <Input
                      id="np-firstName"
                      value={newPatientData.firstName}
                      onChange={(e) => setNewPatientData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Nombre"
                      className={newPatientErrors.firstName ? 'border-red-500' : ''}
                    />
                    {newPatientErrors.firstName && <p className="text-red-500 text-xs mt-0.5">{newPatientErrors.firstName}</p>}
                  </div>
                  <div>
                    <Label htmlFor="np-lastName" className="text-xs">Apellido *</Label>
                    <Input
                      id="np-lastName"
                      value={newPatientData.lastName}
                      onChange={(e) => setNewPatientData(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Apellido"
                      className={newPatientErrors.lastName ? 'border-red-500' : ''}
                    />
                    {newPatientErrors.lastName && <p className="text-red-500 text-xs mt-0.5">{newPatientErrors.lastName}</p>}
                  </div>
                  <div>
                    <Label htmlFor="np-documentId" className="text-xs">Cédula *</Label>
                    <Input
                      id="np-documentId"
                      value={newPatientData.documentId}
                      onChange={(e) => setNewPatientData(prev => ({ ...prev, documentId: e.target.value }))}
                      placeholder="Número de cédula"
                      className={newPatientErrors.documentId ? 'border-red-500' : ''}
                    />
                    {newPatientErrors.documentId && <p className="text-red-500 text-xs mt-0.5">{newPatientErrors.documentId}</p>}
                  </div>
                  <div>
                    <Label htmlFor="np-phone" className="text-xs">Teléfono *</Label>
                    <Input
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
                    onChange={(e) => handleInputChange('patientId', e.target.value)}
                    className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.patientId ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Selecciona un paciente</option>
                    {(patientsData?.data?.data?.data as Patient[])?.map((patient: Patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient?.user?.firstName} {patient?.user?.lastName} - {patient?.user?.phone || patient?.user?.email}
                      </option>
                    )) || []}
                  </select>
                  {errors.patientId && <p className="text-red-500 text-sm mt-1">{errors.patientId}</p>}
                </>
              )}
            </div>

            {/* Doctor */}
            <div>
              <Label htmlFor="doctorId" className="flex items-center space-x-2">
                <Stethoscope className="w-4 h-4" />
                <span>Doctor *</span>
              </Label>
              <select
                id="doctorId"
                value={formData.doctorId}
                onChange={(e) => handleInputChange('doctorId', e.target.value)}
                className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.doctorId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Selecciona un doctor</option>
                {(doctorsData?.data?.data?.data as Doctor[])?.map((doctor: Doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor?.user?.firstName} {doctor?.user?.lastName} - {doctor?.specialty}
                  </option>
                )) || []}
              </select>
              {errors.doctorId && <p className="text-red-500 text-sm mt-1">{errors.doctorId}</p>}
            </div>

            {/* Servicio */}
            <div>
              <Label htmlFor="serviceId" className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Servicio *</span>
              </Label>
              <select
                id="serviceId"
                value={formData.serviceId}
                onChange={(e) => handleServiceChange(e.target.value)}
                className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.serviceId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Selecciona un servicio</option>
                {(servicesData?.data?.data?.data as Service[])?.map((service: Service) => (
                  <option key={service.id} value={service.id}>
                    {service?.name} - {service?.description}
                  </option>
                )) || []}
              </select>
              {errors.serviceId && <p className="text-red-500 text-sm mt-1">{errors.serviceId}</p>}
              {selectedService && (
                <p className="mt-1 text-xs text-gray-500">
                  Duracion sugerida: {selectedService.duration} min - Precio base: ${selectedService.basePrice}
                </p>
              )}
            </div>

            {/* Fecha */}
            <div>
              <Label htmlFor="appointmentDate" className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Fecha *</span>
              </Label>
              <Input
                id="appointmentDate"
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className={errors.scheduledAt ? 'border-red-500' : ''}
              />
              {errors.scheduledAt && <p className="text-red-500 text-sm mt-1">{errors.scheduledAt}</p>}
            </div>

            {/* Duración */}
            <div>
              <Label htmlFor="duration" className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Duración</span>
              </Label>
              <select
                id="duration"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {durationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Precio */}
            <div>
              <Label htmlFor="totalPrice" className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4" />
                <span>Precio Total *</span>
              </Label>
              <Input
                id="totalPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.totalPrice}
                onChange={(e) => handleInputChange('totalPrice', parseFloat(e.target.value) || 0)}
                className={errors.totalPrice ? 'border-red-500' : ''}
                placeholder="0.00"
              />
              {errors.totalPrice && <p className="text-red-500 text-sm mt-1">{errors.totalPrice}</p>}
            </div>

            {/* Dirección */}
            <div>
              <Label htmlFor="address" className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>Dirección *</span>
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className={errors.address ? 'border-red-500' : ''}
                placeholder="Calle 123 #45-67"
              />
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
            </div>

            {/* Localidad */}
            <div>
              <Label htmlFor="city">Localidad *</Label>
              <Input
                id="city"
                list="bogota-localities"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className={errors.city ? 'border-red-500' : ''}
                placeholder="Chapinero, Suba, Kennedy..."
              />
              <datalist id="bogota-localities">
                {bogotaLocalities.map((locality) => (
                  <option key={locality} value={locality} />
                ))}
              </datalist>
              {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
            </div>

            <div>
              <Label htmlFor="latitude">Latitud para mapa</Label>
              <Input
                id="latitude"
                type="number"
                step="0.000001"
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
              <Label htmlFor="longitude">Longitud para mapa</Label>
              <Input
                id="longitude"
                type="number"
                step="0.000001"
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

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Ubicacion en mapa</h3>
                <p className="text-xs text-gray-600">
                  Se calcula automaticamente con direccion y localidad. Puedes reintentar si corriges la direccion.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => geocodeAddress(true)}
                disabled={isGeocoding || !formData.address || !formData.city}
                className="w-full sm:w-auto"
              >
                <MapPin className="h-4 w-4" />
                {isGeocoding ? 'Ubicando...' : 'Ubicar'}
              </Button>
            </div>
            {(geocodeStatus || formData.coordinates.lat !== 0 || formData.coordinates.lng !== 0) && (
              <div className="mt-3 text-xs text-gray-700">
                <p>{geocodeStatus || 'Coordenadas listas.'}</p>
                <p className="mt-1 font-medium">
                  {formData.coordinates.lat.toFixed(6)}, {formData.coordinates.lng.toFixed(6)}
                </p>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3 sm:p-4">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Horas disponibles del medico</h3>
                <p className="text-xs text-gray-600">
                  Selecciona medico, servicio y fecha para reservar un horario disponible.
                </p>
              </div>
              {isFetchingAvailability && <span className="text-xs text-blue-700">Cargando...</span>}
            </div>

            {availability?.availability?.length ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {availability.availability.map((block) => (
                  <span
                    key={block.id}
                    className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-medium text-blue-800"
                  >
                    {block.startTime} - {block.endTime}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mb-3 text-xs text-amber-700">
                {formData.doctorId && selectedDate
                  ? 'Este medico aun no registro disponibilidad para este dia.'
                  : 'Pendiente seleccionar medico y fecha.'}
              </p>
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
                          ? 'border-gray-200 bg-white text-gray-800 hover:border-blue-400 hover:text-blue-700'
                          : 'border-gray-100 bg-gray-100 text-gray-400'
                    }`}
                    title={slot.reason}
                  >
                    {slot.startTime}
                  </button>
                );
              })}
            </div>

            {formData.scheduledAt && (
              <p className="mt-3 text-xs font-medium text-gray-700">
                Hora seleccionada: {formData.scheduledAt.replace('T', ' ')}
              </p>
            )}
          </div>

          {/* Notas */}
          <div>
            <Label htmlFor="notes">Notas</Label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="min-h-24 w-full rounded-md border border-gray-300 p-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Notas adicionales sobre la cita..."
            />
          </div>

          {/* Diagnóstico */}
          <div>
            <Label htmlFor="diagnosis">Diagnóstico</Label>
            <textarea
              id="diagnosis"
              value={formData.diagnosis}
              onChange={(e) => handleInputChange('diagnosis', e.target.value)}
              className="min-h-24 w-full rounded-md border border-gray-300 p-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Diagnóstico médico..."
            />
          </div>

          {/* Prescripción */}
          <div>
            <Label htmlFor="prescription">Prescripción</Label>
            <textarea
              id="prescription"
              value={formData.prescription}
              onChange={(e) => handleInputChange('prescription', e.target.value)}
              className="min-h-24 w-full rounded-md border border-gray-300 p-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Medicamentos y tratamientos prescritos..."
            />
          </div>

          {/* Urgente */}
          <div className="flex items-center space-x-2">
            <Switch
              id="isUrgent"
              checked={formData.isUrgent}
              onCheckedChange={(checked) => handleInputChange('isUrgent', checked)}
            />
            <Label htmlFor="isUrgent">Cita urgente</Label>
          </div>

          </div>

          {/* Botones */}
          <div className="sticky bottom-0 z-10 flex flex-col-reverse gap-3 border-t bg-white/95 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur sm:flex-row sm:justify-end sm:p-6 sm:shadow-none">
            <Button type="button" variant="outline" onClick={handleClose} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button type="submit" disabled={appointmentMutation.isPending} className="w-full sm:w-auto">
              {appointmentMutation.isPending ? 'Guardando...' : (appointment ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
