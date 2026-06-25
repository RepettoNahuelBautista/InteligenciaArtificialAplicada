import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ContentType, DurationOption, YearOption } from '../../hooks/useRecommendationContext';

interface FilterPanelProps {
  contentType: ContentType;
  duration: DurationOption;
  year: YearOption;
  onContentTypeChange: (type: ContentType) => void;
  onDurationChange: (duration: DurationOption) => void;
  onYearChange: (year: YearOption) => void;
  onClearFilters: () => void;
}

const CONTENT_OPTIONS: { value: ContentType; label: string; emoji: string }[] = [
  { value: 'movie', label: 'Película', emoji: '🎬' },
  { value: 'tv',    label: 'Serie',    emoji: '📺' },
];

const DURATION_OPTIONS: { value: DurationOption; label: string; emoji: string }[] = [
  { value: 'short',  label: 'Corta',   emoji: '⚡' },
  { value: 'normal', label: 'Normal',  emoji: '🎯' },
  { value: 'long',   label: 'Larga',   emoji: '🍿' },
];

const YEAR_OPTIONS: { value: YearOption; label: string; emoji: string }[] = [
  { value: 'classic', label: 'Clásica',  emoji: '📽️' },
  { value: 'recent',  label: 'Reciente', emoji: '🎞️' },
  { value: 'new',     label: 'Nueva',    emoji: '✨' },
];

const hasFilters = (c: ContentType, d: DurationOption, y: YearOption) =>
  c !== null || d !== null || y !== null;

function Pill<T extends string>({
  value, label, emoji, active, onClick,
}: { value: T; label: string; emoji: string; active: boolean; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-medium text-sm transition-all duration-150
        ${active
          ? 'border-indigo-500 bg-indigo-500/15 text-indigo-700 dark:text-indigo-200 shadow-sm shadow-indigo-500/20'
          : 'border-white/60 bg-white/40 text-zinc-600 hover:bg-white/70 hover:border-indigo-200 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:border-indigo-500/40'
        }`}
    >
      <span>{emoji}</span>
      <span>{label}</span>
      {active && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="ml-0.5 text-indigo-500 dark:text-indigo-300 text-xs"
        >
          ✓
        </motion.span>
      )}
    </motion.button>
  );
}

export const FilterPanel = ({
  contentType, duration, year,
  onContentTypeChange, onDurationChange, onYearChange, onClearFilters,
}: FilterPanelProps) => {
  const [open, setOpen] = useState(false);
  const activeCount = [contentType, duration, year].filter(Boolean).length;

  return (
    <div>
      {/* Toggle header */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full group"
      >
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 dark:text-zinc-400 text-sm font-medium group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition">
            Filtros opcionales
          </span>
          {activeCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-indigo-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
            >
              {activeCount}
            </motion.span>
          )}
        </div>
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-4 h-4 text-zinc-400"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-5 space-y-5">
              {/* Tipo */}
              <div>
                <p className="text-zinc-400 dark:text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-3">
                  Tipo
                </p>
                <div className="flex gap-2 flex-wrap">
                  {CONTENT_OPTIONS.map((o) => (
                    <Pill
                      key={String(o.value)}
                      value={String(o.value)}
                      label={o.label}
                      emoji={o.emoji}
                      active={contentType === o.value}
                      onClick={() => onContentTypeChange(o.value)}
                    />
                  ))}
                </div>
              </div>

              {/* Duración */}
              <div>
                <p className="text-zinc-400 dark:text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-3">
                  Duración
                </p>
                <div className="flex gap-2 flex-wrap">
                  {DURATION_OPTIONS.map((o) => (
                    <Pill
                      key={String(o.value)}
                      value={String(o.value)}
                      label={o.label}
                      emoji={o.emoji}
                      active={duration === o.value}
                      onClick={() => onDurationChange(o.value)}
                    />
                  ))}
                </div>
              </div>

              {/* Época */}
              <div>
                <p className="text-zinc-400 dark:text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-3">
                  Época
                </p>
                <div className="flex gap-2 flex-wrap">
                  {YEAR_OPTIONS.map((o) => (
                    <Pill
                      key={String(o.value)}
                      value={String(o.value)}
                      label={o.label}
                      emoji={o.emoji}
                      active={year === o.value}
                      onClick={() => onYearChange(o.value)}
                    />
                  ))}
                </div>
              </div>

              {/* Clear */}
              {hasFilters(contentType, duration, year) && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={onClearFilters}
                  className="text-xs text-zinc-400 hover:text-red-400 dark:hover:text-red-400 transition underline underline-offset-2"
                >
                  Limpiar filtros
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
