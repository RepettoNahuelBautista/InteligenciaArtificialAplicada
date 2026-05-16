import { Request, Response } from 'express';
import { profileService } from '../services/profileService';
import { logger } from '../utils/logger';

/**
 * GET /api/v1/profile
 * Returns the user's complete profile with genres, directors, actors, stats, and recent movies
 */
export const getProfileController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId as string;

    const profile = await profileService.getCompleteProfile(userId);

    logger.info('Complete profile retrieved', { userId });
    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    throw error;
  }
};
