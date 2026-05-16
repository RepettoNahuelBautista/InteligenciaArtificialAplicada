import { prisma } from '../db/client';
import { RateMovieInput, WatchedMovieResponse } from '../schemas/movie';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

class MovieService {
  /**
   * Save a movie/series rating (like=5, dislike=1)
   */
  async rateMovie(userId: string, input: RateMovieInput): Promise<WatchedMovieResponse> {
    try {
      // Check if already rated
      const existing = await prisma.watchedMovie.findUnique({
        where: {
          userId_tmdbId: {
            userId,
            tmdbId: input.tmdbId,
          },
        },
      });

      let movie;

      if (existing) {
        // Update existing rating
        movie = await prisma.watchedMovie.update({
          where: { id: existing.id },
          data: { rating: input.rating },
        });

        logger.info('Movie rating updated', {
          userId,
          tmdbId: input.tmdbId,
          title: input.title,
          rating: input.rating,
        });
      } else {
        // Create new rating
        movie = await prisma.watchedMovie.create({
          data: {
            userId,
            tmdbId: input.tmdbId,
            title: input.title,
            rating: input.rating,
          },
        });

        logger.info('Movie rating saved', {
          userId,
          tmdbId: input.tmdbId,
          title: input.title,
          rating: input.rating,
        });
      }

      return {
        id: movie.id,
        tmdbId: movie.tmdbId,
        title: movie.title,
        rating: movie.rating,
        createdAt: movie.createdAt.toISOString(),
      };
    } catch (error) {
      logger.error('Failed to rate movie', {
        userId,
        tmdbId: input.tmdbId,
        error: (error as Error).message,
      });

      throw new AppError(
        'MOVIE_RATING_ERROR',
        500,
        'Failed to save movie rating'
      );
    }
  }

  /**
   * Get all watched movies for a user
   */
  async getUserWatchedMovies(userId: string): Promise<WatchedMovieResponse[]> {
    try {
      const movies = await prisma.watchedMovie.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      return movies.map((movie) => ({
        id: movie.id,
        tmdbId: movie.tmdbId,
        title: movie.title,
        rating: movie.rating,
        createdAt: movie.createdAt.toISOString(),
      }));
    } catch (error) {
      logger.error('Failed to get watched movies', {
        userId,
        error: (error as Error).message,
      });

      throw new AppError(
        'MOVIE_GET_ERROR',
        500,
        'Failed to get watched movies'
      );
    }
  }

  /**
   * Get statistics about user's watched movies
   */
  async getWatchedMoviesStats(userId: string): Promise<{
    total: number;
    liked: number;
    disliked: number;
  }> {
    try {
      const movies = await prisma.watchedMovie.findMany({
        where: { userId },
        select: { rating: true },
      });

      return {
        total: movies.length,
        liked: movies.filter((m) => m.rating === 5).length,
        disliked: movies.filter((m) => m.rating === 1).length,
      };
    } catch (error) {
      logger.error('Failed to get watched movies stats', {
        userId,
        error: (error as Error).message,
      });

      return { total: 0, liked: 0, disliked: 0 };
    }
  }

  /**
   * Remove a watched movie rating
   */
  async removeWatchedMovie(userId: string, movieId: string): Promise<void> {
    try {
      const movie = await prisma.watchedMovie.findUnique({
        where: { id: movieId },
      });

      if (!movie || movie.userId !== userId) {
        throw new AppError('MOVIE_NOT_FOUND', 404, 'Movie not found');
      }

      await prisma.watchedMovie.delete({
        where: { id: movieId },
      });

      logger.info('Movie rating removed', { userId, movieId });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Failed to remove movie rating', {
        userId,
        movieId,
        error: (error as Error).message,
      });

      throw new AppError(
        'MOVIE_DELETE_ERROR',
        500,
        'Failed to remove movie rating'
      );
    }
  }
}

export const movieService = new MovieService();
