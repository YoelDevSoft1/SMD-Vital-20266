import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, CreditCard, DollarSign, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { GlassModal } from '@/components/ui/GlassModal';
import { toast } from 'react-hot-toast';
import { adminService } from '@/services/admin.service';
import type { Payment, Appointment } from '@/types';

interface CreatePaymentFormProps {
  isOpen: boolean;
  onClose: () => void;
  payment?: Payment | null;
}

const statusOptions = [
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'COMPLETED', label: 'Completado' },
  { value: 'FAILED', label: 'Fallido' }
];

const methodOptions = [
  { value: 'CARD', label: 'Tarjeta de Crédito/Débito' },
  { value: 'BANK_TRANSFER', label: 'Transferencia Bancaria' },
  { value: 'NEQUI', label: 'Nequi' },
  { value: 'DAVIPLATA', label: 'Davivienda' },
  { value: 'PSE', label: 'PSE' },
  { value: 'CASH', label: 'Efectivo' }
];

export default function CreatePaymentForm({ isOpen, onClose, payment }: CreatePaymentFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!payment;

  const [formData, setFormData] = useState({
    appointmentId: '',
    amount: '',
    currency: 'COP',
    status: 'PENDING',
    method: 'CARD',
    transactionId: '',
    // stripePaymentIntentId: '' // Removed - not in Payment type
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch appointments for dropdown
  const { data: appointmentsData } = useQuery({
    queryKey: ['appointments-for-payment'],
    queryFn: () => adminService.getAppointments({ page: 1, limit: 100 }),
    enabled: isOpen
  });

  // Create/Update payment mutation
  const paymentMutation = useMutation({
    mutationFn: (data: any) => {
      if (isEditing) {
        return adminService.updatePayment(payment!.id, data);
      } else {
        return adminService.createPayment(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success(isEditing ? 'Pago actualizado' : 'Pago creado');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al procesar el pago');
    }
  });

  // Initialize form data
  useEffect(() => {
    if (isEditing && payment) {
      setFormData({
        appointmentId: payment.appointmentId || '',
        amount: payment.amount.toString(),
        currency: payment.currency || 'COP',
        status: payment.status || 'PENDING',
        method: payment.method || 'CARD',
        transactionId: payment.transactionId || '',
        // stripePaymentIntentId: payment.stripePaymentIntentId || '' // Removed - not in Payment type
      });
    } else {
      setFormData({
        appointmentId: '',
        amount: '',
        currency: 'COP',
        status: 'PENDING',
        method: 'CARD',
        transactionId: '',
        // stripePaymentIntentId: '' // Removed - not in Payment type
      });
    }
    setErrors({});
  }, [isEditing, payment, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.appointmentId) {
      newErrors.appointmentId = 'La cita es requerida';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'El monto debe ser mayor a 0';
    }

    if (!formData.method) {
      newErrors.method = 'El método de pago es requerido';
    }

    if (!formData.status) {
      newErrors.status = 'El estado es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = {
      appointmentId: formData.appointmentId,
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      status: formData.status,
      method: formData.method,
      ...(formData.transactionId && { transactionId: formData.transactionId }),
      // ...(formData.stripePaymentIntentId && { stripePaymentIntentId: formData.stripePaymentIntentId }) // Removed - not in Payment type
    };

    paymentMutation.mutate(submitData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const selectedAppointment = (appointmentsData?.data?.data?.data as Appointment[])?.find(
    (apt: Appointment) => apt.id === formData.appointmentId
  );

  // Debug logging
  console.log('=== CREATE PAYMENT FORM DEBUG ===');
  console.log('Is editing:', isEditing);
  console.log('Payment:', payment);
  console.log('Has appointmentsData:', !!appointmentsData);
  console.log('Appointments data structure:', appointmentsData ? Object.keys(appointmentsData) : []);
  console.log('Data structure:', appointmentsData?.data ? Object.keys(appointmentsData.data) : []);
  console.log('Data.data structure:', appointmentsData?.data?.data ? Object.keys(appointmentsData.data.data) : []);
  console.log('Appointments array length:', appointmentsData?.data?.data?.data?.length || 0);
  console.log('Form data:', formData);
  console.log('========================');

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} size="xl" variant="glass">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10 dark:border-white/5">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
              <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isEditing ? 'Editar Pago' : 'Nuevo Pago'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {isEditing ? 'Modifica la información del pago' : 'Crea un nuevo pago en el sistema'}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4" />
            Cerrar
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Appointment Selection */}
          <div className="space-y-2">
            <Label htmlFor="appointmentId">Cita *</Label>
            <Select
              value={formData.appointmentId}
              onChange={(e) => handleInputChange('appointmentId', e.target.value)}
            >
              <option value="">Seleccionar cita</option>
              {(appointmentsData?.data?.data?.data as Appointment[])?.map((appointment: Appointment) => (
                <option key={appointment.id} value={appointment.id}>
                  {appointment.patient?.user?.firstName} {appointment.patient?.user?.lastName} - {appointment.service?.name} - {new Date(appointment.scheduledAt).toLocaleDateString('es-ES')}
                </option>
              ))}
            </Select>
            {errors.appointmentId && (
              <p className="text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.appointmentId}
              </p>
            )}
          </div>

          {/* Selected Appointment Info */}
          {selectedAppointment && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Información de la Cita</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Paciente:</span>
                  <span className="ml-2 font-medium">
                    {selectedAppointment.patient?.user?.firstName} {selectedAppointment.patient?.user?.lastName}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Servicio:</span>
                  <span className="ml-2 font-medium">{selectedAppointment.service?.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Fecha:</span>
                  <span className="ml-2 font-medium">
                    {new Date(selectedAppointment.scheduledAt).toLocaleDateString('es-ES')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Precio Total:</span>
                  <span className="ml-2 font-medium">
                    {new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP'
                    }).format(selectedAppointment.totalPrice)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Amount and Currency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  className="pl-10"
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.amount}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Moneda</Label>
              <Select
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
              >
                <option value="COP">Peso Colombiano (COP)</option>
                <option value="USD">Dólar Americano (USD)</option>
                <option value="EUR">Euro (EUR)</option>
              </Select>
            </div>
          </div>

          {/* Payment Method and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="method">Método de Pago *</Label>
              <Select
                value={formData.method}
                onChange={(e) => handleInputChange('method', e.target.value)}
              >
                {methodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              {errors.method && (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.method}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado *</Label>
              <Select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              {errors.status && (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.status}
                </p>
              )}
            </div>
          </div>

          {/* Transaction Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transactionId">ID de Transacción</Label>
              <Input
                id="transactionId"
                placeholder="TXN-123456789"
                value={formData.transactionId}
                onChange={(e) => handleInputChange('transactionId', e.target.value)}
              />
            </div>

          {/* <div className="space-y-2">
            <Label htmlFor="stripePaymentIntentId">Stripe Payment Intent ID</Label>
            <Input
              id="stripePaymentIntentId"
              placeholder="pi_1234567890"
              value={formData.stripePaymentIntentId}
              onChange={(e) => handleInputChange('stripePaymentIntentId', e.target.value)}
            />
          </div> */}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={paymentMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={paymentMutation.isPending}
            >
              {paymentMutation.isPending ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isEditing ? 'Actualizando...' : 'Creando...'}
                </div>
              ) : (
                <div className="flex items-center">
                  <Save className="w-4 h-4" />
                  {isEditing ? 'Actualizar Pago' : 'Crear Pago'}
                </div>
              )}
            </Button>
          </div>
        </form>
    </GlassModal>
  );
}
