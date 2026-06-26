import { FC } from 'react';
import { motion } from 'framer-motion';
import { MOVIE_GENRES, TV_GENRES } from '../../schemas/genres';

const GENRE_EMOJI: Record<number, string> = {
  28: '💥', 12: '🗺️', 16: '🎨', 35: '😂', 80: '🔫', 99: '📹',
  18: '🎭', 10751: '👨‍👩‍👧', 14: '🧙', 36: '📜', 27: '👻', 10402: '🎵',
  9648: '🔍', 10749: '💕', 878: '🚀', 10770: '📺', 53: '😱', 10752: '⚔️', 37: '🤠',
  10759: '🏃', 10762: '🧒', 10763: '📰', 10764: '🎪', 10765: '🔮',
  10766: '💔', 10767: '🎤', 10768: '🌍',
};

interface GenreSelectorProps {
  selectedGenres: number[];
  onToggleGenre: (genreId: number) => void;
  contentType: 'movie' | 'tv';
  onContentTypeChange: (type: 'movie' | 'tv') => void;
  isValid: boolean;
}

export const GenreSelector: FC<GenreSelectorProps> = ({
  selectedGenres,
  onToggleGenre,
  contentType,
  onContentTypeChange,
  isValid,
}) => {
  const genres = contentType === 'tv' ? TV_GENRES : MOVIE_GENRES;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">¿Qué preferís ver?</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Elegí al menos 3 géneros que te gusten</p>
        <div className="flex gap-3">
          <button
            onClick={() => onContentTypeChange('movie')}
            className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition ${
              contentType === 'movie'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                : 'bg-white/60 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-white/10'
            }`}
          >
            🎬 Películas
          </button>
          <button
            onClick={() => onContentTypeChange('tv')}
            className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition ${
              contentType === 'tv'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                : 'bg-white/60 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-white/10'
            }`}
          >
            📺 Series
          </button>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Géneros favoritos</h3>
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full transition ${
            selectedGenres.length >= 3
              ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
          }`}>
            {selectedGenres.length >= 3 ? `✓ ${selectedGenres.length} seleccionados` : `${selectedGenres.length}/3 mínimo`}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {genres.map((genre: { id: number; name: string }) => {
            const selected = selectedGenres.includes(genre.id);
            return (
              <motion.button
                key={genre.id}
                whileTap={{ scale: 0.94 }}
                onClick={() => onToggleGenre(genre.id)}
                className={`py-2.5 px-3 rounded-xl text-sm font-medium transition text-left flex items-center gap-2 ${
                  selected
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                    : 'bg-white/60 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'
                }`}
              >
                <span className="text-base flex-shrink-0">{GENRE_EMOJI[genre.id] ?? '🎞️'}</span>
                <span className="truncate">{genre.name}</span>
              </motion.button>
            );
          })}
        </div>

        {!isValid && selectedGenres.length > 0 && selectedGenres.length < 3 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-amber-600 dark:text-amber-400 text-sm mt-3 flex items-center gap-1.5"
          >
            <span>⚠️</span> Seleccioná al menos 3 géneros para continuar
          </motion.p>
        )}
      </div>
    </div>
  );
};
