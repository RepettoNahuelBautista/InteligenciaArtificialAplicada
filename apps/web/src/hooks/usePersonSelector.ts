import { useState, useCallback, useEffect, useRef } from 'react';
import { apiClient } from '../api/apiClient';
import { logger } from '../utils/logger';

interface Person {
  id: number;
  name: string;
  department: string;
}

interface UsePersonSelectorOptions {
  type: 'directors' | 'actors';
}

export const usePersonSelector = (options: UsePersonSelectorOptions) => {
  const { type } = options;

  const [selectedPersons, setSelectedPersons] = useState<Person[]>([]);
  const [searchResults, setSearchResults] = useState<Person[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadSavedPersons();
  }, []);

  const loadSavedPersons = async () => {
    try {
      const response = await apiClient.get('/profile');
      const prefs = response.data?.data?.preferences;
      if (prefs) {
        const persons: { id: number; name: string }[] =
          type === 'directors' ? prefs.directors : prefs.actors;
        if (Array.isArray(persons) && persons.length > 0) {
          setSelectedPersons(
            persons.map((p) => ({
              id: p.id,
              name: p.name,
              department: type === 'directors' ? 'Directing' : 'Acting',
            }))
          );
        }
      }
    } catch {
      logger.warn('Failed to load saved persons', { type });
    }
  };

  const searchPersons = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setError(null);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await apiClient.get('/search/people', {
        params: { q: query },
      });

      if (response.data?.data) {
        setSearchResults(response.data.data);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      setError('Error al buscar');
      logger.error('Person search error', { query, error: err });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => searchPersons(query), 350);
    },
    [searchPersons]
  );

  const togglePerson = useCallback(
    (person: Person) => {
      setSelectedPersons((prev) => {
        const exists = prev.some((p) => p.id === person.id);

        if (exists) {
          return prev.filter((p) => p.id !== person.id);
        }

        if (prev.length >= 15) {
          setError('Maximum 15 persons allowed');
          return prev;
        }

        return [...prev, person];
      });
      setError(null);
    },
    []
  );

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
  }, []);

  const isValid = selectedPersons.length <= 15;
  const selectedIds = selectedPersons.map((p) => p.id);

  return {
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
  };
};
