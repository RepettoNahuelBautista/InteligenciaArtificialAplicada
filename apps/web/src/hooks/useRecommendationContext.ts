import { useState } from 'react';
import { Mood } from './useMoodSelector';

export type ContentType = 'movie' | 'tv' | null;
export type DurationOption = 'short' | 'normal' | 'long' | null;
export type YearOption = 'classic' | 'recent' | 'new' | null;

export interface RecommendationContext {
  moodId: string | null;
  moodLabel: string | null;
  moodEmoji: string | null;
  contentType: ContentType;
  duration: DurationOption;
  year: YearOption;
}

const DURATION_LABELS: Record<string, string> = {
  short: 'Corta (<90 min)',
  normal: 'Normal (90-120 min)',
  long: 'Larga (+120 min)',
};

const YEAR_LABELS: Record<string, string> = {
  classic: 'Clásica (<2000)',
  recent: 'Reciente (2000-2015)',
  new: 'Nueva (2016+)',
};

export function useRecommendationContext() {
  const [context, setContext] = useState<RecommendationContext>({
    moodId: null,
    moodLabel: null,
    moodEmoji: null,
    contentType: null,
    duration: null,
    year: null,
  });

  const toggleMood = (mood: Mood) => {
    setContext((prev) => ({
      ...prev,
      moodId: prev.moodId === mood.id ? null : mood.id,
      moodLabel: prev.moodId === mood.id ? null : mood.label,
      moodEmoji: prev.moodId === mood.id ? null : mood.emoji,
    }));
  };

  const toggleContentType = (type: ContentType) => {
    setContext((prev) => ({ ...prev, contentType: prev.contentType === type ? null : type }));
  };

  const toggleDuration = (duration: DurationOption) => {
    setContext((prev) => ({ ...prev, duration: prev.duration === duration ? null : duration }));
  };

  const toggleYear = (year: YearOption) => {
    setContext((prev) => ({ ...prev, year: prev.year === year ? null : year }));
  };

  const clearFilters = () => {
    setContext((prev) => ({ ...prev, contentType: null, duration: null, year: null }));
  };

  const clearAll = () => {
    setContext({ moodId: null, moodLabel: null, moodEmoji: null, contentType: null, duration: null, year: null });
  };

  const isReady = context.moodId !== null;

  const getSummaryItems = (): string[] => {
    const items: string[] = [];
    if (context.moodLabel) items.push(`${context.moodEmoji} ${context.moodLabel}`);
    if (context.contentType === 'movie') items.push('🎬 Película');
    else if (context.contentType === 'tv') items.push('📺 Serie');
    if (context.duration) items.push(DURATION_LABELS[context.duration]);
    if (context.year) items.push(YEAR_LABELS[context.year]);
    return items;
  };

  return {
    context,
    toggleMood,
    toggleContentType,
    toggleDuration,
    toggleYear,
    clearFilters,
    clearAll,
    isReady,
    getSummaryItems,
  };
}
