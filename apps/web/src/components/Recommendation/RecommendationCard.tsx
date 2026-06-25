import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { apiClient } from '../../api/apiClient';
import { RecommendationResult } from '../../hooks/useRecommendation';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_LOGO_BASE  = 'https://image.tmdb.org/t/p/original';

const PROVIDER_URLS: Record<string, string> = {
  'netflix':              'https://www.netflix.com',
  'disney+':              'https://www.disneyplus.com',
  'disney plus':          'https://www.disneyplus.com',
  'amazon prime video':   'https://www.primevideo.com',
  'prime video':          'https://www.primevideo.com',
  'max':                  'https://www.max.com',
  'hbo max':              'https://www.max.com',
  'apple tv+':            'https://tv.apple.com',
  'apple tv plus':        'https://tv.apple.com',
  'hulu':                 'https://www.hulu.com',
  'paramount+':           'https://www.paramountplus.com',
  'paramount plus':       'https://www.paramountplus.com',
  'star+':                'https://www.starplus.com',
  'star plus':            'https://www.starplus.com',
  'crunchyroll':          'https://www.crunchyroll.com',
  'mubi':                 'https://mubi.com',
  'peacock':              'https://www.peacocktv.com',
  'funimation':           'https://www.funimation.com',
  'claro video':          'https://www.clarovideo.com',
  'flow':                 'https://www.flow.com.ar',
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
  const [rated, setRated]                   = useState<'liked' | 'disliked' | null>(null);
  const [ratingLoading, setRatingLoading]   = useState(false);
  const [narration, setNarration]           = useState<NarrationState>('idle');
  const [narrationError, setNarrationError] = useState<string | null>(null);
  const audioRef   = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (audioRef.current) audioRef.current.src = '';
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  const handleNarrate = async () => {
    if (narration === 'loading') return;

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

    setNarration('loading');
    setNarrationError(null);
    try {
      const response = await apiClient.post(
        '/recommendations/narrate',
        { text: result.explanation },
        { responseType: 'arraybuffer' }
      );
      const blob = new Blob([response.data], { type: 'audio/mpeg' });
      const url  = URL.createObjectURL(blob);
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
        title:  result.title,
        rating,
      });
      setRated(rating === '5' ? 'liked' : 'disliked');
    } catch {
      // rating is non-critical, fail silently
    } finally {
      setRatingLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: 'easeOut' }}
      className="group relative bg-zinc-800/60 border border-zinc-700/50 rounded-2xl overflow-hidden hover:border-zinc-600 transition-all duration-300 hover:shadow-2xl hover:shadow-black/40"
    >
      {/* Index badge */}
      {index > 1 && (
        <div className="absolute top-3 left-3 z-10 bg-black/60 backdrop-blur-sm text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-full border border-indigo-500/30">
          #{index}
        </div>
      )}

      <div className="flex flex-col sm:flex-row">

        {/* ── Poster ─────────────────────────────────────── */}
        <div className="relative w-full sm:w-44 shrink-0 bg-zinc-900 overflow-hidden">
          {result.posterPath ? (
            <>
              <img
                src={`${TMDB_IMAGE_BASE}${result.posterPath}`}
                alt={result.title}
                className="w-full h-full object-cover sm:min-h-[280px] transition-transform duration-500 group-hover:scale-105"
              />
              {/* Gradient overlay on poster */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-zinc-800/60 sm:block hidden" />
            </>
          ) : (
            <div className="w-full sm:min-h-[280px] h-36 flex items-center justify-center">
              <span className="text-5xl">{result.contentType === 'tv' ? '📺' : '🎬'}</span>
            </div>
          )}
        </div>

        {/* ── Content ────────────────────────────────────── */}
        <div className="flex flex-col justify-between p-6 flex-1 min-w-0">

          {/* Header */}
          <div>
            <div className="flex items-start justify-between gap-3 mb-1">
              <h2 className="text-xl font-bold text-white leading-tight">{result.title}</h2>
              <span className="shrink-0 bg-zinc-700/80 text-zinc-300 text-xs font-medium px-2.5 py-1 rounded-full border border-zinc-600/50">
                {result.contentType === 'movie' ? '🎬 Película' : '📺 Serie'}
              </span>
            </div>

            <p className="text-zinc-500 text-sm mb-3">
              {result.year}{result.genre ? ` · ${result.genre}` : ''}
            </p>

            {result.overview && (
              <p className="text-zinc-400 text-sm leading-relaxed mb-4 line-clamp-3">
                {result.overview}
              </p>
            )}

            {/* Explanation box */}
            <div className="bg-indigo-950/50 border border-indigo-800/50 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-indigo-300 text-xs font-semibold uppercase tracking-wide">
                  ✦ Por qué te la recomendamos
                </p>

                {/* Narration button */}
                <button
                  onClick={handleNarrate}
                  disabled={narration === 'loading'}
                  title={narration === 'playing' ? 'Pausar narración' : 'Escuchar narración'}
                  className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-200 disabled:opacity-50 px-2.5 py-1.5 rounded-lg hover:bg-indigo-800/40 transition-all"
                >
                  {narration === 'loading' ? (
                    <span className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin inline-block" />
                  ) : narration === 'playing' ? (
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}
                  <span>
                    {narration === 'loading'  ? 'Generando...' :
                     narration === 'playing'  ? 'Pausar' :
                     narration === 'paused'   ? 'Continuar' : 'Escuchar'}
                  </span>
                </button>
              </div>

              <p className="text-zinc-300 text-sm leading-relaxed">{result.explanation}</p>
              {narrationError && (
                <p className="text-red-400 text-xs mt-2">{narrationError}</p>
              )}
            </div>

            {/* Streaming providers */}
            {result.watchProviders && result.watchProviders.length > 0 && (
              <div className="mb-4">
                <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wide mb-2">
                  Disponible en
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.watchProviders.map((p) => {
                    const url   = getProviderUrl(p.providerName);
                    const inner = (
                      <>
                        <img
                          src={`${TMDB_LOGO_BASE}${p.logoPath}`}
                          alt={p.providerName}
                          className="w-5 h-5 rounded-md"
                        />
                        <span className="text-xs text-zinc-300 font-medium">{p.providerName}</span>
                      </>
                    );
                    return url ? (
                      <a
                        key={p.providerId}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-zinc-700/60 hover:bg-indigo-800/60 border border-zinc-600/50 hover:border-indigo-600/50 rounded-lg px-2.5 py-1 transition-all"
                      >
                        {inner}
                      </a>
                    ) : (
                      <div key={p.providerId} className="flex items-center gap-1.5 bg-zinc-700/60 border border-zinc-600/50 rounded-lg px-2.5 py-1">
                        {inner}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── Rating ─────────────────────────────────────── */}
          <div className="flex items-center gap-3 pt-2 border-t border-zinc-700/50 mt-2">
            {rated ? (
              <motion.p
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-sm text-emerald-400 font-medium"
              >
                {rated === 'liked' ? '👍 Guardada como "me gustó"' : '👎 Guardada como "no me gustó"'}
              </motion.p>
            ) : (
              <>
                <p className="text-zinc-500 text-xs">¿La viste?</p>
                <button
                  onClick={() => rate('5')}
                  disabled={ratingLoading}
                  className="flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-lg bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-400 border border-emerald-800/50 hover:border-emerald-600/60 transition-all disabled:opacity-50"
                >
                  👍 Me gustó
                </button>
                <button
                  onClick={() => rate('1')}
                  disabled={ratingLoading}
                  className="flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-lg bg-red-900/30 hover:bg-red-800/50 text-red-400 border border-red-800/50 hover:border-red-600/60 transition-all disabled:opacity-50"
                >
                  👎 No me gustó
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </motion.div>
  );
};
