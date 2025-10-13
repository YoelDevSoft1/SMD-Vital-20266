import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { Users, Stethoscope, Calendar, DollarSign, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => adminService.getDashboard(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error al cargar el dashboard. Por favor intenta de nuevo.</p>
      </div>
    );
  }

  const stats = data?.data.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Bienvenido al panel de administración</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Usuarios"
          value={stats?.overview.totalUsers || 0}
          icon={Users}
          color="blue"
          trend={stats?.growth.users}
        />
        <StatCard
          title="Doctores Activos"
          value={stats?.overview.verifiedDoctors || 0}
          icon={Stethoscope}
          color="green"
        />
        <StatCard
          title="Citas"
          value={stats?.overview.totalAppointments || 0}
          icon={Calendar}
          color="purple"
          trend={stats?.growth.appointments}
        />
        <StatCard
          title="Ingresos Totales"
          value={formatCurrency(stats?.overview.totalRevenue || 0)}
          icon={DollarSign}
          color="yellow"
        />
      </div>

      {/* Appointment Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Estado de Citas</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-3xl font-bold text-blue-600">{stats?.appointments.pending || 0}</p>
            <p className="text-sm text-gray-600 mt-1">Pendientes</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-3xl font-bold text-green-600">{stats?.appointments.completed || 0}</p>
            <p className="text-sm text-gray-600 mt-1">Completadas</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-3xl font-bold text-red-600">{stats?.appointments.cancelled || 0}</p>
            <p className="text-sm text-gray-600 mt-1">Canceladas</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-3xl font-bold text-purple-600">
              {stats?.appointments.completionRate.toFixed(1) || 0}%
            </p>
            <p className="text-sm text-gray-600 mt-1">Tasa de Éxito</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Usuarios Recientes</h2>
          <div className="space-y-3">
            {stats?.recentActivity.users.slice(0, 5).map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    user.role === 'ADMIN'
                      ? 'bg-purple-100 text-purple-800'
                      : user.role === 'DOCTOR'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {user.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Citas Recientes</h2>
          <div className="space-y-3">
            {stats?.recentActivity.appointments.slice(0, 5).map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {appointment.patient?.user.firstName} {appointment.patient?.user.lastName}
                  </p>
                  <p className="text-sm text-gray-500">
                    Dr. {appointment.doctor?.user.firstName}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    appointment.status === 'COMPLETED'
                      ? 'bg-green-100 text-green-800'
                      : appointment.status === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {appointment.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: any;
  color: 'blue' | 'green' | 'purple' | 'yellow';
  trend?: number;
}

function StatCard({ title, value, icon: Icon, color, trend }: StatCardProps) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    yellow: 'bg-yellow-100 text-yellow-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center mt-2">
              {trend >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
              )}
              <span className={`text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(trend).toFixed(1)}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs mes anterior</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
}
