import { useMoodSelector, Mood } from '../hooks/useMoodSelector';

interface MoodSelectorProps {
  selectedMoodId: string | null;
  onMoodSelected: (mood: Mood) => void;
}

export const MoodSelector = ({ selectedMoodId, onMoodSelected }: MoodSelectorProps) => {
  const { moods, loading, error } = useMoodSelector();

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 dark:border-white mx-auto mb-4"></div>
        <p className="text-zinc-600 dark:text-indigo-100">Cargando estados de ánimo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-700 dark:text-red-100">
        <p>Error al cargar estados: {error}</p>
      </div>
    );
  }

  const selectedMood = moods.find((m) => m.id === selectedMoodId) ?? null;

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">¿Cómo te sentís hoy?</h2>
      <p className="text-zinc-600 dark:text-indigo-200 mb-6 text-sm">
        Seleccioná tu estado de ánimo para recibir recomendaciones personalizadas
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {moods.map((mood) => (
          <button
            key={mood.id}
            onClick={() => onMoodSelected(mood)}
            className={`flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-200 border-2 ${
              selectedMoodId === mood.id
                ? 'border-purple-400 bg-purple-500/30 scale-105'
                : 'border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-400 dark:border-white/20 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:border-white/40'
            }`}
          >
            <span className="text-4xl mb-2">{mood.emoji}</span>
            <span className="text-sm font-semibold text-zinc-900 dark:text-white text-center">{mood.label}</span>
            <span className="text-xs text-zinc-500 dark:text-indigo-200 mt-1 text-center hidden sm:block">
              {mood.description}
            </span>
          </button>
        ))}
      </div>

      {selectedMood && (
        <div className="mt-4 p-3 bg-purple-500/20 border border-purple-400/50 rounded-lg">
          <p className="text-purple-800 dark:text-purple-100 text-sm">
            ✓ <strong>{selectedMood.emoji} {selectedMood.label}</strong> — {selectedMood.description}
          </p>
        </div>
      )}
    </div>
  );
};
