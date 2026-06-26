import { motion, AnimatePresence } from 'framer-motion';
import { useMovieRater } from '../../hooks/useMovieRater';

const TMDB_IMAGE_URL = 'https://image.tmdb.org/t/p/w342';

export const MovieRater: React.FC = () => {
  const {
    searchQuery,
    searchResults,
    isSearching,
    handleSearch,
    clearSearch,
    currentMovie,
    selectMovie,
    rateMovie,
    isRating,
    ratedCount,
    error,
  } = useMovieRater();

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">🎥 Películas vistas</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Opcional — valorá películas que ya viste</p>
        </div>
        {ratedCount > 0 && (
          <span className="flex-shrink-0 text-sm font-semibold bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/25 px-3 py-1 rounded-full">
            {ratedCount} valoradas
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!currentMovie ? (
          <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Buscar película o serie..."
                className="w-full px-4 py-2.5 border border-zinc-200 dark:border-white/10 rounded-xl bg-white/80 dark:bg-white/5 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition pr-10 placeholder-zinc-400 dark:placeholder-zinc-600"
              />
              <div className="absolute right-3 top-2.5">
                {isSearching ? (
                  <span className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin inline-block" />
                ) : searchQuery ? (
                  <button onClick={clearSearch} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition text-lg leading-none">✕</button>
                ) : null}
              </div>
            </div>

            {error && (
              <p className="text-red-600 dark:text-red-400 text-sm bg-red-500/10 px-3 py-2 rounded-xl">{error}</p>
            )}

            {/* Results list */}
            {searchQuery && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-zinc-200 dark:border-white/10 rounded-xl bg-white dark:bg-zinc-900 shadow-lg max-h-80 overflow-y-auto"
              >
                {searchResults.map((movie) => (
                  <button
                    key={`${movie.id}-${movie.media_type}`}
                    onClick={() => selectMovie(movie)}
                    className="w-full text-left p-3 border-b border-zinc-100 dark:border-white/5 last:border-b-0 hover:bg-zinc-50 dark:hover:bg-white/5 transition flex gap-3 items-start"
                  >
                    {movie.poster_path ? (
                      <img
                        src={`${TMDB_IMAGE_URL}${movie.poster_path}`}
                        alt={movie.title}
                        className="w-10 h-14 object-cover rounded-lg flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-14 bg-zinc-200 dark:bg-zinc-700 rounded-lg flex-shrink-0 flex items-center justify-center text-zinc-400 text-xs">?</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-zinc-800 dark:text-zinc-100 text-sm truncate">{movie.title}</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1">
                        {movie.year} · {movie.media_type === 'tv' ? 'Serie' : 'Película'}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">{movie.overview}</p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}

            {searchQuery && !isSearching && searchResults.length === 0 && !error && (
              <p className="text-center text-zinc-400 dark:text-zinc-600 text-sm py-2">No se encontraron resultados</p>
            )}

            {!searchQuery && (
              <div className="border-2 border-dashed border-zinc-200 dark:border-white/10 rounded-xl p-8 text-center">
                <p className="text-3xl mb-2">🔍</p>
                <p className="text-sm text-zinc-400 dark:text-zinc-600">Buscá una película o serie para comenzar</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="rate"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
            className="space-y-4"
          >
            {/* Movie card */}
            <div className="bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl p-4 flex gap-4">
              {currentMovie.poster_path ? (
                <img
                  src={`${TMDB_IMAGE_URL}${currentMovie.poster_path}`}
                  alt={currentMovie.title}
                  className="w-20 rounded-lg shadow-md flex-shrink-0 object-cover self-start"
                />
              ) : (
                <div className="w-20 h-28 bg-zinc-200 dark:bg-zinc-700 rounded-lg flex-shrink-0 flex items-center justify-center text-zinc-400">?</div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-zinc-900 dark:text-white text-base leading-tight mb-1 truncate">
                  {currentMovie.title}
                </h3>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-2">
                  {currentMovie.year} · {currentMovie.media_type === 'tv' ? 'Serie' : 'Película'}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3">
                  {currentMovie.overview || 'Sin descripción disponible'}
                </p>
              </div>
            </div>

            <p className="text-center text-sm font-medium text-zinc-500 dark:text-zinc-400">¿Qué te pareció?</p>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => rateMovie(1)}
                disabled={isRating}
                className="flex-1 flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition shadow-sm shadow-rose-500/30"
              >
                {isRating
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <span>👎</span>
                }
                No me gustó
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => rateMovie(5)}
                disabled={isRating}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition shadow-sm shadow-emerald-500/30"
              >
                {isRating
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <span>👍</span>
                }
                Me gustó
              </motion.button>
            </div>

            <button
              onClick={() => { selectMovie(null as unknown as typeof currentMovie); handleSearch(''); }}
              className="w-full text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 py-1.5 transition"
            >
              ← Volver a buscar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
