import { useState, useCallback, useEffect } from 'react';
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

  // Load saved preferences on mount
  useEffect(() => {
    loadSavedPersons();
  }, []);

  const loadSavedPersons = async () => {
    try {
      const response = await apiClient.get('/profile/people');
      if (response.data?.data) {
        const persons = type === 'directors' 
          ? response.data.data.directors 
          : response.data.data.actors;
        
        // For now, just store IDs. In a real app, we'd fetch names too
        setSelectedPersons(
          persons.map((id: number) => ({
            id,
            name: `Person #${id}`,
            department: type === 'directors' ? 'Directing' : 'Acting',
          }))
        );
      }
    } catch (err) {
      logger.warn('Failed to load saved persons', { type });
    }
  };

  const searchPersons = useCallback(
    async (query: string) => {
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
        setError('Failed to search persons');
        logger.error('Person search error', { query, error: err });
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      searchPersons(query);
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
