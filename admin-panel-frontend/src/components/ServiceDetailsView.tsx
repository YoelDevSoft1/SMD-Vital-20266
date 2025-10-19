import React from 'react';
import { X, Stethoscope, DollarSign, Clock, Calendar, Activity, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from './ui/Button';
import type { Service, ServiceCategory } from '@/types';

interface ServiceDetailsViewProps {
  service: Service;
  onClose: () => void;
  onEdit: () => void;
}

export default function ServiceDetailsView({ service, onClose, onEdit }: ServiceDetailsViewProps) {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
              <Stethoscope className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{service.name}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Detalles del servicio</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="w-4 h-4" />
              Editar
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Información Básica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Nombre del Servicio</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">{service.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Categoría</label>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(service.category)} dark:bg-opacity-20`}>
                    {getCategoryLabel(service.category)}
                  </span>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Descripción</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">{service.description}</p>
              </div>
            </div>
          </div>

          {/* Pricing and Duration */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Precios y Duración</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Precio Base</label>
                <div className="flex items-center mt-1">
                  <DollarSign className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-1" />
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP'
                    }).format(service.basePrice)}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Duración</label>
                <div className="flex items-center mt-1">
                  <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-1" />
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{service.duration} minutos</p>
                </div>
              </div>
            </div>
          </div>

          {/* Status and Activity */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Estado y Actividad</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Estado</label>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    service.isActive ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                  }`}>
                    {service.isActive ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Activo
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 mr-1" />
                        Inactivo
                      </>
                    )}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Citas Realizadas</label>
                <div className="flex items-center mt-1">
                  <Activity className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-1" />
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {service._count?.appointments || 0} citas
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Requirements */}
          {service.requirements && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Requisitos</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">{service.requirements}</p>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Fechas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Fecha de Creación</label>
                <div className="flex items-center mt-1">
                  <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                  <p className="text-sm text-gray-900">
                    {new Date(service.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Última Actualización</label>
                <div className="flex items-center mt-1">
                  <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                  <p className="text-sm text-gray-900">
                    {new Date(service.updatedAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={onEdit}>
            <Edit className="w-4 h-4" />
            Editar Servicio
          </Button>
        </div>
      </div>
    </div>
  );
}
