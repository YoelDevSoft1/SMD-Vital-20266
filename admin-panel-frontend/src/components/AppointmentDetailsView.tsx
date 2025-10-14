import React from 'react';
import { X, Calendar, Clock, User, Stethoscope, MapPin, DollarSign, FileText, AlertCircle, CheckCircle, XCircle, RefreshCw, Phone, Mail, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Appointment } from '@/types';

interface AppointmentDetailsViewProps {
  appointment: Appointment;
  onClose: () => void;
  onEdit: () => void;
}

const statusTranslations = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  IN_PROGRESS: 'En Progreso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'No Asistió',
  RESCHEDULED: 'Reprogramada'
};

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  NO_SHOW: 'bg-gray-100 text-gray-800',
  RESCHEDULED: 'bg-orange-100 text-orange-800'
};

export default function AppointmentDetailsView({ appointment, onClose, onEdit }: AppointmentDetailsViewProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <AlertCircle className="w-5 h-5" />;
      case 'CONFIRMED': return <CheckCircle className="w-5 h-5" />;
      case 'IN_PROGRESS': return <RefreshCw className="w-5 h-5" />;
      case 'COMPLETED': return <CheckCircle className="w-5 h-5" />;
      case 'CANCELLED': return <XCircle className="w-5 h-5" />;
      case 'NO_SHOW': return <XCircle className="w-5 h-5" />;
      case 'RESCHEDULED': return <RefreshCw className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Detalles de la Cita</h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={onEdit}>
              Editar
            </Button>
            <Button variant="ghost" onClick={onClose}>
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Estado y Información Principal */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[appointment.status as keyof typeof statusColors]}`}>
                {getStatusIcon(appointment.status)}
                <span className="ml-2">{statusTranslations[appointment.status as keyof typeof statusTranslations]}</span>
              </div>
              {appointment.isUrgent && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Urgente
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Fecha y Hora</p>
                  <p className="font-medium">{formatDate(appointment.scheduledAt)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Duración</p>
                  <p className="font-medium">{appointment.duration} minutos</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <DollarSign className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Precio Total</p>
                  <p className="font-medium text-lg">{formatCurrency(appointment.totalPrice)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Información del Paciente */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Información del Paciente
            </h3>
            {appointment.patient ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nombre Completo</p>
                  <p className="font-medium">{appointment.patient.user.firstName} {appointment.patient.user.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    {appointment.patient.user.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Teléfono</p>
                  <p className="font-medium flex items-center">
                    <Phone className="w-4 h-4 mr-1" />
                    {appointment.patient.user.phone || 'No disponible'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <p className="font-medium">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      appointment.patient.user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {appointment.patient.user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Información del paciente no disponible</p>
            )}
          </div>

          {/* Información del Doctor */}
          <div className="bg-green-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Stethoscope className="w-5 h-5 mr-2" />
              Información del Doctor
            </h3>
            {appointment.doctor ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nombre Completo</p>
                  <p className="font-medium">{appointment.doctor.user.firstName} {appointment.doctor.user.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Especialidad</p>
                  <p className="font-medium">{appointment.doctor.specialty}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    {appointment.doctor.user.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Teléfono</p>
                  <p className="font-medium flex items-center">
                    <Phone className="w-4 h-4 mr-1" />
                    {appointment.doctor.user.phone || 'No disponible'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Experiencia</p>
                  <p className="font-medium">{appointment.doctor.experience} años</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Calificación</p>
                  <p className="font-medium">{appointment.doctor.rating}/5 ⭐</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Información del doctor no disponible</p>
            )}
          </div>

          {/* Información del Servicio */}
          <div className="bg-purple-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Información del Servicio
            </h3>
            {appointment.service ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nombre del Servicio</p>
                  <p className="font-medium">{appointment.service.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Categoría</p>
                  <p className="font-medium">{appointment.service.category}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">Descripción</p>
                  <p className="font-medium">{appointment.service.description}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Información del servicio no disponible</p>
            )}
          </div>

          {/* Ubicación */}
          <div className="bg-orange-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Ubicación
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Dirección</p>
                <p className="font-medium">{appointment.address}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ciudad</p>
                <p className="font-medium">{appointment.city}</p>
              </div>
              {appointment.coordinates && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">Coordenadas</p>
                  <p className="font-medium">
                    Lat: {appointment.coordinates.lat}, Lng: {appointment.coordinates.lng}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Notas Médicas */}
          {(appointment.notes || appointment.diagnosis || appointment.prescription) && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notas Médicas</h3>
              <div className="space-y-4">
                {appointment.notes && (
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Notas</p>
                    <p className="text-gray-900 bg-white p-3 rounded border">{appointment.notes}</p>
                  </div>
                )}
                {appointment.diagnosis && (
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Diagnóstico</p>
                    <p className="text-gray-900 bg-white p-3 rounded border">{appointment.diagnosis}</p>
                  </div>
                )}
                {appointment.prescription && (
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Prescripción</p>
                    <p className="text-gray-900 bg-white p-3 rounded border">{appointment.prescription}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Información del Sistema */}
          <div className="bg-gray-100 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Sistema</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">ID de la Cita</p>
                <p className="font-mono text-xs">{appointment.id}</p>
              </div>
              <div>
                <p className="text-gray-600">Creada</p>
                <p className="font-medium">{formatDate(appointment.createdAt)}</p>
              </div>
              <div>
                <p className="text-gray-600">Última Actualización</p>
                <p className="font-medium">{formatDate(appointment.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
