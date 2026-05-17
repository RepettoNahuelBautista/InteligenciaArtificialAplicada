import { useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';

export interface HistoryItem {
  id: string;
  tmdbId: string;
  title: string;
  explanation: string;
  genre: string;
  year: number;
  contentType: string | null;
  posterPath: string | null;
  overview: string | null;
  contextMood: string | null;
  contextType: string | null;
  createdAt: string;
}

export function useHistory() {
  const [allItems, setAllItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get('/recommendations', { params: { page: 1, limit: 100 } });
        setAllItems(response.data.data.recommendations);
      } catch {
        setError('No se pudo cargar el historial');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { allItems, loading, error };
}
