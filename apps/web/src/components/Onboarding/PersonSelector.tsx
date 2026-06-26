import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePersonSelector } from '../../hooks/usePersonSelector';

interface PersonSelectorProps {
  type: 'directors' | 'actors';
  onSelectionChange?: (selectedIds: number[]) => void;
}

export const PersonSelector: React.FC<PersonSelectorProps> = ({ type, onSelectionChange }) => {
  const {
    selectedPersons,
    searchResults,
    searchQuery,
    isSearching,
    error,
    isValid,
    handleSearch,
    togglePerson,
    clearSearch,
  } = usePersonSelector({ type });

  useEffect(() => {
    onSelectionChange?.(selectedPersons.map((p) => p.id));
  }, [selectedPersons]);

  const isDirectors = type === 'directors';
  const displayType = isDirectors ? 'Directores' : 'Actores';
  const icon = isDirectors ? '🎬' : '⭐';

  const chipClass = isDirectors
    ? 'bg-violet-100 dark:bg-violet-500/15 text-violet-800 dark:text-violet-200 border border-violet-200 dark:border-violet-500/25 hover:bg-violet-200 dark:hover:bg-violet-500/25'
    : 'bg-pink-100 dark:bg-pink-500/15 text-pink-800 dark:text-pink-200 border border-pink-200 dark:border-pink-500/25 hover:bg-pink-200 dark:hover:bg-pink-500/25';

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">
          {icon} {displayType} Favoritos
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Opcional — podés saltear este paso
        </p>
      </div>

      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={`Buscar ${displayType.toLowerCase()}...`}
          className="w-full px-4 py-2.5 border border-zinc-200 dark:border-white/10 rounded-xl bg-white/80 dark:bg-white/5 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition pr-10 placeholder-zinc-400 dark:placeholder-zinc-600"
        />
        <div className="absolute right-3 top-2.5">
          {isSearching ? (
            <span className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin inline-block" />
          ) : searchQuery ? (
            <button onClick={clearSearch} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition text-lg leading-none">✕</button>
          ) : null}
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search results */}
      <AnimatePresence>
        {searchQuery && searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="border border-zinc-200 dark:border-white/10 rounded-xl bg-white dark:bg-zinc-900 shadow-lg max-h-56 overflow-y-auto"
          >
            {searchResults.map((person) => {
              const selected = selectedPersons.some((p) => p.id === person.id);
              return (
                <button
                  key={person.id}
                  onClick={() => togglePerson(person)}
                  className={`w-full text-left px-4 py-2.5 border-b border-zinc-100 dark:border-white/5 last:border-b-0 transition flex items-center justify-between ${
                    selected
                      ? 'bg-indigo-50 dark:bg-indigo-500/10'
                      : 'hover:bg-zinc-50 dark:hover:bg-white/5'
                  }`}
                >
                  <div>
                    <p className="font-medium text-zinc-800 dark:text-zinc-100 text-sm">{person.name}</p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">{person.department}</p>
                  </div>
                  {selected && <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">✓</span>}
                </button>
              );
            })}
          </motion.div>
        )}
        {searchQuery && !isSearching && searchResults.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center text-zinc-400 dark:text-zinc-600 text-sm py-1"
          >
            No se encontraron {displayType.toLowerCase()}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Selected chips */}
      {selectedPersons.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {selectedPersons.map((person) => (
              <motion.button
                key={person.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                whileTap={{ scale: 0.93 }}
                onClick={() => togglePerson(person)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition ${chipClass}`}
              >
                {person.name}
                <span className="opacity-50 hover:opacity-100 transition text-xs">✕</span>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Validation / count */}
      {!isValid && (
        <p className="text-amber-600 dark:text-amber-400 text-sm flex items-center gap-1.5">
          <span>⚠️</span> Máximo 15 {displayType.toLowerCase()} permitidos
        </p>
      )}
      {selectedPersons.length > 0 && isValid && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          {selectedPersons.length}{' '}
          {selectedPersons.length === 1
            ? isDirectors ? 'director' : 'actor'
            : displayType.toLowerCase()}{' '}
          seleccionado{selectedPersons.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};
