import { useState } from 'react';
import { usePersonSelector } from '../../hooks/usePersonSelector';

interface Person {
  id: number;
  name: string;
  department: string;
}

interface PersonSelectorProps {
  type: 'directors' | 'actors';
  onSelectionChange?: (selectedIds: number[]) => void;
}

export const PersonSelector: React.FC<PersonSelectorProps> = ({
  type,
  onSelectionChange,
}) => {
  const {
    selectedPersons,
    searchResults,
    searchQuery,
    isSearching,
    error,
    isValid,
    selectedIds,
    handleSearch,
    togglePerson,
    clearSearch,
  } = usePersonSelector({ type });

  // Notify parent when selection changes
  const handleToggle = (person: Person) => {
    togglePerson(person);
    // Update parent after toggle (slight delay to ensure state update)
    setTimeout(() => {
      onSelectionChange?.(selectedIds);
    }, 0);
  };

  const displayType = type === 'directors' ? 'Directores' : 'Actores';
  const placeholder = `Buscar ${displayType.toLowerCase()}...`;

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">
          {displayType} Favoritos
        </h3>
        <span className="text-sm text-gray-600">
          {selectedPersons.length}/15
        </span>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-10"
        />
        <div className="absolute right-3 top-2.5">
          {isSearching ? (
            <span className="inline-block w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          ) : searchQuery ? (
            <button onClick={clearSearch} className="text-gray-500 hover:text-gray-700">✕</button>
          ) : null}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Search Results Dropdown */}
      {searchQuery && searchResults.length > 0 && (
        <div className="border border-gray-300 rounded-lg bg-white shadow-lg max-h-64 overflow-y-auto">
          {searchResults.map((person) => {
            const isSelected = selectedPersons.some((p) => p.id === person.id);
            return (
              <button
                key={person.id}
                onClick={() => handleToggle(person)}
                className={`w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-200 last:border-b-0 transition-colors flex items-center justify-between ${
                  isSelected ? 'bg-indigo-50' : ''
                }`}
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{person.name}</div>
                  <div className="text-xs text-gray-500">{person.department}</div>
                </div>
                {isSelected && (
                  <span className="text-indigo-600 font-bold text-lg">✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* No Results Message */}
      {searchQuery && !isSearching && searchResults.length === 0 && (
        <div className="p-4 text-center text-gray-500 text-sm">
          No se encontraron {displayType.toLowerCase()}
        </div>
      )}

      {/* Selected Persons Chips */}
      {selectedPersons.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedPersons.map((person) => (
            <button
              key={person.id}
              onClick={() => handleToggle(person)}
              className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm hover:bg-indigo-200 transition-colors"
            >
              {person.name}
              <span className="hover:text-indigo-900">✕</span>
            </button>
          ))}
        </div>
      )}

      {/* Validation Message */}
      {!isValid && (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">
          Máximo 15 {displayType.toLowerCase()} permitidos
        </div>
      )}

      {/* Optional: Show count message */}
      {selectedPersons.length > 0 && isValid && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          {selectedPersons.length === 1
            ? `1 ${type === 'directors' ? 'director' : 'actor'} seleccionado`
            : `${selectedPersons.length} ${displayType.toLowerCase()} seleccionados`}
        </div>
      )}
    </div>
  );
};
