import React from 'react';
import { Button } from '@/components/ui/Button';
import { User } from '@/types';

interface ExportUsersButtonProps {
  users: User[];
  selectedUsers?: string[];
}

const roleTranslations = {
  SUPER_ADMIN: 'Super Administrador',
  ADMIN: 'Administrador',
  DOCTOR: 'Médico',
  NURSE: 'Enfermero/a',
  PATIENT: 'Paciente',
} as const;

export const ExportUsersButton: React.FC<ExportUsersButtonProps> = ({ users, selectedUsers }) => {
  const exportToCSV = () => {
    const usersToExport = selectedUsers 
      ? users.filter(user => selectedUsers.includes(user.id))
      : users;

    const headers = [
      'ID',
      'Nombre',
      'Apellido',
      'Email',
      'Teléfono',
      'Rol',
      'Estado',
      'Verificado',
      'Fecha de Registro'
    ];

    const csvContent = [
      headers.join(','),
      ...usersToExport.map(user => [
        user.id,
        `"${user.firstName}"`,
        `"${user.lastName}"`,
        `"${user.email}"`,
        `"${user.phone || ''}"`,
        `"${roleTranslations[user.role as keyof typeof roleTranslations] || user.role}"`,
        user.isActive ? 'Activo' : 'Inactivo',
        user.isVerified ? 'Sí' : 'No',
        new Date(user.createdAt).toLocaleDateString('es-ES')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `usuarios_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    const usersToExport = selectedUsers 
      ? users.filter(user => selectedUsers.includes(user.id))
      : users;

    const jsonContent = JSON.stringify(usersToExport.map(user => ({
      id: user.id,
      nombre: user.firstName,
      apellido: user.lastName,
      email: user.email,
      telefono: user.phone || '',
      rol: roleTranslations[user.role as keyof typeof roleTranslations] || user.role,
      estado: user.isActive ? 'Activo' : 'Inactivo',
      verificado: user.isVerified ? 'Sí' : 'No',
      fechaRegistro: new Date(user.createdAt).toLocaleDateString('es-ES')
    })), null, 2);

    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `usuarios_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const usersToExport = selectedUsers 
    ? users.filter(user => selectedUsers.includes(user.id))
    : users;

  if (usersToExport.length === 0) {
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
