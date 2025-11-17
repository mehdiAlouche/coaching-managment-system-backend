import multer from 'multer';
import path from 'path';
import fs from 'fs';

const UPLOAD_ROOT = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

interface UploadOptions {
  subDirectory?: string;
  maxFileSizeMb?: number;
  allowedMimeTypes?: string[];
}

export function createUploader(options: UploadOptions = {}) {
  const { subDirectory = 'general', maxFileSizeMb = 25, allowedMimeTypes } = options;
  const destination = path.join(UPLOAD_ROOT, subDirectory);
  ensureDir(destination);

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, destination);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname);
      cb(null, `${uniqueSuffix}${ext}`);
    },
  });

  const limits = {
    fileSize: maxFileSizeMb * 1024 * 1024,
  };

  return multer({
    storage,
    limits,
    fileFilter: (_req, file, cb) => {
      if (allowedMimeTypes && !allowedMimeTypes.includes(file.mimetype)) {
        return cb(new Error(`Unsupported file type: ${file.mimetype}`));
      }
      cb(null, true);
    },
  });
}

export { UPLOAD_ROOT };

