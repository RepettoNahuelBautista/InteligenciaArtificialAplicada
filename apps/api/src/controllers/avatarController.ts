import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ success: false, error: { message: 'Servicio de generación no configurado' } });
    return;
  }

  try {
    logger.info('Generating avatar via Gemini', { userId: req.userId });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-preview-image-generation',
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: `Generate a profile avatar image: ${prompt.trim()}` }] }],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      generationConfig: { responseModalities: ['IMAGE'] } as any,
    });

    const parts = result.response.candidates?.[0]?.content?.parts ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imagePart = (parts as any[]).find(p => p.inlineData);

    if (!imagePart?.inlineData) {
      logger.error('Gemini returned no image part', { candidateCount: result.response.candidates?.length });
      res.status(502).json({ success: false, error: { message: 'No se generó ninguna imagen, intentá de nuevo' } });
      return;
    }

    const { data, mimeType } = imagePart.inlineData as { data: string; mimeType: string };
    res.json({ success: true, data: { previewUrl: `data:${mimeType};base64,${data}` } });
  } catch (err) {
    logger.error('generateAvatarController error', { err });
    res.status(500).json({ success: false, error: { message: 'Error al generar la imagen, intentá de nuevo' } });
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
