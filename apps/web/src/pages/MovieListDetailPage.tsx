import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import { useAuth } from '../hooks/useAuth';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w92';

interface ListItem {
  id: string;
  tmdbId: string;
  title: string;
  posterPath: string | null;
  contentType: string;
  addedAt: string;
}

interface ListDetail {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  isOwner: boolean;
  owner: { userId: string; displayName: string; avatarUrl: string | null };
  items: ListItem[];
  createdAt: string;
}

interface SearchResult {
  id: number;
  title: string;
  media_type: 'movie' | 'tv';
  year: number;
  poster_path?: string | null;
}

export function MovieListDetailPage() {
  const navigate = useNavigate();
  const { listId } = useParams<{ listId: string }>();
  const { user } = useAuth();

  const [list, setList] = useState<ListDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPublic, setEditPublic] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!listId) return;
    const load = async () => {
      try {
        const res = await apiClient.get(`/lists/${listId}`);
        setList(res.data.data);
      } catch {
        setError('No se pudo cargar la lista');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [listId]);

  // Debounced TMDB search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await apiClient.get('/search/movies', { params: { q: searchQuery } });
        setSearchResults(res.data.data.slice(0, 8));
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  }, [searchQuery]);

  // Close search on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleAddItem = async (result: SearchResult) => {
    if (!list) return;
    try {
      const res = await apiClient.post(`/lists/${list.id}/items`, {
        tmdbId: String(result.id),
        title: result.title,
        posterPath: result.poster_path ?? null,
        contentType: result.media_type,
      });
      setList((prev) => prev ? { ...prev, items: [res.data.data, ...prev.items] } : prev);
      setSearchQuery('');
      setSearchResults([]);
      setShowSearch(false);
    } catch {
      // item already in list — silently ignore
    }
  };

  const handleRemoveItem = async (tmdbId: string) => {
    if (!list) return;
    setList((prev) => prev ? { ...prev, items: prev.items.filter((i) => i.tmdbId !== tmdbId) } : prev);
    try {
      await apiClient.delete(`/lists/${list.id}/items/${tmdbId}`);
    } catch {
      // revert not critical here
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!list) return;
    setSaving(true);
    try {
      const res = await apiClient.put(`/lists/${list.id}`, {
        name: editName.trim(),
        description: editDesc.trim() || null,
        isPublic: editPublic,
      });
      setList((prev) => prev ? { ...prev, name: res.data.data.name, description: res.data.data.description, isPublic: res.data.data.isPublic } : prev);
      setEditing(false);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteList = async () => {
    if (!list) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/lists/${list.id}`);
      navigate('/lists');
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const openEdit = () => {
    if (!list) return;
    setEditName(list.name);
    setEditDesc(list.description ?? '');
    setEditPublic(list.isPublic);
    setEditing(true);
  };

  const isOwn = list?.isOwner ?? (list?.owner.userId === user?.id);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white" />
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
          <p className="text-4xl mb-4">📋</p>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Lista no encontrada</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button onClick={() => navigate(-1)} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition">
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button onClick={() => navigate(-1)} className="text-white hover:text-indigo-200 transition mb-4 flex items-center gap-2 text-sm">
            ← Volver
          </button>

          {editing ? (
            <form onSubmit={handleSaveEdit} className="bg-white rounded-xl p-5 mb-4 shadow-lg">
              <h3 className="font-bold text-gray-900 mb-4">Editar lista</h3>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <input
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  maxLength={300}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div className="mb-4 flex items-center gap-2">
                <input type="checkbox" id="editPublic" checked={editPublic} onChange={(e) => setEditPublic(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded" />
                <label htmlFor="editPublic" className="text-sm text-gray-700">Lista pública</label>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition">Cancelar</button>
                <button type="submit" disabled={saving || !editName.trim()} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 transition">
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-3xl font-bold text-white truncate">{list.name}</h1>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${list.isPublic ? 'bg-green-500/30 text-green-200' : 'bg-gray-500/30 text-gray-300'}`}>
                    {list.isPublic ? 'Pública' : 'Privada'}
                  </span>
                </div>
                {list.description && <p className="text-indigo-300 text-sm">{list.description}</p>}
                <p className="text-indigo-400 text-xs mt-1">
                  {list.items.length} {list.items.length === 1 ? 'título' : 'títulos'} · por {list.owner.displayName}
                </p>
              </div>
              {isOwn && (
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={openEdit} className="px-3 py-1.5 text-sm bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition">
                    Editar
                  </button>
                  <button onClick={() => setConfirmDelete(true)} className="px-3 py-1.5 text-sm bg-red-500/20 border border-red-400/30 text-red-300 rounded-lg hover:bg-red-500/30 transition">
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Delete confirm */}
        {confirmDelete && (
          <div className="bg-white rounded-xl p-5 mb-6 shadow-lg">
            <h3 className="font-bold text-gray-900 mb-2">¿Eliminar esta lista?</h3>
            <p className="text-gray-500 text-sm mb-4">Se eliminarán todos los títulos de la lista. Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition">Cancelar</button>
              <button onClick={handleDeleteList} disabled={deleting} className="flex-1 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-40 transition">
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        )}

        {/* Add item search */}
        {isOwn && (
          <div ref={searchRef} className="relative mb-6">
            {!showSearch ? (
              <button
                onClick={() => setShowSearch(true)}
                className="w-full py-2.5 rounded-xl bg-white/10 border border-white/20 text-indigo-300 hover:bg-white/20 transition text-sm font-medium"
              >
                + Agregar película o serie
              </button>
            ) : (
              <div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar para agregar..."
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                {searching && (
                  <span className="absolute right-4 top-3.5 animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                )}
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
                    {searchResults.map((r) => {
                      const alreadyAdded = list.items.some((i) => i.tmdbId === String(r.id));
                      return (
                        <button
                          key={r.id}
                          onClick={() => !alreadyAdded && handleAddItem(r)}
                          disabled={alreadyAdded}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${alreadyAdded ? 'opacity-40 cursor-not-allowed bg-gray-50' : 'hover:bg-indigo-50'}`}
                        >
                          {r.poster_path ? (
                            <img src={`${TMDB_IMAGE_BASE}${r.poster_path}`} alt={r.title} className="w-8 h-12 object-cover rounded flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-12 bg-gray-200 rounded flex items-center justify-center flex-shrink-0 text-lg">
                              {r.media_type === 'tv' ? '📺' : '🎬'}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900 truncate">{r.title}</p>
                            <p className="text-xs text-gray-500">{r.year} · {r.media_type === 'tv' ? 'Serie' : 'Película'}</p>
                          </div>
                          {alreadyAdded && <span className="text-xs text-gray-400 flex-shrink-0">Ya agregada</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Items */}
        {list.items.length === 0 ? (
          <div className="text-center py-16 text-indigo-300">
            <p className="text-5xl mb-4">🎬</p>
            <p className="font-medium text-white mb-1">La lista está vacía</p>
            {isOwn && <p className="text-sm">Buscá películas o series para agregarlas</p>}
          </div>
        ) : (
          <div className="space-y-2">
            {list.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-3">
                {item.posterPath ? (
                  <img
                    src={`${TMDB_IMAGE_BASE}${item.posterPath}`}
                    alt={item.title}
                    className="w-10 h-14 object-cover rounded flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-14 bg-white/10 rounded flex items-center justify-center flex-shrink-0 text-xl">
                    {item.contentType === 'tv' ? '📺' : '🎬'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{item.title}</p>
                  <p className="text-indigo-400 text-xs">{item.contentType === 'tv' ? 'Serie' : 'Película'}</p>
                </div>
                {isOwn && (
                  <button
                    onClick={() => handleRemoveItem(item.tmdbId)}
                    className="flex-shrink-0 text-red-400 hover:text-red-300 transition text-sm px-2 py-1"
                    title="Quitar de la lista"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
