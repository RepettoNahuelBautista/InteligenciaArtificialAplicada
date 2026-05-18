import { useState, useCallback } from 'react';
import { apiClient } from '../api/apiClient';

export interface ReviewAuthor {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface ReviewItem {
  id: string;
  tmdbId: string;
  title: string;
  contentType: string;
  rating: number;
  text: string;
  createdAt: string;
  updatedAt: string;
  author: ReviewAuthor;
  likeCount: number;
  dislikeCount: number;
  userLike: 1 | -1 | null;
}

export interface UpsertReviewPayload {
  tmdbId: string;
  title: string;
  contentType: 'movie' | 'tv';
  rating: number;
  text: string;
}

export function useReviews() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchReviews = useCallback(async (tmdbId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/reviews', { params: { tmdbId } });
      setReviews(response.data.data);
    } catch {
      setError('No se pudieron cargar las reseñas');
    } finally {
      setLoading(false);
    }
  }, []);

  const upsertReview = async (payload: UpsertReviewPayload): Promise<ReviewItem | null> => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await apiClient.post('/reviews', payload);
      const saved: ReviewItem = response.data.data;
      setReviews((prev) => {
        const exists = prev.findIndex((r) => r.id === saved.id || (r.author.userId === saved.author.userId && r.tmdbId === saved.tmdbId));
        if (exists >= 0) {
          const updated = [...prev];
          updated[exists] = saved;
          return updated;
        }
        return [saved, ...prev];
      });
      return saved;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setSubmitError(e.response?.data?.error?.message || 'Error al guardar la reseña');
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const likeReview = async (reviewId: string, value: 1 | -1 | null) => {
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id !== reviewId) return r;
        const prevLike = r.userLike;
        let likeCount = r.likeCount;
        let dislikeCount = r.dislikeCount;

        if (prevLike === 1) likeCount--;
        if (prevLike === -1) dislikeCount--;

        if (value === 1) likeCount++;
        if (value === -1) dislikeCount++;

        return { ...r, userLike: value, likeCount, dislikeCount };
      })
    );

    try {
      if (value === null) {
        await apiClient.delete(`/reviews/${reviewId}/like`);
      } else {
        await apiClient.post(`/reviews/${reviewId}/like`, { value });
      }
    } catch {
      // revert on error by re-fetching is not available here; just silently fail
    }
  };

  return { reviews, loading, error, fetchReviews, upsertReview, submitting, submitError, likeReview };
}
