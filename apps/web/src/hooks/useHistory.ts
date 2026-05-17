import { useState, useEffect, useCallback } from 'react';
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

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export function useHistory() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/recommendations', { params: { page, limit: 10 } });
      setItems(response.data.data.recommendations);
      setPagination(response.data.data.pagination);
    } catch {
      setError('No se pudo cargar el historial');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  return { items, pagination, loading, error, fetchPage };
}
