import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Boton } from '@/components/ui/Boton';
import { Entrada } from '@/components/ui/Entrada';
import { Etiqueta } from '@/components/ui/Etiqueta';
import { PickerSelect, type PickerSelectOption } from '@/components/ui/PickerSelect';
import { adminService } from '@/services/admin.service';
import toast from 'react-hot-toast';

interface CreateDoctorFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface CreateDoctorData {
  // User data
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  
  // Doctor specific data
  licenseNumber: string;
  specialty: string;
  experience: number;
  consultationFee: number;
  bio?: string;
  isAvailable: boolean;
}

const specialties = [
  'Medicina General',
  'Cardiología',
  'Dermatología',
  'Endocrinología',
  'Gastroenterología',
  'Ginecología',
  'Neurología',
  'Oftalmología',
  'Ortopedia',
  'Pediatría',
  'Psiquiatría',
  'Radiología',
  'Urología',
  'Anestesiología',
  'Cirugía General',
  'Medicina Interna',
  'Oncología',
  'Reumatología',
  'Neumología',
  'Hematología'
];

const OPCIONES_ESPECIALIDAD: PickerSelectOption[] = specialties.map((s) => ({
  value: s,
  label: s,
}));

export default function CreateDoctorForm({ onSuccess, onCancel }: CreateDoctorFormProps) {
  const [formData, setFormData] = useState<CreateDoctorData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    licenseNumber: '',
    specialty: 'Medicina General',
    experience: 1,
    consultationFee: 50000,
    bio: '',
    isAvailable: true,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CreateDoctorData, string>>>({});

  // Create doctor mutation
  const createDoctorMutation = useMutation({
    mutationFn: async (doctorData: CreateDoctorData) => {
      const response = await fetch('/api/v1/admin-panel/doctors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(doctorData),
      });

      if (!response.ok) {
        let errorMessage = 'Error al crear doctor';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Si no es JSON, usar el status text
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Doctor creado exitosamente');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear doctor');
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateDoctorData, string>> = {};

    if (!formData.email) newErrors.email = 'El correo electrónico es requerido';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El correo electrónico no es válido';
    }

    if (!formData.password) newErrors.password = 'La contraseña es requerida';
    else if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    if (!formData.firstName?.trim()) newErrors.firstName = 'El nombre es requerido';
    if (!formData.lastName?.trim()) newErrors.lastName = 'El apellido es requerido';
    if (!formData.licenseNumber?.trim()) newErrors.licenseNumber = 'El número de licencia es requerido';
    if (!formData.specialty) newErrors.specialty = 'La especialidad es requerida';
    if (formData.experience < 0) newErrors.experience = 'La experiencia debe ser mayor o igual a 0';
    if (formData.consultationFee < 0) newErrors.consultationFee = 'La tarifa debe ser mayor o igual a 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    createDoctorMutation.mutate(formData);
  };

  const handleChange = (field: keyof CreateDoctorData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Etiqueta htmlFor="firstName">Nombre *</Etiqueta>
          <Entrada
            id="firstName"
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            placeholder="Nombre"
            error={errors.firstName}
          />
        </div>
        <div>
          <Etiqueta htmlFor="lastName">Apellido *</Etiqueta>
          <Entrada
            id="lastName"
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            placeholder="Apellido"
            error={errors.lastName}
          />
        </div>
      </div>

      <div>
        <Etiqueta htmlFor="email">Email *</Etiqueta>
        <Entrada
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="doctor@ejemplo.com"
          error={errors.email}
        />
      </div>

      <div>
        <Etiqueta htmlFor="password">Contraseña *</Etiqueta>
        <Entrada
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => handleChange('password', e.target.value)}
          placeholder="Mínimo 8 caracteres"
          error={errors.password}
          autoComplete="new-password"
        />
      </div>

      <div>
        <Etiqueta htmlFor="phone">Teléfono</Etiqueta>
        <Entrada
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          placeholder="+573001234567"
          error={errors.phone}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Etiqueta htmlFor="licenseNumber">Número de Licencia *</Etiqueta>
          <Entrada
            id="licenseNumber"
            value={formData.licenseNumber}
            onChange={(e) => handleChange('licenseNumber', e.target.value)}
            placeholder="Ej: 12345-COL"
            error={errors.licenseNumber}
          />
        </div>
        <div>
          <PickerSelect
            id="specialty"
            label="Especialidad"
            required
            value={formData.specialty}
            onChange={(value) => handleChange('specialty', value)}
            options={OPCIONES_ESPECIALIDAD}
            placeholder="Seleccionar especialidad..."
            error={errors.specialty}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Etiqueta htmlFor="experience">Años de Experiencia *</Etiqueta>
          <Entrada
            id="experience"
            type="number"
            min="0"
            value={formData.experience}
            onChange={(e) => handleChange('experience', parseInt(e.target.value) || 0)}
            placeholder="Años de experiencia"
            error={errors.experience}
          />
        </div>
        <div>
          <Etiqueta htmlFor="consultationFee">Tarifa de Consulta *</Etiqueta>
          <Entrada
            id="consultationFee"
            type="number"
            min="0"
            value={formData.consultationFee}
            onChange={(e) => handleChange('consultationFee', parseInt(e.target.value) || 0)}
            placeholder="Tarifa en pesos"
            error={errors.consultationFee}
          />
        </div>
      </div>

      <div>
        <Etiqueta htmlFor="bio">Biografía</Etiqueta>
        <textarea
          id="bio"
          rows={3}
          value={formData.bio}
          onChange={(e) => handleChange('bio', e.target.value)}
          placeholder="Breve descripción profesional..."
          className="w-full rounded-lg border border-input bg-card px-3 py-2 text-base text-foreground shadow-soft-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:bg-card dark:text-foreground sm:text-sm"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isAvailable"
          checked={formData.isAvailable}
          onChange={(e) => handleChange('isAvailable', e.target.checked)}
          className="h-4 w-4 rounded border-input text-brand-600 focus:ring-2 focus:ring-ring"
        />
        <label htmlFor="isAvailable" className="ml-2 block text-sm text-foreground">
          Doctor disponible para citas
        </label>
      </div>

      <div className="flex flex-col-reverse items-stretch gap-2 border-t border-border pt-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end">
        <Boton
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={createDoctorMutation.isPending}
        >
          Cancelar
        </Boton>
        <Boton
          type="submit"
          isLoading={createDoctorMutation.isPending}
        >
          {createDoctorMutation.isPending ? 'Creando...' : 'Crear doctor'}
        </Boton>
      </div>
    </form>
  );
}
