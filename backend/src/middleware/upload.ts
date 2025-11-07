import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads/messages');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Allowed file types with size limits (in bytes)
const FILE_SIZE_LIMITS = {
  image: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024, // 10MB
  video: 50 * 1024 * 1024, // 50MB
  archive: 25 * 1024 * 1024, // 25MB
  default: 10 * 1024 * 1024, // 10MB
};

const ALLOWED_FILE_TYPES = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
  ],
  video: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
  archive: [
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
  ],
  design: [
    'application/postscript', // .ai
    'image/vnd.adobe.photoshop', // .psd
    'application/octet-stream', // Generic for design files
  ],
  code: [
    'text/javascript',
    'application/javascript',
    'text/typescript',
    'text/html',
    'text/css',
    'application/json',
  ],
};

// Get all allowed MIME types
const getAllowedMimeTypes = (): string[] => {
  return Object.values(ALLOWED_FILE_TYPES).flat();
};

// Determine file category based on MIME type
const getFileCategory = (mimetype: string): string => {
  for (const [category, types] of Object.entries(ALLOWED_FILE_TYPES)) {
    if (types.includes(mimetype)) {
      return category;
    }
  }
  return 'default';
};

// Get size limit for file type
const getSizeLimit = (mimetype: string): number => {
  const category = getFileCategory(mimetype);
  return FILE_SIZE_LIMITS[category as keyof typeof FILE_SIZE_LIMITS] || FILE_SIZE_LIMITS.default;
};

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create year/month subdirectories
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const dest = path.join(uploadsDir, String(year), month);

    // Ensure directory exists
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    cb(null, dest);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const sanitizedName = nameWithoutExt.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const filename = `${timestamp}-${uniqueSuffix}-${sanitizedName}${ext}`;
    cb(null, filename);
  },
});

// File filter function
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = getAllowedMimeTypes();

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `File type not allowed. Allowed types: images, documents, videos, archives, design files, code files.`
      )
    );
  }
};

// Create multer upload instance
export const uploadMessageFiles = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // Max 50MB per file (will check specific limits in controller)
    files: 5, // Max 5 files per upload
  },
});

// Middleware to validate individual file sizes based on type
export const validateFileSizes = (req: any, res: any, next: any) => {
  if (!req.files || !Array.isArray(req.files)) {
    return next();
  }

  const errors: string[] = [];

  for (const file of req.files) {
    const sizeLimit = getSizeLimit(file.mimetype);
    if (file.size > sizeLimit) {
      const category = getFileCategory(file.mimetype);
      const limitMB = (sizeLimit / (1024 * 1024)).toFixed(0);
      errors.push(
        `File "${file.originalname}" exceeds size limit for ${category} files (${limitMB}MB)`
      );
    }
  }

  if (errors.length > 0) {
    // Clean up uploaded files
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach((file: Express.Multer.File) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    return res.status(400).json({
      status: 'error',
      message: 'File size validation failed',
      errors: errors,
    });
  }

  next();
};

// Utility function to delete uploaded file
export const deleteUploadedFile = (filePath: string): void => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

// Utility function to get file URL from path
export const getFileUrl = (filePath: string): string => {
  // Convert absolute path to relative URL
  const relativePath = filePath.split('uploads/messages/')[1];
  return `/uploads/messages/${relativePath}`;
};

// Utility function to get absolute path from URL
export const getAbsolutePathFromUrl = (fileUrl: string): string => {
  const relativePath = fileUrl.replace('/uploads/messages/', '');
  return path.join(uploadsDir, relativePath);
};
