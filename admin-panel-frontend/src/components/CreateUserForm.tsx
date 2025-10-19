import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UserRole } from '@/types';
import toast from 'react-hot-toast';

interface CreateUserFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
}

export default function CreateUserForm({ onSuccess, onCancel }: CreateUserFormProps) {
  const [formData, setFormData] = useState<CreateUserData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'PATIENT',
    isActive: true,
    isVerified: false,
  });

  const [errors, setErrors] = useState<Partial<CreateUserData>>({});

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserData) => {
      console.log('Creating user with data:', userData);
      const response = await fetch('/api/v1/admin-panel/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(userData),
      });

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || 'Error al crear usuario');
      }

      return responseData;
    },
    onSuccess: (data) => {
      console.log('User created successfully:', data);
      toast.success('Usuario creado exitosamente');
      onSuccess();
    },
    onError: (error: any) => {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Error al crear usuario');
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateUserData> = {};

    if (!formData.email) newErrors.email = 'El email es requerido';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'El email no es válido';

    if (!formData.password) newErrors.password = 'La contraseña es requerida';
    else if (formData.password.length < 6) newErrors.password = 'La contraseña debe tener al menos 6 caracteres';

    if (!formData.firstName) newErrors.firstName = 'El nombre es requerido';
    if (!formData.lastName) newErrors.lastName = 'El apellido es requerido';

    if (formData.phone && !/^\+?[1-9]\d{1,14}$/.test(formData.phone)) {
      newErrors.phone = 'El teléfono no es válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      createUserMutation.mutate(formData);
    }
  };

  const handleChange = (field: keyof CreateUserData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre *
          </label>
          <Input
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            placeholder="Nombre"
            error={errors.firstName}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Apellido *
          </label>
          <Input
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            placeholder="Apellido"
            error={errors.lastName}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email *
        </label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="usuario@ejemplo.com"
          error={errors.email}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Contraseña *
        </label>
        <Input
          type="password"
          value={formData.password}
          onChange={(e) => handleChange('password', e.target.value)}
          placeholder="Mínimo 6 caracteres"
          error={errors.password}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Teléfono
        </label>
        <Input
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          placeholder="+573001234567"
          error={errors.phone}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Rol *
        </label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.role}
          onChange={(e) => handleChange('role', e.target.value as UserRole)}
        >
          <option value="PATIENT">Paciente</option>
          <option value="DOCTOR">Médico</option>
          <option value="NURSE">Enfermero/a</option>
          <option value="ADMIN">Administrador</option>
          <option value="SUPER_ADMIN">Super Administrador</option>
        </select>
      </div>

      <div className="flex space-x-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => handleChange('isActive', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
            Usuario activo
          </label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isVerified"
            checked={formData.isVerified}
            onChange={(e) => handleChange('isVerified', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isVerified" className="ml-2 block text-sm text-gray-900">
            Usuario verificado
          </label>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={createUserMutation.isPending}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={createUserMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {createUserMutation.isPending ? 'Creando...' : 'Crear Usuario'}
        </Button>
      </div>
    </form>
  );
}
