import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Stethoscope, Search, Plus, Edit, Trash2, Eye, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'react-hot-toast';
import { adminService } from '@/services/admin.service';
import type { Service, ServiceFilters } from '@/types';
import ServiceDetailsView from './ServiceDetailsView';
import CreateServiceForm from './CreateServiceForm';

interface ServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ServicesModal({ isOpen, onClose }: ServicesModalProps) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ServiceFilters>({
    page: 1,
    limit: 10,
    category: undefined,
    isActive: undefined,
    search: '',
    minPrice: undefined,
    maxPrice: undefined,
    minDuration: undefined,
    maxDuration: undefined
  });

  const [sortField, setSortField] = useState<'name' | 'category' | 'basePrice' | 'duration' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Fetch services
  const { data: servicesData, isLoading, error } = useQuery({
    queryKey: ['services', filters],
    queryFn: () => adminService.getServices(filters),
    enabled: isOpen,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Delete service mutation
  const deleteServiceMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['all-services-stats'] });
      toast.success('Servicio eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar el servicio');
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      // Delete services one by one since bulkDeleteServices doesn't exist
      const deletePromises = ids.map(id => adminService.deleteService(id));
      await Promise.all(deletePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['all-services-stats'] });
      setSelectedServices([]);
      toast.success('Servicios eliminados exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar los servicios');
    },
  });

  const handleSort = (field: 'name' | 'category' | 'basePrice' | 'duration' | 'createdAt') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: 'name' | 'category' | 'basePrice' | 'duration' | 'createdAt') => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const sortedServices = useMemo(() => {
    const services = servicesData?.data?.data?.data || [];
    return [...services].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'basePrice' || sortField === 'duration') {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      } else if (sortField === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else {
        aValue = String(aValue || '').toLowerCase();
        bValue = String(bValue || '').toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [servicesData?.data?.data?.data, sortField, sortOrder]);

  const handleSearch = () => {
    setFilters(prev => ({
      ...prev,
      search: searchQuery,
      page: 1
    }));
  };

  const handleFilterChange = (key: keyof ServiceFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const handleSelectAll = () => {
    const allServiceIds = servicesData?.data?.data?.data?.map(service => service.id) || [];
    setSelectedServices(
      selectedServices.length === allServiceIds.length ? [] : allServiceIds
    );
  };

  const handleSelectService = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este servicio?')) {
      deleteServiceMutation.mutate(id);
    }
  };

  const handleBulkDelete = () => {
    if (selectedServices.length === 0) return;
    if (window.confirm(`¿Estás seguro de que quieres eliminar ${selectedServices.length} servicios?`)) {
      bulkDeleteMutation.mutate(selectedServices);
    }
  };

  const handleEdit = (service: Service) => {
    setSelectedService(service);
    setShowEditForm(true);
  };

  const handleView = (service: Service) => {
    setSelectedService(service);
    setShowDetails(true);
  };

  const handleClose = () => {
    setShowCreateForm(false);
    setShowEditForm(false);
    setShowDetails(false);
    setSelectedService(null);
    setSelectedServices([]);
    onClose();
  };

  // Debug logging
  console.log('=== SERVICES MODAL DEBUG ===');
  console.log('Has servicesData:', !!servicesData);
  console.log('Services data structure:', servicesData ? Object.keys(servicesData) : []);
  console.log('Data structure:', servicesData?.data ? Object.keys(servicesData.data) : []);
  console.log('Data.data structure:', servicesData?.data?.data ? Object.keys(servicesData.data.data) : []);
  console.log('Services array length:', servicesData?.data?.data?.data?.length || 0);
  console.log('Is loading:', isLoading);
  console.log('Error:', error);
  console.log('========================');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Servicios</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search" className="text-gray-700 dark:text-gray-300">Buscar</Label>
              <div className="flex">
                <Input
                  id="search"
                  placeholder="Buscar servicios..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-r-none"
                />
                <Button
                  onClick={handleSearch}
                  className="rounded-l-none"
                  size="sm"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="category" className="text-gray-700 dark:text-gray-300">Categoría</Label>
              <select
                id="category"
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Todas las categorías</option>
                <option value="CONSULTATION">Consulta</option>
                <option value="EMERGENCY">Emergencia</option>
                <option value="FOLLOW_UP">Seguimiento</option>
                <option value="PREVENTIVE">Preventivo</option>
                <option value="SPECIALIST">Especialista</option>
              </select>
            </div>

            <div>
              <Label htmlFor="status" className="text-gray-700 dark:text-gray-300">Estado</Label>
              <select
                id="status"
                value={filters.isActive === undefined ? '' : filters.isActive ? 'active' : 'inactive'}
                onChange={(e) => {
                  const isActive = e.target.value === '' ? undefined : e.target.value === 'active';
                  handleFilterChange('isActive', isActive);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={() => setShowCreateForm(true)}
                className="w-full"
                size="sm"
              >
                <Plus className="w-4 h-4" />
                Nuevo Servicio
              </Button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedServices.length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedServices.length} servicios seleccionados
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
              >
                <Trash2 className="w-4 h-4" />
                Eliminar Seleccionados
              </Button>
            </div>
          )}
        </div>

        {/* Services Table */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 dark:text-red-400">Error al cargar los servicios</p>
              </div>
            </div>
          ) : !servicesData?.data?.data?.data?.length ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Stethoscope className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No se encontraron servicios</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedServices.length === (servicesData?.data?.data?.data?.length || 0)}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-800"
                      />
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Servicio</span>
                        <span className="text-gray-400 dark:text-gray-500">{getSortIcon('name')}</span>
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none"
                      onClick={() => handleSort('category')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Categoría</span>
                        <span className="text-gray-400 dark:text-gray-500">{getSortIcon('category')}</span>
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none"
                      onClick={() => handleSort('basePrice')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Precio</span>
                        <span className="text-gray-400 dark:text-gray-500">{getSortIcon('basePrice')}</span>
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none"
                      onClick={() => handleSort('duration')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Duración</span>
                        <span className="text-gray-400 dark:text-gray-500">{getSortIcon('duration')}</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Citas
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Fecha</span>
                        <span className="text-gray-400 dark:text-gray-500">{getSortIcon('createdAt')}</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {sortedServices.map((service: any) => (
                    <tr key={service.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedServices.includes(service.id)}
                          onChange={() => handleSelectService(service.id)}
                          className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-800"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {service.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {service.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
                          {service.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        ${service.basePrice?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {service.duration} min
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          service.isActive 
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' 
                            : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                        }`}>
                          {service.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {service.appointmentCount || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(service.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(service)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(service)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(service.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
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
          )}
        </div>

        {/* Pagination */}
        {servicesData?.data?.data?.pagination && servicesData.data.data.pagination.totalPages > 1 && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Mostrando {((filters.page || 1) - 1) * (filters.limit || 10) + 1} a {Math.min((filters.page || 1) * (filters.limit || 10), servicesData.data.data.pagination.total)} de {servicesData.data.data.pagination.total} servicios
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('page', (filters.page || 1) - 1)}
                  disabled={(filters.page || 1) <= 1}
                >
                  Anterior
                </Button>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Página {filters.page || 1} de {servicesData.data.data.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('page', (filters.page || 1) + 1)}
                  disabled={(filters.page || 1) >= servicesData.data.data.pagination.totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateForm && (
        <CreateServiceForm
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
        />
      )}

      {showEditForm && selectedService && (
        <CreateServiceForm
          isOpen={showEditForm}
          onClose={() => setShowEditForm(false)}
          service={selectedService}
        />
      )}

      {showDetails && selectedService && (
        <ServiceDetailsView
          service={selectedService}
          onClose={() => setShowDetails(false)}
          onEdit={() => {
            setShowDetails(false);
            setShowEditForm(true);
          }}
        />
      )}
    </div>
  );
}