import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/label';
import { adminService } from '../services/admin.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Doctor } from '@/types';

interface EditDoctorFormProps {
  doctor: Doctor;
  onSuccess: () => void;
  onCancel: () => void;
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

export const EditDoctorForm: React.FC<EditDoctorFormProps> = ({ doctor, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    // User data
    email: doctor.user.email,
    firstName: doctor.user.firstName,
    lastName: doctor.user.lastName,
    phone: doctor.user.phone || '',
    isActive: doctor.user.isActive,
    isVerified: doctor.user.isVerified,
    
    // Doctor specific data
    licenseNumber: doctor.licenseNumber,
    specialty: doctor.specialty,
    experience: doctor.experience,
    consultationFee: doctor.consultationFee,
    bio: doctor.bio || '',
    isAvailable: doctor.isAvailable,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const updateDoctorMutation = useMutation({
    mutationFn: (data: any) => adminService.updateDoctor(doctor.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      toast.success('Doctor actualizado exitosamente');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar doctor');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateDoctorMutation.mutateAsync(formData);
    } catch (error) {
      console.error('Error updating doctor:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">Nombre *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Label htmlFor="lastName">Apellido *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Label htmlFor="email">Correo Electrónico *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Label htmlFor="licenseNumber">Número de Licencia *</Label>
          <Input
            id="licenseNumber"
            value={formData.licenseNumber}
            onChange={(e) => handleChange('licenseNumber', e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Label htmlFor="specialty">Especialidad *</Label>
          <select
            id="specialty"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.specialty}
            onChange={(e) => handleChange('specialty', e.target.value)}
            disabled={isSubmitting}
          >
            {specialties.map(specialty => (
              <option key={specialty} value={specialty}>
                {specialty}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="experience">Años de Experiencia *</Label>
          <Input
            id="experience"
            type="number"
            min="0"
            value={formData.experience}
            onChange={(e) => handleChange('experience', parseInt(e.target.value) || 0)}
            required
            disabled={isSubmitting}
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
            required
            disabled={isSubmitting}
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
          disabled={isSubmitting}
          placeholder="Breve descripción profesional..."
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="isActive">Usuario Activo</Label>
            <p className="text-sm text-gray-500">El doctor puede iniciar sesión</p>
          </div>
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => handleChange('isActive', e.target.checked)}
            disabled={isSubmitting}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="isVerified">Usuario Verificado</Label>
            <p className="text-sm text-gray-500">El doctor ha verificado su correo electrónico</p>
          </div>
          <input
            type="checkbox"
            id="isVerified"
            checked={formData.isVerified}
            onChange={(e) => handleChange('isVerified', e.target.checked)}
            disabled={isSubmitting}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="isAvailable">Disponible para Citas</Label>
            <p className="text-sm text-gray-500">El doctor puede recibir nuevas citas</p>
          </div>
          <input
            type="checkbox"
            id="isAvailable"
            checked={formData.isAvailable}
            onChange={(e) => handleChange('isAvailable', e.target.checked)}
            disabled={isSubmitting}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting ? 'Actualizando...' : 'Actualizar Doctor'}
        </Button>
      </div>
    </form>
  );
};
