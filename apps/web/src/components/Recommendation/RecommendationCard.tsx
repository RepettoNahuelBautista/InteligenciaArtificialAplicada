import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
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

type NarrationState = 'idle' | 'loading' | 'playing' | 'paused';

interface RecommendationCardProps {
  result: RecommendationResult;
  index: number;
}

export const RecommendationCard = ({ result, index }: RecommendationCardProps) => {
  const [rated, setRated] = useState<'liked' | 'disliked' | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);

  const [narration, setNarration] = useState<NarrationState>('idle');
  const [narrationError, setNarrationError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  const handleNarrate = async () => {
    if (narration === 'loading') return;

    // Already have audio — toggle play/pause
    if (audioRef.current && (narration === 'playing' || narration === 'paused')) {
      if (narration === 'playing') {
        audioRef.current.pause();
        setNarration('paused');
      } else {
        audioRef.current.play();
        setNarration('playing');
      }
      return;
    }

    // First time — fetch audio from backend
    setNarration('loading');
    setNarrationError(null);
    try {
      const response = await apiClient.post(
        '/recommendations/narrate',
        { text: result.explanation },
        { responseType: 'arraybuffer' }
      );
      const blob = new Blob([response.data], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setNarration('idle');
      audio.onerror = () => { setNarration('idle'); setNarrationError('Error al reproducir el audio'); };
      await audio.play();
      setNarration('playing');
    } catch (err: unknown) {
      setNarration('idle');
      let msg = 'No se pudo generar la narración';
      if (axios.isAxiosError(err) && err.response?.data) {
        try {
          const text = new TextDecoder().decode(err.response.data as ArrayBuffer);
          const json = JSON.parse(text);
          if (json?.error?.message) msg = json.error.message;
        } catch { /* keep default */ }
      }
      setNarrationError(msg);
    }
  };

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
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
      {index > 1 && (
        <div className="bg-indigo-50 dark:bg-gray-700 px-4 py-2 border-b border-indigo-100 dark:border-gray-600">
          <span className="text-xs font-semibold text-indigo-500 dark:text-indigo-300">Recomendación #{index}</span>
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
          <div className="w-full sm:w-48 h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
            <span className="text-5xl">{result.contentType === 'tv' ? '📺' : '🎬'}</span>
          </div>
        )}

        {/* Info */}
        <div className="p-6 flex flex-col justify-between flex-1">
          <div>
            <div className="flex items-start justify-between gap-2 mb-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{result.title}</h2>
              <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap">
                {result.contentType === 'movie' ? '🎬 Película' : '📺 Serie'}
              </span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
              {result.year} · {result.genre}
            </p>

            {result.overview && (
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4 line-clamp-3">
                {result.overview}
              </p>
            )}

            {/* Explanation + narration player */}
            <div className="bg-indigo-50 dark:bg-indigo-900/40 border-l-4 border-indigo-400 p-3 rounded-r-lg mb-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">Por qué te la recomendamos</p>
                <button
                  onClick={handleNarrate}
                  disabled={narration === 'loading'}
                  title={narration === 'playing' ? 'Pausar narración' : 'Escuchar narración'}
                  className="flex items-center gap-1.5 text-xs text-indigo-500 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-white transition disabled:opacity-50 px-2 py-1 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-800/50"
                >
                  {narration === 'loading' ? (
                    <span className="inline-block w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  ) : narration === 'playing' ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}
                  <span>
                    {narration === 'loading' ? 'Generando...' :
                     narration === 'playing' ? 'Pausar' :
                     narration === 'paused' ? 'Continuar' : 'Escuchar'}
                  </span>
                </button>
              </div>
              <p className="text-sm text-indigo-900 dark:text-indigo-100 leading-relaxed">{result.explanation}</p>
              {narrationError && (
                <p className="text-xs text-red-500 mt-1">{narrationError}</p>
              )}
            </div>

            {/* Watch Providers */}
            {result.watchProviders && result.watchProviders.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Disponible en streaming</p>
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
                        <span className="text-xs text-gray-700 dark:text-gray-200 font-medium">{p.providerName}</span>
                      </>
                    );
                    return url ? (
                      <a
                        key={p.providerId}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg px-2 py-1 transition"
                      >
                        {inner}
                      </a>
                    ) : (
                      <div key={p.providerId} className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg px-2 py-1">
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
