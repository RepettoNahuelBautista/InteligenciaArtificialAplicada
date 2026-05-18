import { prisma } from '../db/client';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface UserSearchResult {
  userId: string;
  displayName: string;
  email: string;
}

export interface FollowUserItem {
  userId: string;
  displayName: string;
  email: string;
}

class FollowService {
  async searchUsers(query: string, currentUserId: string): Promise<UserSearchResult[]> {
    const users = await prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        profile: {
          displayName: { contains: query, mode: 'insensitive' },
        },
      },
      include: {
        profile: { select: { displayName: true } },
      },
      take: 10,
      orderBy: { createdAt: 'asc' },
    });

    return users.map((u) => ({
      userId: u.id,
      displayName: u.profile?.displayName ?? u.email.split('@')[0],
      email: u.email,
    }));
  }

  async follow(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) {
      throw new AppError('INVALID_INPUT', 400, 'No podés seguirte a vos mismo');
    }
    const target = await prisma.user.findUnique({ where: { id: followingId }, select: { id: true } });
    if (!target) {
      throw new AppError('USER_NOT_FOUND', 404, 'Usuario no encontrado');
    }
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      create: { followerId, followingId },
      update: {},
    });
    logger.info('Follow created', { followerId, followingId });
  }

  async unfollow(followerId: string, followingId: string): Promise<void> {
    await prisma.follow.deleteMany({ where: { followerId, followingId } });
    logger.info('Follow removed', { followerId, followingId });
  }

  async getFollowCounts(userId: string): Promise<{ followerCount: number; followingCount: number }> {
    const [followerCount, followingCount] = await Promise.all([
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.follow.count({ where: { followerId: userId } }),
    ]);
    return { followerCount, followingCount };
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
      select: { id: true },
    });
    return follow !== null;
  }

  async getFollowersList(userId: string): Promise<FollowUserItem[]> {
    const follows = await prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: { include: { profile: { select: { displayName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return follows.map((f) => ({
      userId: f.follower.id,
      displayName: f.follower.profile?.displayName ?? f.follower.email.split('@')[0],
      email: f.follower.email,
    }));
  }

  async getFollowingList(userId: string): Promise<FollowUserItem[]> {
    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: { include: { profile: { select: { displayName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return follows.map((f) => ({
      userId: f.following.id,
      displayName: f.following.profile?.displayName ?? f.following.email.split('@')[0],
      email: f.following.email,
    }));
  }
}

export const followService = new FollowService();
