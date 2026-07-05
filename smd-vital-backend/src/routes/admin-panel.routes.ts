import { Router } from 'express';
import { AdminPanelController } from '../controllers/admin-panel.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { uploadDoctorMedia } from '../middleware/upload.middleware';

const router = Router();
const adminPanelController = new AdminPanelController();

// Apply authentication to all routes
router.use(authMiddleware);

// Authorization: by default only ADMIN/SUPER_ADMIN. AGENT is allowed ONLY on
// read-only doctor routes (list + availability + route) so call-center agents
// can schedule appointments without being able to mutate doctor records.
// Everything else (users, appointments mutations, payments, services, reviews,
// system, exports, etc.) stays restricted to ADMIN/SUPER_ADMIN.
const AGENT_READONLY_PATH =
  /^\/doctors(?:\/(?:[^\/]+\/(?:daily-availability|daily-route)))?$/;
router.use((req, res, next) => {
  const agentAllowed = AGENT_READONLY_PATH.test(req.path);
  return requireRole(
    agentAllowed ? ['AGENT', 'ADMIN', 'SUPER_ADMIN'] : ['ADMIN', 'SUPER_ADMIN'],
  )(req, res, next);
});

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
router
  .route('/users')
  .get(adminPanelController.getUsers)
  .post(adminPanelController.createUser);

router
  .route('/users/:id')
  .get(adminPanelController.getUserDetails)
  .put(adminPanelController.updateUser)
  .delete(adminPanelController.deleteUser);

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
router.patch('/users/:id/reset-password', requireRole(['SUPER_ADMIN']), adminPanelController.resetUserPassword);

// ========================================
// DOCTOR MANAGEMENT
// ========================================

/**
 * @route   GET /api/v1/admin-panel/doctors
 * @desc    Get all doctors with filters and pagination
 * @query   page, limit, specialty, isAvailable, search
 * @access  Private/Admin
 */
router
  .route('/doctors')
  .get(adminPanelController.getDoctors)
  .post(adminPanelController.createDoctor);

/**
 * @route   POST /api/v1/admin-panel/doctors/seed-default-availability
 * One-off: siembra disponibilidad L-V 8-12 + 14-18 a todos los doctores
 * activos que no tengan bloques registrados para los proximos N dias.
 */
router
  .post('/doctors/seed-default-availability', adminPanelController.seedDefaultAvailabilityForAll);

router
  .route('/doctors/:id')
  .put(adminPanelController.updateDoctor)
  .delete(adminPanelController.deleteDoctor);

/**
 * @route   PATCH /api/v1/admin-panel/doctors/:id/availability
 * @desc    Update doctor availability status
 * @body    { isAvailable: boolean }
 * @access  Private/Admin
 */
router.patch('/doctors/:id/availability', adminPanelController.updateDoctorAvailability);

router.get('/doctors/:id/daily-availability', adminPanelController.getDoctorDailyAvailability);

router.get('/doctors/:id/daily-route', adminPanelController.getDoctorDailyRoute);

/**
 * @route   PATCH /api/v1/admin-panel/doctors/:id/media
 * @desc    Update doctor media (logo and signature)
 * @body    { logoPath?: string, signaturePath?: string }
 * @access  Private/Admin
 */
router.patch('/doctors/:id/media', adminPanelController.updateDoctorMedia);

/**
 * @route   POST /api/v1/admin-panel/doctors/:id/upload-media
 * @desc    Upload doctor media files (logo and signature)
 * @body    FormData with 'logo' and/or 'signature' files
 * @access  Private/Admin
 */
router.post('/doctors/:id/upload-media', uploadDoctorMedia, adminPanelController.uploadDoctorMediaFiles);


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
 * @route   GET /api/v1/admin-panel/appointments/:id/timeline
 * @desc    Get appointment traceability timeline
 * @access  Private/Admin
 */
router.get('/appointments/:id/timeline', adminPanelController.getAppointmentTimeline);

/**
 * @route   GET /api/v1/admin-panel/appointments/:id
 * @desc    Get appointment details by ID
 * @access  Private/Admin
 */
router.get('/appointments/:id', adminPanelController.getAppointmentDetails);

/**
 * @route   POST /api/v1/admin-panel/appointments
 * @desc    Create new appointment
 * @body    Appointment data
 * @access  Private/Admin
 */
router.post('/appointments', adminPanelController.createAppointment);

/**
 * @route   PUT /api/v1/admin-panel/appointments/:id
 * @desc    Update appointment
 * @body    Appointment data
 * @access  Private/Admin
 */
router.put('/appointments/:id', adminPanelController.updateAppointment);

/**
 * @route   PATCH /api/v1/admin-panel/appointments/:id/status
 * @desc    Update appointment status
 * @body    { status: AppointmentStatus }
 * @access  Private/Admin
 */
router.patch('/appointments/:id/status', adminPanelController.updateAppointmentStatus);

/**
 * @route   DELETE /api/v1/admin-panel/appointments/:id
 * @desc    Delete appointment
 * @access  Private/Admin
 */
router.delete('/appointments/:id', adminPanelController.deleteAppointment);

/**
 * @route   GET /api/v1/admin-panel/patients
 * @desc    Get all patients with filters and pagination
 * @query   page, limit, search, isActive, isVerified
 * @access  Private/Admin
 */
router.post('/patients/quick', adminPanelController.createQuickPatient);
router.get('/patients', adminPanelController.getPatients);

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

/**
 * @route   GET /api/v1/admin-panel/payments/:id
 * @desc    Get payment details by ID
 * @access  Private/Admin
 */
router.get('/payments/:id', adminPanelController.getPaymentDetails);

/**
 * @route   POST /api/v1/admin-panel/payments
 * @desc    Create new payment
 * @body    Payment data
 * @access  Private/Admin
 */
router.post('/payments', adminPanelController.createPayment);

/**
 * @route   PUT /api/v1/admin-panel/payments/:id
 * @desc    Update payment
 * @body    Payment data
 * @access  Private/Admin
 */
router.put('/payments/:id', adminPanelController.updatePayment);

/**
 * @route   PATCH /api/v1/admin-panel/payments/:id/status
 * @desc    Update payment status
 * @body    { status: PaymentStatus }
 * @access  Private/Admin
 */
router.patch('/payments/:id/status', adminPanelController.updatePaymentStatus);

/**
 * @route   DELETE /api/v1/admin-panel/payments/:id
 * @desc    Delete payment
 * @access  Private/Admin
 */
router.delete('/payments/:id', adminPanelController.deletePayment);

/**
 * @route   GET /api/v1/admin-panel/analytics/revenue
 * @desc    Get revenue analytics by month
 * @access  Private/Admin
 */
router.get('/analytics/revenue', adminPanelController.getRevenueAnalytics);

// ========================================
// SERVICE MANAGEMENT
// ========================================

/**
 * @route   GET /api/v1/admin-panel/services
 * @desc    Get all services with filters and pagination
 * @query   page, limit, category, isActive
 * @access  Private/Admin
 */
router
  .route('/services')
  .get(adminPanelController.getServices)
  .post(adminPanelController.createService);

router
  .route('/services/:id')
  .get(adminPanelController.getServiceDetails)
  .put(adminPanelController.updateService)
  .delete(adminPanelController.deleteService);

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
 * @route   GET /api/v1/admin-panel/reviews/:id
 * @desc    Get review details by ID
 * @access  Private/Admin
 */
router.get('/reviews/:id', adminPanelController.getReviewDetails);

/**
 * @route   POST /api/v1/admin-panel/reviews
 * @desc    Create new review
 * @body    Review data
 * @access  Private/Admin
 */
router.post('/reviews', adminPanelController.createReview);

/**
 * @route   PUT /api/v1/admin-panel/reviews/:id
 * @desc    Update review
 * @body    Review data
 * @access  Private/Admin
 */
router.put('/reviews/:id', adminPanelController.updateReview);

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

router.get('/audit', adminPanelController.getAuditLogs);

router.get('/rips/drafts', adminPanelController.getRipsDrafts);

router.post('/rips/export', adminPanelController.exportRipsDrafts);

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
