import { useState } from 'react';
import { apiClient } from '../api/apiClient';
import { RecommendationContext } from './useRecommendationContext';

export interface WatchProvider {
  providerId: number;
  providerName: string;
  logoPath: string;
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

export function useRecommendation() {
  const [results, setResults] = useState<RecommendationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendation = async (context: RecommendationContext) => {
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await apiClient.post('/recommendations', {
        moodId: context.moodId,
        contentType: context.contentType ?? null,
        duration: context.duration ?? null,
        year: context.year ?? null,
        excludeTitles: [],
      });
      setResults([response.data.data]);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setError(e.response?.data?.error?.message || 'Error obteniendo recomendación');
    } finally {
      setLoading(false);
    }
  };

  const fetchNext = async (context: RecommendationContext, currentResults: RecommendationResult[]) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/recommendations', {
        moodId: context.moodId,
        contentType: context.contentType ?? null,
        duration: context.duration ?? null,
        year: context.year ?? null,
        excludeTitles: currentResults.map((r) => r.title),
      });
      setResults((prev) => [response.data.data, ...prev]);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setError(e.response?.data?.error?.message || 'Error obteniendo recomendación');
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setResults([]);
    setError(null);
  };

  return { results, loading, error, fetchRecommendation, fetchNext, clear };
}
