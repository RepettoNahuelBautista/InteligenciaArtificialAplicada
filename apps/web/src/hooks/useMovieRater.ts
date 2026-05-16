import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../api/apiClient';
import { logger } from '../utils/logger';

interface Movie {
  id: number;
  title: string;
  year: number;
  poster_path: string | null;
  overview: string;
  media_type: 'movie' | 'tv';
}

interface UseMovieRaterOptions {
  onMovieRated?: (movie: Movie) => void;
}

export const useMovieRater = (options?: UseMovieRaterOptions) => {
  const { onMovieRated } = options || {};

  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);
  const [isRating, setIsRating] = useState(false);
  const [ratedCount, setRatedCount] = useState(0);

  useEffect(() => {
    loadRatedCount();
  }, []);

  const loadRatedCount = async () => {
    try {
      const response = await apiClient.get('/profile/watched-movies');
      if (response.data?.data?.stats) {
        setRatedCount(response.data.data.stats.total);
      }
    } catch (err) {
      logger.warn('Failed to load rated count', { error: err });
    }
  };

  const searchMovies = useCallback(
    async (query: string, type?: 'movie' | 'tv') => {
      if (query.trim().length < 2) {
        setSearchResults([]);
        setError(null);
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        const params: any = { q: query };
        if (type) {
          params.type = type;
        }

        const response = await apiClient.get('/search/movies', { params });

        if (response.data?.data) {
          setSearchResults(response.data.data);
          if (response.data.data.length === 0) {
            setError('No se encontraron películas o series');
          }
        } else {
          setSearchResults([]);
          setError('Error en la búsqueda');
        }
      } catch (err) {
        setError('Failed to search movies');
        logger.error('Movie search error', { query, error: err });
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      searchMovies(query);
    },
    [searchMovies]
  );

  const selectMovie = useCallback((movie: Movie) => {
    setCurrentMovie(movie);
    setSearchResults([]);
    setSearchQuery('');
    setError(null);
  }, []);

  const rateMovie = useCallback(
    async (rating: 1 | 5) => {
      if (!currentMovie) return;

      setIsRating(true);
      setError(null);

      try {
        await apiClient.post('/profile/watched-movies', {
          tmdbId: String(currentMovie.id),
          title: currentMovie.title,
          rating: String(rating),
        });

        setRatedCount((prev) => prev + 1);
        onMovieRated?.(currentMovie);

        // Reset for next search
        setCurrentMovie(null);
        setSearchQuery('');

        logger.info('Movie rated', {
          title: currentMovie.title,
          rating,
        });
      } catch (err) {
        setError('Failed to save rating');
        logger.error('Movie rating error', { error: err });
      } finally {
        setIsRating(false);
      }
    },
    [currentMovie, onMovieRated]
  );

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
  }, []);

  return {
    // Search
    searchQuery,
    searchResults,
    isSearching,
    handleSearch,
    clearSearch,

    // Current movie
    currentMovie,
    selectMovie,

    // Rating
    rateMovie,
    isRating,
    ratedCount,

    // UI state
    error,
  };
};
