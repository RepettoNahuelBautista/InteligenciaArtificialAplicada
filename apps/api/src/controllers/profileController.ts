import { Request, Response } from 'express';
import { z } from 'zod';
import { profileService } from '../services/profileService';
import { logger } from '../utils/logger';

const PersonalInfoSchema = z.object({
  displayName: z.string().min(1).max(100).nullable().optional(),
  birthDate: z.string().nullable().optional(),
  country: z.string().max(100).nullable().optional(),
  language: z.enum(['es', 'en', 'pt', 'fr', 'de', 'it', 'ja']).nullable().optional(),
});

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

export const updatePersonalInfoController = async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId as string;

  const parsed = PersonalInfoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: parsed.error.errors[0]?.message ?? 'Invalid input' },
    });
    return;
  }

  const result = await profileService.updatePersonalInfo(userId, parsed.data);
  logger.info('Personal info updated via controller', { userId });
  res.json({ success: true, data: result });
};
