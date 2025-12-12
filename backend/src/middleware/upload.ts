import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';
import { ValidationError } from '../utils/errors.js';

// Photo upload storage configuration
const photoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.upload.photosDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

// Signature upload storage configuration
const signatureStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.upload.signaturesDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `signature-${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

// Certificate upload storage configuration (for migration)
const certificateStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.upload.certificatesDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `cert-${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

// File filter for images
const imageFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (config.upload.allowedPhotoTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ValidationError('Only JPEG and PNG images are allowed'));
  }
};

// File filter for PDFs and images (for certificate migration)
const certificateFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [...config.upload.allowedPhotoTypes, ...config.upload.allowedCertTypes];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ValidationError('Only JPEG, PNG, and PDF files are allowed'));
  }
};

// Photo upload middleware
export const uploadPhoto = multer({
  storage: photoStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: config.upload.maxPhotoSize,
  },
}).single('photo');

// Signature upload middleware
export const uploadSignature = multer({
  storage: signatureStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: config.upload.maxPhotoSize,
  },
}).single('signature');

// Certificate upload middleware (for migration)
export const uploadCertificate = multer({
  storage: certificateStorage,
  fileFilter: certificateFilter,
  limits: {
    fileSize: config.upload.maxCertificateSize,
  },
}).single('certificate');

// Multiple certificates upload (for batch migration)
export const uploadCertificates = multer({
  storage: certificateStorage,
  fileFilter: certificateFilter,
  limits: {
    fileSize: config.upload.maxCertificateSize,
  },
}).array('certificates', 50);

// Migration document upload (alias for certificate upload)
export const uploadMigrationDocument = multer({
  storage: certificateStorage,
  fileFilter: certificateFilter,
  limits: {
    fileSize: config.upload.maxCertificateSize,
  },
}).single('file');

export default {
  uploadPhoto,
  uploadSignature,
  uploadCertificate,
  uploadCertificates,
  uploadMigrationDocument,
};

