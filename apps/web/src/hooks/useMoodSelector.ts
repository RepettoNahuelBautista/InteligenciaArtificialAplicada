import { useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';

export interface Mood {
  id: string;
  label: string;
  emoji: string;
  description: string;
}

export const useMoodSelector = () => {
  const [moods, setMoods] = useState<Mood[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get('/moods')
      .then((res) => {
        setMoods(res.data.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Error cargando estados de ánimo');
        setLoading(false);
      });
  }, []);

  return { moods, loading, error };
};
