import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../api/apiClient';

interface ListSummary {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  itemCount: number;
  createdAt: string;
}

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white/60 dark:bg-white/5 border border-white/80 dark:border-white/10 backdrop-blur-sm rounded-2xl shadow-sm ${className}`}>
      {children}
    </div>
  );
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp  = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };

export function MovieListsPage() {
  const navigate = useNavigate();
  const [lists,       setLists]       = useState<ListSummary[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [showForm,    setShowForm]    = useState(false);
  const [formName,    setFormName]    = useState('');
  const [formDesc,    setFormDesc]    = useState('');
  const [formPublic,  setFormPublic]  = useState(true);
  const [creating,    setCreating]    = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get('/lists');
        setLists(res.data.data);
      } catch {
        setError('No se pudieron cargar tus listas');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      const res = await apiClient.post('/lists', {
        name: formName.trim(),
        description: formDesc.trim() || null,
        isPublic: formPublic,
      });
      setLists((prev) => [res.data.data, ...prev]);
      setShowForm(false);
      setFormName('');
      setFormDesc('');
      setFormPublic(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setCreateError(e.response?.data?.error?.message || 'Error al crear la lista');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white">Mis Listas</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Organizá tus películas y series favoritas</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition shadow-sm shadow-indigo-500/30"
          >
            <span className="text-lg leading-none">{showForm ? '✕' : '+'}</span>
            {showForm ? 'Cancelar' : 'Nueva lista'}
          </motion.button>
        </motion.div>

        {/* Create form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden mb-5"
            >
              <GlassCard className="p-5">
                <h3 className="font-bold text-zinc-900 dark:text-white mb-4 text-sm">Nueva lista</h3>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Nombre *</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      maxLength={100}
                      placeholder="Mis favoritas de terror..."
                      className="w-full px-3 py-2 border border-zinc-200 dark:border-white/10 rounded-xl bg-white/80 dark:bg-white/5 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition placeholder-zinc-400 dark:placeholder-zinc-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Descripción</label>
                    <input
                      type="text"
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                      maxLength={300}
                      placeholder="Una breve descripción..."
                      className="w-full px-3 py-2 border border-zinc-200 dark:border-white/10 rounded-xl bg-white/80 dark:bg-white/5 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition placeholder-zinc-400 dark:placeholder-zinc-600"
                    />
                  </div>

                  {/* Toggle público/privado */}
                  <button
                    type="button"
                    onClick={() => setFormPublic((v) => !v)}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border transition text-sm font-medium ${
                      formPublic
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/25 text-emerald-700 dark:text-emerald-400'
                        : 'bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    <span>{formPublic ? '🌐' : '🔒'}</span>
                    <span>{formPublic ? 'Lista pública — visible en tu perfil' : 'Lista privada — solo vos la ves'}</span>
                  </button>

                  <AnimatePresence>
                    {createError && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="text-red-600 dark:text-red-400 text-sm bg-red-500/10 px-3 py-2 rounded-xl">
                        {createError}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setShowForm(false)}
                      className="px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition">
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={creating || !formName.trim()}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl disabled:opacity-40 transition"
                    >
                      {creating ? 'Creando...' : 'Crear lista'}
                    </button>
                  </div>
                </form>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <span className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <GlassCard className="p-6 text-center">
            <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>
          </GlassCard>
        ) : lists.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <p className="text-5xl mb-4">📋</p>
            <p className="font-bold text-zinc-900 dark:text-white mb-1">Aún no tenés listas</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Creá tu primera lista para organizar tus películas y series favoritas
            </p>
          </motion.div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
            {lists.map((list) => (
              <motion.div key={list.id} variants={fadeUp}>
                <button
                  onClick={() => navigate(`/lists/${list.id}`)}
                  className="w-full text-left group"
                >
                  <GlassCard className="p-4 hover:bg-white/80 dark:hover:bg-white/10 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all duration-200">
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-lg flex-shrink-0">
                        📋
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-zinc-900 dark:text-white text-sm truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                            {list.name}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${
                            list.isPublic
                              ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/25'
                              : 'bg-zinc-100 dark:bg-zinc-700/50 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-600/30'
                          }`}>
                            {list.isPublic ? '🌐 Pública' : '🔒 Privada'}
                          </span>
                        </div>
                        {list.description && (
                          <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">{list.description}</p>
                        )}
                      </div>

                      {/* Count + arrow */}
                      <div className="flex-shrink-0 flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-bold text-zinc-900 dark:text-white">{list.itemCount}</p>
                          <p className="text-xs text-zinc-400 dark:text-zinc-500">{list.itemCount === 1 ? 'título' : 'títulos'}</p>
                        </div>
                        <svg className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-indigo-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </GlassCard>
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}

      </div>
    </div>
  );
}
