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

async function pollStableHorde(jobId: string, deadlineMs: number): Promise<string> {
  while (Date.now() < deadlineMs) {
    await new Promise(r => setTimeout(r, 4000));

    const checkRes = await fetch(`https://stablehorde.net/api/v2/generate/check/${jobId}`, {
      signal: AbortSignal.timeout(10000),
    });
    const check = await checkRes.json() as { done: boolean; faulted?: boolean; wait_time?: number };

    if (check.faulted) throw new Error('faulted');
    if (!check.done) continue;

    const statusRes = await fetch(`https://stablehorde.net/api/v2/generate/status/${jobId}`, {
      signal: AbortSignal.timeout(15000),
    });
    const status = await statusRes.json() as { generations: Array<{ img: string }> };
    const imgUrl = status.generations?.[0]?.img;
    if (!imgUrl) throw new Error('no_image');
    return imgUrl;
  }
  throw new Error('timeout');
}

export async function generateAvatarController(req: Request, res: Response): Promise<void> {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    res.status(400).json({ success: false, error: { message: 'El prompt es requerido' } });
    return;
  }

  try {
    logger.info('Generating avatar via Stable Horde', { userId: req.userId });

    const submitRes = await fetch('https://stablehorde.net/api/v2/generate/async', {
      method: 'POST',
      headers: {
        'apikey': '0000000000',
        'Content-Type': 'application/json',
        'Client-Agent': 'recomendador-peliculas:1.0:anonymous',
      },
      body: JSON.stringify({
        prompt: prompt.trim(),
        params: { width: 512, height: 512, steps: 20, n: 1, sampler_name: 'k_euler' },
        models: ['Deliberate'],
        r2: false,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!submitRes.ok) {
      const body = await submitRes.text().catch(() => '');
      logger.error('Stable Horde submit error', { status: submitRes.status, body });
      res.status(502).json({ success: false, error: { message: `Error al iniciar la generación (${submitRes.status})` } });
      return;
    }

    const { id } = await submitRes.json() as { id: string };
    logger.info('Stable Horde job submitted', { jobId: id });

    const imgUrl = await pollStableHorde(id, Date.now() + 110000);

    // Fetch and proxy the image
    const imgRes = await fetch(imgUrl, { signal: AbortSignal.timeout(15000) });
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const base64 = buffer.toString('base64');
    const contentType = imgRes.headers.get('content-type') ?? 'image/webp';

    res.json({ success: true, data: { previewUrl: `data:${contentType};base64,${base64}` } });
  } catch (err) {
    logger.error('generateAvatarController error', { err });
    const errMsg = err instanceof Error ? err.message : '';
    const message =
      errMsg === 'timeout' ? 'La generación tardó demasiado, intentá de nuevo' :
      errMsg === 'faulted' ? 'El servidor de imágenes reportó un error, intentá de nuevo' :
      errMsg === 'TimeoutError' ? 'Tiempo de espera agotado, intentá de nuevo' :
      'Error inesperado al generar la imagen';
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
