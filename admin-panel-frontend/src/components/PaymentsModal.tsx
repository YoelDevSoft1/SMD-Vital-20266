import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, CreditCard, Filter, Search, Plus, Edit, Trash2, Eye, CheckCircle, XCircle, Clock, AlertCircle, Download, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'react-hot-toast';
import { adminService } from '@/services/admin.service';
import type { Payment, PaymentFilters } from '@/types';
import PaymentDetailsView from './PaymentDetailsView';
import CreatePaymentForm from './CreatePaymentForm';

interface PaymentsModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  CARD: 'Tarjeta',
  BANK_TRANSFER: 'Transferencia Bancaria',
  NEQUI: 'Nequi',
  DAVIPLATA: 'Davivienda',
  PSE: 'PSE',
  CASH: 'Efectivo'
};

export default function PaymentsModal({ isOpen, onClose }: PaymentsModalProps) {
  const queryClient = useQueryClient();
  
  const [filters, setFilters] = useState<PaymentFilters>({
    page: 1,
    limit: 10,
    search: '',
    status: '',
    method: '',
    dateFrom: '',
    dateTo: ''
  });

  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Fetch payments
  const { data: paymentsData, isLoading, error } = useQuery({
    queryKey: ['payments', filters],
    queryFn: () => adminService.getPayments(filters),
    enabled: isOpen
  });

  // Update payment status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      adminService.updatePaymentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Estado actualizado');
    },
    onError: () => {
      toast.error('Error al actualizar estado');
    }
  });

  // Delete payment mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deletePayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Pago eliminado');
    },
    onError: () => {
      toast.error('Error al eliminar pago');
    }
  });

  const handleStatusChange = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este pago?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowDetails(true);
  };

  const handleEdit = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowEditForm(true);
  };

  const handleSelectPayment = (paymentId: string) => {
    setSelectedPayments(prev => 
      prev.includes(paymentId) 
        ? prev.filter(id => id !== paymentId)
        : [...prev, paymentId]
    );
  };

  const handleSelectAll = () => {
    const allPaymentIds = paymentsData?.data?.data?.data?.map(payment => payment.id) || [];
    setSelectedPayments(
      selectedPayments.length === allPaymentIds.length ? [] : allPaymentIds
    );
  };

  const handleBulkStatusUpdate = (status: string) => {
    if (selectedPayments.length === 0) {
      toast.error('Selecciona al menos un pago');
      return;
    }
    
    selectedPayments.forEach(paymentId => {
      handleStatusChange(paymentId, status);
    });
    
    setSelectedPayments([]);
  };

  const handleExport = (format: 'csv' | 'json') => {
    // TODO: Implement export functionality
    toast.success(`Exportando pagos en formato ${format.toUpperCase()}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
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

  // Debug logging
  console.log('=== PAYMENTS MODAL DEBUG ===');
  console.log('Has paymentsData:', !!paymentsData);
  console.log('Payments data structure:', paymentsData ? Object.keys(paymentsData) : []);
  console.log('Data structure:', paymentsData?.data ? Object.keys(paymentsData.data) : []);
  console.log('Data.data structure:', paymentsData?.data?.data ? Object.keys(paymentsData.data.data) : []);
  console.log('Payments array length:', paymentsData?.data?.data?.data?.length || 0);
  console.log('Is loading:', isLoading);
  console.log('Error:', error);
  console.log('========================');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Pagos</h2>
              <p className="text-gray-600 dark:text-gray-400">Administra todos los pagos del sistema</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4" />
              Nuevo Pago
            </Button>
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4" />
              Cerrar
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Buscar pagos..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="status">Estado</Label>
              <Select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
              >
                <option value="">Todos los estados</option>
                <option value="PENDING">Pendiente</option>
                <option value="COMPLETED">Completado</option>
                <option value="FAILED">Fallido</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="method">Método</Label>
              <Select
                value={filters.method}
                onChange={(e) => setFilters(prev => ({ ...prev, method: e.target.value, page: 1 }))}
              >
                <option value="">Todos los métodos</option>
                <option value="CARD">Tarjeta</option>
                <option value="BANK_TRANSFER">Transferencia Bancaria</option>
                <option value="NEQUI">Nequi</option>
                <option value="DAVIPLATA">Davivienda</option>
                <option value="PSE">PSE</option>
                <option value="CASH">Efectivo</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="dateFrom">Fecha Desde</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value, page: 1 }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({
                  page: 1,
                  limit: 10,
                  search: '',
                  status: '',
                  method: '',
                  dateFrom: '',
                  dateTo: ''
                })}
              >
                Limpiar Filtros
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
              >
                <Download className="w-4 h-4 mr-1" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('json')}
              >
                <Download className="w-4 h-4 mr-1" />
                JSON
              </Button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedPayments.length > 0 && (
          <div className="p-4 bg-blue-50 border-b">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {selectedPayments.length} pago(s) seleccionado(s)
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  onClick={() => handleBulkStatusUpdate('COMPLETED')}
                >
                  Marcar como Completado
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkStatusUpdate('FAILED')}
                >
                  Marcar como Fallido
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedPayments([])}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Cargando pagos...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600">Error al cargar los pagos</p>
              </div>
            </div>
          ) : !paymentsData?.data?.data?.data?.length ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No se encontraron pagos</p>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedPayments.length === (paymentsData?.data?.data?.data?.length || 0)}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Servicio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Método
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {paymentsData?.data?.data?.data?.map((payment: any) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedPayments.includes(payment.id)}
                            onChange={() => handleSelectPayment(payment.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {payment.appointment?.patient?.user?.firstName} {payment.appointment?.patient?.user?.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {payment.appointment?.patient?.user?.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {payment.appointment?.service?.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(payment.amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {methodTranslations[payment.method as keyof typeof methodTranslations] || payment.method}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            statusColors[payment.status as keyof typeof statusColors]
                          }`}>
                            {statusTranslations[payment.status as keyof typeof statusTranslations]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(payment.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(payment)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(payment)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(payment.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {paymentsData?.data?.data?.pagination && paymentsData.data.data.pagination.totalPages > 1 && (
          <div className="border-t p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando{' '}
                <span className="font-medium">
                  {((filters.page! - 1) * filters.limit!) + 1}
                </span>{' '}
                a{' '}
                <span className="font-medium">
                  {Math.min(filters.page! * filters.limit!, paymentsData.data.data.pagination.total)}
                </span>{' '}
                de{' '}
                <span className="font-medium">{paymentsData.data.data.pagination.total}</span>{' '}
                resultados
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page! - 1 }))}
                  disabled={!paymentsData.data.data.pagination.hasPrev}
                >
                  Anterior
                </Button>
                <span className="text-sm text-gray-700">
                  Página {filters.page} de {paymentsData.data.data.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page! + 1 }))}
                  disabled={!paymentsData.data.data.pagination.hasNext}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showDetails && selectedPayment && (
        <PaymentDetailsView
          payment={selectedPayment}
          onClose={() => {
            setShowDetails(false);
            setSelectedPayment(null);
          }}
          onEdit={() => {
            setShowDetails(false);
            setShowEditForm(true);
          }}
        />
      )}

      {showEditForm && selectedPayment && (
        <CreatePaymentForm
          isOpen={showEditForm}
          onClose={() => {
            setShowEditForm(false);
            setSelectedPayment(null);
          }}
          payment={selectedPayment}
        />
      )}

      {showCreateForm && (
        <CreatePaymentForm
          isOpen={showCreateForm}
          onClose={() => {
            setShowCreateForm(false);
          }}
        />
      )}
    </div>
  );
}
