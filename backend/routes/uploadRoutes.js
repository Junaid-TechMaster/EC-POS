import express from 'express';
import multer from 'multer';
import asyncHandler from 'express-async-handler';
import cloudinary from '../config/cloudinary.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
});

const isCloudinaryConfigured = () =>
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

const saveLocally = (buffer, originalName, subfolder = '') => {
  const uploadsDir = path.join(__dirname, '../../frontend/public/uploads', subfolder);
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  const ext = originalName.split('.').pop().toLowerCase();
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
  fs.writeFileSync(path.join(uploadsDir, filename), buffer);
  return subfolder ? `/uploads/${subfolder}/${filename}` : `/uploads/${filename}`;
};

const uploadToCloudinary = (buffer, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    stream.end(buffer);
  });

// @route  POST /api/upload  — product images (admin only)
router.post(
  '/',
  protect,
  admin,
  upload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) { res.status(400); throw new Error('No file uploaded'); }

    if (isCloudinaryConfigured()) {
      try {
        const result = await uploadToCloudinary(req.file.buffer, {
          folder: 'ecpos-products',
          transformation: [{ width: 900, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
        });
        return res.json({ url: result.secure_url, public_id: result.public_id });
      } catch (err) {
        console.warn('Cloudinary upload failed, falling back to local storage:', err.message);
      }
    }

    const url = saveLocally(req.file.buffer, req.file.originalname, 'products');
    res.json({ url, public_id: url });
  })
);

// @route  POST /api/upload/avatar  — profile picture (any logged-in user)
router.post(
  '/avatar',
  protect,
  upload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) { res.status(400); throw new Error('No file uploaded'); }

    if (isCloudinaryConfigured()) {
      try {
        const result = await uploadToCloudinary(req.file.buffer, {
          folder: 'ecpos-avatars',
          transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face', quality: 'auto' }],
        });
        return res.json({ url: result.secure_url });
      } catch (err) {
        console.warn('Cloudinary avatar upload failed, falling back to local storage:', err.message);
      }
    }

    const url = saveLocally(req.file.buffer, req.file.originalname, 'avatars');
    res.json({ url });
  })
);

// @route  POST /api/upload/message  — chat attachments: images, files, voice
const messageUpload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const t = file.mimetype;
    if (
      t.startsWith('image/') ||
      t.startsWith('audio/') ||
      t === 'application/pdf' ||
      t.includes('msword') ||
      t.includes('officedocument') ||
      t.startsWith('text/')
    ) {
      cb(null, true);
    } else {
      cb(new Error('File type not supported'), false);
    }
  },
});

router.post(
  '/message',
  protect,
  messageUpload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) { res.status(400); throw new Error('No file uploaded'); }

    const isImage = req.file.mimetype.startsWith('image/');
    const isAudio = req.file.mimetype.startsWith('audio/');
    const attType = isAudio ? 'voice' : isImage ? 'image' : 'file';

    if (isCloudinaryConfigured()) {
      try {
        const result = await uploadToCloudinary(req.file.buffer, {
          folder: 'ecpos-messages',
          resource_type: isAudio ? 'video' : isImage ? 'image' : 'raw',
          ...(isImage && { transformation: [{ width: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }] }),
        });
        return res.json({ url: result.secure_url, type: attType, name: req.file.originalname, size: req.file.size });
      } catch (err) {
        console.warn('Cloudinary message upload failed, falling back to local:', err.message);
      }
    }

    const subfolder = isAudio ? 'voice' : isImage ? 'chat' : 'files';
    const url = saveLocally(req.file.buffer, req.file.originalname, subfolder);
    res.json({ url, type: attType, name: req.file.originalname, size: req.file.size });
  })
);

// @route  POST /api/upload/review  — review images (any logged-in user)
router.post(
  '/review',
  protect,
  upload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) { res.status(400); throw new Error('No file uploaded'); }

    if (isCloudinaryConfigured()) {
      try {
        const result = await uploadToCloudinary(req.file.buffer, {
          folder: 'ecpos-reviews',
          transformation: [{ width: 900, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
        });
        return res.json({ url: result.secure_url });
      } catch (err) {
        console.warn('Cloudinary review upload failed, falling back to local:', err.message);
      }
    }

    const url = saveLocally(req.file.buffer, req.file.originalname, 'reviews');
    res.json({ url });
  })
);

export default router;
