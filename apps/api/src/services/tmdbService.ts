import { config } from 'dotenv';
import { resolve } from 'path';
import axios, { AxiosError } from 'axios';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

config({ path: resolve(process.cwd(), '.env.local'), override: true });

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY || '';
const TMDB_TIMEOUT_MS = parseInt(process.env.TMDB_TIMEOUT_MS || '5000', 10);

interface Person {
  id: number;
  name: string;
  known_for_department?: string;
  profile_path?: string | null;
  known_for?: Array<{ title?: string; name?: string }>;
}

interface PersonResponse {
  id: number;
  name: string;
  department: string; // "Acting" or "Directing"
}

interface MovieSearchResult {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  overview: string;
}

/**
 * TMDB Service - Search movies/series/people
 */
class TMDBService {
  private apiKey: string;
  private baseURL: string;
  private timeout: number;

  constructor() {
    if (!TMDB_API_KEY) {
      logger.warn('TMDB_API_KEY not set in environment');
    }
    this.apiKey = TMDB_API_KEY;
    this.baseURL = TMDB_BASE_URL;
    this.timeout = TMDB_TIMEOUT_MS;
  }

  /**
   * Search for people (directors/actors) by name
   */
  async searchPeople(query: string): Promise<PersonResponse[]> {
    try {
      if (!query || query.trim().length < 2) {
        return [];
      }

      const response = await axios.get(`${this.baseURL}/search/person`, {
        params: {
          api_key: this.apiKey,
          query: query.trim(),
          page: 1,
        },
        timeout: this.timeout,
      });

      const results: Person[] = response.data.results || [];

      // Filter and map to our format
      const mapped = results
        .filter((person) => person.known_for_department && person.id)
        .slice(0, 10) // Limit to top 10 results
        .map((person) => ({
          id: person.id,
          name: person.name,
          department: person.known_for_department || 'Unknown',
        }));

      logger.debug('TMDB person search', {
        query,
        resultsCount: mapped.length,
      });

      return mapped;
    } catch (error) {
      const axiosError = error as AxiosError;
      logger.error('TMDB search error', {
        query,
        status: axiosError.response?.status,
        message: axiosError.message,
      });

      if (axiosError.response?.status === 401) {
        throw new AppError(
          'TMDB_AUTH_ERROR',
          500,
          'TMDB API authentication failed',
          false
        );
      }

      if (axiosError.code === 'ECONNABORTED') {
        throw new AppError(
          'TMDB_TIMEOUT',
          504,
          'TMDB API timeout',
          true
        );
      }

      throw new AppError(
        'TMDB_SEARCH_ERROR',
        502,
        'Failed to search TMDB',
        true
      );
    }
  }

  /**
   * Get person details (for validation)
   */
  async getPersonDetails(personId: number): Promise<PersonResponse | null> {
    try {
      const response = await axios.get(`${this.baseURL}/person/${personId}`, {
        params: {
          api_key: this.apiKey,
        },
        timeout: this.timeout,
      });

      const person = response.data as Person;

      if (!person.id || !person.name) {
        return null;
      }

      return {
        id: person.id,
        name: person.name,
        department: person.known_for_department || 'Unknown',
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      logger.warn('Failed to get person details', {
        personId,
        status: axiosError.response?.status,
      });
      return null;
    }
  }

  /**
   * Search for a movie by title (for validation)
   */
  async searchMovie(title: string): Promise<{ id: number; title: string } | null> {
    try {
      if (!title || title.trim().length < 2) {
        return null;
      }

      const response = await axios.get(`${this.baseURL}/search/movie`, {
        params: {
          api_key: this.apiKey,
          query: title.trim(),
          page: 1,
        },
        timeout: this.timeout,
      });

      const results: MovieSearchResult[] = response.data.results || [];
      const topResult = results[0];

      if (!topResult || !topResult.id) {
        return null;
      }

      return {
        id: topResult.id,
        title: topResult.title || 'Unknown',
      };
    } catch (error) {
      logger.warn('Failed to search movie', {
        title,
        error: (error as Error).message,
      });
      return null;
    }
  }

  /**
   * Get movie details by ID
   */
  async getMovieDetails(
    movieId: number
  ): Promise<{ id: number; title: string; poster_path: string | null; overview: string } | null> {
    try {
      const response = await axios.get(`${this.baseURL}/movie/${movieId}`, {
        params: {
          api_key: this.apiKey,
        },
        timeout: this.timeout,
      });

      const movie = response.data as MovieSearchResult;

      if (!movie.id) {
        return null;
      }

      return {
        id: movie.id,
        title: movie.title || 'Unknown',
        poster_path: movie.poster_path || null,
        overview: movie.overview || '',
      };
    } catch (error) {
      logger.warn('Failed to get movie details', {
        movieId,
        error: (error as Error).message,
      });
      return null;
    }
  }

  /**
   * Search for movies or TV series
   */
  async searchMovies(
    query: string,
    type: 'movie' | 'tv' | undefined = undefined
  ): Promise<
    Array<{
      id: number;
      title: string;
      year: number;
      poster_path: string | null;
      overview: string;
      media_type: 'movie' | 'tv';
    }>
  > {
    try {
      if (!query || query.trim().length < 2) {
        return [];
      }

      // Determine endpoint
      const endpoint = type ? `search/${type}` : 'search/multi';

      const response = await axios.get(`${this.baseURL}/${endpoint}`, {
        params: {
          api_key: this.apiKey,
          query: query.trim(),
          page: 1,
        },
        timeout: this.timeout,
      });

      const results: MovieSearchResult[] = response.data.results || [];

      // Filter and map results
      const mapped = results
        .filter((item) => {
          // Filter out results without ID or title
          const hasId = item.id;
          const hasTitle = item.title || (item as any).name;
          return hasId && hasTitle;
        })
        .slice(0, 15) // Limit to 15 results
        .map((item) => ({
          id: item.id,
          title: item.title || (item as any).name || 'Unknown',
          year: new Date(
            (item as any).release_date || (item as any).first_air_date || ''
          ).getFullYear() || new Date().getFullYear(),
          poster_path: item.poster_path || null,
          overview: item.overview || '',
          media_type: (item as any).media_type || type || 'movie',
        }));

      logger.debug('TMDB movies search', {
        query,
        type: type || 'all',
        resultsCount: mapped.length,
      });

      return mapped;
    } catch (error) {
      const axiosError = error as AxiosError;
      logger.error('TMDB movies search error', {
        query,
        status: axiosError.response?.status,
        message: axiosError.message,
      });

      if (axiosError.code === 'ECONNABORTED') {
        throw new AppError('TMDB_TIMEOUT', 504, 'TMDB API timeout', true);
      }

      throw new AppError(
        'TMDB_SEARCH_ERROR',
        502,
        'Failed to search TMDB',
        true
      );
    }
  }
}

export const tmdbService = new TMDBService();
