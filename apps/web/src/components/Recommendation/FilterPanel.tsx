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
  { value: 'tv', label: 'Serie', emoji: '📺' },
];

const DURATION_OPTIONS: { value: DurationOption; label: string }[] = [
  { value: 'short', label: 'Corta (<90 min)' },
  { value: 'normal', label: 'Normal (90-120 min)' },
  { value: 'long', label: 'Larga (+120 min)' },
];

const YEAR_OPTIONS: { value: YearOption; label: string }[] = [
  { value: 'classic', label: 'Clásica (<2000)' },
  { value: 'recent', label: 'Reciente (2000-2015)' },
  { value: 'new', label: 'Nueva (2016+)' },
];

const hasFilters = (c: ContentType, d: DurationOption, y: YearOption) =>
  c !== null || d !== null || y !== null;

const pillClass = (active: boolean) =>
  `px-4 py-2 rounded-lg border-2 transition font-medium text-sm ${
    active
      ? 'border-purple-400 bg-purple-500/30 text-white'
      : 'border-white/20 bg-white/5 text-indigo-200 hover:bg-white/10 hover:border-white/40'
  }`;

export const FilterPanel = ({
  contentType,
  duration,
  year,
  onContentTypeChange,
  onDurationChange,
  onYearChange,
  onClearFilters,
}: FilterPanelProps) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold text-white">Filtros</h2>
        {hasFilters(contentType, duration, year) && (
          <button
            onClick={onClearFilters}
            className="text-indigo-300 hover:text-white text-sm transition underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tipo de contenido */}
      <div className="mb-5">
        <p className="text-indigo-300 text-xs font-semibold uppercase tracking-wide mb-3">
          Tipo de contenido
        </p>
        <div className="flex gap-3 flex-wrap">
          {CONTENT_OPTIONS.map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => onContentTypeChange(opt.value)}
              className={pillClass(contentType === opt.value)}
            >
              {opt.emoji} {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Duración */}
      <div className="mb-5">
        <p className="text-indigo-300 text-xs font-semibold uppercase tracking-wide mb-3">
          Duración
        </p>
        <div className="flex gap-3 flex-wrap">
          {DURATION_OPTIONS.map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => onDurationChange(opt.value)}
              className={pillClass(duration === opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Época */}
      <div>
        <p className="text-indigo-300 text-xs font-semibold uppercase tracking-wide mb-3">
          Época
        </p>
        <div className="flex gap-3 flex-wrap">
          {YEAR_OPTIONS.map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => onYearChange(opt.value)}
              className={pillClass(year === opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
