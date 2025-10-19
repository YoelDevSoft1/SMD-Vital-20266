import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { validationSchemas } from '../types/validation';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/register', 
  validateRequest(validationSchemas.register),
  authController.register
);

router.post('/login', 
  validateRequest(validationSchemas.login),
  authController.login
);

router.post('/refresh', 
  validateRequest(validationSchemas.refreshToken),
  authController.refreshToken
);

router.post('/forgot-password', 
  authController.forgotPassword
);

router.post('/reset-password', 
  authController.resetPassword
);

// Protected routes
router.use(authMiddleware);

router.post('/logout', 
  authController.logout
);

router.get('/me', 
  authController.getProfile
);

router.put('/profile', 
  validateRequest(validationSchemas.updateUser),
  authController.updateProfile
);

router.put('/change-password', 
  authController.changePassword
);

export default router;








