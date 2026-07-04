import React, { useState, useRef } from 'react';
import { Boton } from './ui/Boton';
import { Entrada } from './ui/Entrada';
import { Etiqueta } from './ui/Etiqueta';
import { adminService } from '../services/admin.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { Doctor } from '@/types';

interface EditDoctorFormProps {
  doctor: Doctor;
  onSuccess: () => void;
  onCancel: () => void;
}

const specialties = [
  'Medicina General',
  'Cardiología',
  'Dermatología',
  'Endocrinología',
  'Gastroenterología',
  'Ginecología',
  'Neurología',
  'Oftalmología',
  'Ortopedia',
  'Pediatría',
  'Psiquiatría',
  'Radiología',
  'Urología',
  'Anestesiología',
  'Cirugía General',
  'Medicina Interna',
  'Oncología',
  'Reumatología',
  'Neumología',
  'Hematología'
];

export const EditDoctorForm: React.FC<EditDoctorFormProps> = ({ doctor, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    // User data
    email: doctor.user.email,
    firstName: doctor.user.firstName,
    lastName: doctor.user.lastName,
    phone: doctor.user.phone || '',
    isActive: doctor.user.isActive,
    isVerified: doctor.user.isVerified,

    // Doctor specific data
    licenseNumber: doctor.licenseNumber,
    specialty: doctor.specialty,
    experience: doctor.experience,
    consultationFee: doctor.consultationFee,
    bio: doctor.bio || '',
    isAvailable: doctor.isAvailable,
    logoPath: doctor.logoPath || '',
    signaturePath: doctor.signaturePath || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const updateDoctorMutation = useMutation({
    mutationFn: (data: any) => adminService.updateDoctor(doctor.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      toast.success('Doctor actualizado exitosamente');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar doctor');
    },
  });

  const uploadMediaMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`/api/v1/admin-panel/doctors/${doctor.id}/upload-media`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al subir archivos');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      toast.success('Archivos subidos exitosamente');
      setLogoFile(null);
      setSignatureFile(null);
      setLogoPreview(null);
      setSignaturePreview(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al subir archivos');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // First, upload files if any
      if (logoFile || signatureFile) {
        const formData = new FormData();
        if (logoFile) {
          formData.append('logo', logoFile);
        }
        if (signatureFile) {
          formData.append('signature', signatureFile);
        }
        await uploadMediaMutation.mutateAsync(formData);
      }

      // Then update doctor data
      await updateDoctorMutation.mutateAsync(formData);
    } catch (error) {
      console.error('Error updating doctor:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSignatureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignaturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Etiqueta htmlFor="firstName">Nombre *</Etiqueta>
          <Entrada
            id="firstName"
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Etiqueta htmlFor="lastName">Apellido *</Etiqueta>
          <Entrada
            id="lastName"
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Etiqueta htmlFor="email">Correo Electrónico *</Etiqueta>
          <Entrada
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Etiqueta htmlFor="phone">Teléfono</Etiqueta>
          <Entrada
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Etiqueta htmlFor="licenseNumber">Número de Licencia *</Etiqueta>
          <Entrada
            id="licenseNumber"
            value={formData.licenseNumber}
            onChange={(e) => handleChange('licenseNumber', e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Etiqueta htmlFor="specialty">Especialidad *</Etiqueta>
          <select
            id="specialty"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.specialty}
            onChange={(e) => handleChange('specialty', e.target.value)}
            disabled={isSubmitting}
          >
            {specialties.map(specialty => (
              <option key={specialty} value={specialty}>
                {specialty}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Etiqueta htmlFor="experience">Años de Experiencia *</Etiqueta>
          <Entrada
            id="experience"
            type="number"
            min="0"
            value={formData.experience}
            onChange={(e) => handleChange('experience', parseInt(e.target.value) || 0)}
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Etiqueta htmlFor="consultationFee">Tarifa de Consulta *</Etiqueta>
          <Entrada
            id="consultationFee"
            type="number"
            min="0"
            value={formData.consultationFee}
            onChange={(e) => handleChange('consultationFee', parseInt(e.target.value) || 0)}
            required
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div>
        <Etiqueta htmlFor="bio">Biografía</Etiqueta>
        <textarea
          id="bio"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          value={formData.bio}
          onChange={(e) => handleChange('bio', e.target.value)}
          disabled={isSubmitting}
          placeholder="Breve description profesional..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Etiqueta htmlFor="logo">Logo del Doctor</Etiqueta>
          <div className="mt-2">
            <input
              ref={logoInputRef}
              type="file"
              id="logo"
              accept="image/*"
              onChange={handleLogoChange}
              disabled={isSubmitting}
              className="hidden"
            />
            {logoPreview || formData.logoPath ? (
              <div className="space-y-2">
                <div className="relative w-full h-32 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-50">
                      <ImageIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <Boton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Cambiar Logo
                </Boton>
              </div>
            ) : (
              <Boton
                type="button"
                variant="outline"
                onClick={() => logoInputRef.current?.click()}
                disabled={isSubmitting}
                className="w-full h-32 border-2 border-dashed"
              >
                <div className="flex flex-col items-center">
                  <Upload className="h-8 w-8 mb-2 text-gray-400" />
                  <span className="text-sm text-gray-600">Subir Logo</span>
                  <span className="text-xs text-gray-400 mt-1">PNG, JPG hasta 10MB</span>
                </div>
              </Boton>
            )}
            {formData.logoPath && !logoPreview && (
              <p className="text-xs text-gray-500 mt-1">Actual: {formData.logoPath}</p>
            )}
          </div>
        </div>

        <div>
          <Etiqueta htmlFor="signature">Firma del Doctor</Etiqueta>
          <div className="mt-2">
            <input
              ref={signatureInputRef}
              type="file"
              id="signature"
              accept="image/*"
              onChange={handleSignatureChange}
              disabled={isSubmitting}
              className="hidden"
            />
            {signaturePreview || formData.signaturePath ? (
              <div className="space-y-2">
                <div className="relative w-full h-32 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                  {signaturePreview ? (
                    <img
                      src={signaturePreview}
                      alt="Signature preview"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-50">
                      <ImageIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <Boton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => signatureInputRef.current?.click()}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Cambiar Firma
                </Boton>
              </div>
            ) : (
              <Boton
                type="button"
                variant="outline"
                onClick={() => signatureInputRef.current?.click()}
                disabled={isSubmitting}
                className="w-full h-32 border-2 border-dashed"
              >
                <div className="flex flex-col items-center">
                  <Upload className="h-8 w-8 mb-2 text-gray-400" />
                  <span className="text-sm text-gray-600">Subir Firma</span>
                  <span className="text-xs text-gray-400 mt-1">PNG, JPG hasta 10MB</span>
                </div>
              </Boton>
            )}
            {formData.signaturePath && !signaturePreview && (
              <p className="text-xs text-gray-500 mt-1">Actual: {formData.signaturePath}</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Etiqueta htmlFor="isActive">Usuario Activo</Etiqueta>
            <p className="text-sm text-gray-500">El doctor puede iniciar sesión</p>
          </div>
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => handleChange('isActive', e.target.checked)}
            disabled={isSubmitting}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Etiqueta htmlFor="isVerified">Usuario Verificado</Etiqueta>
            <p className="text-sm text-gray-500">El doctor ha verificado su email electrónico</p>
          </div>
          <input
            type="checkbox"
            id="isVerified"
            checked={formData.isVerified}
            onChange={(e) => handleChange('isVerified', e.target.checked)}
            disabled={isSubmitting}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Etiqueta htmlFor="isAvailable">Disponible para Citas</Etiqueta>
            <p className="text-sm text-gray-500">El doctor puede recibir nuevas citas</p>
          </div>
          <input
            type="checkbox"
            id="isAvailable"
            checked={formData.isAvailable}
            onChange={(e) => handleChange('isAvailable', e.target.checked)}
            disabled={isSubmitting}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Boton
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Boton>
        <Boton
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting ? 'Actualizando...' : 'Actualizar Doctor'}
        </Boton>
      </div>
    </form>
  );
};
