import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Calendar, Clock, User, Stethoscope, MapPin, DollarSign, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'react-hot-toast';
import { adminService } from '@/services/admin.service';
import type { Doctor, Patient, Service } from '@/types';

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

export default function CreateAppointmentForm({ isOpen, onClose, appointment }: CreateAppointmentFormProps) {
  const queryClient = useQueryClient();
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

  // Create/Update mutation
  const appointmentMutation = useMutation({
    mutationFn: (data: AppointmentFormData) => {
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
    // Debug logging
    console.log('=== CREATE APPOINTMENT FORM DEBUG ===');
    console.log('Is editing:', !!appointment);
    console.log('Appointment data:', appointment);
    console.log('Has doctorsData:', !!doctorsData);
    console.log('Has patientsData:', !!patientsData);
    console.log('Has servicesData:', !!servicesData);
    console.log('Doctors data structure:', doctorsData ? Object.keys(doctorsData) : []);
    console.log('Patients data structure:', patientsData ? Object.keys(patientsData) : []);
    console.log('Services data structure:', servicesData ? Object.keys(servicesData) : []);
    console.log('========================');

    if (appointment) {
      setFormData({
        patientId: appointment.patientId || '',
        doctorId: appointment.doctorId || '',
        serviceId: appointment.serviceId || '',
        scheduledAt: appointment.scheduledAt ? new Date(appointment.scheduledAt).toISOString().slice(0, 16) : '',
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.patientId) newErrors.patientId = 'Selecciona un paciente';
    if (!formData.doctorId) newErrors.doctorId = 'Selecciona un doctor';
    if (!formData.serviceId) newErrors.serviceId = 'Selecciona un servicio';
    if (!formData.scheduledAt) newErrors.scheduledAt = 'Selecciona una fecha y hora';
    if (!formData.address) newErrors.address = 'Ingresa la dirección';
    if (!formData.city) newErrors.city = 'Ingresa la ciudad';
    if (formData.totalPrice <= 0) newErrors.totalPrice = 'El precio debe ser mayor a 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      appointmentMutation.mutate(formData);
    }
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
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {appointment ? 'Editar Cita' : 'Nueva Cita'}
          </h2>
          <Button variant="ghost" onClick={handleClose}>
            <X className="w-6 h-6" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Paciente */}
            <div>
              <Label htmlFor="patientId" className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Paciente *</span>
              </Label>
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
                    {patient?.user?.firstName} {patient?.user?.lastName} - {patient?.user?.email}
                  </option>
                )) || []}
              </select>
              {errors.patientId && <p className="text-red-500 text-sm mt-1">{errors.patientId}</p>}
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
                onChange={(e) => handleInputChange('serviceId', e.target.value)}
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
            </div>

            {/* Fecha y Hora */}
            <div>
              <Label htmlFor="scheduledAt" className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Fecha y Hora *</span>
              </Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => handleInputChange('scheduledAt', e.target.value)}
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

            {/* Ciudad */}
            <div>
              <Label htmlFor="city">Ciudad *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className={errors.city ? 'border-red-500' : ''}
                placeholder="Bogotá"
              />
              {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
            </div>
          </div>

          {/* Notas */}
          <div>
            <Label htmlFor="notes">Notas</Label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

          {/* Botones */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={appointmentMutation.isPending}>
              {appointmentMutation.isPending ? 'Guardando...' : (appointment ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
