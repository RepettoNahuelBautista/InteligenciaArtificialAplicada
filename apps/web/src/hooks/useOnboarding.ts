import { useState, useEffect } from 'react';
import { MOVIE_GENRES, TV_GENRES } from '../schemas/genres';

export interface Genre {
  id: number;
  name: string;
}

export function useGenreSelector() {
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [genres, setGenres] = useState<Genre[]>(MOVIE_GENRES);
  const [contentType, setContentType] = useState<'movie' | 'tv'>('movie');

  useEffect(() => {
    setGenres(contentType === 'tv' ? TV_GENRES : MOVIE_GENRES);
    setSelectedGenres([]);
  }, [contentType]);

  const toggleGenre = (genreId: number) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId) ? prev.filter((id) => id !== genreId) : [...prev, genreId]
    );
  };

  const isValid = selectedGenres.length >= 3 && selectedGenres.length <= 15;

  return {
    selectedGenres,
    genres,
    contentType,
    setContentType,
    toggleGenre,
    isValid,
  };
}

export function useOnboarding() {
  const [step, setStep] = useState(1);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [selectedDirectors, setSelectedDirectors] = useState<number[]>([]);
  const [selectedActors, setSelectedActors] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const nextStep = () => {
    setStep((prev) => prev + 1);
    setError('');
  };

  const prevStep = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const completeOnboarding = async () => {
    setError('');
    setIsLoading(true);
    return { selectedGenres, selectedDirectors, selectedActors };
  };

  return {
    step,
    nextStep,
    prevStep,
    completeOnboarding,
    selectedGenres,
    setSelectedGenres,
    selectedDirectors,
    setSelectedDirectors,
    selectedActors,
    setSelectedActors,
    isLoading,
    setIsLoading,
    error,
    setError,
  };
}
