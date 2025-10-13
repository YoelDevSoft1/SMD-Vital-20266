import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All review routes require authentication
router.use(authMiddleware);

// Placeholder routes - implement as needed
router.get('/', (_req, res) => {
  res.json({ message: 'Review routes - to be implemented' });
});

export default router;

