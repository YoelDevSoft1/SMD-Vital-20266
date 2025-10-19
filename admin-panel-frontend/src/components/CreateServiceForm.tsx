import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Stethoscope, DollarSign, Clock, FileText, Save } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/label';
import { Select } from './ui/select';
import { Switch } from './ui/switch';
import { toast } from 'react-hot-toast';
import { adminService } from '@/services/admin.service';
import type { Service, ServiceCategory } from '@/types';

interface CreateServiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  service?: Service;
}

export default function CreateServiceForm({ isOpen, onClose, service }: CreateServiceFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!service;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'CONSULTATION' as ServiceCategory,
    basePrice: 0,
    duration: 30,
    isActive: true,
    requirements: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Initialize form data when editing
  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        description: service.description,
        category: service.category,
        basePrice: service.basePrice,
        duration: service.duration,
        isActive: service.isActive,
        requirements: service.requirements || ''
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category: 'CONSULTATION',
        basePrice: 0,
        duration: 30,
        isActive: true,
        requirements: ''
      });
    }
    setErrors({});
  }, [service, isOpen]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del servicio es requerido';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    if (formData.basePrice <= 0) {
      newErrors.basePrice = 'El precio debe ser mayor a 0';
    }

    if (formData.duration <= 0) {
      newErrors.duration = 'La duración debe ser mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => adminService.createService(data),
    onSuccess: () => {
      toast.success('Servicio creado correctamente');
      queryClient.invalidateQueries({ queryKey: ['services'] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(`Error al crear servicio: ${err.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => adminService.updateService(service!.id, data),
    onSuccess: () => {
      toast.success('Servicio actualizado correctamente');
      queryClient.invalidateQueries({ queryKey: ['services'] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(`Error al actualizar servicio: ${err.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = {
      ...formData,
      basePrice: Number(formData.basePrice),
      duration: Number(formData.duration)
    };

    if (isEditing) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getCategoryOptions = () => [
    { value: 'CONSULTATION', label: 'Consulta' },
    { value: 'EMERGENCY', label: 'Emergencia' },
    { value: 'LABORATORY', label: 'Laboratorio' },
    { value: 'NURSING', label: 'Enfermería' },
    { value: 'SPECIALIST', label: 'Especialista' },
    { value: 'THERAPY', label: 'Terapia' },
    { value: 'VACCINATION', label: 'Vacunación' },
    { value: 'OTHER', label: 'Otro' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
              <Stethoscope className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {isEditing ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isEditing ? 'Modifica los datos del servicio' : 'Completa la información del nuevo servicio'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="name">Nombre del Servicio *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={errors.name ? 'border-red-500' : ''}
                  placeholder="Ej: Consulta médica general"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Descripción *</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  rows={3}
                  placeholder="Describe el servicio médico..."
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>

              <div>
                <Label htmlFor="category">Categoría *</Label>
                <Select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value as ServiceCategory)}
                >
                  {getCategoryOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="requirements">Requisitos</Label>
                <Input
                  id="requirements"
                  type="text"
                  value={formData.requirements}
                  onChange={(e) => handleInputChange('requirements', e.target.value)}
                  placeholder="Ej: Ayuno de 8 horas"
                />
              </div>
            </div>
          </div>

          {/* Pricing and Duration */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Precios y Duración</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="basePrice">Precio Base (COP) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="basePrice"
                    type="number"
                    value={formData.basePrice}
                    onChange={(e) => handleInputChange('basePrice', e.target.value)}
                    className={`pl-10 ${errors.basePrice ? 'border-red-500' : ''}`}
                    placeholder="50000"
                    min="0"
                    step="1000"
                  />
                </div>
                {errors.basePrice && <p className="text-red-500 text-sm mt-1">{errors.basePrice}</p>}
              </div>

              <div>
                <Label htmlFor="duration">Duración (minutos) *</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                    className={`pl-10 ${errors.duration ? 'border-red-500' : ''}`}
                    placeholder="30"
                    min="1"
                    max="480"
                  />
                </div>
                {errors.duration && <p className="text-red-500 text-sm mt-1">{errors.duration}</p>}
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado</h3>
            <div className="flex items-center space-x-3">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange('isActive', checked)}
              />
              <div>
                <Label htmlFor="isActive" className="text-base">
                  Servicio Activo
                </Label>
                <p className="text-sm text-gray-500">
                  {formData.isActive 
                    ? 'El servicio está disponible para citas' 
                    : 'El servicio no está disponible temporalmente'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isEditing ? 'Actualizar Servicio' : 'Crear Servicio'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
