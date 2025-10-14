import { Doctor } from '@/types';

interface DoctorDetailsViewProps {
  doctor: Doctor;
}

export default function DoctorDetailsView({ doctor }: DoctorDetailsViewProps) {
  // Debug: Log the doctor data to see the date format
  console.log('Doctor data for dates:', {
    createdAt: doctor.user.createdAt,
    updatedAt: doctor.user.updatedAt,
    createdAtType: typeof doctor.user.createdAt,
    updatedAtType: typeof doctor.user.updatedAt,
    userKeys: Object.keys(doctor.user),
    userValues: Object.values(doctor.user)
  });

  const getSpecialtyBadgeColor = (specialty: string) => {
    const colors = {
      'Medicina General': 'bg-blue-100 text-blue-800',
      'Cardiología': 'bg-red-100 text-red-800',
      'Dermatología': 'bg-pink-100 text-pink-800',
      'Endocrinología': 'bg-yellow-100 text-yellow-800',
      'Gastroenterología': 'bg-green-100 text-green-800',
      'Ginecología': 'bg-purple-100 text-purple-800',
      'Neurología': 'bg-indigo-100 text-indigo-800',
      'Oftalmología': 'bg-cyan-100 text-cyan-800',
      'Ortopedia': 'bg-orange-100 text-orange-800',
      'Pediatría': 'bg-teal-100 text-teal-800',
    };
    return colors[specialty as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Doctor Header */}
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0 h-16 w-16">
          {doctor.user.avatar ? (
            <img
              className="h-16 w-16 rounded-full"
              src={doctor.user.avatar}
              alt={`${doctor.user.firstName} ${doctor.user.lastName}`}
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-lg font-medium text-gray-700">
                {doctor.user.firstName[0]}{doctor.user.lastName[0]}
              </span>
            </div>
          )}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Dr. {doctor.user.firstName} {doctor.user.lastName}
          </h2>
          <p className="text-gray-600">{doctor.licenseNumber}</p>
          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getSpecialtyBadgeColor(doctor.specialty)}`}>
            {doctor.specialty}
          </span>
        </div>
      </div>

      {/* Doctor Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Información Personal</h3>
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium text-gray-500">Email:</span>
              <p className="text-sm text-gray-900">{doctor.user.email}</p>
            </div>
            {doctor.user.phone && (
              <div>
                <span className="text-sm font-medium text-gray-500">Teléfono:</span>
                <p className="text-sm text-gray-900">{doctor.user.phone}</p>
              </div>
            )}
            <div>
              <span className="text-sm font-medium text-gray-500">Estado del Usuario:</span>
              <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                doctor.user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {doctor.user.isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Verificado:</span>
              <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                doctor.user.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {doctor.user.isVerified ? 'Sí' : 'No'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Información Profesional</h3>
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium text-gray-500">Años de Experiencia:</span>
              <p className="text-sm text-gray-900">{doctor.experience} años</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Tarifa de Consulta:</span>
              <p className="text-sm text-gray-900">${doctor.consultationFee.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Disponibilidad:</span>
              <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                doctor.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {doctor.isAvailable ? 'Disponible' : 'No disponible'}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Calificación:</span>
              <div className="flex items-center mt-1">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`h-4 w-4 ${i < Math.floor(doctor.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600">
                  {doctor.rating.toFixed(1)} ({doctor.totalReviews} reseñas)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bio */}
      {doctor.bio && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Biografía</h3>
          <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
            {doctor.bio}
          </p>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {doctor._count?.appointments || 0}
          </div>
          <div className="text-sm text-blue-800">Citas Totales</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {doctor._count?.reviews || 0}
          </div>
          <div className="text-sm text-green-800">Reseñas</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {doctor.rating.toFixed(1)}
          </div>
          <div className="text-sm text-yellow-800">Calificación Promedio</div>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
        <div>
          <span className="font-medium">Fecha de Registro:</span>
          <p>
            {doctor.user.createdAt 
              ? (() => {
                  try {
                    const date = new Date(doctor.user.createdAt);
                    return isNaN(date.getTime()) 
                      ? 'Fecha inválida' 
                      : date.toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        });
                  } catch (error) {
                    console.error('Error parsing createdAt:', error, doctor.user.createdAt);
                    return 'Error al parsear fecha';
                  }
                })()
              : 'Doctor registrado recientemente'
            }
          </p>
        </div>
        <div>
          <span className="font-medium">Última Actualización:</span>
          <p>
            {doctor.user.updatedAt 
              ? (() => {
                  try {
                    const date = new Date(doctor.user.updatedAt);
                    return isNaN(date.getTime()) 
                      ? 'Fecha inválida' 
                      : date.toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        });
                  } catch (error) {
                    console.error('Error parsing updatedAt:', error, doctor.user.updatedAt);
                    return 'Error al parsear fecha';
                  }
                })()
              : 'Información actualizada recientemente'
            }
          </p>
        </div>
      </div>

      {/* Debug Information - Solo visible en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-2">Debug Info (Solo en desarrollo):</h4>
          <div className="text-xs text-yellow-700">
            <p><strong>User Keys:</strong> {Object.keys(doctor.user).join(', ')}</p>
            <p><strong>CreatedAt:</strong> {JSON.stringify(doctor.user.createdAt)}</p>
            <p><strong>UpdatedAt:</strong> {JSON.stringify(doctor.user.updatedAt)}</p>
            <p><strong>User Object:</strong> {JSON.stringify(doctor.user, null, 2)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
