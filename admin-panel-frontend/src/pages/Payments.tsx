import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Filter, 
  Plus, 
  Eye, 
  CheckCircle, 
  Clock, 
  BarChart3,
  PieChart
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { adminService } from '@/services/admin.service';
import PaymentsModal from '@/components/PaymentsModal';
import PaymentDetailsView from '@/components/PaymentDetailsView';
import CreatePaymentForm from '@/components/CreatePaymentForm';
import RevenueChart from '@/components/RevenueChart';
import PaymentMethodsChart from '@/components/PaymentMethodsChart';
import { useRevenueData } from '@/hooks/useRevenueData';

export default function Payments() {
  const [showModal, setShowModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Fetch payments data for recent payments display
  const { data: recentPaymentsData } = useQuery({
    queryKey: ['recent-payments'],
    queryFn: () => adminService.getPayments({ page: 1, limit: 5 })
  });

  // Fetch all payments data for statistics
  const { data: allPaymentsData, isLoading: allPaymentsLoading } = useQuery({
    queryKey: ['all-payments-stats'],
    queryFn: () => adminService.getPayments({ page: 1, limit: 1000 })
  });

  // Fetch dashboard data
  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => adminService.getDashboard()
  });

  // Fetch revenue data for chart
  const { data: analyticsData, isLoading: revenueLoading } = useRevenueData();

  const handleViewAll = () => {
    setShowModal(true);
  };

  const handleCreateNew = () => {
    setShowCreateForm(true);
  };

  const handleViewDetails = (payment: any) => {
    setSelectedPayment(payment);
  };

  // Calculate payment statistics from all payments
  const allPayments = allPaymentsData?.data?.data?.data || [];
  const totalPayments = allPaymentsData?.data?.data?.pagination?.total || 0;
  const completedPayments = allPayments.filter(p => p.status === 'COMPLETED').length || 0;
  const pendingPayments = allPayments.filter(p => p.status === 'PENDING').length || 0;
  const failedPayments = allPayments.filter(p => p.status === 'FAILED').length || 0;
  
  // Calculate total revenue from completed payments as fallback
  const calculatedRevenue = allPayments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  
  const totalRevenue = dashboardData?.data?.data?.overview?.totalRevenue || calculatedRevenue;

  // Process payment methods data for chart
  const processPaymentMethodsData = () => {
    if (!allPayments || allPayments.length === 0) {
      return undefined; // Will use default data in component
    }

    // Count payments by method
    const methodCounts = allPayments.reduce((acc: any, payment: any) => {
      const method = payment.method || 'Otro';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});

    // Convert to chart data format
    const labels = Object.keys(methodCounts);
    const data = Object.values(methodCounts) as number[];
    
    const colors = [
      'rgba(59, 130, 246, 0.8)',
      'rgba(34, 197, 94, 0.8)',
      'rgba(168, 85, 247, 0.8)',
      'rgba(249, 115, 22, 0.8)',
      'rgba(239, 68, 68, 0.8)',
      'rgba(107, 114, 128, 0.8)',
    ];

    const borderColors = [
      'rgb(59, 130, 246)',
      'rgb(34, 197, 94)',
      'rgb(168, 85, 247)',
      'rgb(249, 115, 22)',
      'rgb(239, 68, 68)',
      'rgb(107, 114, 128)',
    ];

    return {
      labels,
      datasets: [
        {
          label: 'Cantidad de Pagos',
          data,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: borderColors.slice(0, labels.length),
          borderWidth: 1,
        },
      ],
    };
  };

  const paymentMethodsData = processPaymentMethodsData();

  // Recent payments for display (first 5)
  const payments = recentPaymentsData?.data?.data?.data || [];

  // Debug logging
  console.log('=== PAYMENTS DEBUG ===');
  console.log('Has allPaymentsData:', !!allPaymentsData);
  console.log('All payments array length:', allPayments.length);
  console.log('Total payments:', totalPayments);
  console.log('Completed payments:', completedPayments);
  console.log('Pending payments:', pendingPayments);
  console.log('Failed payments:', failedPayments);
  console.log('Total revenue:', totalRevenue);
  console.log('Calculated revenue:', calculatedRevenue);
  console.log('Recent payments for display:', payments.length);
  console.log('========================');
  
  // Debug dashboard data
  console.log('=== DASHBOARD DEBUG ===');
  console.log('Has dashboardData:', !!dashboardData);
  console.log('Dashboard data structure:', dashboardData ? Object.keys(dashboardData) : []);
  console.log('Dashboard data.data structure:', dashboardData?.data ? Object.keys(dashboardData.data) : []);
  console.log('Dashboard data.data.data structure:', dashboardData?.data?.data ? Object.keys(dashboardData.data.data) : []);
  console.log('Dashboard overview:', dashboardData?.data?.data?.overview);
  console.log('Dashboard totalRevenue:', dashboardData?.data?.data?.overview?.totalRevenue);
  console.log('========================');

  const stats = [
    {
      title: 'Total Pagos',
      value: totalPayments,
      icon: CreditCard,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Completados',
      value: completedPayments,
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'Pendientes',
      value: pendingPayments,
      icon: Clock,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      change: '-3%',
      changeType: 'negative'
    },
    {
      title: 'Ingresos Totales',
      value: new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP'
      }).format(totalRevenue),
      icon: DollarSign,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      change: '+15%',
      changeType: 'positive'
    }
  ];


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Pagos</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Administra todos los pagos del sistema</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleViewAll}>
            <Filter className="w-4 h-4" />
            Ver Todos
          </Button>
          <Button onClick={handleCreateNew}>
            <Plus className="w-4 h-4" />
            Nuevo Pago
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <div className="flex items-center mt-2">
                  {stat.changeType === 'positive' ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">vs mes anterior</span>
                </div>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ingresos por Mes</h3>
            <BarChart3 className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
          {revenueLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-500 dark:text-gray-400">Cargando datos de ingresos...</p>
              </div>
            </div>
          ) : (
            <RevenueChart data={(analyticsData as any)?.revenue || []} />
          )}
        </div>

        {/* Payment Methods */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Métodos de Pago</h3>
            <PieChart className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
          {allPaymentsLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-500 dark:text-gray-400">Cargando métodos de pago...</p>
              </div>
            </div>
          ) : (
            <PaymentMethodsChart data={paymentMethodsData} />
          )}
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pagos Recientes</h2>
            <Button variant="outline" onClick={handleViewAll}>
              Ver todos los pagos
            </Button>
          </div>
        </div>
        <div className="p-6">
          {payments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No hay pagos</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">No se encontraron pagos recientes.</p>
              <Button onClick={handleCreateNew}>
                <Plus className="w-4 h-4" />
                Crear Primer Pago
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.slice(0, 5).map((payment: any) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow bg-white dark:bg-gray-800">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                      <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {payment.appointment?.patient?.user?.firstName} {payment.appointment?.patient?.user?.lastName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {payment.appointment?.service?.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(payment.createdAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {new Intl.NumberFormat('es-CO', {
                          style: 'currency',
                          currency: 'COP'
                        }).format(payment.amount)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{payment.method}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                        payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                        payment.status === 'FAILED' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {payment.status === 'COMPLETED' ? 'Completado' :
                         payment.status === 'PENDING' ? 'Pendiente' :
                         payment.status === 'FAILED' ? 'Fallido' :
                         payment.status}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(payment)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <PaymentsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />

      <CreatePaymentForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
      />

      {selectedPayment && (
        <PaymentDetailsView
          payment={selectedPayment}
          onClose={() => {
            setSelectedPayment(null);
          }}
          onEdit={() => {
            setSelectedPayment(null);
            setShowCreateForm(true);
          }}
        />
      )}
    </div>
  );
}
