import { Request, Response } from 'express';
import { followService } from '../services/followService';

export const searchUsersController = async (req: Request, res: Response): Promise<void> => {
  const q = String(req.query.q ?? '').trim();
  if (q.length < 2) {
    res.json({ success: true, data: [] });
    return;
  }
  const currentUserId = req.userId as string;
  const results = await followService.searchUsers(q, currentUserId);
  res.json({ success: true, data: results });
};

export const followController = async (req: Request, res: Response): Promise<void> => {
  const followerId = req.userId as string;
  const { userId: followingId } = req.params;
  await followService.follow(followerId, followingId);
  res.json({ success: true, data: { following: true } });
};

export const unfollowController = async (req: Request, res: Response): Promise<void> => {
  const followerId = req.userId as string;
  const { userId: followingId } = req.params;
  await followService.unfollow(followerId, followingId);
  res.json({ success: true, data: { following: false } });
};

export const getFollowersController = async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId as string;
  const list = await followService.getFollowersList(userId);
  res.json({ success: true, data: list });
};

export const getFollowingController = async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId as string;
  const list = await followService.getFollowingList(userId);
  res.json({ success: true, data: list });
};

export const getNewFollowersController = async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId as string;
  const result = await followService.getNewFollowers(userId);
  res.json({ success: true, data: result });
};

export const markFollowersSeenController = async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId as string;
  await followService.markFollowersSeen(userId);
  res.json({ success: true });
};
