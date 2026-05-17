import { useMovieRater } from '../../hooks/useMovieRater';

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

  const TMDB_IMAGE_URL = 'https://image.tmdb.org/t/p/w342';

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">
          Películas/Series que ya viste
        </h3>
        <span className="text-sm text-gray-600 bg-blue-100 px-3 py-1 rounded-full">
          {ratedCount} valoradas
        </span>
      </div>

      {/* Info */}
      <p className="text-sm text-gray-600">
        Valora películas que ya has visto (opcional - puedes saltar este paso)
      </p>

      {!currentMovie ? (
        <>
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar película o serie..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-10"
            />
            <div className="absolute right-3 top-2.5">
              {isSearching ? (
                <span className="inline-block w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              ) : searchQuery ? (
                <button onClick={clearSearch} className="text-gray-500 hover:text-gray-700">✕</button>
              ) : null}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Search Results */}
          {searchQuery && searchResults.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {searchResults.map((movie) => (
                <button
                  key={`${movie.id}-${movie.media_type}`}
                  onClick={() => selectMovie(movie)}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-colors flex gap-3"
                >
                  {/* Poster */}
                  {movie.poster_path ? (
                    <img
                      src={`${TMDB_IMAGE_URL}${movie.poster_path}`}
                      alt={movie.title}
                      className="w-12 h-18 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-18 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                      No image
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 truncate">
                      {movie.title}
                    </div>
                    <div className="text-xs text-gray-600">
                      {movie.year} • {movie.media_type === 'tv' ? 'Serie' : 'Película'}
                    </div>
                    <div className="text-xs text-gray-500 line-clamp-2 mt-1">
                      {movie.overview}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {searchQuery && !isSearching && searchResults.length === 0 && !error && (
            <div className="p-4 text-center text-gray-500 text-sm">
              No se encontraron resultados
            </div>
          )}

          {/* Empty State */}
          {!searchQuery && (
            <div className="p-8 text-center text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
              <p>🔍</p>
              <p className="text-sm">Busca una película o serie para comenzar</p>
            </div>
          )}
        </>
      ) : (
        /* Movie Card - Rating View */
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-lg border border-gray-200">
          <div className="flex gap-4 mb-6">
            {/* Poster */}
            {currentMovie.poster_path ? (
              <img
                src={`${TMDB_IMAGE_URL}${currentMovie.poster_path}`}
                alt={currentMovie.title}
                className="w-20 h-30 object-cover rounded shadow-md"
              />
            ) : (
              <div className="w-20 h-30 bg-gray-300 rounded shadow-md flex items-center justify-center text-xs text-gray-600">
                No image
              </div>
            )}

            {/* Info */}
            <div className="flex-1">
              <h4 className="font-bold text-gray-800 text-lg">
                {currentMovie.title}
              </h4>
              <p className="text-sm text-gray-600 mb-2">
                {currentMovie.year} • {currentMovie.media_type === 'tv' ? 'Serie' : 'Película'}
              </p>
              <p className="text-sm text-gray-700 line-clamp-4">
                {currentMovie.overview || 'Sin descripción disponible'}
              </p>
            </div>
          </div>

          {/* Rating Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => rateMovie(1)}
              disabled={isRating}
              className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition"
            >
              {isRating ? 'Guardando...' : '👎 No me gustó'}
            </button>
            <button
              onClick={() => rateMovie(5)}
              disabled={isRating}
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition"
            >
              {isRating ? 'Guardando...' : '👍 Me gustó'}
            </button>
          </div>

          {/* Back to Search */}
          <button
            onClick={() => {
              selectMovie(null as any);
              handleSearch('');
            }}
            className="w-full mt-3 text-sm text-gray-600 hover:text-gray-800 py-2"
          >
            ← Volver a buscar
          </button>
        </div>
      )}
    </div>
  );
};
