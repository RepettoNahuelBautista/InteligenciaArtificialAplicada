import { profileService } from './profileService';
import { geminiService, RecommendationPromptContext, LLMRecommendation } from './geminiService';
import { tmdbService, WatchProvider } from './tmdbService';
import { prisma } from '../db/client';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

const MAX_RETRIES = parseInt(process.env.RECOMMENDATION_MAX_RETRIES || '3', 10);

export interface RecommendationRequest {
  moodId: string;
  contentType: 'movie' | 'tv' | null;
  duration: 'short' | 'normal' | 'long' | null;
  year: 'classic' | 'recent' | 'new' | null;
}

export interface RecommendationResult {
  tmdbId: string;
  title: string;
  year: number;
  genre: string;
  overview: string;
  posterPath: string | null;
  contentType: 'movie' | 'tv';
  explanation: string;
  watchProviders: WatchProvider[];
}

class RecommendationService {
  async getRecommendation(
    userId: string,
    req: RecommendationRequest
  ): Promise<RecommendationResult> {
    // 1. Load user profile
    const profile = await profileService.getCompleteProfile(userId);

    // Build context for LLM
    const ctx: RecommendationPromptContext = {
      genres: profile.preferences.genres.map(String),
      directors: profile.preferences.directors.map((d) => d.name),
      actors: profile.preferences.actors.map((a) => a.name),
      likedMovies: [],
      dislikedMovies: [],
      mood: req.moodId,
      contentType: req.contentType,
      duration: req.duration,
      year: req.year,
    };

    // Add watched movies context
    const watchedMovies = await prisma.watchedMovie.findMany({
      where: { userId },
      select: { title: true, rating: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    ctx.likedMovies = watchedMovies.filter((m) => m.rating === 5).map((m) => m.title);
    ctx.dislikedMovies = watchedMovies.filter((m) => m.rating === 1).map((m) => m.title);

    // 2. Call LLM with retry + TMDB validation
    const excluded: string[] = [];
    let lastLLMResult: LLMRecommendation | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      logger.info(`Recommendation attempt ${attempt}/${MAX_RETRIES}`, { userId });

      try {
        lastLLMResult = await geminiService.getRecommendation(ctx, excluded);
      } catch (err) {
        if (attempt === MAX_RETRIES) throw err;
        logger.warn('Gemini error, retrying', { attempt, error: (err as Error).message });
        continue;
      }

      // 3. Validate against TMDB (anti-hallucination) — optional if no API key configured
      const tmdbKeyConfigured = !!(
        process.env.TMDB_API_KEY && process.env.TMDB_API_KEY !== 'your-tmdb-api-key'
      );

      let tmdbId = `llm-${Date.now()}`;
      let finalTitle = lastLLMResult.title;
      let overview = '';
      let posterPath: string | null = null;
      let watchProviders: WatchProvider[] = [];
      const mediaType = lastLLMResult.contentType;

      if (tmdbKeyConfigured) {
        const tmdbResult = await tmdbService.searchMovie(lastLLMResult.title, mediaType);

        if (!tmdbResult) {
          logger.warn('Title not found in TMDB, retrying', { title: lastLLMResult.title, attempt });
          excluded.push(lastLLMResult.title);
          continue;
        }

        const [tmdbDetails, providers] = await Promise.all([
          tmdbService.getMovieDetails(tmdbResult.id, tmdbResult.mediaType),
          tmdbService.getWatchProviders(String(tmdbResult.id), tmdbResult.mediaType),
        ]);

        tmdbId = String(tmdbResult.id);
        finalTitle = tmdbResult.title;
        overview = tmdbDetails?.overview || '';
        posterPath = tmdbDetails?.poster_path || null;
        watchProviders = providers;

        logger.info('Recommendation validated via TMDB', {
          title: finalTitle,
          tmdbId,
          attempt,
          providers: providers.map((p) => p.providerName),
        });
      } else {
        logger.warn('TMDB key not configured, skipping validation');
      }

      const result: RecommendationResult = {
        tmdbId,
        title: finalTitle,
        year: lastLLMResult.year,
        genre: lastLLMResult.genre,
        overview,
        posterPath,
        contentType: lastLLMResult.contentType,
        explanation: lastLLMResult.explanation,
        watchProviders,
      };

      // 5. Persist recommendation
      try {
        await prisma.recommendation.create({
          data: {
            userId,
            tmdbId: result.tmdbId,
            title: result.title,
            explanation: result.explanation,
            genre: result.genre,
            year: result.year,
            contentType: result.contentType,
            posterPath: result.posterPath,
            overview: result.overview || null,
            contextMood: req.moodId,
            contextType: req.contentType,
            contextDuration: req.duration ? this.durationToMinutes(req.duration) : null,
            contextYear: req.year ? this.yearOptionToInt(req.year) : null,
          },
        });
      } catch (err) {
        logger.warn('Failed to persist recommendation', { error: (err as Error).message });
      }

      return result;
    }

    throw new AppError(
      'RECOMMENDATION_FAILED',
      503,
      'No se pudieron generar recomendaciones válidas. Intentá de nuevo.',
      false
    );
  }

  private durationToMinutes(duration: 'short' | 'normal' | 'long'): number {
    return { short: 90, normal: 120, long: 180 }[duration];
  }

  private yearOptionToInt(year: 'classic' | 'recent' | 'new'): number {
    return { classic: 1999, recent: 2015, new: 2016 }[year];
  }
}

export const recommendationService = new RecommendationService();
