import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHistory, HistoryItem } from '../hooks/useHistory';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w200';

const MOOD_LABELS: Record<string, string> = {
  mystery: '🕵️ Misterio',
  relax: '😌 Relajar',
  emotional: '😢 Emocional',
  laugh: '😂 Reír',
  action: '💥 Acción',
  romantic: '❤️ Romántico',
  horror: '😱 Terror',
  inspiring: '🌟 Inspirar',
};

function HistoryCard({ item }: { item: HistoryItem }) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex gap-4 p-4 dark:bg-white/10 dark:border-white/20">
      {item.posterPath ? (
        <img
          src={`${TMDB_IMAGE_BASE}${item.posterPath}`}
          alt={item.title}
          className="w-16 h-24 object-cover rounded-lg flex-shrink-0"
        />
      ) : (
        <div className="w-16 h-24 bg-zinc-100 dark:bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">{item.contentType === 'tv' ? '📺' : '🎬'}</span>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-zinc-900 dark:text-white font-semibold leading-tight truncate">{item.title}</h3>
          <span className="text-xs bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-indigo-200 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
            {item.contentType === 'tv' ? '📺 Serie' : '🎬 Película'}
          </span>
        </div>
        <p className="text-zinc-500 dark:text-indigo-300 text-xs mb-2">
          {item.year} · {item.genre}
          {item.contextMood && ` · ${MOOD_LABELS[item.contextMood] ?? item.contextMood}`}
        </p>
        <p className="text-zinc-700 dark:text-indigo-100 text-sm leading-relaxed line-clamp-2">{item.explanation}</p>
        <p className="text-zinc-400 text-xs mt-2">
          {new Date(item.createdAt).toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>
    </div>
  );
}

type TypeFilter = 'all' | 'movie' | 'tv';

export function HistoryPage() {
  const navigate = useNavigate();
  const { allItems, loading, error } = useHistory();

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [moodFilter, setMoodFilter] = useState<string>('all');

  const moodsInHistory = useMemo(() => {
    const found = new Set<string>();
    allItems.forEach((item) => { if (item.contextMood) found.add(item.contextMood); });
    return Array.from(found);
  }, [allItems]);

  const filtered = useMemo(() => {
    return allItems.filter((item) => {
      if (typeFilter !== 'all' && item.contentType !== typeFilter) return false;
      if (moodFilter !== 'all' && item.contextMood !== moodFilter) return false;
      return true;
    });
  }, [allItems, typeFilter, moodFilter]);

  const hasFilters = typeFilter !== 'all' || moodFilter !== 'all';

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-200 via-amber-50 to-stone-200 dark:from-indigo-900 dark:via-purple-900 dark:to-indigo-900 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/home')}
            className="text-zinc-600 dark:text-white hover:text-zinc-900 dark:hover:text-indigo-200 transition mb-4 flex items-center gap-2 text-sm"
          >
            ← Volver al inicio
          </button>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Historial de Recomendaciones</h1>
          {!loading && (
            <p className="text-zinc-500 dark:text-indigo-300 mt-1">
              {hasFilters
                ? `${filtered.length} de ${allItems.length} recomendaciones`
                : `${allItems.length} ${allItems.length === 1 ? 'recomendación' : 'recomendaciones'} en total`}
            </p>
          )}
        </div>

        {/* Filtros */}
        {!loading && allItems.length > 0 && (
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4 mb-6 space-y-3 dark:bg-white/10 dark:border-white/20">
            {/* Tipo */}
            <div>
              <p className="text-xs font-semibold text-zinc-500 dark:text-indigo-300 mb-2">Tipo</p>
              <div className="flex gap-2">
                {(['all', 'movie', 'tv'] as TypeFilter[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      typeFilter === t
                        ? 'bg-indigo-500 text-white'
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-white/10 dark:text-indigo-200 dark:hover:bg-white/20'
                    }`}
                  >
                    {t === 'all' ? 'Todos' : t === 'movie' ? '🎬 Películas' : '📺 Series'}
                  </button>
                ))}
              </div>
            </div>

            {/* Estado de ánimo */}
            {moodsInHistory.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-zinc-500 dark:text-indigo-300 mb-2">Estado de ánimo</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setMoodFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      moodFilter === 'all'
                        ? 'bg-indigo-500 text-white'
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-white/10 dark:text-indigo-200 dark:hover:bg-white/20'
                    }`}
                  >
                    Todos
                  </button>
                  {moodsInHistory.map((mood) => (
                    <button
                      key={mood}
                      onClick={() => setMoodFilter(mood)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        moodFilter === mood
                          ? 'bg-indigo-500 text-white'
                          : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-white/10 dark:text-indigo-200 dark:hover:bg-white/20'
                      }`}
                    >
                      {MOOD_LABELS[mood] ?? mood}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Clear */}
            {hasFilters && (
              <button
                onClick={() => { setTypeFilter('all'); setMoodFilter('all'); }}
                className="text-xs text-zinc-500 hover:text-zinc-800 dark:text-indigo-400 dark:hover:text-indigo-200 transition"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-white" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-4 text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Empty state global */}
        {!loading && !error && allItems.length === 0 && (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">📭</p>
            <p className="text-indigo-900 dark:text-white font-semibold text-lg mb-2">Todavía no tenés recomendaciones</p>
            <p className="text-zinc-500 dark:text-indigo-300 mb-6">Pedí tu primera recomendación y aparecerá aquí</p>
            <button
              onClick={() => navigate('/recommendation')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition"
            >
              Obtener Recomendación ✨
            </button>
          </div>
        )}

        {/* Empty state filtrado */}
        {!loading && !error && allItems.length > 0 && filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-3xl mb-3">🔍</p>
            <p className="text-zinc-900 dark:text-white font-semibold mb-1">Sin resultados para estos filtros</p>
            <button
              onClick={() => { setTypeFilter('all'); setMoodFilter('all'); }}
              className="text-zinc-500 hover:text-zinc-900 dark:text-indigo-300 dark:hover:text-white text-sm transition mt-2"
            >
              Limpiar filtros
            </button>
          </div>
        )}

        {/* List */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-4">
            {filtered.map((item) => (
              <HistoryCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
