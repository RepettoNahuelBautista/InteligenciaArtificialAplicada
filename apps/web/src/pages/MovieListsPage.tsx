import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/apiClient';

interface ListSummary {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  itemCount: number;
  createdAt: string;
}

export function MovieListsPage() {
  const navigate = useNavigate();
  const [lists, setLists] = useState<ListSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPublic, setFormPublic] = useState(true);
  const [creating, setCreating] = useState(false);
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
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-indigo-50 to-purple-100 dark:from-indigo-900 dark:via-purple-900 dark:to-indigo-900 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button onClick={() => navigate('/home')} className="text-indigo-700 dark:text-white hover:text-indigo-500 dark:hover:text-indigo-200 transition mb-4 flex items-center gap-2 text-sm">
            ← Volver al inicio
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-indigo-900 dark:text-white">Mis Listas</h1>
              <p className="text-indigo-500 dark:text-indigo-300 mt-1">Organizá tus películas y series en listas personalizadas</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-2 rounded-xl font-medium text-sm transition"
            >
              + Nueva lista
            </button>
          </div>
        </div>

        {/* Create form */}
        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-xl p-5 mb-6 shadow-lg">
            <h3 className="font-bold text-gray-900 mb-4">Nueva lista</h3>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                maxLength={100}
                placeholder="Mis favoritas de terror..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                required
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
              <input
                type="text"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                maxLength={300}
                placeholder="Una breve descripción..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="mb-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={formPublic}
                onChange={(e) => setFormPublic(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <label htmlFor="isPublic" className="text-sm text-gray-700">Lista pública (visible en tu perfil)</label>
            </div>
            {createError && <p className="text-red-600 text-sm mb-3">{createError}</p>}
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={creating || !formName.trim()}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 transition"
              >
                {creating ? 'Creando...' : 'Crear lista'}
              </button>
            </div>
          </form>
        )}

        {/* Lists */}
        {loading ? (
          <div className="flex justify-center py-16">
            <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-white" />
          </div>
        ) : error ? (
          <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-4 text-red-200 text-sm">{error}</div>
        ) : lists.length === 0 ? (
          <div className="text-center py-16 text-indigo-500 dark:text-indigo-300">
            <p className="text-5xl mb-4">📋</p>
            <p className="font-medium text-indigo-900 dark:text-white mb-1">Aún no tenés listas</p>
            <p className="text-sm">Creá tu primera lista para organizar tus películas y series favoritas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lists.map((list) => (
              <button
                key={list.id}
                onClick={() => navigate(`/lists/${list.id}`)}
                className="w-full text-left bg-white/70 backdrop-blur-md rounded-xl border border-indigo-200 p-5 hover:bg-white/90 dark:bg-white/10 dark:border-white/20 dark:hover:bg-white/20 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-indigo-900 dark:text-white font-semibold truncate">{list.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${list.isPublic ? 'bg-green-100 text-green-700 dark:bg-green-500/30 dark:text-green-200' : 'bg-gray-100 text-gray-600 dark:bg-gray-500/30 dark:text-gray-300'}`}>
                        {list.isPublic ? 'Pública' : 'Privada'}
                      </span>
                    </div>
                    {list.description && (
                      <p className="text-indigo-500 dark:text-indigo-300 text-sm truncate">{list.description}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-indigo-900 dark:text-white font-bold">{list.itemCount}</p>
                    <p className="text-indigo-400 text-xs">{list.itemCount === 1 ? 'título' : 'títulos'}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
