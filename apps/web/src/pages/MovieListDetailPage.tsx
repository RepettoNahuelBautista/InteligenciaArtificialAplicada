import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white/60 dark:bg-white/5 border border-white/80 dark:border-white/10 backdrop-blur-sm rounded-2xl shadow-sm ${className}`}>
      {children}
    </div>
  );
}

const fadeUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };

export function MovieListDetailPage() {
  const navigate  = useNavigate();
  const { listId } = useParams<{ listId: string }>();
  const { user }  = useAuth();

  const [list,    setList]    = useState<ListDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const [editing,    setEditing]    = useState(false);
  const [editName,   setEditName]   = useState('');
  const [editDesc,   setEditDesc]   = useState('');
  const [editPublic, setEditPublic] = useState(true);
  const [saving,     setSaving]     = useState(false);

  const [showSearch,    setShowSearch]    = useState(false);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching,     setSearching]     = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef   = useRef<HTMLDivElement>(null);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting,      setDeleting]      = useState(false);

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

  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
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
        tmdbId:      String(result.id),
        title:       result.title,
        posterPath:  result.poster_path ?? null,
        contentType: result.media_type,
      });
      setList((prev) => prev ? { ...prev, items: [res.data.data, ...prev.items] } : prev);
      setSearchQuery('');
      setSearchResults([]);
      setShowSearch(false);
    } catch { /* item already in list */ }
  };

  const handleRemoveItem = async (tmdbId: string) => {
    if (!list) return;
    setList((prev) => prev ? { ...prev, items: prev.items.filter((i) => i.tmdbId !== tmdbId) } : prev);
    try {
      await apiClient.delete(`/lists/${list.id}/items/${tmdbId}`);
    } catch { /* ignore */ }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!list) return;
    setSaving(true);
    try {
      const res = await apiClient.put(`/lists/${list.id}`, {
        name:        editName.trim(),
        description: editDesc.trim() || null,
        isPublic:    editPublic,
      });
      setList((prev) => prev ? { ...prev, name: res.data.data.name, description: res.data.data.description, isPublic: res.data.data.isPublic } : prev);
      setEditing(false);
    } catch { /* ignore */ } finally {
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

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────

  if (error || !list) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <GlassCard className="p-8 max-w-sm w-full text-center">
          <p className="text-4xl mb-4">📋</p>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Lista no encontrada</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">{error}</p>
          <button onClick={() => navigate(-1)} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition">
            Volver
          </button>
        </GlassCard>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Back */}
        <motion.button
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </motion.button>

        {/* ── Header card ─────────────────────────────────────────────────── */}
        <motion.div variants={fadeUp} initial="hidden" animate="show">
          <GlassCard className="p-5">
            <AnimatePresence mode="wait">
              {editing ? (
                <motion.form
                  key="edit"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSaveEdit}
                  className="space-y-4"
                >
                  <h3 className="font-bold text-zinc-900 dark:text-white text-sm">Editar lista</h3>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Nombre *</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={100}
                      className="w-full px-3 py-2 border border-zinc-200 dark:border-white/10 rounded-xl bg-white/80 dark:bg-white/5 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Descripción</label>
                    <input
                      type="text"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      maxLength={300}
                      className="w-full px-3 py-2 border border-zinc-200 dark:border-white/10 rounded-xl bg-white/80 dark:bg-white/5 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditPublic((v) => !v)}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border transition text-sm font-medium ${
                      editPublic
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/25 text-emerald-700 dark:text-emerald-400'
                        : 'bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    <span>{editPublic ? '🌐' : '🔒'}</span>
                    <span>{editPublic ? 'Lista pública' : 'Lista privada'}</span>
                  </button>
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setEditing(false)}
                      className="px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition">
                      Cancelar
                    </button>
                    <button type="submit" disabled={saving || !editName.trim()}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl disabled:opacity-40 transition">
                      {saving ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </div>
                </motion.form>
              ) : (
                <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-2xl flex-shrink-0">
                      📋
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h1 className="text-lg font-extrabold text-zinc-900 dark:text-white truncate">{list.name}</h1>
                        <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${
                          list.isPublic
                            ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/25'
                            : 'bg-zinc-100 dark:bg-zinc-700/50 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-600/30'
                        }`}>
                          {list.isPublic ? '🌐 Pública' : '🔒 Privada'}
                        </span>
                      </div>
                      {list.description && (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">{list.description}</p>
                      )}
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                        {list.items.length} {list.items.length === 1 ? 'título' : 'títulos'} · por {list.owner.displayName}
                      </p>
                    </div>
                    {isOwn && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={openEdit}
                          className="px-3 py-1.5 text-xs font-medium bg-white/80 dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 rounded-xl transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setConfirmDelete(true)}
                          className="px-3 py-1.5 text-xs font-medium bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/25 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-500/20 transition"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </motion.div>

        {/* ── Delete confirm ──────────────────────────────────────────────── */}
        <AnimatePresence>
          {confirmDelete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.18 }}
            >
              <GlassCard className="p-5 border-rose-200 dark:border-rose-500/25">
                <h3 className="font-bold text-zinc-900 dark:text-white mb-1 text-sm">¿Eliminar esta lista?</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">
                  Se eliminarán todos los títulos. Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 py-2 text-sm text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/10 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDeleteList}
                    disabled={deleting}
                    className="flex-1 py-2 text-sm bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl disabled:opacity-40 transition"
                  >
                    {deleting ? 'Eliminando...' : 'Eliminar lista'}
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Add item search ─────────────────────────────────────────────── */}
        {isOwn && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            ref={searchRef}
            className="relative"
          >
            <AnimatePresence mode="wait">
              {!showSearch ? (
                <motion.button
                  key="add-btn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setShowSearch(true)}
                  className="w-full py-3 rounded-xl bg-white/60 dark:bg-white/5 border border-dashed border-zinc-300 dark:border-white/15 text-zinc-500 dark:text-zinc-400 hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 transition text-sm font-medium"
                >
                  + Agregar película o serie
                </motion.button>
              ) : (
                <motion.div
                  key="search-box"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative"
                >
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar para agregar..."
                    autoFocus
                    className="w-full px-4 py-3 border border-zinc-200 dark:border-white/10 rounded-xl bg-white/80 dark:bg-white/5 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition placeholder-zinc-400 dark:placeholder-zinc-600 pr-10"
                  />
                  <div className="absolute right-3 top-3">
                    {searching ? (
                      <span className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin inline-block" />
                    ) : (
                      <button onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); }}
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition text-lg leading-none">✕</button>
                    )}
                  </div>

                  <AnimatePresence>
                    {searchResults.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="absolute z-20 w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden"
                      >
                        {searchResults.map((r) => {
                          const alreadyAdded = list.items.some((i) => i.tmdbId === String(r.id));
                          return (
                            <button
                              key={r.id}
                              onClick={() => !alreadyAdded && handleAddItem(r)}
                              disabled={alreadyAdded}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-zinc-100 dark:border-white/5 last:border-b-0 transition ${
                                alreadyAdded
                                  ? 'opacity-40 cursor-not-allowed'
                                  : 'hover:bg-indigo-50 dark:hover:bg-indigo-500/10'
                              }`}
                            >
                              {r.poster_path ? (
                                <img src={`${TMDB_IMAGE_BASE}${r.poster_path}`} alt={r.title} className="w-8 h-11 object-cover rounded-lg flex-shrink-0" />
                              ) : (
                                <div className="w-8 h-11 bg-zinc-100 dark:bg-zinc-700 rounded-lg flex-shrink-0 flex items-center justify-center text-sm">
                                  {r.media_type === 'tv' ? '📺' : '🎬'}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-zinc-900 dark:text-white text-sm truncate">{r.title}</p>
                                <p className="text-xs text-zinc-400 dark:text-zinc-500">{r.year} · {r.media_type === 'tv' ? 'Serie' : 'Película'}</p>
                              </div>
                              {alreadyAdded && <span className="text-xs text-zinc-400 flex-shrink-0">Ya agregada</span>}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── Items ───────────────────────────────────────────────────────── */}
        {list.items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-center py-16"
          >
            <p className="text-5xl mb-4">🎬</p>
            <p className="font-bold text-zinc-900 dark:text-white mb-1">La lista está vacía</p>
            {isOwn && <p className="text-sm text-zinc-500 dark:text-zinc-400">Buscá películas o series para agregarlas</p>}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="space-y-2"
          >
            <AnimatePresence>
              {list.items.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.03 }}
                >
                  <GlassCard className="p-3 flex items-center gap-3">
                    {item.posterPath ? (
                      <img
                        src={`${TMDB_IMAGE_BASE}${item.posterPath}`}
                        alt={item.title}
                        className="w-10 h-14 object-cover rounded-lg flex-shrink-0 shadow-sm"
                      />
                    ) : (
                      <div className="w-10 h-14 bg-zinc-100 dark:bg-white/10 rounded-lg flex-shrink-0 flex items-center justify-center text-lg">
                        {item.contentType === 'tv' ? '📺' : '🎬'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-zinc-900 dark:text-white text-sm truncate">{item.title}</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">{item.contentType === 'tv' ? 'Serie' : 'Película'}</p>
                    </div>
                    {isOwn && (
                      <button
                        onClick={() => handleRemoveItem(item.tmdbId)}
                        className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition text-sm"
                        title="Quitar de la lista"
                      >
                        ✕
                      </button>
                    )}
                  </GlassCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

      </div>
    </div>
  );
}
