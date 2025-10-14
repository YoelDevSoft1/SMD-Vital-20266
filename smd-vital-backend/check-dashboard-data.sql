-- Verificar datos para el dashboard
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Patients', COUNT(*) FROM patients
UNION ALL
SELECT 'Doctors', COUNT(*) FROM doctors
UNION ALL
SELECT 'Appointments', COUNT(*) FROM appointments
UNION ALL
SELECT 'Payments', COUNT(*) FROM payments
UNION ALL
SELECT 'Reviews', COUNT(*) FROM reviews
UNION ALL
SELECT 'Services', COUNT(*) FROM services;

-- Verificar usuarios activos
SELECT 'Active Users' as metric, COUNT(*) as count FROM users WHERE "isActive" = true;

-- Verificar doctores disponibles
SELECT 'Available Doctors' as metric, COUNT(*) as count FROM doctors WHERE "isAvailable" = true;

-- Verificar citas por estado
SELECT 'Pending Appointments' as status, COUNT(*) as count FROM appointments WHERE status = 'PENDING'
UNION ALL
SELECT 'Completed Appointments', COUNT(*) FROM appointments WHERE status = 'COMPLETED'
UNION ALL
SELECT 'Cancelled Appointments', COUNT(*) FROM appointments WHERE status = 'CANCELLED';

-- Verificar ingresos
SELECT 'Total Revenue' as metric, COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'COMPLETED';
