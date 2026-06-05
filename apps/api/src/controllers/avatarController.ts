import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { uploadAvatar } from '../services/avatarService';
import { logger } from '../utils/logger';

const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo se permiten imágenes'));
  },
}).single('avatar');

export async function generateAvatarController(req: Request, res: Response): Promise<void> {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    res.status(400).json({ success: false, error: { message: 'El prompt es requerido' } });
    return;
  }

  try {
    logger.info('Generating avatar via Pollinations', { userId: req.userId });

    const encodedPrompt = encodeURIComponent(prompt.trim());
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&model=flux-schnell&nologo=true&seed=${Date.now()}`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      logger.error('Pollinations API error', { status: response.status });
      res.status(502).json({ success: false, error: { message: `Error al generar la imagen (${response.status}), intentá de nuevo` } });
      return;
    }

    const contentType = response.headers.get('content-type') ?? 'image/jpeg';
    if (!contentType.startsWith('image/')) {
      const bodyText = await response.text().catch(() => '');
      logger.error('Pollinations returned non-image', { contentType, body: bodyText.slice(0, 200) });
      res.status(502).json({ success: false, error: { message: 'El servicio de imágenes no respondió correctamente' } });
      return;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const base64 = buffer.toString('base64');

    res.json({ success: true, data: { previewUrl: `data:${contentType};base64,${base64}` } });
  } catch (err) {
    logger.error('generateAvatarController error', { err });
    const message = err instanceof Error && err.name === 'TimeoutError'
      ? 'La generación tardó demasiado (>60s), intentá de nuevo'
      : 'Error inesperado al generar la imagen';
    res.status(500).json({ success: false, error: { message } });
  }
}

export const uploadAvatarController = (req: Request, res: Response, next: NextFunction): void => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  multerUpload(req as any, res as any, async (err) => {
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
