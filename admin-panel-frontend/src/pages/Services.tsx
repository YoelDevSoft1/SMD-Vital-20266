import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Stethoscope, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  Filter, 
  Search, 
  Plus, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  BarChart3,
  PieChart,
  Calendar,
  Users,
  FileText,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { adminService } from '@/services/admin.service';
import ServicesModal from '@/components/ServicesModal';
import ServiceDetailsView from '@/components/ServiceDetailsView';
import CreateServiceForm from '@/components/CreateServiceForm';
import { ServiceFilters, ServiceCategory } from '@/types';

export default function Services() {
  const [showModal, setShowModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  // Fetch services data for recent services display
  const { data: recentServicesData } = useQuery({
    queryKey: ['recent-services'],
    queryFn: () => adminService.getServices({ page: 1, limit: 5 })
  });

  // Fetch all services data for statistics
  const { data: allServicesData } = useQuery({
    queryKey: ['all-services-stats'],
    queryFn: () => adminService.getServices({ page: 1, limit: 1000 })
  });

  // Fetch dashboard data
  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => adminService.getDashboard()
  });

  const handleViewAll = () => {
    setShowModal(true);
  };

  const handleCreateNew = () => {
    setShowCreateForm(true);
  };

  const handleViewDetails = (service: any) => {
    setSelectedService(service);
    setShowDetails(true);
  };

  // Calculate service statistics from all services
  const allServices = allServicesData?.data?.data?.data || [];
  const totalServices = allServicesData?.data?.data?.pagination?.total || 0;
  const activeServices = allServices.filter(s => s.isActive).length || 0;
  const inactiveServices = allServices.filter(s => !s.isActive).length || 0;
  const totalRevenue = dashboardData?.data?.data?.overview?.totalRevenue || 0;

  // Recent services for display (first 5)
  const recentServices = recentServicesData?.data?.data?.data || [];

  // Debug logging
  console.log('Services Debug:', {
    hasAllServicesData: !!allServicesData,
    allServicesCount: allServices.length,
    totalServices: totalServices,
    activeServices: activeServices,
    inactiveServices: inactiveServices,
    totalRevenue: totalRevenue,
    recentServicesCount: recentServices.length
  });

  const stats = [
    {
      title: 'Total Servicios',
      value: totalServices,
      icon: Stethoscope,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'Servicios Activos',
      value: activeServices,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Servicios Inactivos',
      value: inactiveServices,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      change: '-2%',
      changeType: 'negative'
    },
    {
      title: 'Ingresos Totales',
      value: new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP'
      }).format(totalRevenue),
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: '+15%',
      changeType: 'positive'
    }
  ];

  const getCategoryLabel = (category: ServiceCategory) => {
    const labels: { [key in ServiceCategory]: string } = {
      'CONSULTATION': 'Consulta',
      'EMERGENCY': 'Emergencia',
      'LABORATORY': 'Laboratorio',
      'NURSING': 'Enfermería',
      'SPECIALIST': 'Especialista',
      'THERAPY': 'Terapia',
      'VACCINATION': 'Vacunación',
      'OTHER': 'Otro'
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: ServiceCategory) => {
    const colors: { [key in ServiceCategory]: string } = {
      'CONSULTATION': 'bg-blue-100 text-blue-800',
      'EMERGENCY': 'bg-red-100 text-red-800',
      'LABORATORY': 'bg-yellow-100 text-yellow-800',
      'NURSING': 'bg-green-100 text-green-800',
      'SPECIALIST': 'bg-purple-100 text-purple-800',
      'THERAPY': 'bg-pink-100 text-pink-800',
      'VACCINATION': 'bg-indigo-100 text-indigo-800',
      'OTHER': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Servicios</h1>
          <p className="text-gray-600 mt-1">Administra todos los servicios médicos del sistema</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleViewAll}>
            <Filter className="w-4 h-4 mr-2" />
            Ver Todos
          </Button>
          <Button onClick={handleCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Servicio
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <div className="flex items-center mt-2">
                  {stat.changeType === 'positive' ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-red-500 mr-1 rotate-180" />
                  )}
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs mes anterior</span>
                </div>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Services */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Servicios Recientes</h2>
            <Button variant="outline" onClick={handleViewAll}>
              Ver todos los servicios
            </Button>
          </div>
        </div>
        <div className="p-6">
          {recentServices.length === 0 ? (
            <div className="text-center py-12">
              <Stethoscope className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay servicios</h3>
              <p className="text-gray-600 mb-4">No se encontraron servicios recientes.</p>
              <Button onClick={handleCreateNew}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Servicio
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentServices.slice(0, 5).map((service: any) => (
                <div key={service.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Stethoscope className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{service.name}</p>
                      <p className="text-sm text-gray-600">{service.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(service.category)}`}>
                          {getCategoryLabel(service.category)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Intl.NumberFormat('es-CO', {
                            style: 'currency',
                            currency: 'COP'
                          }).format(service.basePrice)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {service.duration} min
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {service.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(service)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ServicesModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />

      <CreateServiceForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
      />

      {selectedService && (
        <ServiceDetailsView
          service={selectedService}
          onClose={() => {
            setShowDetails(false);
            setSelectedService(null);
          }}
          onEdit={() => {
            setShowDetails(false);
            setShowCreateForm(true);
          }}
        />
      )}
    </div>
  );
}
