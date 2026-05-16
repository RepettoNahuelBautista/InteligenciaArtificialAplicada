import { z } from 'zod';

export const RateMovieSchema = z.object({
  tmdbId: z.string().min(1),
  title: z.string().min(1).max(255),
  rating: z.enum(['1', '5']).transform(Number), // 1=dislike, 5=like
});

export const SearchMoviesSchema = z.object({
  q: z.string().min(2).max(100),
  type: z.enum(['movie', 'tv']).optional(),
});

export type RateMovieInput = z.infer<typeof RateMovieSchema>;
export type SearchMoviesInput = z.infer<typeof SearchMoviesSchema>;

export interface MovieSearchResult {
  id: number;
  title: string;
  type: 'movie' | 'tv';
  year: number;
  poster_path?: string | null;
  overview: string;
}

export interface WatchedMovieResponse {
  id: string;
  tmdbId: string;
  title: string;
  rating: number;
  createdAt: string;
}
