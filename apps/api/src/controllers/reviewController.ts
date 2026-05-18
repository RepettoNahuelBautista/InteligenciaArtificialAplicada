import { Request, Response } from 'express';
import { reviewService, UpsertReviewSchema } from '../services/reviewService';
import { logger } from '../utils/logger';

export const getReviewsController = async (req: Request, res: Response): Promise<void> => {
  const tmdbId = String(req.query.tmdbId ?? '');
  if (!tmdbId) {
    res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'tmdbId is required' } });
    return;
  }

  const reviews = await reviewService.getReviews(tmdbId);
  res.json({ success: true, data: reviews });
};

export const upsertReviewController = async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId as string;

  const parsed = UpsertReviewSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: parsed.error.errors[0]?.message ?? 'Invalid input' },
    });
    return;
  }

  const review = await reviewService.upsertReview(userId, parsed.data);
  logger.info('Review saved', { userId, tmdbId: parsed.data.tmdbId });
  res.status(201).json({ success: true, data: review });
};

export const getPublicProfileController = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const profile = await reviewService.getPublicProfile(userId);
  res.json({ success: true, data: profile });
};
