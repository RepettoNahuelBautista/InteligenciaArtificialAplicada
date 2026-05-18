import { prisma } from '../db/client';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

export const UpsertReviewSchema = z.object({
  tmdbId: z.string().min(1),
  title: z.string().min(1).max(300),
  contentType: z.enum(['movie', 'tv']),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(1).max(2000),
});

export type UpsertReviewInput = z.infer<typeof UpsertReviewSchema>;

export interface ReviewAuthor {
  userId: string;
  displayName: string | null;
}

export interface ReviewItem {
  id: string;
  tmdbId: string;
  title: string;
  contentType: string;
  rating: number;
  text: string;
  createdAt: string;
  updatedAt: string;
  author: ReviewAuthor;
}

export interface PublicProfile {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  memberSince: string;
  stats: {
    moviesWatched: number;
    moviesLiked: number;
    moviesDisliked: number;
    genreCount: number;
    directorCount: number;
    actorCount: number;
  };
  favoriteGenres: number[];
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
}

class ReviewService {
  async getReviews(tmdbId: string): Promise<ReviewItem[]> {
    const reviews = await prisma.review.findMany({
      where: { tmdbId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          include: { profile: { select: { displayName: true } } },
        },
      },
    });

    return reviews.map((r) => ({
      id: r.id,
      tmdbId: r.tmdbId,
      title: r.title,
      contentType: r.contentType,
      rating: r.rating,
      text: r.text,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      author: {
        userId: r.userId,
        displayName: r.user.profile?.displayName ?? r.user.email.split('@')[0],
      },
    }));
  }

  async upsertReview(userId: string, input: UpsertReviewInput): Promise<ReviewItem> {
    const review = await prisma.review.upsert({
      where: { userId_tmdbId: { userId, tmdbId: input.tmdbId } },
      create: {
        userId,
        tmdbId: input.tmdbId,
        title: input.title,
        contentType: input.contentType,
        rating: input.rating,
        text: input.text,
      },
      update: {
        rating: input.rating,
        text: input.text,
        updatedAt: new Date(),
      },
      include: {
        user: {
          include: { profile: { select: { displayName: true } } },
        },
      },
    });

    logger.info('Review upserted', { userId, tmdbId: input.tmdbId, rating: input.rating });

    return {
      id: review.id,
      tmdbId: review.tmdbId,
      title: review.title,
      contentType: review.contentType,
      rating: review.rating,
      text: review.text,
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString(),
      author: {
        userId: review.userId,
        displayName: review.user.profile?.displayName ?? review.user.email.split('@')[0],
      },
    };
  }

  async getPublicProfile(userId: string, currentUserId: string): Promise<PublicProfile> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new AppError('USER_NOT_FOUND', 404, 'User not found');
    }

    const [watchedMovies, followerCount, followingCount, followRecord] = await Promise.all([
      prisma.watchedMovie.findMany({ where: { userId }, select: { rating: true } }),
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.follow.count({ where: { followerId: userId } }),
      prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: currentUserId, followingId: userId } },
        select: { id: true },
      }),
    ]);

    let genres: number[] = [];
    let directors: number[] = [];
    let actors: number[] = [];

    try {
      if (user.profile?.favoriteGenres) genres = JSON.parse(user.profile.favoriteGenres);
      if (user.profile?.favoriteDirectors) directors = JSON.parse(user.profile.favoriteDirectors);
      if (user.profile?.favoriteActors) actors = JSON.parse(user.profile.favoriteActors);
    } catch {
      // ignore parse errors
    }

    return {
      userId: user.id,
      displayName: user.profile?.displayName ?? user.email.split('@')[0],
      avatarUrl: user.profile?.avatarUrl ?? null,
      memberSince: user.createdAt.toISOString(),
      stats: {
        moviesWatched: watchedMovies.length,
        moviesLiked: watchedMovies.filter((m) => m.rating === 5).length,
        moviesDisliked: watchedMovies.filter((m) => m.rating === 1).length,
        genreCount: genres.length,
        directorCount: directors.length,
        actorCount: actors.length,
      },
      favoriteGenres: genres,
      followerCount,
      followingCount,
      isFollowing: followRecord !== null,
    };
  }

  async getUserReviews(userId: string): Promise<ReviewItem[]> {
    const reviews = await prisma.review.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { include: { profile: { select: { displayName: true } } } },
      },
    });

    return reviews.map((r) => ({
      id: r.id,
      tmdbId: r.tmdbId,
      title: r.title,
      contentType: r.contentType,
      rating: r.rating,
      text: r.text,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      author: {
        userId: r.userId,
        displayName: r.user.profile?.displayName ?? r.user.email.split('@')[0],
      },
    }));
  }
}

export const reviewService = new ReviewService();
