import { Request, Response } from 'express';
import { z } from 'zod';
import { recommendationService } from '../services/recommendationService';
import { logger } from '../utils/logger';

const RecommendationRequestSchema = z.object({
  moodId: z.enum(['mystery', 'relax', 'emotional', 'laugh', 'action', 'romantic', 'horror', 'inspiring']),
  contentType: z.enum(['movie', 'tv']).nullable().optional(),
  duration: z.enum(['short', 'normal', 'long']).nullable().optional(),
  year: z.enum(['classic', 'recent', 'new']).nullable().optional(),
});

export const getRecommendationController = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).userId as string;

  const parsed = RecommendationRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: parsed.error.errors[0]?.message ?? 'Invalid input' },
    });
    return;
  }

  const { moodId, contentType = null, duration = null, year = null } = parsed.data;

  logger.info('Recommendation requested', { userId, moodId, contentType, duration, year });

  const result = await recommendationService.getRecommendation(userId, {
    moodId,
    contentType: contentType ?? null,
    duration: duration ?? null,
    year: year ?? null,
  });

  res.json({ success: true, data: result });
};
