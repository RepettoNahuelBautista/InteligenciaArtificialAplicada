import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MoodSelector } from '../components/MoodSelector';
import { FilterPanel } from '../components/Recommendation/FilterPanel';
import { ContextSummary } from '../components/Recommendation/ContextSummary';
import { RecommendationCard } from '../components/Recommendation/RecommendationCard';
import { useRecommendationContext } from '../hooks/useRecommendationContext';
import { useRecommendation } from '../hooks/useRecommendation';
import { RecommendationResult } from '../hooks/useRecommendation';

const LOADING_MESSAGES = [
  'Analizando tu perfil...',
  'Consultando a Gemini...',
  'Buscando coincidencias...',
  'Validando en TMDB...',
  'Ajustando la recomendación...',
];

function LoadingOverlay() {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-24 gap-6"
    >
      {/* Pulsing rings */}
      <div className="relative w-24 h-24 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" />
        <div className="absolute inset-2 rounded-full bg-indigo-500/20 animate-ping [animation-delay:300ms]" />
        <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-500/40">
          <span className="text-2xl">✨</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={msgIdx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
          className="text-indigo-600 dark:text-indigo-300 font-medium text-base"
        >
          {LOADING_MESSAGES[msgIdx]}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  );
}

const cardStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const cardItem = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export const RecommendationPage = () => {
  const navigate = useNavigate();
  const {
    context, toggleMood, toggleContentType, toggleDuration,
    toggleYear, clearFilters, clearAll, isReady, getSummaryItems,
  } = useRecommendationContext();

  const { results, loading, error, fetchRecommendation, fetchNext, clear } = useRecommendation();

  // ── Results view ────────────────────────────────────────────────────────────
  if (results.length > 0 || (loading && results.length === 0)) {
    return (
      <div className="min-h-screen p-6 sm:p-10">
        <div className="max-w-2xl mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-10"
          >
            <button
              onClick={clear}
              className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Cambiar filtros
            </button>
            <button
              onClick={() => navigate('/home')}
              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition text-sm"
            >
              Volver al inicio
            </button>
          </motion.div>

          {/* Mood badge */}
          {context.moodEmoji && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6"
            >
              <div className="inline-flex items-center gap-3 bg-white/60 dark:bg-white/5 border border-white/80 dark:border-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <span className="text-2xl">{context.moodEmoji}</span>
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  Modo <strong>{context.moodLabel}</strong>
                </span>
              </div>
            </motion.div>
          )}

          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-3xl font-bold text-zinc-900 dark:text-white mb-1"
          >
            {results.length === 1 ? 'Tu recomendación' : 'Tus recomendaciones'} ✨
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-zinc-500 dark:text-zinc-400 text-sm mb-8"
          >
            {results.length} {results.length === 1 ? 'resultado' : 'resultados'} · Los filtros se mantienen activos
          </motion.p>

          {/* Get another */}
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            whileHover={!loading ? { scale: 1.02 } : {}}
            whileTap={!loading ? { scale: 0.98 } : {}}
            onClick={() => fetchNext(context, results)}
            disabled={loading}
            className={`w-full mb-8 py-3.5 rounded-2xl font-semibold text-sm transition flex items-center justify-center gap-2 border
              ${loading
                ? 'bg-white/30 dark:bg-white/5 text-zinc-400 dark:text-zinc-500 border-white/40 dark:border-white/10 cursor-not-allowed'
                : 'bg-white/60 dark:bg-white/8 hover:bg-white/90 dark:hover:bg-white/15 border-white/80 dark:border-white/20 text-zinc-800 dark:text-white backdrop-blur-sm shadow-sm'
              }`}
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="text-base">+</span>
            )}
            {loading ? 'Buscando otra...' : 'Pedir otra recomendación'}
          </motion.button>

          {/* Loading overlay for "another" */}
          <AnimatePresence>
            {loading && <LoadingOverlay />}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-red-500/15 border border-red-400/40 rounded-xl"
              >
                <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cards */}
          <motion.div
            variants={cardStagger}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {results.map((r: RecommendationResult, i: number) => (
              <motion.div key={r.tmdbId + i} variants={cardItem}>
                <RecommendationCard result={r} index={results.length - i} />
              </motion.div>
            ))}
          </motion.div>

        </div>
      </div>
    );
  }

  // ── Form view ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-6 sm:p-10">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition text-sm font-medium mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </button>
          <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-white mb-2">
            ¿Qué querés ver hoy?
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Elegí cómo te sentís y te recomendamos algo perfecto para el momento
          </p>
        </motion.div>

        {/* Step 1 — Mood */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mb-8"
        >
          <p className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-4">
            01 · Estado de ánimo
          </p>
          <MoodSelector selectedMoodId={context.moodId} onMoodSelected={toggleMood} />
        </motion.section>

        {/* Step 2 — Filters (collapsible) */}
        <AnimatePresence>
          {isReady && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.25 }}
              className="mb-8 bg-white/50 dark:bg-white/5 border border-white/70 dark:border-white/10 backdrop-blur-sm rounded-2xl p-5"
            >
              <p className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-4">
                02 · Ajustes
              </p>
              <FilterPanel
                contentType={context.contentType}
                duration={context.duration}
                year={context.year}
                onContentTypeChange={toggleContentType}
                onDurationChange={toggleDuration}
                onYearChange={toggleYear}
                onClearFilters={clearFilters}
              />
            </motion.section>
          )}
        </AnimatePresence>

        {/* Summary chips */}
        <div className="mb-6 min-h-[28px]">
          <ContextSummary items={getSummaryItems()} onClear={clearAll} />
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 p-4 bg-red-500/15 border border-red-400/40 rounded-xl"
            >
              <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading */}
        <AnimatePresence>
          {loading && <LoadingOverlay />}
        </AnimatePresence>

        {/* CTA */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex gap-3"
          >
            <button
              onClick={() => navigate('/home')}
              className="px-5 py-3.5 rounded-2xl text-sm font-medium border border-white/60 dark:border-white/10 bg-white/40 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-white/70 dark:hover:bg-white/10 transition backdrop-blur-sm"
            >
              Cancelar
            </button>

            <motion.button
              onClick={() => fetchRecommendation(context)}
              disabled={!isReady}
              whileHover={isReady ? { scale: 1.02 } : {}}
              whileTap={isReady ? { scale: 0.98 } : {}}
              className={`flex-1 py-3.5 rounded-2xl font-bold text-base transition-all duration-300 relative overflow-hidden
                ${isReady
                  ? 'bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50'
                  : 'bg-white/30 dark:bg-white/5 text-zinc-400 dark:text-zinc-600 border border-white/40 dark:border-white/10 cursor-not-allowed'
                }`}
            >
              {/* Shimmer when ready */}
              {isReady && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.5, ease: 'easeInOut' }}
                />
              )}
              <span className="relative">
                {isReady ? '✨ Obtener Recomendación' : 'Primero elegí tu estado de ánimo'}
              </span>
            </motion.button>
          </motion.div>
        )}

      </div>
    </div>
  );
};
