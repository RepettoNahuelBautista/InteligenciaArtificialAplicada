import { Request, Response } from 'express';
import { z } from 'zod';
import { recommendationService } from '../services/recommendationService';
import { prisma } from '../db/client';
import { logger } from '../utils/logger';

const RecommendationRequestSchema = z.object({
  moodId: z.enum(['mystery', 'relax', 'emotional', 'laugh', 'action', 'romantic', 'horror', 'inspiring']),
  contentType: z.enum(['movie', 'tv']).nullable().optional(),
  duration: z.enum(['short', 'normal', 'long']).nullable().optional(),
  year: z.enum(['classic', 'recent', 'new']).nullable().optional(),
  excludeTitles: z.array(z.string()).optional().default([]),
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

  const { moodId, contentType = null, duration = null, year = null, excludeTitles } = parsed.data;

  logger.info('Recommendation requested', { userId, moodId, contentType, duration, year, excludeCount: excludeTitles.length });

  const result = await recommendationService.getRecommendation(userId, {
    moodId,
    contentType: contentType ?? null,
    duration: duration ?? null,
    year: year ?? null,
    excludeTitles,
  });

  res.json({ success: true, data: result });
};

export const getRecommendationHistoryController = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).userId as string;
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
  const limit = Math.min(20, Math.max(1, parseInt(String(req.query.limit ?? '10'), 10)));

  const [total, recommendations] = await Promise.all([
    prisma.recommendation.count({ where: { userId } }),
    prisma.recommendation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        tmdbId: true,
        title: true,
        explanation: true,
        genre: true,
        year: true,
        contentType: true,
        posterPath: true,
        overview: true,
        contextMood: true,
        contextType: true,
        createdAt: true,
      },
    }),
  ]);

  res.json({
    success: true,
    data: {
      recommendations,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    },
  });
};
