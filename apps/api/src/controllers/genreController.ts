import { Request, Response } from 'express';
import { MOVIE_GENRES, TV_GENRES, SelectGenresSchema } from '../schemas/genres';
import { saveUserGenrePreferences, getUserProfile } from '../services/genreService';
import { logger } from '../utils/logger';

export function getGenresController(req: Request, res: Response): void {
  try {
    const { type } = req.query;

    if (type === 'tv') {
      res.status(200).json({
        success: true,
        data: TV_GENRES,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: MOVIE_GENRES,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching genres', error as Error);
    throw error;
  }
}

export async function saveGenrePreferencesController(req: Request, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
      return;
    }

    const validatedInput = SelectGenresSchema.parse(req.body);
    const profile = await saveUserGenrePreferences(req.userId, validatedInput);

    res.status(200).json({
      success: true,
      data: {
        ...profile,
        favoriteGenres: JSON.parse(profile.favoriteGenres),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
}

export async function getProfileController(req: Request, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
      return;
    }

    const profile = await getUserProfile(req.userId);

    res.status(200).json({
      success: true,
      data: profile,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
}
