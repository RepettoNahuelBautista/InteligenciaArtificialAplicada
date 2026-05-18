import { prisma } from '../db/client';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { tmdbService } from './tmdbService';

export interface PersonInfo {
  id: number;
  name: string;
}

export interface PersonalInfo {
  displayName: string | null;
  birthDate: string | null;
  country: string | null;
  language: string | null;
}

export interface UserProfileComplete {
  userId: string;
  email: string;
  createdAt: string;
  personalInfo: PersonalInfo;
  preferences: {
    genres: number[];
    directors: PersonInfo[];
    actors: PersonInfo[];
  };
  stats: {
    genreCount: number;
    directorCount: number;
    actorCount: number;
    moviesWatched: number;
    moviesLiked: number;
    moviesDisliked: number;
  };
  social: {
    followerCount: number;
    followingCount: number;
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

      // Resolve person names from TMDB in parallel
      const [directorDetails, actorDetails] = await Promise.all([
        Promise.all(directors.map((id) => tmdbService.getPersonDetails(id))),
        Promise.all(actors.map((id) => tmdbService.getPersonDetails(id))),
      ]);

      const directorObjects: PersonInfo[] = directors.map((id, i) => ({
        id,
        name: directorDetails[i]?.name ?? `Director #${id}`,
      }));

      const actorObjects: PersonInfo[] = actors.map((id, i) => ({
        id,
        name: actorDetails[i]?.name ?? `Actor #${id}`,
      }));

      // Get watched movies stats, follow counts, and recent movies in parallel
      const [watchedMovies, followerCount, followingCount, recentMovies] = await Promise.all([
        prisma.watchedMovie.findMany({ where: { userId }, select: { rating: true, id: true } }),
        prisma.follow.count({ where: { followingId: userId } }),
        prisma.follow.count({ where: { followerId: userId } }),
        prisma.watchedMovie.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, tmdbId: true, title: true, rating: true, createdAt: true },
        }),
      ]);

      const moviesLiked = watchedMovies.filter((m) => m.rating === 5).length;
      const moviesDisliked = watchedMovies.filter((m) => m.rating === 1).length;

      logger.info('Complete profile retrieved', { userId });

      return {
        userId: user.id,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
        personalInfo: {
          displayName: profile.displayName ?? null,
          birthDate: profile.birthDate ? profile.birthDate.toISOString() : null,
          country: profile.country ?? null,
          language: profile.language ?? null,
        },
        preferences: {
          genres,
          directors: directorObjects,
          actors: actorObjects,
        },
        stats: {
          genreCount: genres.length,
          directorCount: directors.length,
          actorCount: actors.length,
          moviesWatched: watchedMovies.length,
          moviesLiked,
          moviesDisliked,
        },
        social: { followerCount, followingCount },
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

  async updatePersonalInfo(
    userId: string,
    data: { displayName?: string | null; birthDate?: string | null; country?: string | null; language?: string | null }
  ): Promise<PersonalInfo> {
    const updated = await prisma.userProfile.update({
      where: { userId },
      data: {
        displayName: data.displayName ?? undefined,
        birthDate: data.birthDate ? new Date(data.birthDate) : data.birthDate === null ? null : undefined,
        country: data.country ?? undefined,
        language: data.language ?? undefined,
      },
    });

    logger.info('Personal info updated', { userId });

    return {
      displayName: updated.displayName ?? null,
      birthDate: updated.birthDate ? updated.birthDate.toISOString() : null,
      country: updated.country ?? null,
      language: updated.language ?? null,
    };
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
