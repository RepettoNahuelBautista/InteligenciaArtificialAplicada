import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';

export interface NewFollower {
  userId: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
}

export function useNewFollowers() {
  const [followers, setFollowers] = useState<NewFollower[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ success: boolean; data: { followers: NewFollower[]; count: number } }>(
        '/notifications/followers'
      );
      setFollowers(res.data.data.followers);
      setCount(res.data.data.count);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const markSeen = useCallback(async () => {
    try {
      await apiClient.post('/notifications/followers/seen');
      setCount(0);
      setFollowers([]);
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) fetch();
  }, [fetch]);

  return { followers, count, loading, markSeen, refetch: fetch };
}
