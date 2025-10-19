import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, MessageSquare, Filter, Search, Plus, Edit, Trash2, Eye, CheckCircle, XCircle, AlertCircle, Download, Calendar, Star, Shield, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/label';
import { Select } from './ui/select';
import { Switch } from './ui/switch';
import { toast } from 'react-hot-toast';
import { adminService } from '@/services/admin.service';
import type { Review, ReviewFilters } from '@/types';
import ReviewDetailsView from './ReviewDetailsView';
import CreateReviewForm from './CreateReviewForm';

interface ReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReviewsModal({ isOpen, onClose }: ReviewsModalProps) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ReviewFilters>({
    page: 1,
    limit: 10,
    rating: undefined,
    isVerified: undefined,
    search: '',
    doctorId: '',
    patientId: '',
    dateFrom: '',
    dateTo: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  // Fetch reviews
  const { data: reviewsData, isLoading, error } = useQuery({
    queryKey: ['reviews', filters],
    queryFn: () => adminService.getReviews(filters),
    enabled: isOpen,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutations for actions
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteReview(id),
    onSuccess: () => {
      toast.success('Reseña eliminada correctamente');
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      setSelectedReviews([]);
    },
    onError: (err: any) => {
      toast.error(`Error al eliminar reseña: ${err.message}`);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => adminService.verifyReview(id),
    onSuccess: () => {
      toast.success('Reseña verificada correctamente');
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
    onError: (err: any) => {
      toast.error(`Error al verificar reseña: ${err.message}`);
    },
  });

  const handleViewDetails = (review: Review) => {
    setSelectedReview(review);
    setShowDetails(true);
  };

  const handleEdit = (review: Review) => {
    setSelectedReview(review);
    setShowEditForm(true);
  };

  const handleDelete = (reviewId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta reseña?')) {
      deleteMutation.mutate(reviewId);
    }
  };

  const handleVerify = (reviewId: string) => {
    if (window.confirm('¿Estás seguro de que quieres verificar esta reseña?')) {
      verifyMutation.mutate(reviewId);
    }
  };

  const handleSelectReview = (reviewId: string) => {
    setSelectedReviews(prev => 
      prev.includes(reviewId) 
        ? prev.filter(id => id !== reviewId)
        : [...prev, reviewId]
    );
  };

  const handleSelectAll = () => {
    const allReviewIds = reviewsData?.data?.data?.data?.map(review => review.id) || [];
    setSelectedReviews(
      selectedReviews.length === allReviewIds.length ? [] : allReviewIds
    );
  };

  const handleBulkVerify = () => {
    if (window.confirm(`¿Estás seguro de que quieres verificar ${selectedReviews.length} reseñas?`)) {
      selectedReviews.forEach(id => {
        verifyMutation.mutate(id);
      });
    }
    setSelectedReviews([]);
  };
  
  const handleExport = (format: 'csv' | 'json') => {
    // TODO: Implement export functionality
    toast.success(`Exportando reseñas en formato ${format.toUpperCase()}`);
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
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

  // Debug logging
  console.log('=== REVIEWS MODAL DEBUG ===');
  console.log('Has reviewsData:', !!reviewsData);
  console.log('Reviews data structure:', reviewsData ? Object.keys(reviewsData) : []);
  console.log('Data structure:', reviewsData?.data ? Object.keys(reviewsData.data) : []);
  console.log('Data.data structure:', reviewsData?.data?.data ? Object.keys(reviewsData.data.data) : []);
  console.log('Reviews array length:', reviewsData?.data?.data?.data?.length || 0);
  console.log('Is loading:', isLoading);
  console.log('Error:', error);
  console.log('========================');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Todas las Reseñas</h2>
          <div className="flex items-center space-x-2">
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4" />
              Nueva Reseña
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative col-span-full md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <Input
              type="text"
              placeholder="Buscar por paciente, doctor, comentario..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="rating" className="text-gray-700 dark:text-gray-300">Calificación</Label>
            <Select
              value={filters.rating || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value ? Number(e.target.value) : undefined, page: 1 }))}
            >
              <option value="">Todas las calificaciones</option>
              <option value="5">5 estrellas</option>
              <option value="4">4 estrellas</option>
              <option value="3">3 estrellas</option>
              <option value="2">2 estrellas</option>
              <option value="1">1 estrella</option>
            </Select>
          </div>

          <div>
            <Label htmlFor="status" className="text-gray-700 dark:text-gray-300">Estado</Label>
            <Select
              value={filters.isVerified === undefined ? '' : filters.isVerified ? 'true' : 'false'}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                isVerified: e.target.value === '' ? undefined : e.target.value === 'true',
                page: 1 
              }))}
            >
              <option value="">Todos los estados</option>
              <option value="true">Verificadas</option>
              <option value="false">Pendientes</option>
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
          <div>
            <Label htmlFor="dateTo">Fecha Hasta</Label>
            <Input
              id="dateTo"
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value, page: 1 }))}
            />
          </div>
          <Button onClick={() => setFilters({ page: 1, limit: 10, rating: undefined, isVerified: undefined, search: '', doctorId: '', patientId: '', dateFrom: '', dateTo: '' })} variant="outline">
            Limpiar Filtros
          </Button>
        </div>

        {/* Bulk Actions */}
        {selectedReviews.length > 0 && (
          <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
            <span className="text-sm text-gray-700">
              {selectedReviews.length} reseñas seleccionadas
            </span>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleBulkVerify}>
                <Shield className="w-4 h-4 mr-1" />
                Verificar
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedReviews([])}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Reviews Table */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600">Error al cargar las reseñas</p>
              </div>
            </div>
          ) : !reviewsData?.data?.data?.data?.length ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No se encontraron reseñas</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedReviews.length === (reviewsData?.data?.data?.data?.length || 0)}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reseña
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paciente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Calificación
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
                  {reviewsData?.data?.data?.data?.map((review: any) => (
                    <tr key={review.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedReviews.includes(review.id)}
                          onChange={() => handleSelectReview(review.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="max-w-xs">
                          <p className="text-sm text-gray-900 truncate">
                            {review.comment || 'Sin comentario'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {review.patient?.user?.firstName} {review.patient?.user?.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Dr. {review.doctor?.user?.firstName} {review.doctor?.user?.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <div className="flex items-center">
                            {getRatingStars(review.rating)}
                          </div>
                          <span className="text-sm text-gray-500 ml-1">
                            {review.rating}/5
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          review.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {review.isVerified ? (
                            <>
                              <Shield className="w-3 h-3 mr-1" />
                              Verificada
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Pendiente
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(review)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(review)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {!review.isVerified && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVerify(review.id)}
                            >
                              <Shield className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(review.id)}
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
        {reviewsData?.data?.data?.pagination && reviewsData.data.data.pagination.totalPages > 1 && (
          <div className="border-t p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando{' '}
                <span className="font-medium">
                  {((filters.page! - 1) * filters.limit!) + 1}
                </span>{' '}
                a{' '}
                <span className="font-medium">
                  {Math.min(filters.page! * filters.limit!, reviewsData.data.data.pagination.total)}
                </span>{' '}
                de{' '}
                <span className="font-medium">{reviewsData.data.data.pagination.total}</span>{' '}
                resultados
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page! - 1 }))}
                  disabled={!reviewsData.data.data.pagination.hasPrev}
                >
                  Anterior
                </Button>
                <span className="text-sm text-gray-700">
                  Página {filters.page} de {reviewsData.data.data.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page! + 1 }))}
                  disabled={!reviewsData.data.data.pagination.hasNext}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showDetails && selectedReview && (
        <ReviewDetailsView
          review={selectedReview}
          onClose={() => {
            setShowDetails(false);
            setSelectedReview(null);
          }}
          onEdit={() => {
            setShowDetails(false);
            setShowEditForm(true);
          }}
        />
      )}

      {showEditForm && selectedReview && (
        <CreateReviewForm
          isOpen={showEditForm}
          onClose={() => {
            setShowEditForm(false);
            setSelectedReview(null);
          }}
          review={selectedReview}
        />
      )}

      {showCreateForm && (
        <CreateReviewForm
          isOpen={showCreateForm}
          onClose={() => {
            setShowCreateForm(false);
          }}
        />
      )}
    </div>
  );
}
