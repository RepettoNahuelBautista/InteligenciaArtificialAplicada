import { prisma } from '../db/client';
import { AppError } from '../utils/errors';

class ReviewLikeService {
  async likeReview(userId: string, reviewId: string, value: 1 | -1): Promise<void> {
    const review = await prisma.review.findUnique({ where: { id: reviewId }, select: { id: true } });
    if (!review) throw new AppError('NOT_FOUND', 404, 'Reseña no encontrada');

    await prisma.reviewLike.upsert({
      where: { userId_reviewId: { userId, reviewId } },
      create: { userId, reviewId, value },
      update: { value },
    });
  }

  async unlikeReview(userId: string, reviewId: string): Promise<void> {
    await prisma.reviewLike.deleteMany({ where: { userId, reviewId } });
  }
}

export const reviewLikeService = new ReviewLikeService();
