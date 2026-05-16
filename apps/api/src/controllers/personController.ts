import { Request, Response, NextFunction } from 'express';
import { tmdbService } from '../services/tmdbService';
import { personService } from '../services/personService';
import { SearchPersonSchema, SavePersonPreferencesSchema } from '../schemas/person';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

/**
 * GET /api/v1/search/people?q=name
 * Search for directors or actors by name
 */
export const searchPeopleController = async (
  req: Request<{}, {}, {}, { q: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { q } = req.query;

    // Validate query
    const validation = SearchPersonSchema.safeParse({ q });
    if (!validation.success) {
      throw new AppError(
        'INVALID_SEARCH_QUERY',
        400,
        'Invalid search query',
        false
      );
    }

    const results = await tmdbService.searchPeople(q);

    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
    });

    logger.debug('People search executed', {
      query: q,
      resultsCount: results.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/profile/people
 * Save user's favorite directors or actors
 * Requires auth
 */
export const savePersonPreferencesController = async (
  req: Request<{}, {}, { personIds: number[]; type: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).userId; // Set by auth middleware
    if (!userId) {
      throw new AppError('UNAUTHORIZED', 401, 'User not authenticated');
    }

    // Validate input
    const validation = SavePersonPreferencesSchema.safeParse(req.body);
    if (!validation.success) {
      throw new AppError(
        'INVALID_PERSON_DATA',
        400,
        validation.error.errors[0]?.message || 'Invalid person data'
      );
    }

    const result = await personService.saveUserPersonPreferences(
      userId,
      validation.data
    );

    res.status(201).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });

    logger.info('Person preferences saved', {
      userId,
      type: validation.data.type,
      count: validation.data.personIds.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/profile/people
 * Get user's favorite directors and actors
 * Requires auth
 */
export const getPersonPreferencesController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      throw new AppError('UNAUTHORIZED', 401, 'User not authenticated');
    }

    const result = await personService.getUserPeople(userId);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });

    logger.debug('Retrieved person preferences', { userId });
  } catch (error) {
    next(error);
  }
};
