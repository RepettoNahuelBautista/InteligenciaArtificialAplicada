import { prisma } from '../db/client';
import { logger } from '../utils/logger';

export interface FeedMovie {
  tmdbId: string;
  title: string;
  posterPath: string | null;
  contentType: string | null;
  /** Number of platform users who liked it (trending only) */
  likedByCount?: number;
  /** Display names of followed users who liked it (fromFollowing only) */
  likedBy?: string[];
}

export interface FeedResponse {
  trending: FeedMovie[];
  fromFollowing: FeedMovie[];
}

/** Minimal shape returned by watchedMovie.findMany with select:{tmdbId} */
type SeenRecord = { tmdbId: string };

/** Shape of each row from watchedMovie.groupBy */
type GroupedMovie = { tmdbId: string; title: string; _count: { tmdbId: number } };

class FeedService {
  /**
   * Returns two personalised movie lists for the home feed:
   *  - trending:      most-liked movies across all platform users
   *  - fromFollowing: movies liked by followed users that the current user hasn't seen yet
   */
  async getFeed(userId: string, limit = 20): Promise<FeedResponse> {
    const [trending, fromFollowing] = await Promise.all([
      this.getTrending(userId, limit),
      this.getFromFollowing(userId, limit),
    ]);

    logger.info('Feed retrieved', { userId, trendingCount: trending.length, fromFollowingCount: fromFollowing.length });
    return { trending, fromFollowing };
  }

  /**
   * Most liked movies on the platform (rating=5), excluding what the current user already rated.
   * Poster paths are resolved from Recommendations or MovieListItems stored in the DB.
   */
  private async getTrending(userId: string, limit: number): Promise<FeedMovie[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const liked = (await (prisma.watchedMovie.groupBy as unknown as (args: any) => Promise<unknown>)({
      by: ['tmdbId', 'title'],
      where: { rating: 5 },
      _count: { tmdbId: true },
      orderBy: { _count: { tmdbId: 'desc' } },
      take: limit * 2,
    })) as GroupedMovie[];

    const seen = await prisma.watchedMovie.findMany({
      where: { userId },
      select: { tmdbId: true },
    }) as SeenRecord[];

    const seenIds = new Set(seen.map((m: SeenRecord) => m.tmdbId));
    const filtered = liked.filter((m: GroupedMovie) => !seenIds.has(m.tmdbId)).slice(0, limit);

    const tmdbIds = filtered.map((m: GroupedMovie) => m.tmdbId);
    const posterMap = await this.resolvePosterPaths(tmdbIds);

    return filtered.map((m: GroupedMovie) => ({
      tmdbId: m.tmdbId,
      title: m.title,
      posterPath: posterMap.get(m.tmdbId) ?? null,
      contentType: null,
      likedByCount: m._count.tmdbId,
    }));
  }

  /**
   * Movies liked by users the current user follows, that the current user hasn't seen yet.
   * Groups by tmdbId and collects display names of who liked each movie.
   */
  private async getFromFollowing(userId: string, limit: number): Promise<FeedMovie[]> {
    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    }) as Array<{ followingId: string }>;

    if (follows.length === 0) return [];

    const followingIds = follows.map((f: { followingId: string }) => f.followingId);

    const likedByFollowed = await prisma.watchedMovie.findMany({
      where: { userId: { in: followingIds }, rating: 5 },
      select: {
        tmdbId: true,
        title: true,
        user: { select: { profile: { select: { displayName: true } }, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const seen = await prisma.watchedMovie.findMany({
      where: { userId },
      select: { tmdbId: true },
    }) as SeenRecord[];

    const seenIds = new Set(seen.map((m: SeenRecord) => m.tmdbId));

    type FollowedMovie = typeof likedByFollowed[number];

    const grouped = new Map<string, { title: string; likedBy: string[] }>();
    for (const m of likedByFollowed as FollowedMovie[]) {
      if (seenIds.has(m.tmdbId)) continue;
      const name = m.user.profile?.displayName ?? m.user.email.split('@')[0];
      const existing = grouped.get(m.tmdbId);
      if (!existing) {
        grouped.set(m.tmdbId, { title: m.title, likedBy: [name] });
      } else {
        existing.likedBy.push(name);
      }
    }

    const top = Array.from(grouped.entries()).slice(0, limit);
    const tmdbIds = top.map(([id]) => id);
    const posterMap = await this.resolvePosterPaths(tmdbIds);

    return top.map(([tmdbId, data]) => ({
      tmdbId,
      title: data.title,
      posterPath: posterMap.get(tmdbId) ?? null,
      contentType: null,
      likedBy: data.likedBy,
    }));
  }

  /**
   * Resolves poster paths for a set of tmdbIds by looking at existing Recommendation
   * and MovieListItem records, avoiding extra TMDB API calls.
   */
  private async resolvePosterPaths(tmdbIds: string[]): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    if (tmdbIds.length === 0) return map;

    const [recs, listItems] = await Promise.all([
      prisma.recommendation.findMany({
        where: { tmdbId: { in: tmdbIds }, posterPath: { not: null } },
        select: { tmdbId: true, posterPath: true },
        distinct: ['tmdbId'],
      }),
      prisma.movieListItem.findMany({
        where: { tmdbId: { in: tmdbIds }, posterPath: { not: null } },
        select: { tmdbId: true, posterPath: true },
        distinct: ['tmdbId'],
      }),
    ]);

    for (const r of listItems) {
      if (r.posterPath) map.set(r.tmdbId, r.posterPath);
    }
    // Recommendations override list items (more recent data)
    for (const r of recs) {
      if (r.posterPath) map.set(r.tmdbId, r.posterPath);
    }

    return map;
  }
}

export const feedService = new FeedService();
