import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/apiClient';

interface UserResult {
  userId: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
}

export function UserSearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await apiClient.get('/users/search', { params: { q: query } });
        setResults(response.data.data);
        setSearched(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  }, [query]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-200 via-amber-50 to-stone-200 dark:from-indigo-900 dark:via-purple-900 dark:to-indigo-900 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <button onClick={() => navigate('/home')} className="text-zinc-600 dark:text-white hover:text-zinc-900 dark:hover:text-indigo-200 transition mb-4 flex items-center gap-2 text-sm">
            ← Volver al inicio
          </button>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Buscar usuarios</h1>
          <p className="text-zinc-500 dark:text-indigo-300 mt-1">Encontrá usuarios por su nombre y seguílos</p>
        </div>

        <div className="relative mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscá por nombre de usuario..."
            autoFocus
            className="w-full px-4 py-3 rounded-xl bg-white border border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-white/10 dark:border-white/20 dark:text-white dark:placeholder-indigo-300 dark:focus:ring-indigo-400"
          />
          {searching && (
            <span className="absolute right-4 top-3.5 animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 dark:border-white" />
          )}
        </div>

        {results.length > 0 ? (
          <div className="space-y-3">
            {results.map((u) => (
              <button
                key={u.userId}
                onClick={() => navigate(`/users/${u.userId}`, { state: { from: 'search' } })}
                className="w-full bg-white hover:bg-zinc-50 hover:shadow-sm border border-zinc-200 dark:bg-white/10 dark:hover:bg-white/20 dark:border-white/20 rounded-xl p-4 flex items-center gap-4 transition text-left"
              >
                <div className="w-11 h-11 rounded-full overflow-hidden bg-indigo-500 flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt={u.displayName} className="w-full h-full object-cover" />
                  ) : (
                    u.displayName[0].toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-zinc-900 dark:text-white truncate">{u.displayName}</p>
                  <p className="text-zinc-500 dark:text-indigo-300 text-sm truncate">{u.email}</p>
                </div>
                <span className="ml-auto text-zinc-400 dark:text-indigo-400 flex-shrink-0">→</span>
              </button>
            ))}
          </div>
        ) : searched && query.length >= 2 ? (
          <div className="text-center py-16 text-zinc-500 dark:text-indigo-300">
            <p className="text-5xl mb-4">🔍</p>
            <p className="font-medium">No se encontraron usuarios con ese nombre</p>
            <p className="text-sm mt-1 text-zinc-400 dark:text-indigo-400">Solo se puede buscar a usuarios que configuraron su nombre de usuario</p>
          </div>
        ) : (
          <div className="text-center py-16 text-zinc-500 dark:text-indigo-300">
            <p className="text-5xl mb-4">👥</p>
            <p className="font-medium">Escribí al menos 2 caracteres para buscar</p>
          </div>
        )}
      </div>
    </div>
  );
}
