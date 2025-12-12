import { Router } from 'express';
import { apiLimiter } from '../middleware/rateLimiter.js';

// Import route modules
import authRoutes from './auth.js';
import userRoutes from './users.js';
import departmentRoutes from './departments.js';
import employeeRoutes from './employees.js';
import trainingRoutes from './trainings.js';
import batchRoutes from './batches.js';
import certificateRoutes from './certificates.js';
import dashboardRoutes from './dashboard.js';
import notificationRoutes from './notifications.js';
import reportRoutes from './reports.js';
import migrationRoutes from './migration.js';

const router = Router();

// Apply API rate limiting to all routes
router.use(apiLimiter);

// API info endpoint
router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Training Management System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      departments: '/api/departments',
      employees: '/api/employees',
      trainings: '/api/trainings',
      batches: '/api/batches',
      certificates: '/api/certificates',
      dashboard: '/api/dashboard',
      notifications: '/api/notifications',
      reports: '/api/reports',
      migration: '/api/migration',
    },
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/departments', departmentRoutes);
router.use('/employees', employeeRoutes);
router.use('/trainings', trainingRoutes);
router.use('/batches', batchRoutes);
router.use('/certificates', certificateRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);
router.use('/migration', migrationRoutes);

export default router;
