import { prisma } from '../db/client';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

interface PersonData {
  id: number;
  name: string;
  department: string;
}

interface SavePersonInput {
  personIds: number[];
  type: 'directors' | 'actors'; // directors or actors
}

const MAX_PERSONS = 15;

class PersonService {
  /**
   * Save user's favorite people (directors or actors)
   */
  async saveUserPersonPreferences(
    userId: string,
    input: SavePersonInput
  ): Promise<{ directors: number[]; actors: number[] }> {
    try {
      // Validate input
      if (!Array.isArray(input.personIds)) {
        throw new AppError('INVALID_INPUT', 400, 'personIds must be an array');
      }

      if (input.personIds.length > MAX_PERSONS) {
        throw new AppError(
          'TOO_MANY_PERSONS',
          400,
          `Maximum ${MAX_PERSONS} persons allowed`,
          false
        );
      }

      // Validate all IDs are numbers
      if (!input.personIds.every((id) => typeof id === 'number' && id > 0)) {
        throw new AppError('INVALID_PERSON_ID', 400, 'Invalid person IDs');
      }

      // Get current profile
      const profile = await prisma.userProfile.findUnique({
        where: { userId },
      });

      if (!profile) {
        throw new AppError('PROFILE_NOT_FOUND', 404, 'User profile not found');
      }

      // Parse current preferences
      let directors: number[] = [];
      let actors: number[] = [];

      try {
        if (profile.favoriteDirectors) {
          directors = JSON.parse(profile.favoriteDirectors);
        }
        if (profile.favoriteActors) {
          actors = JSON.parse(profile.favoriteActors);
        }
      } catch (e) {
        logger.warn('Failed to parse existing preferences', { userId });
      }

      // Update based on type
      if (input.type === 'directors') {
        directors = input.personIds;
      } else if (input.type === 'actors') {
        actors = input.personIds;
      } else {
        throw new AppError('INVALID_TYPE', 400, 'Type must be "directors" or "actors"');
      }

      // Save to database
      await prisma.userProfile.update({
        where: { userId },
        data: {
          favoriteDirectors: JSON.stringify(directors),
          favoriteActors: JSON.stringify(actors),
        },
      });

      logger.info('User preferences saved', {
        userId,
        type: input.type,
        count: input.personIds.length,
      });

      return { directors, actors };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Failed to save person preferences', {
        userId,
        error: (error as Error).message,
      });

      throw new AppError(
        'PERSON_SAVE_ERROR',
        500,
        'Failed to save person preferences'
      );
    }
  }

  /**
   * Get user's favorite people
   */
  async getUserPeople(userId: string): Promise<{ directors: number[]; actors: number[] }> {
    try {
      const profile = await prisma.userProfile.findUnique({
        where: { userId },
      });

      if (!profile) {
        throw new AppError('PROFILE_NOT_FOUND', 404, 'User profile not found');
      }

      let directors: number[] = [];
      let actors: number[] = [];

      try {
        if (profile.favoriteDirectors) {
          directors = JSON.parse(profile.favoriteDirectors);
        }
        if (profile.favoriteActors) {
          actors = JSON.parse(profile.favoriteActors);
        }
      } catch (e) {
        logger.warn('Failed to parse preferences', { userId });
      }

      return { directors, actors };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Failed to get person preferences', {
        userId,
        error: (error as Error).message,
      });

      throw new AppError(
        'PERSON_GET_ERROR',
        500,
        'Failed to get person preferences'
      );
    }
  }
}

export const personService = new PersonService();
