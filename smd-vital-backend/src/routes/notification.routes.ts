import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All notification routes require authentication
router.use(authMiddleware);

// Placeholder routes - implement as needed
router.get('/', (_req, res) => {
  res.json({ message: 'Notification routes - to be implemented' });
});

export default router;

