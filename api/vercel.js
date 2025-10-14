// Vercel serverless function entry point
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
app.use(cors({
  origin: [
    'https://smd-vital-admin.vercel.app',
    'https://smd-vital-2026.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'SMD Vital Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Basic API endpoints
app.get('/api/', (req, res) => {
  res.json({
    message: 'SMD Vital Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      doctors: '/api/doctors',
      appointments: '/api/appointments',
      services: '/api/services',
      payments: '/api/payments',
      reviews: '/api/reviews',
      admin: '/api/admin'
    }
  });
});

// Auth routes placeholder
app.use('/api/auth', (req, res) => {
  res.json({
    message: 'Auth endpoints will be available soon',
    available: ['/login', '/register', '/logout', '/refresh']
  });
});

// Admin routes placeholder
app.use('/api/admin', (req, res) => {
  res.json({
    message: 'Admin endpoints will be available soon',
    available: ['/dashboard', '/users', '/doctors', '/appointments', '/analytics']
  });
});

// Users routes placeholder
app.use('/api/users', (req, res) => {
  res.json({
    message: 'User endpoints will be available soon',
    available: ['/profile', '/update', '/delete']
  });
});

// Doctors routes placeholder
app.use('/api/doctors', (req, res) => {
  res.json({
    message: 'Doctor endpoints will be available soon',
    available: ['/list', '/profile', '/schedule', '/availability']
  });
});

// Appointments routes placeholder
app.use('/api/appointments', (req, res) => {
  res.json({
    message: 'Appointment endpoints will be available soon',
    available: ['/create', '/list', '/update', '/cancel']
  });
});

// Services routes placeholder
app.use('/api/services', (req, res) => {
  res.json({
    message: 'Service endpoints will be available soon',
    available: ['/list', '/create', '/update', '/delete']
  });
});

// Payments routes placeholder
app.use('/api/payments', (req, res) => {
  res.json({
    message: 'Payment endpoints will be available soon',
    available: ['/create', '/list', '/status', '/refund']
  });
});

// Reviews routes placeholder
app.use('/api/reviews', (req, res) => {
  res.json({
    message: 'Review endpoints will be available soon',
    available: ['/create', '/list', '/update', '/delete']
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      '/api/health',
      '/api/auth',
      '/api/users',
      '/api/doctors',
      '/api/appointments',
      '/api/services',
      '/api/payments',
      '/api/reviews',
      '/api/admin'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

module.exports = app;
