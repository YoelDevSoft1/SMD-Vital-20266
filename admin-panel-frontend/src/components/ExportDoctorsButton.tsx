import React from 'react';
import { Button } from '@/components/ui/Button';
import { Doctor } from '@/types';

interface ExportDoctorsButtonProps {
  doctors: Doctor[];
  selectedDoctors?: string[];
}

export const ExportDoctorsButton: React.FC<ExportDoctorsButtonProps> = ({ doctors, selectedDoctors }) => {
  const exportToCSV = () => {
    const doctorsToExport = selectedDoctors 
      ? doctors.filter(doctor => selectedDoctors.includes(doctor.id))
      : doctors;

    const headers = [
      'ID',
      'Nombre',
      'Apellido',
      'Email',
      'Teléfono',
      'Número de Licencia',
      'Especialidad',
      'Experiencia (años)',
      'Calificación',
      'Reseñas',
      'Tarifa de Consulta',
      'Disponible',
      'Activo',
      'Verificado',
      'Fecha de Registro'
    ];

    const csvContent = [
      headers.join(','),
      ...doctorsToExport.map(doctor => [
        doctor.id,
        `"${doctor.user.firstName}"`,
        `"${doctor.user.lastName}"`,
        `"${doctor.user.email}"`,
        `"${doctor.user.phone || ''}"`,
        `"${doctor.licenseNumber}"`,
        `"${doctor.specialty}"`,
        doctor.experience,
        doctor.rating.toFixed(1),
        doctor.totalReviews,
        doctor.consultationFee,
        doctor.isAvailable ? 'Sí' : 'No',
        doctor.user.isActive ? 'Sí' : 'No',
        doctor.user.isVerified ? 'Sí' : 'No',
        doctor.user.createdAt 
          ? (() => {
              try {
                const date = new Date(doctor.user.createdAt);
                return isNaN(date.getTime()) 
                  ? 'Fecha inválida' 
                  : date.toLocaleDateString('es-ES');
              } catch (error) {
                return 'Error al parsear fecha';
              }
            })()
          : 'No disponible'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `doctores_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    const doctorsToExport = selectedDoctors 
      ? doctors.filter(doctor => selectedDoctors.includes(doctor.id))
      : doctors;

    const jsonContent = JSON.stringify(doctorsToExport.map(doctor => ({
      id: doctor.id,
      nombre: doctor.user.firstName,
      apellido: doctor.user.lastName,
      email: doctor.user.email,
      telefono: doctor.user.phone || '',
      numeroLicencia: doctor.licenseNumber,
      especialidad: doctor.specialty,
      experiencia: doctor.experience,
      calificacion: doctor.rating,
      reseñas: doctor.totalReviews,
      tarifaConsulta: doctor.consultationFee,
      disponible: doctor.isAvailable ? 'Sí' : 'No',
      activo: doctor.user.isActive ? 'Sí' : 'No',
      verificado: doctor.user.isVerified ? 'Sí' : 'No',
      fechaRegistro: doctor.user.createdAt 
        ? (() => {
            try {
              const date = new Date(doctor.user.createdAt);
              return isNaN(date.getTime()) 
                ? 'Fecha inválida' 
                : date.toLocaleDateString('es-ES');
            } catch (error) {
              return 'Error al parsear fecha';
            }
          })()
        : 'No disponible',
      biografia: doctor.bio || ''
    })), null, 2);

    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `doctores_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const doctorsToExport = selectedDoctors 
    ? doctors.filter(doctor => selectedDoctors.includes(doctor.id))
    : doctors;

  if (doctorsToExport.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      <Button
        size="sm"
        variant="outline"
        onClick={exportToCSV}
        className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Exportar CSV
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={exportToJSON}
        className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Exportar JSON
      </Button>
    </div>
  );
};
