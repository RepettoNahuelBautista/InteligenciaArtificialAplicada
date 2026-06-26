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

const AZURE_FLUX_ENDPOINT =
  'https://blacksharkfoundry-ia2026.services.ai.azure.com/providers/blackforestlabs/v1/flux-2-pro?api-version=preview';

export async function generateAvatarController(req: Request, res: Response): Promise<void> {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    res.status(400).json({ success: false, error: { message: 'El prompt es requerido' } });
    return;
  }

  const apiKey = process.env.AZURE_API_KEY;
  if (!apiKey) {
    res.status(500).json({ success: false, error: { message: 'AZURE_API_KEY no configurada en el servidor' } });
    return;
  }

  try {
    logger.info('Generating avatar via Azure AI Foundry FLUX.2-pro', { userId: req.userId });

    const response = await fetch(AZURE_FLUX_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt: prompt.trim(),
        model: 'FLUX.2-pro',
        width: 1024,
        height: 1024,
        n: 1,
      }),
      signal: AbortSignal.timeout(90000),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      logger.error('Azure FLUX generate error', { status: response.status, body });
      res.status(502).json({
        success: false,
        error: { message: `Error generando imagen (${response.status}): ${body.slice(0, 200)}` },
      });
      return;
    }

    const result = await response.json() as { data: Array<{ b64_json: string }> };
    const b64 = result.data?.[0]?.b64_json;
    if (!b64) throw new Error('no_image');

    res.json({ success: true, data: { previewUrl: `data:image/png;base64,${b64}` } });
  } catch (err) {
    logger.error('generateAvatarController error', { err });
    const msg = err instanceof Error ? err.message : '';
    const message =
      msg === 'no_image'    ? 'No se recibió imagen del servidor, intentá de nuevo' :
      msg === 'TimeoutError' ? 'La generación tardó demasiado (>90s), intentá de nuevo' :
                               `Error inesperado: ${msg || 'desconocido'}`;
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
      const avatarUrl = await uploadAvatar(userId, req.file.buffer, req.file.mimetype);
      res.json({ success: true, data: { avatarUrl } });
    } catch (e) {
      next(e);
    }
  });
};
