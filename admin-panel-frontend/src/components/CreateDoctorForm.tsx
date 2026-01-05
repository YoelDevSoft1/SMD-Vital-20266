import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

  const [errors, setErrors] = useState<Partial<CreateDoctorData>>({});

  // Create doctor mutation
  const createDoctorMutation = useMutation({
    mutationFn: async (doctorData: CreateDoctorData) => {
      console.log('Creating doctor with data:', doctorData);
      const response = await fetch('/api/v1/admin-panel/doctors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(doctorData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear doctor');
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
    const newErrors: Partial<CreateDoctorData> = {};

    if (!formData.email) newErrors.email = 'El email es requerido';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.password) newErrors.password = 'La contraseña es requerida';
    else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.firstName) newErrors.firstName = 'El nombre es requerido';
    if (!formData.lastName) newErrors.lastName = 'El apellido es requerido';
    if (!formData.licenseNumber) newErrors.licenseNumber = 'El número de licencia es requerido';
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
          <Label htmlFor="firstName">Nombre *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            placeholder="Nombre"
            error={errors.firstName}
          />
        </div>
        <div>
          <Label htmlFor="lastName">Apellido *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            placeholder="Apellido"
            error={errors.lastName}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="doctor@ejemplo.com"
          error={errors.email}
        />
      </div>

      <div>
        <Label htmlFor="password">Contraseña *</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => handleChange('password', e.target.value)}
          placeholder="Mínimo 6 caracteres"
          error={errors.password}
        />
      </div>

      <div>
        <Label htmlFor="phone">Teléfono</Label>
        <Input
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
          <Label htmlFor="licenseNumber">Número de Licencia *</Label>
          <Input
            id="licenseNumber"
            value={formData.licenseNumber}
            onChange={(e) => handleChange('licenseNumber', e.target.value)}
            placeholder="Ej: 12345-COL"
            error={errors.licenseNumber}
          />
        </div>
        <div>
          <Label htmlFor="specialty">Especialidad *</Label>
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
          <Label htmlFor="experience">Años de Experiencia *</Label>
          <Input
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
          <Label htmlFor="consultationFee">Tarifa de Consulta *</Label>
          <Input
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
        <Label htmlFor="bio">Biografía</Label>
        <textarea
          id="bio"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          value={formData.bio}
          onChange={(e) => handleChange('bio', e.target.value)}
          placeholder="Breve descripción profesional..."
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
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={createDoctorMutation.isPending}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={createDoctorMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {createDoctorMutation.isPending ? 'Creando...' : 'Crear Doctor'}
        </Button>
      </div>
    </form>
  );
}
