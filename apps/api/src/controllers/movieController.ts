import { Request, Response, NextFunction } from 'express';
import { tmdbService } from '../services/tmdbService';
import { movieService } from '../services/movieService';
import { RateMovieSchema, SearchMoviesSchema } from '../schemas/movie';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

/**
 * GET /api/v1/search/movies?q=title&type=movie|tv
 * Search for movies or series by title
 */
export const searchMoviesController = async (
  req: Request<{}, {}, {}, { q: string; type?: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { q, type } = req.query;

    // Validate query
    const validation = SearchMoviesSchema.safeParse({ q, type });
    if (!validation.success) {
      throw new AppError(
        'INVALID_SEARCH_QUERY',
        400,
        'Invalid search query'
      );
    }

    // Search TMDB
    const results = await tmdbService.searchMovies(q, type as 'movie' | 'tv' | undefined);

    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
    });

    logger.debug('Movie search executed', {
      query: q,
      type: type || 'all',
      resultsCount: results.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/profile/watched-movies
 * Rate a movie (like/dislike)
 * Requires auth
 */
export const rateMovieController = async (
  req: Request<{}, {}, { tmdbId: string; title: string; rating: string | number }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      throw new AppError('UNAUTHORIZED', 401, 'User not authenticated');
    }

    // Validate input
    const validation = RateMovieSchema.safeParse({
      tmdbId: req.body.tmdbId,
      title: req.body.title,
      rating: String(req.body.rating),
    });

    if (!validation.success) {
      throw new AppError(
        'INVALID_MOVIE_DATA',
        400,
        validation.error.errors[0]?.message || 'Invalid movie data'
      );
    }

    const result = await movieService.rateMovie(userId, validation.data);

    res.status(201).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });

    logger.info('Movie rated', {
      userId,
      tmdbId: validation.data.tmdbId,
      rating: validation.data.rating,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/profile/watched-movies
 * Get all watched movies for user
 * Requires auth
 */
export const getWatchedMoviesController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      throw new AppError('UNAUTHORIZED', 401, 'User not authenticated');
    }

    const movies = await movieService.getUserWatchedMovies(userId);
    const stats = await movieService.getWatchedMoviesStats(userId);

    res.json({
      success: true,
      data: {
        movies,
        stats,
      },
      timestamp: new Date().toISOString(),
    });

    logger.debug('Retrieved watched movies', { userId, count: movies.length });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/profile/watched-movies/:movieId
 * Remove a watched movie rating
 * Requires auth
 */
export const removeWatchedMovieController = async (
  req: Request<{ movieId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      throw new AppError('UNAUTHORIZED', 401, 'User not authenticated');
    }

    const { movieId } = req.params;

    if (!movieId || movieId.trim().length === 0) {
      throw new AppError('INVALID_MOVIE_ID', 400, 'Invalid movie ID');
    }

    await movieService.removeWatchedMovie(userId, movieId);

    res.json({
      success: true,
      data: { deleted: true },
      timestamp: new Date().toISOString(),
    });

    logger.info('Watched movie removed', { userId, movieId });
  } catch (error) {
    next(error);
  }
};
