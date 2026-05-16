import { prisma } from '../db/client';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

export interface UserProfileComplete {
  userId: string;
  email: string;
  createdAt: string;
  preferences: {
    genres: number[];
    directors: number[];
    actors: number[];
  };
  stats: {
    genreCount: number;
    directorCount: number;
    actorCount: number;
    moviesWatched: number;
    moviesLiked: number;
    moviesDisliked: number;
  };
  recentMovies: Array<{
    id: string;
    tmdbId: string;
    title: string;
    rating: number;
    createdAt: string;
  }>;
}

class ProfileService {
  /**
   * Get complete user profile with all preferences and stats
   */
  async getCompleteProfile(userId: string): Promise<UserProfileComplete> {
    try {
      // Get user
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, createdAt: true },
      });

      if (!user) {
        throw new AppError('USER_NOT_FOUND', 404, 'User not found');
      }

      // Get profile
      const profile = await prisma.userProfile.findUnique({
        where: { userId },
      });

      if (!profile) {
        throw new AppError('PROFILE_NOT_FOUND', 404, 'User profile not found');
      }

      // Parse preferences
      let genres: number[] = [];
      let directors: number[] = [];
      let actors: number[] = [];

      try {
        if (profile.favoriteGenres) {
          genres = JSON.parse(profile.favoriteGenres);
        }
        if (profile.favoriteDirectors) {
          directors = JSON.parse(profile.favoriteDirectors);
        }
        if (profile.favoriteActors) {
          actors = JSON.parse(profile.favoriteActors);
        }
      } catch (e) {
        logger.warn('Failed to parse preferences', { userId });
      }

      // Get watched movies stats
      const watchedMovies = await prisma.watchedMovie.findMany({
        where: { userId },
        select: { rating: true, id: true },
      });

      const moviesLiked = watchedMovies.filter((m) => m.rating === 5).length;
      const moviesDisliked = watchedMovies.filter((m) => m.rating === 1).length;

      // Get recent movies (last 5)
      const recentMovies = await prisma.watchedMovie.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          tmdbId: true,
          title: true,
          rating: true,
          createdAt: true,
        },
      });

      logger.info('Complete profile retrieved', { userId });

      return {
        userId: user.id,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
        preferences: {
          genres,
          directors,
          actors,
        },
        stats: {
          genreCount: genres.length,
          directorCount: directors.length,
          actorCount: actors.length,
          moviesWatched: watchedMovies.length,
          moviesLiked,
          moviesDisliked,
        },
        recentMovies: recentMovies.map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
        })),
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Failed to get complete profile', {
        userId,
        error: (error as Error).message,
      });

      throw new AppError(
        'PROFILE_GET_ERROR',
        500,
        'Failed to get complete profile'
      );
    }
  }

  /**
   * Check if profile is complete (onboarding finished)
   */
  async isProfileComplete(userId: string): Promise<boolean> {
    try {
      const profile = await this.getCompleteProfile(userId);
      // Profile is complete if user has at least:
      // - 3+ genres (required)
      // - Optionally directors, actors, or movies
      return profile.stats.genreCount >= 3;
    } catch (error) {
      return false;
    }
  }
}

export const profileService = new ProfileService();
