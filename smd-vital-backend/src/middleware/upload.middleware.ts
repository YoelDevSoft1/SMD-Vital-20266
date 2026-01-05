import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config/config';

// Ensure upload directories exist
const doctorLogoPath = path.join(config.upload.uploadPath, 'doctors', 'logos');
const doctorSignaturePath = path.join(config.upload.uploadPath, 'doctors', 'signatures');

[doctorLogoPath, doctorSignaturePath].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage configuration for doctor media
const doctorMediaStorage = multer.diskStorage({
  destination: (_req, file, cb) => {
    const fieldName = file.fieldname;
    let uploadPath = config.upload.uploadPath;

    if (fieldName === 'logo') {
      uploadPath = doctorLogoPath;
    } else if (fieldName === 'signature') {
      uploadPath = doctorSignaturePath;
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const doctorId = req.params['id'];
    const ext = path.extname(file.originalname);
    const fieldName = file.fieldname;
    const timestamp = Date.now();

    // Format: doctor-{id}-{type}-{timestamp}.ext
    const filename = `doctor-${doctorId}-${fieldName}-${timestamp}${ext}`;
    cb(null, filename);
  }
});

// File filter for images only
const imageFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG and JPG files are allowed.'));
  }
};

// Multer upload middleware for doctor media
export const uploadDoctorMedia = multer({
  storage: doctorMediaStorage,
  limits: {
    fileSize: config.upload.maxFileSize // 10MB default
  },
  fileFilter: imageFileFilter
}).fields([
  { name: 'logo', maxCount: 1 },
  { name: 'signature', maxCount: 1 }
]);
