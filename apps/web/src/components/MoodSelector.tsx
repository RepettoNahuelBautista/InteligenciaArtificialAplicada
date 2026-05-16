import { useMoodSelector } from '../hooks/useMoodSelector';

interface MoodSelectorProps {
  onMoodSelected?: (moodId: string) => void;
}

/**
 * MoodSelector - Displays mood options for the user to select their current mood
 */
export const MoodSelector = ({ onMoodSelected }: MoodSelectorProps) => {
  const { moods, selectedMood, loading, error, selectMood } = useMoodSelector();

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-indigo-100">Cargando estados de ánimo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-100">
        <p>Error al cargar estados: {error}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-white mb-4">
        ¿Cuál es tu estado de ánimo hoy?
      </h2>
      <p className="text-indigo-100 mb-8">
        Selecciona cómo te sientes para recibir recomendaciones más personalizadas
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {moods.map((mood) => (
          <button
            key={mood.id}
            onClick={() => {
              selectMood(mood);
              onMoodSelected?.(mood.id);
            }}
            className={`flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-200 border-2 ${
              selectedMood?.id === mood.id
                ? 'border-purple-400 bg-purple-500/30 scale-105'
                : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40'
            }`}
          >
            <span className="text-4xl mb-2">{mood.emoji}</span>
            <span className="text-sm font-semibold text-white text-center">
              {mood.label}
            </span>
            <span className="text-xs text-indigo-200 mt-1 text-center hidden sm:block">
              {mood.description}
            </span>
          </button>
        ))}
      </div>

      {selectedMood && (
        <div className="mt-6 p-4 bg-green-500/20 border border-green-400 rounded-lg">
          <p className="text-green-100">
            ✓ Seleccionaste: <strong>{selectedMood.label}</strong> - {selectedMood.description}
          </p>
        </div>
      )}
    </div>
  );
};
