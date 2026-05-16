import { useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';
import { logger } from '../utils/logger';

export interface UserProfileComplete {
  userId: string;
  email: string;
  createdAt: string;
  preferences: {
    genres: number[];
    directors: number[];
    actors: number[];
  };
  stats: {
    genreCount: number;
    directorCount: number;
    actorCount: number;
    moviesWatched: number;
    moviesLiked: number;
    moviesDisliked: number;
  };
  recentMovies: Array<{
    id: string;
    tmdbId: string;
    title: string;
    rating: number;
    createdAt: string;
  }>;
}

interface UseProfileState {
  profile: UserProfileComplete | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch and manage user's complete profile
 */
export const useProfile = () => {
  const [state, setState] = useState<UseProfileState>({
    profile: null,
    loading: true,
    error: null,
  });

  const fetchProfile = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const response = await apiClient.get('/profile');
      const { data } = response.data;

      logger.info('Profile loaded successfully');
      setState({
        profile: data,
        loading: false,
        error: null,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load profile';
      logger.error('Failed to load profile', { error: errorMessage });
      setState({
        profile: null,
        loading: false,
        error: errorMessage,
      });
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    ...state,
    refetch: fetchProfile,
  };
};
