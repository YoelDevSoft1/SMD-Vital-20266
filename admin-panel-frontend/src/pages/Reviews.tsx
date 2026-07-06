import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Star, 
  MessageSquare, 
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
  Activity,
  Shield,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { Boton } from '@/components/ui/Boton';
import { Entrada } from '@/components/ui/Entrada';
import { Etiqueta } from '@/components/ui/Etiqueta';
import { Seleccion } from '@/components/ui/Seleccion';
import { Interruptor } from '@/components/ui/Interruptor';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { EsqueletoLista } from '@/components/ui/Esqueleto';
import { adminService } from '@/services/admin.service';
import ReviewsModal from '@/components/ReviewsModal';
import ReviewDetailsView from '@/components/ReviewDetailsView';
import CreateReviewForm from '@/components/CreateReviewForm';
import { ReviewFilters } from '@/types';

export default function Reviews() {
  const [showModal, setShowModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);

  // Fetch reviews data
  const { data: reviewsData, isLoading: isLoadingReviews } = useQuery({
    queryKey: ['reviews-stats'],
    queryFn: () => adminService.getReviews({ page: 1, limit: 5 })
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

  const handleViewDetails = (review: any) => {
    setSelectedReview(review);
    setShowDetails(true);
  };

  // Calculate review statistics
  const reviews = (reviewsData?.data?.data?.data as any[]) || [];
  const totalReviews = reviewsData?.data?.data?.pagination?.total || 0;
  const verifiedReviews = reviews.filter((r: any) => r.isVerified).length || 0;
  const unverifiedReviews = reviews.filter((r: any) => !r.isVerified).length || 0;
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
    : 0;

  const stats = [
    {
      title: 'Total Reseñas',
      value: totalReviews,
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: '+15%',
      changeType: 'positive'
    },
    {
      title: 'Reseñas Verificadas',
      value: verifiedReviews,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'Pendientes',
      value: unverifiedReviews,
      icon: AlertCircle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      change: '-3%',
      changeType: 'negative'
    },
    {
      title: 'Calificación Promedio',
      value: averageRating.toFixed(1),
      icon: Star,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: '+0.2',
      changeType: 'positive'
    }
  ];

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current dark:text-yellow-500' : 'text-muted-foreground dark:text-muted-foreground'
        }`}
      />
    ));
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-900/20';
    if (rating >= 3.5) return 'text-yellow-600 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/20';
    if (rating >= 2.5) return 'text-orange-600 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/20';
    return 'text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-900/20';
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return 'Excelente';
    if (rating >= 3.5) return 'Bueno';
    if (rating >= 2.5) return 'Regular';
    return 'Malo';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl dark:text-foreground">Gestión de Reseñas</h1>
          <p className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">Administra todas las reseñas y calificaciones del sistema</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Boton
            variant="outline"
            onClick={handleViewAll}
            leftIcon={<Filter className="h-4 w-4" />}
          >
            Ver Todas
          </Boton>
          <Boton
            onClick={handleCreateNew}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Nueva Reseña
          </Boton>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-card rounded-lg shadow p-6 border border-border dark:border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold text-foreground dark:text-foreground">{stat.value}</p>
                <div className="flex items-center mt-2">
                  {stat.changeType === 'positive' ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
                  )}
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-muted-foreground dark:text-muted-foreground ml-1">vs mes anterior</span>
                </div>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor} dark:bg-opacity-20`}>
                <stat.icon className={`w-6 h-6 ${stat.color} dark:opacity-80`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Reviews */}
      <div className="bg-white dark:bg-card rounded-lg shadow border border-border dark:border-border">
        <div className="p-6 border-b border-border dark:border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground dark:text-foreground">Reseñas Recientes</h2>
            <Boton variant="outline" onClick={handleViewAll}>
              Ver todas las reseñas
            </Boton>
          </div>
        </div>
        <div className="p-6">
          {isLoadingReviews ? (
            <EsqueletoLista rows={4} />
          ) : reviews.length === 0 ? (
            <EstadoVacio
              icon={MessageSquare}
              title="No hay reseñas"
              description="No se encontraron reseñas recientes."
              action={
                <Boton
                  variant="primary"
                  onClick={handleCreateNew}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Crear Primera Reseña
                </Boton>
              }
              size="md"
            />
          ) : (
            <div className="space-y-4">
              {reviews.slice(0, 5).map((review: any) => (
                <div key={review.id} className="flex items-start justify-between p-4 border border-border dark:border-border rounded-lg hover:shadow-md transition-shadow bg-white dark:bg-card">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                      <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <p className="font-medium text-foreground dark:text-foreground">
                          {review.patient?.user?.firstName} {review.patient?.user?.lastName}
                        </p>
                        <span className="text-sm text-muted-foreground dark:text-muted-foreground">para</span>
                        <p className="font-medium text-foreground dark:text-foreground">
                          Dr. {review.doctor?.user?.firstName} {review.doctor?.user?.lastName}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="flex items-center">
                          {getRatingStars(review.rating)}
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRatingColor(review.rating)} dark:bg-opacity-20`}>
                          {getRatingLabel(review.rating)}
                        </span>
                        <span className="text-sm text-muted-foreground dark:text-muted-foreground">
                          {review.rating}/5
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-2 line-clamp-2">
                          {review.comment}
                        </p>
                      )}
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground dark:text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(review.createdAt).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      review.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {review.isVerified ? (
                        <>
                          <Shield className="w-3 h-3" />
                          Verificada
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          Pendiente
                        </>
                      )}
                    </span>
                    <Boton
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(review)}
                    >
                      <Eye className="w-4 h-4" />
                    </Boton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ReviewsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />

      <CreateReviewForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
      />

      {selectedReview && (
        <ReviewDetailsView
          review={selectedReview}
          onClose={() => {
            setShowDetails(false);
            setSelectedReview(null);
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
