import { RecommendationResult } from '../../hooks/useRecommendation';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

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
            <span className="text-5xl">🎬</span>
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
            <div className="bg-indigo-50 border-l-4 border-indigo-400 p-3 rounded-r-lg">
              <p className="text-xs font-semibold text-indigo-600 mb-1">Por qué te la recomendamos</p>
              <p className="text-sm text-indigo-900 leading-relaxed">{result.explanation}</p>
            </div>
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
