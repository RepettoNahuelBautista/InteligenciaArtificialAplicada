import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

function LoadingIndicator() {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center gap-3 py-6">
      <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 dark:border-white flex-shrink-0" />
      <span className="text-indigo-600 dark:text-indigo-200 text-sm font-medium transition-all">{LOADING_MESSAGES[msgIdx]}</span>
    </div>
  );
}

export const RecommendationPage = () => {
  const navigate = useNavigate();
  const {
    context,
    toggleMood,
    toggleContentType,
    toggleDuration,
    toggleYear,
    clearFilters,
    clearAll,
    isReady,
    getSummaryItems,
  } = useRecommendationContext();

  const { results, loading, error, fetchRecommendation, fetchNext, clear } = useRecommendation();

  const handleGetRecommendation = () => {
    fetchRecommendation(context);
  };

  const handleGetAnother = () => {
    fetchNext(context, results);
  };

  const handleChangeFilters = () => {
    clear();
  };

  // --- Vista: resultados ---
  if (results.length > 0 || (loading && results.length === 0 && !error)) {
    // show results view once we have at least 1 result (or still loading first)
  }

  if (results.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-200 via-amber-50 to-stone-200 dark:from-indigo-900 dark:via-purple-900 dark:to-indigo-900 p-4 sm:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => navigate('/home')}
              className="text-zinc-600 dark:text-white hover:text-zinc-900 dark:hover:text-indigo-200 transition text-sm flex items-center gap-2"
            >
              ← Volver al inicio
            </button>
            <button
              onClick={handleChangeFilters}
              className="text-zinc-500 hover:text-zinc-900 dark:text-indigo-300 dark:hover:text-white transition text-sm"
            >
              Cambiar filtros
            </button>
          </div>

          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
            {results.length === 1 ? 'Tu recomendación ✨' : `Tus recomendaciones ✨`}
          </h1>
          <p className="text-zinc-500 dark:text-indigo-300 text-sm mb-6">
            {results.length === 1 ? '1 recomendación' : `${results.length} recomendaciones`} · Los filtros se mantienen activos
          </p>

          {/* Botón pedir otra */}
          <button
            onClick={handleGetAnother}
            disabled={loading}
            className={`w-full mb-4 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${
              loading
                ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200 dark:bg-white/10 dark:text-indigo-300 dark:border-white/10'
                : 'bg-white border border-zinc-300 text-zinc-800 hover:bg-zinc-50 hover:shadow-sm dark:bg-white/15 dark:border-white/30 dark:text-white dark:hover:bg-white/25'
            }`}
          >
            {loading ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500 dark:border-white" />
                Buscando otra...
              </>
            ) : (
              '+ Pedir otra recomendación'
            )}
          </button>

          {/* Loading message cuando carga "otra" */}
          {loading && <LoadingIndicator />}

          {/* Error */}
          {error && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-400/50 rounded-lg">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Cards acumuladas (newest on top) */}
          <div className="space-y-6">
            {results.map((r: RecommendationResult, i: number) => (
              <RecommendationCard key={r.tmdbId + i} result={r} index={results.length - i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- Vista: formulario ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-200 via-amber-50 to-stone-200 dark:from-indigo-900 dark:via-purple-900 dark:to-indigo-900 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/home')}
            className="text-zinc-600 dark:text-white hover:text-zinc-900 dark:hover:text-indigo-200 transition mb-6 flex items-center gap-2 text-sm"
          >
            ← Volver
          </button>
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-2">Obtener Recomendación</h1>
          <p className="text-zinc-600 dark:text-indigo-200">Elegí tu estado de ánimo y ajustá los filtros opcionales</p>
        </div>

        {/* Paso 1: Estado de ánimo */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 mb-4 dark:bg-white/10 dark:border-white/20">
          <MoodSelector selectedMoodId={context.moodId} onMoodSelected={toggleMood} />
        </div>

        {/* Paso 2: Filtros */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 mb-4 dark:bg-white/10 dark:border-white/20">
          <FilterPanel
            contentType={context.contentType}
            duration={context.duration}
            year={context.year}
            onContentTypeChange={toggleContentType}
            onDurationChange={toggleDuration}
            onYearChange={toggleYear}
            onClearFilters={clearFilters}
          />
        </div>

        {/* Paso 3: Resumen */}
        <div className="mb-6">
          <ContextSummary items={getSummaryItems()} onClear={clearAll} />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-400/50 rounded-lg">
            <p className="text-red-300 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && <LoadingIndicator />}

        {/* Acciones */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/home')}
            className="bg-white border border-zinc-200 text-zinc-800 px-6 py-3 rounded-lg hover:bg-zinc-50 transition font-medium dark:bg-white/10 dark:border-white/20 dark:text-white dark:hover:bg-white/20"
          >
            Cancelar
          </button>
          <button
            onClick={handleGetRecommendation}
            disabled={!isReady || loading}
            className={`flex-1 py-3 rounded-lg font-semibold transition ${
              isReady && !loading
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                : 'bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200 dark:bg-white/10 dark:text-indigo-300 dark:border-white/10'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500 dark:border-white" />
                Buscando...
              </span>
            ) : isReady ? (
              'Obtener Recomendación ✨'
            ) : (
              'Primero elegí tu estado de ánimo'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
