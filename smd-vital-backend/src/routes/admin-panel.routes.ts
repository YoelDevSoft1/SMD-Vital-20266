import { Router } from 'express';
import { AdminPanelController } from '../controllers/admin-panel.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();
const adminPanelController = new AdminPanelController();

// Apply authentication and authorization to all routes
router.use(authMiddleware);
router.use(requireRole(['ADMIN', 'SUPER_ADMIN']));

// ========================================
// DASHBOARD & ANALYTICS
// ========================================

/**
 * @route   GET /api/v1/admin-panel/dashboard
 * @desc    Get comprehensive dashboard statistics
 * @access  Private/Admin
 */
router.get('/dashboard', adminPanelController.getDashboard);

/**
 * @route   GET /api/v1/admin-panel/analytics
 * @desc    Get advanced analytics with date range and grouping
 * @query   startDate, endDate, groupBy (day|week|month)
 * @access  Private/Admin
 */
router.get('/analytics', adminPanelController.getAnalytics);

/**
 * @route   GET /api/v1/admin-panel/revenue
 * @desc    Get detailed revenue report
 * @query   startDate, endDate
 * @access  Private/Admin
 */
router.get('/revenue', adminPanelController.getRevenueReport);

// ========================================
// USER MANAGEMENT
// ========================================

/**
 * @route   GET /api/v1/admin-panel/users
 * @desc    Get all users with filters and pagination
 * @query   page, limit, role, search, isActive, isVerified
 * @access  Private/Admin
 */
router.get('/users', adminPanelController.getUsers);

/**
 * @route   GET /api/v1/admin-panel/users/:id
 * @desc    Get detailed user information
 * @access  Private/Admin
 */
router.get('/users/:id', adminPanelController.getUserDetails);

/**
 * @route   PATCH /api/v1/admin-panel/users/:id/status
 * @desc    Update user active/inactive status
 * @body    { isActive: boolean }
 * @access  Private/Admin
 */
router.patch('/users/:id/status', adminPanelController.updateUserStatus);

/**
 * @route   PATCH /api/v1/admin-panel/users/:id/verify
 * @desc    Verify a user account
 * @access  Private/Admin
 */
router.patch('/users/:id/verify', adminPanelController.verifyUser);

/**
 * @route   DELETE /api/v1/admin-panel/users/:id
 * @desc    Delete a user (soft delete)
 * @access  Private/Admin
 */
router.delete('/users/:id', adminPanelController.deleteUser);

// ========================================
// DOCTOR MANAGEMENT
// ========================================

/**
 * @route   GET /api/v1/admin-panel/doctors
 * @desc    Get all doctors with filters and pagination
 * @query   page, limit, specialty, isAvailable, search
 * @access  Private/Admin
 */
router.get('/doctors', adminPanelController.getDoctors);

/**
 * @route   PATCH /api/v1/admin-panel/doctors/:id/availability
 * @desc    Update doctor availability status
 * @body    { isAvailable: boolean }
 * @access  Private/Admin
 */
router.patch('/doctors/:id/availability', adminPanelController.updateDoctorAvailability);

// ========================================
// APPOINTMENT MANAGEMENT
// ========================================

/**
 * @route   GET /api/v1/admin-panel/appointments
 * @desc    Get all appointments with filters and pagination
 * @query   page, limit, status, dateFrom, dateTo, doctorId, patientId
 * @access  Private/Admin
 */
router.get('/appointments', adminPanelController.getAppointments);

/**
 * @route   PATCH /api/v1/admin-panel/appointments/:id/status
 * @desc    Update appointment status
 * @body    { status: AppointmentStatus }
 * @access  Private/Admin
 */
router.patch('/appointments/:id/status', adminPanelController.updateAppointmentStatus);

// ========================================
// PAYMENT MANAGEMENT
// ========================================

/**
 * @route   GET /api/v1/admin-panel/payments
 * @desc    Get all payments with filters and pagination
 * @query   page, limit, status, method, dateFrom, dateTo
 * @access  Private/Admin
 */
router.get('/payments', adminPanelController.getPayments);

// ========================================
// SERVICE MANAGEMENT
// ========================================

/**
 * @route   GET /api/v1/admin-panel/services
 * @desc    Get all services with filters and pagination
 * @query   page, limit, category, isActive
 * @access  Private/Admin
 */
router.get('/services', adminPanelController.getServices);

/**
 * @route   PATCH /api/v1/admin-panel/services/:id/status
 * @desc    Update service active/inactive status
 * @body    { isActive: boolean }
 * @access  Private/Admin
 */
router.patch('/services/:id/status', adminPanelController.updateServiceStatus);

// ========================================
// REVIEW MANAGEMENT
// ========================================

/**
 * @route   GET /api/v1/admin-panel/reviews
 * @desc    Get all reviews with filters and pagination
 * @query   page, limit, doctorId, minRating, isVerified
 * @access  Private/Admin
 */
router.get('/reviews', adminPanelController.getReviews);

/**
 * @route   PATCH /api/v1/admin-panel/reviews/:id/verify
 * @desc    Verify a review
 * @access  Private/Admin
 */
router.patch('/reviews/:id/verify', adminPanelController.verifyReview);

/**
 * @route   DELETE /api/v1/admin-panel/reviews/:id
 * @desc    Delete a review
 * @access  Private/Admin
 */
router.delete('/reviews/:id', adminPanelController.deleteReview);

// ========================================
// SYSTEM MANAGEMENT
// ========================================

/**
 * @route   GET /api/v1/admin-panel/system/health
 * @desc    Get system health status
 * @access  Private/Admin
 */
router.get('/system/health', adminPanelController.getSystemHealth);

/**
 * @route   GET /api/v1/admin-panel/system/logs
 * @desc    Get system logs with filters
 * @query   level, limit, startDate, endDate
 * @access  Private/Admin
 */
router.get('/system/logs', adminPanelController.getSystemLogs);

// ========================================
// DATA EXPORT
// ========================================

/**
 * @route   POST /api/v1/admin-panel/export
 * @desc    Export data in various formats
 * @body    { type: string, format: string, filters: object }
 * @access  Private/Admin
 */
router.post('/export', adminPanelController.exportData);

export default router;
