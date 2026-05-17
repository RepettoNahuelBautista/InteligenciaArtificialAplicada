import { useState } from 'react';
import { apiClient } from '../../api/apiClient';
import { RecommendationResult } from '../../hooks/useRecommendation';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_LOGO_BASE = 'https://image.tmdb.org/t/p/original';

const PROVIDER_URLS: Record<string, string> = {
  'netflix': 'https://www.netflix.com',
  'disney+': 'https://www.disneyplus.com',
  'disney plus': 'https://www.disneyplus.com',
  'amazon prime video': 'https://www.primevideo.com',
  'prime video': 'https://www.primevideo.com',
  'max': 'https://www.max.com',
  'hbo max': 'https://www.max.com',
  'apple tv+': 'https://tv.apple.com',
  'apple tv plus': 'https://tv.apple.com',
  'hulu': 'https://www.hulu.com',
  'paramount+': 'https://www.paramountplus.com',
  'paramount plus': 'https://www.paramountplus.com',
  'star+': 'https://www.starplus.com',
  'star plus': 'https://www.starplus.com',
  'crunchyroll': 'https://www.crunchyroll.com',
  'mubi': 'https://mubi.com',
  'peacock': 'https://www.peacocktv.com',
  'funimation': 'https://www.funimation.com',
  'claro video': 'https://www.clarovideo.com',
  'flow': 'https://www.flow.com.ar',
};

function getProviderUrl(name: string): string | null {
  return PROVIDER_URLS[name.toLowerCase()] ?? null;
}

interface RecommendationCardProps {
  result: RecommendationResult;
  index: number;
}

export const RecommendationCard = ({ result, index }: RecommendationCardProps) => {
  const [rated, setRated] = useState<'liked' | 'disliked' | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);

  const rate = async (rating: '5' | '1') => {
    if (ratingLoading || rated) return;
    setRatingLoading(true);
    try {
      await apiClient.post('/profile/watched-movies', {
        tmdbId: result.tmdbId,
        title: result.title,
        rating,
      });
      setRated(rating === '5' ? 'liked' : 'disliked');
    } catch {
      // silently fail — rating is non-critical
    } finally {
      setRatingLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
      {index > 1 && (
        <div className="bg-indigo-50 px-4 py-2 border-b border-indigo-100">
          <span className="text-xs font-semibold text-indigo-500">Recomendación #{index}</span>
        </div>
      )}
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

            {/* Watch Providers */}
            {result.watchProviders && result.watchProviders.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">Disponible en streaming</p>
                <div className="flex flex-wrap gap-2">
                  {result.watchProviders.map((p) => {
                    const url = getProviderUrl(p.providerName);
                    const inner = (
                      <>
                        <img
                          src={`${TMDB_LOGO_BASE}${p.logoPath}`}
                          alt={p.providerName}
                          className="w-5 h-5 rounded"
                        />
                        <span className="text-xs text-gray-700 font-medium">{p.providerName}</span>
                      </>
                    );
                    return url ? (
                      <a
                        key={p.providerId}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-gray-100 hover:bg-indigo-100 rounded-lg px-2 py-1 transition"
                      >
                        {inner}
                      </a>
                    ) : (
                      <div key={p.providerId} className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-2 py-1">
                        {inner}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Rating */}
          <div className="mt-2 flex items-center gap-3">
            {rated ? (
              <p className="text-sm text-green-600 font-medium">
                {rated === 'liked' ? '👍 Guardada como "me gustó"' : '👎 Guardada como "no me gustó"'}
              </p>
            ) : (
              <>
                <p className="text-xs text-gray-500">¿La viste?</p>
                <button
                  onClick={() => rate('5')}
                  disabled={ratingLoading}
                  className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 transition disabled:opacity-50"
                >
                  👍 Me gustó
                </button>
                <button
                  onClick={() => rate('1')}
                  disabled={ratingLoading}
                  className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 transition disabled:opacity-50"
                >
                  👎 No me gustó
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
