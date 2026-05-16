import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { MoodSelector } from '../components/MoodSelector';

/**
 * RecommendationPage - Where users select mood and filters before getting a recommendation
 */
export const RecommendationPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedMoodId, setSelectedMoodId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleGetRecommendation = () => {
    if (!selectedMoodId) {
      alert('Por favor selecciona un estado de ánimo');
      return;
    }

    // TODO: Navigate to recommendation result page with context
    // navigate('/recommendation-result', { state: { mood: selectedMoodId } });
    alert(`Obteniendo recomendación para: ${selectedMoodId}\n\n(Próximamente - US-009)`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <button
            onClick={() => navigate('/home')}
            className="text-white hover:text-indigo-200 transition mb-6 flex items-center gap-2"
          >
            ← Volver
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">Obtener Recomendación</h1>
          <p className="text-indigo-200">
            Cuéntanos cómo te sientes y te recomendaremos algo perfecto para ti
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-8 mb-8">
          <MoodSelector onMoodSelected={setSelectedMoodId} />
        </div>

        {/* Info Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Profile Summary */}
          <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-100 mb-2">📊 Tu Perfil</h3>
            <p className="text-blue-50 text-sm">
              Estamos usando tus preferencias de géneros, directores y actores para personalizar la recomendación.
            </p>
            <button
              onClick={() => navigate('/profile')}
              className="text-blue-300 hover:text-blue-100 text-sm mt-2 underline"
            >
              Ver tu perfil
            </button>
          </div>

          {/* Next Step */}
          <div className="bg-purple-500/10 border border-purple-400/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-purple-100 mb-2">🎬 Próximo Paso</h3>
            <p className="text-purple-50 text-sm">
              Después de seleccionar tu estado de ánimo, podrás añadir filtros adicionales como duración y tipo.
            </p>
            <p className="text-purple-300 text-xs mt-2">
              *(Filtros - Próximamente)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/home')}
            className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={handleGetRecommendation}
            disabled={!selectedMoodId}
            className={`px-8 py-3 rounded-lg font-semibold transition ${
              selectedMoodId
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                : 'bg-gray-500 text-gray-300 cursor-not-allowed'
            }`}
          >
            Obtener Recomendación
          </button>
        </div>

        {/* Feature Teaser */}
        <div className="mt-12 text-center p-6 bg-white/5 rounded-lg border border-white/10">
          <p className="text-indigo-100 text-sm">
            ✨ <strong>Próximamente:</strong> Recomendaciones basadas en IA con explicaciones personalizadas
          </p>
        </div>
      </div>
    </div>
  );
};
