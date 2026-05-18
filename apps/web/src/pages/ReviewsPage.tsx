import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import { useReviews, ReviewItem } from '../hooks/useReviews';
import { useAuth } from '../hooks/useAuth';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w92';

interface SearchResult {
  id: number;
  title: string;
  type: 'movie' | 'tv';
  year: number;
  poster_path?: string | null;
}

interface SelectedTitle {
  tmdbId: string;
  title: string;
  contentType: 'movie' | 'tv';
  year: number;
  posterPath?: string | null;
}

function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`text-2xl transition ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
          disabled={readonly}
        >
          {star <= (hovered || value) ? '★' : '☆'}
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review, currentUserId }: { review: ReviewItem; currentUserId?: string }) {
  const navigate = useNavigate();
  const isOwn = review.author.userId === currentUserId;

  return (
    <div className={`rounded-xl border p-5 ${isOwn ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200'}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <button
            onClick={() => navigate(`/users/${review.author.userId}`)}
            className="font-semibold text-indigo-700 hover:text-indigo-900 hover:underline transition text-sm"
          >
            {review.author.displayName ?? 'Usuario'}
            {isOwn && <span className="ml-2 text-xs text-indigo-400">(vos)</span>}
          </button>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(review.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
            {' · '}
            {new Date(review.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
            {review.updatedAt !== review.createdAt && ' · editada'}
          </p>
        </div>
        <div className="flex-shrink-0">
          <StarRating value={review.rating} readonly />
        </div>
      </div>
      <p className="text-gray-700 text-sm leading-relaxed">{review.text}</p>
    </div>
  );
}

export function ReviewsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { reviews, loading: loadingReviews, error: reviewsError, fetchReviews, upsertReview, submitting, submitError } = useReviews();

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SelectedTitle | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [formRating, setFormRating] = useState(0);
  const [formText, setFormText] = useState('');

  const myReview = reviews.find((r) => r.author.userId === user?.id);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await apiClient.get('/search/movies', { params: { q: query } });
        setSearchResults(response.data.data.slice(0, 8));
        setShowDropdown(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  }, [query]);

  const handleSelectTitle = (result: SearchResult) => {
    const title: SelectedTitle = {
      tmdbId: String(result.id),
      title: result.title,
      contentType: result.type,
      year: result.year,
      posterPath: result.poster_path,
    };
    setSelected(title);
    setQuery('');
    setShowDropdown(false);
    setShowForm(false);
    setFormRating(0);
    setFormText('');
    fetchReviews(String(result.id));
  };

  const handleOpenForm = () => {
    if (myReview) {
      setFormRating(myReview.rating);
      setFormText(myReview.text);
    } else {
      setFormRating(0);
      setFormText('');
    }
    setShowForm(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || formRating === 0 || !formText.trim()) return;
    const saved = await upsertReview({
      tmdbId: selected.tmdbId,
      title: selected.title,
      contentType: selected.contentType,
      rating: formRating,
      text: formText.trim(),
    });
    if (saved) setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button onClick={() => navigate('/home')} className="text-white hover:text-indigo-200 transition mb-4 flex items-center gap-2 text-sm">
            ← Volver al inicio
          </button>
          <h1 className="text-3xl font-bold text-white">Reseñas</h1>
          <p className="text-indigo-300 mt-1">Buscá una película o serie y leé o escribí reseñas</p>
        </div>

        {/* Search */}
        <div ref={searchRef} className="relative mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
            placeholder="Buscar película o serie..."
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          {searching && (
            <span className="absolute right-4 top-3.5 animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          )}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
              {searchResults.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleSelectTitle(r)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 transition text-left"
                >
                  {r.poster_path ? (
                    <img src={`${TMDB_IMAGE_BASE}${r.poster_path}`} alt={r.title} className="w-8 h-12 object-cover rounded flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-12 bg-gray-200 rounded flex items-center justify-center flex-shrink-0 text-lg">
                      {r.type === 'tv' ? '📺' : '🎬'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{r.title}</p>
                    <p className="text-xs text-gray-500">{r.year} · {r.type === 'tv' ? 'Serie' : 'Película'}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected title */}
        {selected && (
          <div className="mb-6">
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-4 flex items-center gap-4 mb-4">
              {selected.posterPath ? (
                <img src={`${TMDB_IMAGE_BASE}${selected.posterPath}`} alt={selected.title} className="w-12 h-16 object-cover rounded-lg flex-shrink-0" />
              ) : (
                <div className="w-12 h-16 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 text-2xl">
                  {selected.contentType === 'tv' ? '📺' : '🎬'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-white font-bold text-lg truncate">{selected.title}</h2>
                <p className="text-indigo-300 text-sm">{selected.year} · {selected.contentType === 'tv' ? 'Serie' : 'Película'}</p>
              </div>
              <button
                onClick={() => { setSelected(null); setShowForm(false); }}
                className="text-indigo-400 hover:text-white transition text-sm flex-shrink-0"
              >
                ✕ Cambiar
              </button>
            </div>

            {/* Review form */}
            {showForm ? (
              <form onSubmit={handleSubmitReview} className="bg-white rounded-xl p-5 mb-4 shadow-lg">
                <h3 className="font-bold text-gray-900 mb-4">{myReview ? 'Editar tu reseña' : 'Nueva reseña'}</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Puntaje</label>
                  <StarRating value={formRating} onChange={setFormRating} />
                  {formRating === 0 && <p className="text-xs text-red-500 mt-1">Seleccioná un puntaje</p>}
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tu reseña</label>
                  <textarea
                    value={formText}
                    onChange={(e) => setFormText(e.target.value)}
                    rows={4}
                    maxLength={2000}
                    placeholder="¿Qué te pareció? Compartí tu opinión..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
                    required
                  />
                  <p className="text-xs text-gray-400 text-right mt-1">{formText.length}/2000</p>
                </div>
                {submitError && <p className="text-red-600 text-sm mb-3">{submitError}</p>}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition">
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || formRating === 0 || !formText.trim()}
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    {submitting ? 'Guardando...' : myReview ? 'Actualizar reseña' : 'Publicar reseña'}
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={handleOpenForm}
                className="w-full mb-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition"
              >
                {myReview ? '✏️ Editar mi reseña' : '+ Dejar una reseña'}
              </button>
            )}

            {/* Reviews list */}
            {loadingReviews ? (
              <div className="flex justify-center py-8">
                <span className="animate-spin rounded-full h-7 w-7 border-b-2 border-white" />
              </div>
            ) : reviewsError ? (
              <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-4 text-red-200 text-sm">{reviewsError}</div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">🎬</p>
                <p className="text-white font-semibold mb-1">
                  Sé el primero en reseñar {selected.contentType === 'tv' ? 'esta serie' : 'esta película'}
                </p>
                <p className="text-indigo-300 text-sm">Tu opinión puede ayudar a otros usuarios</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-indigo-300 text-sm">{reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'}</p>
                {reviews.map((r) => (
                  <ReviewCard key={r.id} review={r} currentUserId={user?.id} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty state before search */}
        {!selected && (
          <div className="text-center py-16 text-indigo-300">
            <p className="text-5xl mb-4">🔍</p>
            <p className="font-medium">Buscá una película o serie para ver sus reseñas</p>
          </div>
        )}
      </div>
    </div>
  );
}
