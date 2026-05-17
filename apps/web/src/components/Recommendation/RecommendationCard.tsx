import { RecommendationResult } from '../../hooks/useRecommendation';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_LOGO_BASE = 'https://image.tmdb.org/t/p/original';

interface RecommendationCardProps {
  result: RecommendationResult;
  onNewRecommendation: () => void;
}

export const RecommendationCard = ({ result, onNewRecommendation }: RecommendationCardProps) => {
  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
      <div className="flex flex-col sm:flex-row">
        {/* Poster */}
        {result.posterPath ? (
          <img
            src={`${TMDB_IMAGE_BASE}${result.posterPath}`}
            alt={result.title}
            className="w-full sm:w-48 object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-full sm:w-48 h-48 bg-gray-200 flex items-center justify-center flex-shrink-0">
            <span className="text-5xl">{result.contentType === 'tv' ? '📺' : '🎬'}</span>
          </div>
        )}

        {/* Info */}
        <div className="p-6 flex flex-col justify-between flex-1">
          <div>
            <div className="flex items-start justify-between gap-2 mb-1">
              <h2 className="text-2xl font-bold text-gray-900 leading-tight">{result.title}</h2>
              <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap">
                {result.contentType === 'movie' ? '🎬 Película' : '📺 Serie'}
              </span>
            </div>
            <p className="text-gray-500 text-sm mb-3">
              {result.year} · {result.genre}
            </p>

            {result.overview && (
              <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                {result.overview}
              </p>
            )}

            {/* Explanation */}
            <div className="bg-indigo-50 border-l-4 border-indigo-400 p-3 rounded-r-lg mb-4">
              <p className="text-xs font-semibold text-indigo-600 mb-1">Por qué te la recomendamos</p>
              <p className="text-sm text-indigo-900 leading-relaxed">{result.explanation}</p>
            </div>

            {/* Watch Providers (JustWatch via TMDB) */}
            {result.watchProviders && result.watchProviders.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Disponible en streaming</p>
                <div className="flex flex-wrap gap-2">
                  {result.watchProviders.map((p) => (
                    <div key={p.providerId} className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-2 py-1">
                      <img
                        src={`${TMDB_LOGO_BASE}${p.logoPath}`}
                        alt={p.providerName}
                        className="w-5 h-5 rounded"
                      />
                      <span className="text-xs text-gray-700 font-medium">{p.providerName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onNewRecommendation}
            className="mt-4 text-sm text-indigo-600 hover:text-indigo-800 transition font-medium self-start"
          >
            ↩ Pedir otra recomendación
          </button>
        </div>
      </div>
    </div>
  );
};
