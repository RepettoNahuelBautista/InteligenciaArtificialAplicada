import { useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';
import { logger } from '../utils/logger';

export interface Mood {
  id: string;
  label: string;
  emoji: string;
  description: string;
}

interface UseMoodSelectorState {
  moods: Mood[];
  selectedMood: Mood | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to manage mood selection for recommendations
 */
export const useMoodSelector = () => {
  const [state, setState] = useState<UseMoodSelectorState>({
    moods: [],
    selectedMood: null,
    loading: true,
    error: null,
  });

  const fetchMoods = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const response = await apiClient.get('/moods');
      const { data } = response.data;

      logger.info('Moods loaded successfully', { count: data.length });
      setState({
        moods: data,
        selectedMood: null,
        loading: false,
        error: null,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load moods';
      logger.error('Failed to load moods', { error: errorMessage });
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  };

  const selectMood = (mood: Mood) => {
    setState((prev) => ({
      ...prev,
      selectedMood: prev.selectedMood?.id === mood.id ? null : mood,
    }));
    logger.info('Mood selected', { moodId: mood.id, label: mood.label });
  };

  const clearMood = () => {
    setState((prev) => ({
      ...prev,
      selectedMood: null,
    }));
    logger.info('Mood cleared');
  };

  useEffect(() => {
    fetchMoods();
  }, []);

  return {
    ...state,
    selectMood,
    clearMood,
  };
};
