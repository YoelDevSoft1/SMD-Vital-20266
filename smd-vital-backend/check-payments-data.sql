-- Verificar datos de pagos
SELECT 
  'Total Payments' as metric, 
  COUNT(*) as count 
FROM payments
UNION ALL
SELECT 
  'Completed Payments', 
  COUNT(*) 
FROM payments 
WHERE status = 'COMPLETED'
UNION ALL
SELECT 
  'Pending Payments', 
  COUNT(*) 
FROM payments 
WHERE status = 'PENDING'
UNION ALL
SELECT 
  'Failed Payments', 
  COUNT(*) 
FROM payments 
WHERE status = 'FAILED'
UNION ALL
SELECT 
  'Total Revenue', 
  COALESCE(SUM(amount), 0) 
FROM payments 
WHERE status = 'COMPLETED';

-- Ver algunos pagos de ejemplo
SELECT id, amount, status, "createdAt" FROM payments LIMIT 5;
