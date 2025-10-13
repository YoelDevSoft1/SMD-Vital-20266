import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(requireRole(['ADMIN', 'SUPER_ADMIN']));

// Placeholder routes - implement as needed
router.get('/', (_req, res) => {
  res.json({ message: 'Admin routes - to be implemented' });
});

export default router;

