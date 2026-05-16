import { useNavigate } from 'react-router-dom';
import { MoodSelector } from '../components/MoodSelector';
import { FilterPanel } from '../components/Recommendation/FilterPanel';
import { ContextSummary } from '../components/Recommendation/ContextSummary';
import { RecommendationCard } from '../components/Recommendation/RecommendationCard';
import { useRecommendationContext } from '../hooks/useRecommendationContext';
import { useRecommendation } from '../hooks/useRecommendation';

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

  const { result, loading, error, fetchRecommendation, clear } = useRecommendation();

  const handleGetRecommendation = () => {
    fetchRecommendation(context);
  };

  const handleNewRecommendation = () => {
    clear();
  };

  // --- Vista: resultado ---
  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 p-4 sm:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => navigate('/home')}
              className="text-white hover:text-indigo-200 transition text-sm flex items-center gap-2"
            >
              ← Volver al inicio
            </button>
          </div>
          <h1 className="text-3xl font-bold text-white mb-6">Tu recomendación ✨</h1>
          <RecommendationCard result={result} onNewRecommendation={handleNewRecommendation} />
        </div>
      </div>
    );
  }

  // --- Vista: formulario ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/home')}
            className="text-white hover:text-indigo-200 transition mb-6 flex items-center gap-2 text-sm"
          >
            ← Volver
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">Obtener Recomendación</h1>
          <p className="text-indigo-200">Elegí tu estado de ánimo y ajustá los filtros opcionales</p>
        </div>

        {/* Paso 1: Estado de ánimo */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-4">
          <MoodSelector selectedMoodId={context.moodId} onMoodSelected={toggleMood} />
        </div>

        {/* Paso 2: Filtros */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-4">
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
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/home')}
            className="bg-white/10 border border-white/20 text-white px-6 py-3 rounded-lg hover:bg-white/20 transition font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleGetRecommendation}
            disabled={!isReady || loading}
            className={`flex-1 py-3 rounded-lg font-semibold transition ${
              isReady && !loading
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                : 'bg-white/10 text-indigo-300 cursor-not-allowed border border-white/10'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                Consultando a la IA...
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
