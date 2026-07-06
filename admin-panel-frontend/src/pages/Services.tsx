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
import { Boton } from '@/components/ui/Boton';
import { Entrada } from '@/components/ui/Entrada';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { EsqueletoLista } from '@/components/ui/Esqueleto';
// import { Etiqueta } from '@/components/ui/Etiqueta';
// import { Seleccion } from '@/components/ui/Seleccion';
// import { Interruptor } from '@/components/ui/Interruptor';
import { adminService } from '../services/admin.service';
import ServicesModal from '../components/ServicesModal';
import ServiceDetailsView from '../components/ServiceDetailsView';
import CreateServiceForm from '../components/CreateServiceForm';
import { ServiceCategory } from '../types';

export default function Services() {
  const [showModal, setShowModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  // Fetch services data for recent services display
  const { data: recentServicesData, isLoading: isLoadingRecent } = useQuery({
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
      'CONSULTATION': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      'EMERGENCY': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
      'LABORATORY': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
      'NURSING': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      'SPECIALIST': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
      'THERAPY': 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300',
      'VACCINATION': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300',
      'OTHER': 'bg-muted text-muted-foreground dark:bg-card dark:text-muted-foreground'
    };
    return colors[category] || 'bg-muted text-muted-foreground dark:bg-card dark:text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl dark:text-foreground">Gestión de Servicios</h1>
          <p className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">Administra todos los servicios médicos del sistema</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Boton
            variant="outline"
            onClick={handleViewAll}
            leftIcon={<Filter className="h-4 w-4" />}
          >
            Ver Todos
          </Boton>
          <Boton
            onClick={handleCreateNew}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Nuevo Servicio
          </Boton>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="rounded-lg border border-border bg-card p-4 shadow-soft-sm sm:p-5 dark:border-border dark:bg-card">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground dark:text-muted-foreground sm:text-sm">{stat.title}</p>
                <p className="mt-1 text-xl font-semibold text-foreground dark:text-foreground sm:mt-2 sm:text-2xl">{stat.value}</p>
                <div className="mt-1 flex items-center sm:mt-2">
                  {stat.changeType === 'positive' ? (
                    <TrendingUp className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-rose-500 rotate-180 dark:text-rose-400" />
                  )}
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="ml-1 text-sm text-muted-foreground dark:text-muted-foreground">vs mes anterior</span>
                </div>
              </div>
              <div className={`shrink-0 rounded-full p-2.5 sm:p-3 ${stat.bgColor} dark:opacity-80`}>
                <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.color} dark:opacity-90`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Services */}
      <div className="rounded-lg border border-border bg-card shadow-soft-sm dark:border-border dark:bg-card">
        <div className="border-b border-border p-4 sm:p-6 dark:border-border">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-foreground dark:text-foreground">Servicios Recientes</h2>
            <Boton variant="outline" onClick={handleViewAll}>
              Ver todos los servicios
            </Boton>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          {isLoadingRecent ? (
            <EsqueletoLista rows={4} />
          ) : recentServices.length === 0 ? (
            <EstadoVacio
              icon={Stethoscope}
              title="No hay servicios"
              description="No se encontraron servicios recientes."
              action={
                <Boton
                  variant="primary"
                  onClick={handleCreateNew}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Crear Primer Servicio
                </Boton>
              }
              size="md"
            />
          ) : (
            <div className="space-y-4">
              {recentServices.slice(0, 5).map((service: any) => (
                <div key={service.id} className="flex flex-col gap-3 rounded-lg border border-border p-4 transition-shadow hover:shadow-soft-md sm:flex-row sm:items-center sm:justify-between dark:border-border">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/20">
                      <Stethoscope className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground dark:text-foreground">{service.name}</p>
                      <p className="text-sm text-muted-foreground dark:text-muted-foreground">{service.description}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getCategoryColor(service.category)}`}>
                          {getCategoryLabel(service.category)}
                        </span>
                        <span className="text-sm text-muted-foreground dark:text-muted-foreground">
                          {new Intl.NumberFormat('es-CO', {
                            style: 'currency',
                            currency: 'COP'
                          }).format(service.basePrice)}
                        </span>
                        <span className="text-sm text-muted-foreground dark:text-muted-foreground">
                          {service.duration} min
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      service.isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/20 dark:text-rose-300'
                    }`}>
                      {service.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                    <Boton
                      variant="outline"
                      onClick={() => handleViewDetails(service)}
                      aria-label="Ver detalles del servicio"
                      leftIcon={<Eye className="h-4 w-4" />}
                    >
                      Ver
                    </Boton>
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
