import { Request, Response } from 'express';
import { MOODS } from '../schemas/moods';
import { logger } from '../utils/logger';

/**
 * GET /api/v1/moods
 * Returns list of available moods for the user to select
 */
export const getMoodsController = (req: Request, res: Response): void => {
  try {
    logger.info('Moods list requested');
    res.json({
      success: true,
      data: MOODS,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching moods', error as Error);
    throw error;
  }
};
