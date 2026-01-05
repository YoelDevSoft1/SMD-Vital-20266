import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X, MessageSquare, Star, Save } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/Switch';
import { GlassModal } from './ui/GlassModal';
import { toast } from 'react-hot-toast';
import { adminService } from '@/services/admin.service';
import type { Review } from '@/types';

interface CreateReviewFormProps {
  isOpen: boolean;
  onClose: () => void;
  review?: Review;
}

export default function CreateReviewForm({ isOpen, onClose, review }: CreateReviewFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!review;

  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    appointmentId: '',
    rating: 5,
    comment: '',
    isVerified: false
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Fetch patients and doctors for dropdowns
  const { data: patientsData } = useQuery({
    queryKey: ['patients-for-review'],
    queryFn: () => adminService.getPatients({ page: 1, limit: 100 }),
    enabled: isOpen
  });

  const { data: doctorsData } = useQuery({
    queryKey: ['doctors-for-review'],
    queryFn: () => adminService.getDoctors({ page: 1, limit: 100 }),
    enabled: isOpen
  });

  // Initialize form data when editing
  useEffect(() => {
    if (review) {
      setFormData({
        patientId: review.patientId || '',
        doctorId: review.doctorId || '',
        appointmentId: review.appointmentId || '',
        rating: review.rating || 5,
        comment: review.comment || '',
        isVerified: review.isVerified || false
      });
    } else {
      setFormData({
        patientId: '',
        doctorId: '',
        appointmentId: '',
        rating: 5,
        comment: '',
        isVerified: false
      });
    }
    setErrors({});
  }, [review, isOpen]);

  // Debug logging
  console.log('=== CREATE REVIEW FORM DEBUG ===');
  console.log('Is editing:', isEditing);
  console.log('Review:', review);
  console.log('Has patientsData:', !!patientsData);
  console.log('Patients data structure:', patientsData ? Object.keys(patientsData) : []);
  console.log('Data structure:', patientsData?.data ? Object.keys(patientsData.data) : []);
  console.log('Data.data structure:', patientsData?.data?.data ? Object.keys(patientsData.data.data) : []);
  console.log('Patients array length:', patientsData?.data?.data?.data?.length || 0);
  console.log('Has doctorsData:', !!doctorsData);
  console.log('Doctors data structure:', doctorsData ? Object.keys(doctorsData) : []);
  console.log('Doctors array length:', doctorsData?.data?.data?.data?.length || 0);
  console.log('Form data:', formData);
  console.log('========================');

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.patientId) {
      newErrors.patientId = 'El paciente es requerido';
    }

    if (!formData.doctorId) {
      newErrors.doctorId = 'El doctor es requerido';
    }

    if (formData.rating < 1 || formData.rating > 5) {
      newErrors.rating = 'La calificación debe estar entre 1 y 5';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => adminService.createReview(data),
    onSuccess: () => {
      toast.success('Reseña creada correctamente');
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(`Error al crear reseña: ${err.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => adminService.updateReview(review!.id, data),
    onSuccess: () => {
      toast.success('Reseña actualizada correctamente');
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(`Error al actualizar reseña: ${err.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = {
      ...formData,
      rating: Number(formData.rating)
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

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <button
        key={i}
        type="button"
        onClick={() => handleInputChange('rating', i + 1)}
        className={`w-8 h-8 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        } hover:text-yellow-500 transition-colors`}
      >
        <Star className="w-full h-full" />
      </button>
    ));
  };

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} size="lg" variant="glass">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-white/10 dark:border-white/5">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
              <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {isEditing ? 'Editar Reseña' : 'Nueva Reseña'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isEditing ? 'Modifica los datos de la reseña' : 'Completa la información de la nueva reseña'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Patient and Doctor Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Paciente y Doctor</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="patientId">Paciente *</Label>
                <select
                  id="patientId"
                  value={formData.patientId}
                  onChange={(e) => handleInputChange('patientId', e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.patientId ? 'border-red-500' : ''}`}
                >
                  <option value="">Seleccionar paciente</option>
                  {(patientsData?.data?.data?.data as any[])?.map((patient: any) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.user?.firstName} {patient.user?.lastName} - {patient.user?.email}
                    </option>
                  ))}
                </select>
                {errors.patientId && <p className="text-red-500 text-sm mt-1">{errors.patientId}</p>}
              </div>

              <div>
                <Label htmlFor="doctorId">Doctor *</Label>
                <select
                  id="doctorId"
                  value={formData.doctorId}
                  onChange={(e) => handleInputChange('doctorId', e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.doctorId ? 'border-red-500' : ''}`}
                >
                  <option value="">Seleccionar doctor</option>
                  {(doctorsData?.data?.data?.data as any[])?.map((doctor: any) => (
                    <option key={doctor.id} value={doctor.id}>
                      Dr. {doctor.user?.firstName} {doctor.user?.lastName} - {doctor.specialty}
                    </option>
                  ))}
                </select>
                {errors.doctorId && <p className="text-red-500 text-sm mt-1">{errors.doctorId}</p>}
              </div>
            </div>
          </div>

          {/* Appointment ID */}
          <div>
            <Label htmlFor="appointmentId">ID de Cita (Opcional)</Label>
            <Input
              id="appointmentId"
              type="text"
              value={formData.appointmentId}
              onChange={(e) => handleInputChange('appointmentId', e.target.value)}
              placeholder="ID de la cita relacionada"
            />
          </div>

          {/* Rating */}
          <div>
            <Label htmlFor="rating">Calificación *</Label>
            <div className="mt-2">
              <div className="flex items-center space-x-1">
                {getRatingStars(formData.rating)}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {formData.rating} de 5 estrellas
              </p>
              {errors.rating && <p className="text-red-500 text-sm mt-1">{errors.rating}</p>}
            </div>
          </div>

          {/* Comment */}
          <div>
            <Label htmlFor="comment">Comentario</Label>
            <textarea
              id="comment"
              value={formData.comment}
              onChange={(e) => handleInputChange('comment', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Escribe tu comentario sobre la atención recibida..."
            />
          </div>

          {/* Verification Status */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Verificación</h3>
            <div className="flex items-center space-x-3">
              <Switch
                checked={formData.isVerified}
                onCheckedChange={(checked) => handleInputChange('isVerified', checked)}
              />
              <div>
                <Label htmlFor="isVerified" className="text-base">
                  Reseña Verificada
                </Label>
                <p className="text-sm text-gray-500">
                  {formData.isVerified 
                    ? 'La reseña está verificada y es visible públicamente' 
                    : 'La reseña está pendiente de verificación'
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
              {isEditing ? 'Actualizar Reseña' : 'Crear Reseña'}
            </Button>
          </div>
        </form>
    </GlassModal>
  );
}
