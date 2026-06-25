import { Request, Response } from 'express';
import { feedService } from '../services/feedService';
import { logger } from '../utils/logger';

/**
 * GET /api/v1/feed
 * Returns trending movies and personalised "from people you follow" movies for the home feed.
 */
export const getFeedController = async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId as string;

  const data = await feedService.getFeed(userId);

  logger.info('Feed served', { userId });
  res.json({ success: true, data });
};
