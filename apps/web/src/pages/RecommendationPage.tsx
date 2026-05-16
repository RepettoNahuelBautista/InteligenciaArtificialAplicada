import { useNavigate } from 'react-router-dom';
import { MoodSelector } from '../components/MoodSelector';
import { FilterPanel } from '../components/Recommendation/FilterPanel';
import { ContextSummary } from '../components/Recommendation/ContextSummary';
import { useRecommendationContext } from '../hooks/useRecommendationContext';

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

  const handleGetRecommendation = () => {
    // TODO: US-009 — navegar a resultado con contexto
    alert(`Próximamente (US-009):\n${getSummaryItems().join('\n')}`);
  };

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
          <p className="text-indigo-200">
            Elegí tu estado de ánimo y ajustá los filtros opcionales
          </p>
        </div>

        {/* Paso 1: Estado de ánimo (US-006) */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-4">
          <MoodSelector
            selectedMoodId={context.moodId}
            onMoodSelected={toggleMood}
          />
        </div>

        {/* Paso 2: Filtros (US-007) */}
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

        {/* Paso 3: Resumen del contexto (US-008) */}
        <div className="mb-6">
          <ContextSummary items={getSummaryItems()} onClear={clearAll} />
        </div>

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
            disabled={!isReady}
            className={`flex-1 py-3 rounded-lg font-semibold transition ${
              isReady
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                : 'bg-white/10 text-indigo-300 cursor-not-allowed border border-white/10'
            }`}
          >
            {isReady ? 'Obtener Recomendación ✨' : 'Primero elegí tu estado de ánimo'}
          </button>
        </div>
      </div>
    </div>
  );
};
