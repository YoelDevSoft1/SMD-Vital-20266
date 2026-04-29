import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from './store/auth.store';
import DashboardLayout from './components/layout/DashboardLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Doctors from './pages/Doctors';
import Appointments from './pages/Appointments';
import Payments from './pages/Payments';
import Services from './pages/Services';
import Reviews from './pages/Reviews';
import Analytics from './pages/Analytics';
import SystemHealth from './pages/SystemHealth';
import AuditLogs from './pages/AuditLogs';
import RipsDrafts from './pages/RipsDrafts';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorAppointments from './pages/DoctorAppointments';
import PatientDashboard from './pages/PatientDashboard';
import PatientHistory from './pages/PatientHistory';
import type { UserRole } from './types';
import { getHomePath } from './utils/roles';
import { realtimeService } from './services/realtime.service';

function RoleRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={getHomePath(user.role)} replace />;
  }

  return <>{children}</>;
}

function RealtimeBridge() {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    return realtimeService.connect((event) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['clinical-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['doctor-my-route'] });
      queryClient.invalidateQueries({ queryKey: ['doctor-my-availability'] });
      queryClient.invalidateQueries({ queryKey: ['appointment-timeline', event.appointmentId] });
    });
  }, [isAuthenticated, queryClient, user]);

  return null;
}

export default function App() {
  return (
    <>
      <RealtimeBridge />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <RoleRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
              <DashboardLayout />
            </RoleRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="doctors" element={<Doctors />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="payments" element={<Payments />} />
          <Route path="services" element={<Services />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="system" element={<SystemHealth />} />
          <Route path="audit" element={<AuditLogs />} />
          <Route path="rips" element={<RipsDrafts />} />
        </Route>

        <Route
          path="/doctor"
          element={
            <RoleRoute allowedRoles={['DOCTOR', 'NURSE']}>
              <DashboardLayout />
            </RoleRoute>
          }
        >
          <Route index element={<DoctorDashboard />} />
          <Route path="appointments" element={<DoctorAppointments />} />
        </Route>

        <Route
          path="/patient"
          element={
            <RoleRoute allowedRoles={['PATIENT']}>
              <DashboardLayout />
            </RoleRoute>
          }
        >
          <Route index element={<PatientDashboard />} />
          <Route path="history" element={<PatientHistory />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}
