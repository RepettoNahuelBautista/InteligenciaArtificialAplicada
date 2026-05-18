import { Request, Response } from 'express';
import { z } from 'zod';
import { reviewLikeService } from '../services/reviewLikeService';

const LikeSchema = z.object({ value: z.union([z.literal(1), z.literal(-1)]) });

export const likeReviewController = async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId as string;
  const { reviewId } = req.params;
  const parsed = LikeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'value must be 1 or -1' } });
    return;
  }
  await reviewLikeService.likeReview(userId, reviewId, parsed.data.value);
  res.json({ success: true, data: { value: parsed.data.value } });
};

export const unlikeReviewController = async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId as string;
  const { reviewId } = req.params;
  await reviewLikeService.unlikeReview(userId, reviewId);
  res.json({ success: true, data: { value: null } });
};
