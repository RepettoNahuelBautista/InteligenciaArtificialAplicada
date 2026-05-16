import { prisma } from '../db/client';
import { SelectGenresInput } from '../schemas/genres';
import { NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

export async function saveUserGenrePreferences(userId: string, input: SelectGenresInput) {
  logger.info('Saving genre preferences', { userId, genreCount: input.genreIds.length });

  const profile = await prisma.userProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new NotFoundError('User profile');
  }

  try {
    const updated = await prisma.userProfile.update({
      where: { userId },
      data: {
        favoriteGenres: JSON.stringify(input.genreIds),
      },
    });

    logger.info('Genre preferences saved', { userId });
    return updated;
  } catch (error) {
    logger.error('Error saving genre preferences', error as Error);
    throw error;
  }
}

export async function getUserProfile(userId: string) {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new NotFoundError('User profile');
  }

  return {
    ...profile,
    favoriteGenres: JSON.parse(profile.favoriteGenres),
    favoriteDirectors: JSON.parse(profile.favoriteDirectors),
    favoriteActors: JSON.parse(profile.favoriteActors),
  };
}
