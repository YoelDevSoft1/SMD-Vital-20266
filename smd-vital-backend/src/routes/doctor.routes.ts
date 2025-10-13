import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All doctor routes require authentication
router.use(authMiddleware);

// Placeholder routes - implement as needed
router.get('/', (_req, res) => {
  res.json({ message: 'Doctor routes - to be implemented' });
});

export default router;

