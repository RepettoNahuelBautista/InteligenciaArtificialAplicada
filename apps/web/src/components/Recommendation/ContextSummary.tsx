import { motion, AnimatePresence } from 'framer-motion';

interface ContextSummaryProps {
  items: string[];
  onClear: () => void;
}

export const ContextSummary = ({ items, onClear }: ContextSummaryProps) => {
  if (items.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 flex-wrap"
    >
      <span className="text-zinc-400 dark:text-zinc-500 text-xs font-medium shrink-0">Buscando:</span>
      <AnimatePresence mode="popLayout">
        {items.map((item) => (
          <motion.span
            key={item}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium px-3 py-1 rounded-full"
          >
            {item}
          </motion.span>
        ))}
      </AnimatePresence>
      <button
        onClick={onClear}
        className="text-xs text-zinc-400 hover:text-red-400 transition ml-1 shrink-0"
        title="Limpiar todo"
      >
        × Limpiar
      </button>
    </motion.div>
  );
};
