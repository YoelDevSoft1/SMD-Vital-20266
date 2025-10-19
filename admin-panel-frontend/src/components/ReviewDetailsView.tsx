import React from 'react';
import { X, MessageSquare, Star, Calendar, Shield, Edit, Trash2, CheckCircle, XCircle, User, Stethoscope } from 'lucide-react';
import { Button } from './ui/Button';
import { GlassModal } from './ui/GlassModal';
import type { Review } from '@/types';

interface ReviewDetailsViewProps {
  review: Review;
  onClose: () => void;
  onEdit: () => void;
}

export default function ReviewDetailsView({ review, onClose, onEdit }: ReviewDetailsViewProps) {
  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600 bg-green-100';
    if (rating >= 3.5) return 'text-yellow-600 bg-yellow-100';
    if (rating >= 2.5) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return 'Excelente';
    if (rating >= 3.5) return 'Bueno';
    if (rating >= 2.5) return 'Regular';
    return 'Malo';
  };

  return (
    <GlassModal isOpen={true} onClose={onClose} size="lg" variant="glass">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-white/10 dark:border-white/5">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
              <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Detalles de la Reseña</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Información completa de la reseña</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="w-4 h-4" />
              Editar
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Rating */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Calificación</h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                {getRatingStars(review.rating)}
              </div>
              <div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRatingColor(review.rating)}`}>
                  {getRatingLabel(review.rating)}
                </span>
                <p className="text-sm text-gray-500 mt-1">
                  {review.rating} de 5 estrellas
                </p>
              </div>
            </div>
          </div>

          {/* Comment */}
          {review.comment && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Comentario</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{review.comment}</p>
              </div>
            </div>
          )}

          {/* Patient Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Paciente</h3>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {review.patient?.user?.firstName} {review.patient?.user?.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{review.patient?.user?.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Doctor Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Doctor</h3>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <Stethoscope className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Dr. {review.doctor?.user?.firstName} {review.doctor?.user?.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{review.doctor?.user?.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Status and Verification */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado y Verificación</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Estado de Verificación</label>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    review.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {review.isVerified ? (
                      <>
                        <Shield className="w-4 h-4 mr-1" />
                        Verificada
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 mr-1" />
                        Pendiente de Verificación
                      </>
                    )}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">ID de Cita</label>
                <p className="text-sm text-gray-900 mt-1">
                  {review.appointmentId ? review.appointmentId : 'No asociada a cita'}
                </p>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Fechas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Fecha de Creación</label>
                <div className="flex items-center mt-1">
                  <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                  <p className="text-sm text-gray-900">
                    {new Date(review.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Última Actualización</label>
                <div className="flex items-center mt-1">
                  <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                  <p className="text-sm text-gray-900">
                    {new Date(review.updatedAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={onEdit}>
            <Edit className="w-4 h-4" />
            Editar Reseña
          </Button>
        </div>
    </GlassModal>
  );
}
