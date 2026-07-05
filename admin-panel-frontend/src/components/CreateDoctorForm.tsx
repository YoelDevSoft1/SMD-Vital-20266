import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Boton } from '@/components/ui/Boton';
import { Entrada } from '@/components/ui/Entrada';
import { Etiqueta } from '@/components/ui/Etiqueta';
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

    if (!formData.email) newErrors.email = 'El email es required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.password) newErrors.password = 'La contraseña es requerida';
    else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.firstName) newErrors.firstName = 'El firstName es required';
    if (!formData.lastName) newErrors.lastName = 'El lastName es required';
    if (!formData.licenseNumber) newErrors.licenseNumber = 'El número de licencia es required';
    if (!formData.specialty) newErrors.specialty = 'La especialidad es requerida';
    if (formData.experience < 0) newErrors.experience = 'La experiencia debe ser mayor a 0';
    if (formData.consultationFee < 0) newErrors.consultationFee = 'La tarifa debe ser mayor a 0';

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
          placeholder="Mínimo 6 caracteres"
          error={errors.password}
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
          <Etiqueta htmlFor="specialty">Especialidad *</Etiqueta>
          <select
            id="specialty"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.specialty}
            onChange={(e) => handleChange('specialty', e.target.value)}
          >
            {specialties.map(specialty => (
              <option key={specialty} value={specialty}>
                {specialty}
              </option>
            ))}
          </select>
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          value={formData.bio}
          onChange={(e) => handleChange('bio', e.target.value)}
          placeholder="Breve description profesional..."
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isAvailable"
          checked={formData.isAvailable}
          onChange={(e) => handleChange('isAvailable', e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="isAvailable" className="ml-2 block text-sm text-gray-900">
          Doctor disponible para citas
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
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
          disabled={createDoctorMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {createDoctorMutation.isPending ? 'Creando...' : 'Crear Doctor'}
        </Boton>
      </div>
    </form>
  );
}
