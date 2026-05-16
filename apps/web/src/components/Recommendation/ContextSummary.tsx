interface ContextSummaryProps {
  items: string[];
  onClear: () => void;
}

export const ContextSummary = ({ items, onClear }: ContextSummaryProps) => {
  if (items.length === 0) {
    return (
      <div className="p-4 bg-white/5 border border-white/10 rounded-lg text-center">
        <p className="text-indigo-300 text-sm">
          Seleccioná un estado de ánimo para ver el resumen de tu búsqueda
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-green-500/10 border border-green-400/40 rounded-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-green-300 text-xs font-semibold uppercase tracking-wide mb-2">
            Buscando
          </p>
          <div className="flex flex-wrap gap-2">
            {items.map((item, i) => (
              <span
                key={i}
                className="bg-green-500/20 border border-green-400/40 text-green-100 text-sm px-3 py-1 rounded-full"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={onClear}
          className="text-green-400 hover:text-white text-sm transition whitespace-nowrap"
        >
          Limpiar todo
        </button>
      </div>
    </div>
  );
};
