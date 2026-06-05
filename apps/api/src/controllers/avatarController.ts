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

  const hfToken = process.env.HUGGINGFACE_API_TOKEN;
  if (!hfToken) {
    res.status(500).json({ success: false, error: { message: 'Servicio de generación no configurado (falta HUGGINGFACE_API_TOKEN)' } });
    return;
  }

  try {
    logger.info('Generating avatar via HuggingFace SDXL', { userId: req.userId });

    const response = await fetch(
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${hfToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: prompt.trim() }),
        signal: AbortSignal.timeout(90000),
      }
    );

    if (!response.ok) {
      const bodyText = await response.text().catch(() => '');
      logger.error('HuggingFace SDXL error', { status: response.status, body: bodyText });
      // Surface the real error so we can diagnose
      const hfError = (() => { try { return JSON.parse(bodyText); } catch { return null; } })();
      const detail = hfError?.error ?? bodyText.slice(0, 200) ?? '';
      const message = response.status === 503
        ? `Modelo cargando, esperá unos segundos e intentá de nuevo${detail ? ` (${detail})` : ''}`
        : `HuggingFace error ${response.status}${detail ? `: ${detail}` : ''}`;
      res.status(502).json({ success: false, error: { message } });
      return;
    }

    const contentType = response.headers.get('content-type') ?? 'image/jpeg';
    if (!contentType.startsWith('image/')) {
      const bodyText = await response.text().catch(() => '');
      logger.error('HuggingFace returned non-image', { contentType, body: bodyText.slice(0, 300) });
      res.status(502).json({ success: false, error: { message: `Respuesta inesperada del servicio: ${bodyText.slice(0, 150)}` } });
      return;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const base64 = buffer.toString('base64');
    res.json({ success: true, data: { previewUrl: `data:${contentType};base64,${base64}` } });
  } catch (err) {
    logger.error('generateAvatarController error', { err });
    const message = err instanceof Error
      ? (err.name === 'TimeoutError' ? 'Timeout esperando imagen (90s), intentá de nuevo' : `Error: ${err.message}`)
      : 'Error inesperado';
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
