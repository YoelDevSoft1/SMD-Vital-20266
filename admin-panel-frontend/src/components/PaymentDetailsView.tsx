import React from 'react';
import { X, CreditCard, DollarSign, Calendar, User, Stethoscope, CheckCircle, XCircle, Clock, AlertCircle, Phone, Mail, Building, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { GlassModal } from '@/components/ui/GlassModal';
import type { Payment } from '@/types';

interface PaymentDetailsViewProps {
  payment: Payment;
  onClose: () => void;
  onEdit: () => void;
}

const statusTranslations = {
  PENDING: 'Pendiente',
  COMPLETED: 'Completado',
  FAILED: 'Fallido'
};

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800'
};

const methodTranslations = {
  CARD: 'Tarjeta de Crédito/Débito',
  BANK_TRANSFER: 'Transferencia Bancaria',
  NEQUI: 'Nequi',
  DAVIPLATA: 'Davivienda',
  PSE: 'PSE',
  CASH: 'Efectivo'
};

const statusIcons = {
  PENDING: Clock,
  COMPLETED: CheckCircle,
  FAILED: XCircle
};

export default function PaymentDetailsView({ payment, onClose, onEdit }: PaymentDetailsViewProps) {
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

  const StatusIcon = statusIcons[payment.status as keyof typeof statusIcons] || AlertCircle;

  return (
    <GlassModal isOpen={true} onClose={onClose} size="xl" variant="glass">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10 dark:border-white/5">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
              <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Detalles del Pago</h2>
              <p className="text-gray-600 dark:text-gray-400">Información completa del pago</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={onEdit}>
              <FileText className="w-4 h-4" />
              Editar
            </Button>
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4" />
              Cerrar
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Payment Status */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <StatusIcon className="w-6 h-6 text-gray-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Estado del Pago</h3>
                  <p className="text-gray-600">Estado actual del procesamiento</p>
                </div>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                statusColors[payment.status as keyof typeof statusColors]
              }`}>
                {statusTranslations[payment.status as keyof typeof statusTranslations]}
              </span>
            </div>
          </div>

          {/* Payment Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payment Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                Información del Pago
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monto:</span>
                  <span className="font-semibold text-lg text-gray-900">
                    {formatCurrency(payment.amount)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Método de Pago:</span>
                  <span className="font-medium text-gray-900">
                    {methodTranslations[payment.method as keyof typeof methodTranslations] || payment.method}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Moneda:</span>
                  <span className="font-medium text-gray-900">{payment.currency}</span>
                </div>
                
                {payment.transactionId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID de Transacción:</span>
                    <span className="font-mono text-sm text-gray-900">{payment.transactionId}</span>
                  </div>
                )}
                
                {payment.stripePaymentIntentId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stripe Payment ID:</span>
                    <span className="font-mono text-sm text-gray-900">{payment.stripePaymentIntentId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Appointment Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                Información de la Cita
              </h3>
              
              {payment.appointment ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Servicio:</span>
                    <span className="font-medium text-gray-900">
                      {payment.appointment.service?.name || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fecha de la Cita:</span>
                    <span className="font-medium text-gray-900">
                      {payment.appointment.scheduledAt ? 
                        formatDate(payment.appointment.scheduledAt) : 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duración:</span>
                    <span className="font-medium text-gray-900">
                      {payment.appointment.duration ? `${payment.appointment.duration} min` : 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Precio Total:</span>
                    <span className="font-medium text-gray-900">
                      {payment.appointment.totalPrice ? 
                        formatCurrency(payment.appointment.totalPrice) : 'N/A'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No hay información de cita disponible</p>
              )}
            </div>
          </div>

          {/* Patient Information */}
          {payment.appointment?.patient && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <User className="w-5 h-5 mr-2 text-purple-600" />
                Información del Paciente
              </h3>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nombre Completo</p>
                    <p className="font-medium text-gray-900">
                      {payment.appointment.patient.user?.firstName} {payment.appointment.patient.user?.lastName}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">
                      {payment.appointment.patient.user?.email || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Teléfono</p>
                    <p className="font-medium text-gray-900">
                      {payment.appointment.patient.user?.phone || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Fecha de Nacimiento</p>
                    <p className="font-medium text-gray-900">
                      {payment.appointment.patient.dateOfBirth ? 
                        new Date(payment.appointment.patient.dateOfBirth).toLocaleDateString('es-ES') : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Doctor Information */}
          {payment.appointment?.doctor && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Stethoscope className="w-5 h-5 mr-2 text-green-600" />
                Información del Doctor
              </h3>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nombre Completo</p>
                    <p className="font-medium text-gray-900">
                      {payment.appointment.doctor.user?.firstName} {payment.appointment.doctor.user?.lastName}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Especialidad</p>
                    <p className="font-medium text-gray-900">
                      {payment.appointment.doctor.specialty || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">
                      {payment.appointment.doctor.user?.email || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Teléfono</p>
                    <p className="font-medium text-gray-900">
                      {payment.appointment.doctor.user?.phone || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-gray-600" />
              Fechas y Horarios
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Fecha de Creación</p>
                <p className="font-medium text-gray-900">
                  {formatDate(payment.createdAt)}
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Última Actualización</p>
                <p className="font-medium text-gray-900">
                  {formatDate(payment.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
    </GlassModal>
  );
}
