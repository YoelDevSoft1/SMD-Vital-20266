import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X, MessageSquare, Star, Save } from 'lucide-react';
import { Boton } from './ui/Boton';
import { Entrada } from './ui/Entrada';
import { Etiqueta } from './ui/Etiqueta';
import { Interruptor } from './ui/Interruptor';
import { ModalCristal } from './ui/ModalCristal';
import { PickerSelect, type PickerSelectOption } from './ui/PickerSelect';
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

  // Opciones para PickerSelect derivadas de las queries (TopPicker necesita PickerSelectOption[])
  const opcionesPacientes = useMemo<PickerSelectOption[]>(() => {
    const lista = (patientsData?.data?.data?.data as Array<{
      id: string;
      user?: { firstName?: string; lastName?: string; email?: string };
    }> | undefined) ?? [];
    return lista.map((p) => {
      const nombre = `${p.user?.firstName ?? ''} ${p.user?.lastName ?? ''}`.trim();
      const email = p.user?.email ?? '';
      return {
        value: p.id,
        label: nombre || 'Sin nombre',
        sublabel: email || undefined,
        searchText: `${nombre} ${email}`.trim(),
      };
    });
  }, [patientsData]);

  const opcionesDoctores = useMemo<PickerSelectOption[]>(() => {
    const lista = (doctorsData?.data?.data?.data as Array<{
      id: string;
      specialty?: string;
      user?: { firstName?: string; lastName?: string };
    }> | undefined) ?? [];
    return lista.map((d) => {
      const nombre = `${d.user?.firstName ?? ''} ${d.user?.lastName ?? ''}`.trim();
      const especialidad = d.specialty ?? '';
      return {
        value: d.id,
        label: nombre ? `Dr. ${nombre}` : 'Sin nombre',
        sublabel: especialidad || undefined,
        searchText: `${nombre} ${especialidad}`.trim(),
      };
    });
  }, [doctorsData]);

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
    <ModalCristal isOpen={isOpen} onClose={onClose} size="lg" variant="glass">
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
                {isEditing ? 'Modifica los formData de la reseña' : 'Completa la información de la nueva reseña'}
              </p>
            </div>
          </div>
          <Boton variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Boton>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Patient and Doctor Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Paciente y Doctor</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <PickerSelect
                  id="patientId"
                  label="Paciente"
                  required
                  value={formData.patientId}
                  onChange={(value) => handleInputChange('patientId', value)}
                  options={opcionesPacientes}
                  placeholder="Seleccionar paciente..."
                  searchPlaceholder="Buscar paciente..."
                  emptyText="Sin pacientes"
                  error={errors.patientId}
                />
              </div>

              <div>
                <PickerSelect
                  id="doctorId"
                  label="Doctor"
                  required
                  value={formData.doctorId}
                  onChange={(value) => handleInputChange('doctorId', value)}
                  options={opcionesDoctores}
                  placeholder="Seleccionar doctor..."
                  searchPlaceholder="Buscar doctor..."
                  emptyText="Sin doctores"
                  error={errors.doctorId}
                />
              </div>
            </div>
          </div>

          {/* Appointment ID */}
          <div>
            <Etiqueta htmlFor="appointmentId">ID de Cita (Opcional)</Etiqueta>
            <Entrada
              id="appointmentId"
              type="text"
              value={formData.appointmentId}
              onChange={(e) => handleInputChange('appointmentId', e.target.value)}
              placeholder="ID de la cita relacionada"
            />
          </div>

          {/* Rating */}
          <div>
            <Etiqueta htmlFor="rating">Calificación *</Etiqueta>
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
            <Etiqueta htmlFor="comment">Comentario</Etiqueta>
            <textarea
              id="comment"
              value={formData.comment}
              onChange={(e) => handleInputChange('comment', e.target.value)}
              className="w-full rounded-lg border border-input bg-card px-3 py-2 text-base text-foreground shadow-soft-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:bg-card dark:text-foreground sm:text-sm"
              rows={4}
              placeholder="Escribe tu comentario sobre la atención recibida..."
            />
          </div>

          {/* Verification Status */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Verificación</h3>
            <div className="flex items-center space-x-3">
              <Interruptor
                checked={formData.isVerified}
                onCheckedChange={(checked) => handleInputChange('isVerified', checked)}
              />
              <div>
                <Etiqueta htmlFor="isVerified" className="text-base">
                  Reseña Verificada
                </Etiqueta>
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
          <div className="flex flex-col-reverse items-stretch gap-2 border-t border-white/10 pt-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end dark:border-white/5">
            <Boton type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Boton>
            <Boton
              type="submit"
              isLoading={createMutation.isPending || updateMutation.isPending}
              leftIcon={<Save className="h-4 w-4" />}
            >
              {isEditing ? 'Actualizar reseña' : 'Crear reseña'}
            </Boton>
          </div>
        </form>
    </ModalCristal>
  );
}
