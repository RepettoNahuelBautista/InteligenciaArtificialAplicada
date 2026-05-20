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
  avatarUrl: string | null;
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
    liked: boolean | null;
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

      // Get watched movies stats, follow counts, recent movies and reviews in parallel
      const [watchedMovies, followerCount, followingCount, recentWatched, recentReviews] = await Promise.all([
        prisma.watchedMovie.findMany({ where: { userId }, select: { rating: true, id: true, tmdbId: true } }),
        prisma.follow.count({ where: { followingId: userId } }),
        prisma.follow.count({ where: { followerId: userId } }),
        prisma.watchedMovie.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: { id: true, tmdbId: true, title: true, rating: true, createdAt: true },
        }),
        prisma.review.findMany({
          where: { userId, liked: { not: null } },
          orderBy: { updatedAt: 'desc' },
          select: { id: true, tmdbId: true, title: true, rating: true, liked: true, updatedAt: true },
        }),
      ]);

      const moviesLiked = watchedMovies.filter((m) => m.rating === 5).length;
      const moviesDisliked = watchedMovies.filter((m) => m.rating === 1).length;

      // Count unique movies across watchedMovies + reviews (both tables contribute to "Películas vistas")
      const allSeenTmdbIds = new Set([
        ...watchedMovies.map((m) => m.tmdbId),
        ...recentReviews.map((r) => r.tmdbId),
      ]);

      // Merge watched + reviewed, deduplicate by tmdbId keeping the most recent entry
      type RecentEntry = { id: string; tmdbId: string; title: string; rating: number; liked: boolean | null; createdAt: string };
      const entryMap = new Map<string, RecentEntry>();

      for (const m of recentWatched) {
        entryMap.set(m.tmdbId, { id: m.id, tmdbId: m.tmdbId, title: m.title, rating: m.rating, liked: m.rating === 5, createdAt: m.createdAt.toISOString() });
      }
      for (const r of recentReviews) {
        const existing = entryMap.get(r.tmdbId);
        const reviewDate = r.updatedAt.toISOString();
        if (!existing || reviewDate > existing.createdAt) {
          entryMap.set(r.tmdbId, { id: r.id, tmdbId: r.tmdbId, title: r.title, rating: r.rating, liked: r.liked, createdAt: reviewDate });
        }
      }

      const recentMovies = Array.from(entryMap.values())
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 10);

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
          avatarUrl: profile.avatarUrl ?? null,
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
          moviesWatched: allSeenTmdbIds.size,
          moviesLiked,
          moviesDisliked,
        },
        social: { followerCount, followingCount },
        recentMovies,
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
      avatarUrl: updated.avatarUrl ?? null,
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
