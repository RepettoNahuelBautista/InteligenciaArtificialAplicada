import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { uploadAvatar } from '../services/avatarService';

const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo se permiten imágenes'));
  },
}).single('avatar');

export const uploadAvatarController = (req: Request, res: Response, next: NextFunction): void => {
  multerUpload(req, res, async (err) => {
    if (err) {
      res.status(400).json({ success: false, error: { code: 'INVALID_FILE', message: err.message } });
      return;
    }
    if (!req.file) {
      res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No se recibió ninguna imagen' } });
      return;
    }
    try {
      const userId = req.userId as string;
      const avatarUrl = await uploadAvatar(userId, req.file.buffer);
      res.json({ success: true, data: { avatarUrl } });
    } catch (e) {
      next(e);
    }
  });
};
