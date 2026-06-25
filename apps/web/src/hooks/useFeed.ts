import { useEffect, useState } from 'react';
import { apiClient } from '../api/apiClient';

export interface FeedMovie {
  tmdbId: string;
  title: string;
  posterPath: string | null;
  contentType: string | null;
  likedByCount?: number;
  likedBy?: string[];
}

export interface FeedData {
  trending: FeedMovie[];
  fromFollowing: FeedMovie[];
}

export function useFeed() {
  const [data, setData]       = useState<FeedData | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiClient.get<{ success: boolean; data: FeedData }>('/feed')
      .then((res) => { if (!cancelled) setData(res.data.data); })
      .catch(() => { if (!cancelled) setError('No se pudo cargar el feed'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  return { data, isLoading, error };
}
