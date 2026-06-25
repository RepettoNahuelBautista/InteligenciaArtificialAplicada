import { motion } from 'framer-motion';
import { useMoodSelector, Mood } from '../hooks/useMoodSelector';

interface MoodSelectorProps {
  selectedMoodId: string | null;
  onMoodSelected: (mood: Mood) => void;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const cardVariant = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

export const MoodSelector = ({ selectedMoodId, onMoodSelected }: MoodSelectorProps) => {
  const { moods, loading, error } = useMoodSelector();

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-white/40 dark:bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-4 text-red-700 dark:text-red-300 text-sm">
        Error al cargar estados: {error}
      </div>
    );
  }

  return (
    <div className="w-full">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {moods.map((mood) => {
          const isSelected = selectedMoodId === mood.id;
          return (
            <motion.button
              key={mood.id}
              variants={cardVariant}
              whileHover={{ scale: 1.04, y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onMoodSelected(mood)}
              className={`relative flex flex-col items-center justify-center p-5 rounded-2xl transition-all duration-200 border-2 text-left
                ${isSelected
                  ? 'border-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/20 shadow-lg shadow-indigo-500/20'
                  : 'border-white/60 bg-white/50 hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 hover:border-indigo-200 dark:hover:border-indigo-500/40'
                }`}
            >
              {/* Selected ring glow */}
              {isSelected && (
                <motion.div
                  layoutId="mood-glow"
                  className="absolute inset-0 rounded-2xl ring-2 ring-indigo-500 ring-offset-1 ring-offset-transparent"
                />
              )}

              <span className="text-5xl mb-3 leading-none">{mood.emoji}</span>
              <span className="text-sm font-bold text-zinc-900 dark:text-white text-center leading-tight">
                {mood.label}
              </span>
              <span className="text-xs text-zinc-500 dark:text-indigo-300 mt-1.5 text-center leading-tight hidden sm:block">
                {mood.description}
              </span>

              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center"
                >
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
};
