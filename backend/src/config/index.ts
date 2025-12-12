import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Application configuration
 * All values loaded from environment variables with sensible defaults
 */
export const config = {
  // Server
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'training_mgt',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },

  // Compliance
  compliance: {
    warningDays: parseInt(process.env.COMPLIANCE_WARNING_DAYS || '30', 10),
  },

  // Email
  email: {
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'Training Management <noreply@example.com>',
  },

  // File Upload
  upload: {
    maxPhotoSize: parseInt(process.env.MAX_PHOTO_SIZE || '5242880', 10), // 5MB
    maxCertificateSize: parseInt(process.env.MAX_CERTIFICATE_SIZE || '10485760', 10), // 10MB
    allowedPhotoTypes: ['image/jpeg', 'image/png'],
    allowedCertTypes: ['application/pdf'],
    photosDir: path.resolve(__dirname, '../../uploads/photos'),
    signaturesDir: path.resolve(__dirname, '../../uploads/signatures'),
    certificatesDir: path.resolve(__dirname, '../../uploads/certificates'),
  },

  // Rate Limiting
  rateLimit: {
    login: {
      max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '5', 10),
      windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || '600000', 10), // 10 minutes
    },
    api: {
      max: parseInt(process.env.API_RATE_LIMIT_MAX || '50', 10),
      windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
    },
  },
};

export default config;
