import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../api/apiClient';
import { useReviews, ReviewItem } from '../hooks/useReviews';
import { useAuth } from '../hooks/useAuth';

type LikeHandler = (reviewId: string, value: 1 | -1 | null) => void;

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w92';

interface SearchResult {
  id: number;
  title: string;
  media_type: 'movie' | 'tv';
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white/60 dark:bg-white/5 border border-white/80 dark:border-white/10 backdrop-blur-sm rounded-2xl shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          disabled={readonly}
          className={`text-xl transition-transform ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-125'} ${
            star <= active ? 'text-amber-400' : 'text-zinc-300 dark:text-zinc-600'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ── ReviewCard ────────────────────────────────────────────────────────────────

function ReviewCard({ review, currentUserId, onAuthorClick, onLike }: {
  review: ReviewItem;
  currentUserId?: string;
  onAuthorClick?: (userId: string) => void;
  onLike?: LikeHandler;
}) {
  const isOwn = review.author.userId === currentUserId;

  const handleLike = (value: 1 | -1) => {
    onLike?.(review.id, review.userLike === value ? null : value);
  };

  return (
    <GlassCard className={`p-4 ${isOwn ? 'border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/60 dark:bg-indigo-500/5' : ''}`}>
      {/* Author row */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => onAuthorClick?.(review.author.userId)}
          className="flex-shrink-0 mt-0.5"
        >
          <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm font-bold text-white ring-2 ring-white dark:ring-zinc-900">
            {review.author.avatarUrl
              ? <img src={review.author.avatarUrl} alt={review.author.displayName ?? ''} className="w-full h-full object-cover" />
              : (review.author.displayName ?? 'U')[0].toUpperCase()
            }
          </div>
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <button
                onClick={() => onAuthorClick?.(review.author.userId)}
                className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition text-sm"
              >
                {review.author.displayName ?? 'Usuario'}
              </button>
              {isOwn && (
                <span className="ml-2 text-xs bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-md font-medium">
                  vos
                </span>
              )}
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                {new Date(review.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                {review.updatedAt !== review.createdAt && ' · editada'}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {review.liked !== null && (
                <span className="text-base">{review.liked ? '👍' : '👎'}</span>
              )}
              <StarRating value={review.rating} readonly />
            </div>
          </div>

          {/* Review text */}
          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed mt-2">{review.text}</p>

          {/* Like / dislike */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-100 dark:border-white/5">
            <button
              onClick={() => handleLike(1)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition font-medium ${
                review.userLike === 1
                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                  : 'text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-zinc-600 dark:hover:text-zinc-300'
              }`}
            >
              👍 {review.likeCount > 0 && <span>{review.likeCount}</span>}
            </button>
            <button
              onClick={() => handleLike(-1)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition font-medium ${
                review.userLike === -1
                  ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400'
                  : 'text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-zinc-600 dark:hover:text-zinc-300'
              }`}
            >
              👎 {review.dislikeCount > 0 && <span>{review.dislikeCount}</span>}
            </button>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp  = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } } };

export function ReviewsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user }  = useAuth();
  const { reviews, loading: loadingReviews, error: reviewsError, fetchReviews, upsertReview, submitting, submitError, likeReview } = useReviews();

  const [query,         setQuery]         = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching,     setSearching]     = useState(false);
  const [selected,      setSelected]      = useState<SelectedTitle | null>(null);
  const [showDropdown,  setShowDropdown]  = useState(false);
  const searchRef   = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showForm,   setShowForm]   = useState(false);
  const [formLiked,  setFormLiked]  = useState<boolean | null>(null);
  const [formRating, setFormRating] = useState(0);
  const [formText,   setFormText]   = useState('');

  const myReview = reviews.find((r) => r.author.userId === user?.id);

  useEffect(() => {
    const state = location.state as { from?: string; selected?: SelectedTitle } | null;
    if (state?.from === 'reviews-back' && state.selected) {
      setSelected(state.selected);
      fetchReviews(state.selected.tmdbId);
      window.history.replaceState({}, document.title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (query.length < 2) { setSearchResults([]); setShowDropdown(false); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await apiClient.get('/search/movies', { params: { q: query } });
        setSearchResults(res.data.data.slice(0, 8));
        setShowDropdown(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  }, [query]);

  const handleSelectTitle = (result: SearchResult) => {
    setSelected({ tmdbId: String(result.id), title: result.title, contentType: result.media_type, year: result.year, posterPath: result.poster_path });
    setQuery('');
    setShowDropdown(false);
    setShowForm(false);
    setFormRating(0);
    setFormText('');
    fetchReviews(String(result.id));
  };

  const handleOpenForm = () => {
    if (myReview) {
      setFormLiked(myReview.liked);
      setFormRating(myReview.rating);
      setFormText(myReview.text);
    } else {
      setFormLiked(null);
      setFormRating(0);
      setFormText('');
    }
    setShowForm(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || formLiked === null || formRating === 0 || !formText.trim()) return;
    const saved = await upsertReview({
      tmdbId: selected.tmdbId,
      title: selected.title,
      contentType: selected.contentType,
      rating: formRating,
      liked: formLiked,
      text: formText.trim(),
    });
    if (saved) setShowForm(false);
  };

  const handleAuthorClick = (userId: string) => {
    navigate(`/users/${userId}`, { state: { from: 'reviews', selected } });
  };

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white">Reseñas</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Buscá una película o serie y leé o escribí reseñas
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          ref={searchRef}
          className="relative"
        >
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
              placeholder="Buscar película o serie..."
              className="w-full pl-10 pr-10 py-3 border border-zinc-200 dark:border-white/10 rounded-xl bg-white/80 dark:bg-white/5 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition placeholder-zinc-400 dark:placeholder-zinc-600"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {searching
                ? <span className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin inline-block" />
                : query
                ? <button onClick={() => { setQuery(''); setShowDropdown(false); }} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition text-lg leading-none">✕</button>
                : null
              }
            </div>
          </div>

          <AnimatePresence>
            {showDropdown && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute z-20 w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden"
              >
                {searchResults.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelectTitle(r)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left border-b border-zinc-100 dark:border-white/5 last:border-b-0 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition"
                  >
                    {r.poster_path ? (
                      <img src={`${TMDB_IMAGE_BASE}${r.poster_path}`} alt={r.title} className="w-8 h-11 object-cover rounded-lg flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-11 bg-zinc-100 dark:bg-zinc-700 rounded-lg flex-shrink-0 flex items-center justify-center text-sm">
                        {r.media_type === 'tv' ? '📺' : '🎬'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-900 dark:text-white text-sm truncate">{r.title}</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">{r.year} · {r.media_type === 'tv' ? 'Serie' : 'Película'}</p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Selected title + reviews */}
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected.tmdbId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
              className="space-y-4"
            >
              {/* Title card */}
              <GlassCard className="p-4 flex items-center gap-4">
                {selected.posterPath ? (
                  <img src={`${TMDB_IMAGE_BASE}${selected.posterPath}`} alt={selected.title} className="w-14 h-20 object-cover rounded-xl flex-shrink-0 shadow-md" />
                ) : (
                  <div className="w-14 h-20 bg-zinc-100 dark:bg-white/10 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl">
                    {selected.contentType === 'tv' ? '📺' : '🎬'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="font-extrabold text-zinc-900 dark:text-white text-lg leading-tight truncate">{selected.title}</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {selected.year} · {selected.contentType === 'tv' ? 'Serie' : 'Película'}
                  </p>
                  {reviews.length > 0 && (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                      {reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => { setSelected(null); setShowForm(false); }}
                  className="flex-shrink-0 text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition px-2 py-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10"
                >
                  ✕ Cambiar
                </button>
              </GlassCard>

              {/* Write review button / form */}
              <AnimatePresence mode="wait">
                {showForm ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <GlassCard className="p-5">
                      <h3 className="font-bold text-zinc-900 dark:text-white text-sm mb-4">
                        {myReview ? '✏️ Editar mi reseña' : '✍️ Escribir reseña'}
                      </h3>

                      <form onSubmit={handleSubmitReview} className="space-y-4">
                        {/* Liked toggle */}
                        <div>
                          <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">¿Te gustó?</label>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => setFormLiked(true)}
                              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 font-semibold text-sm transition ${
                                formLiked === true
                                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                  : 'border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-zinc-400 hover:border-emerald-300 dark:hover:border-emerald-500/40 hover:bg-emerald-50 dark:hover:bg-emerald-500/5'
                              }`}
                            >
                              <span>👍</span> Me gustó
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormLiked(false)}
                              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 font-semibold text-sm transition ${
                                formLiked === false
                                  ? 'border-rose-500 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'
                                  : 'border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-zinc-400 hover:border-rose-300 dark:hover:border-rose-500/40 hover:bg-rose-50 dark:hover:bg-rose-500/5'
                              }`}
                            >
                              <span>👎</span> No me gustó
                            </button>
                          </div>
                          {formLiked === null && (
                            <p className="text-xs text-amber-500 dark:text-amber-400 mt-1">⚠️ Indicá si te gustó o no</p>
                          )}
                        </div>

                        {/* Star rating */}
                        <div>
                          <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Puntaje</label>
                          <StarRating value={formRating} onChange={setFormRating} />
                          {formRating === 0 && (
                            <p className="text-xs text-amber-500 dark:text-amber-400 mt-1">⚠️ Seleccioná un puntaje</p>
                          )}
                        </div>

                        {/* Text */}
                        <div>
                          <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Tu reseña</label>
                          <textarea
                            value={formText}
                            onChange={(e) => setFormText(e.target.value)}
                            rows={4}
                            maxLength={2000}
                            placeholder="¿Qué te pareció? Compartí tu opinión..."
                            className="w-full px-3 py-2.5 border border-zinc-200 dark:border-white/10 rounded-xl bg-white/80 dark:bg-white/5 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition placeholder-zinc-400 dark:placeholder-zinc-600 resize-none"
                            required
                          />
                          <p className="text-xs text-zinc-400 dark:text-zinc-500 text-right mt-1">{formText.length}/2000</p>
                        </div>

                        <AnimatePresence>
                          {submitError && (
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                              className="text-red-600 dark:text-red-400 text-sm bg-red-500/10 px-3 py-2 rounded-xl">
                              {submitError}
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
                            disabled={submitting || formLiked === null || formRating === 0 || !formText.trim()}
                            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl disabled:opacity-40 transition"
                          >
                            {submitting ? 'Guardando...' : myReview ? 'Actualizar reseña' : 'Publicar reseña'}
                          </button>
                        </div>
                      </form>
                    </GlassCard>
                  </motion.div>
                ) : (
                  <motion.div key="write-btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleOpenForm}
                      className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition shadow-sm shadow-indigo-500/30"
                    >
                      {myReview ? '✏️ Editar mi reseña' : '✍️ Escribir una reseña'}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Reviews list */}
              {loadingReviews ? (
                <div className="flex justify-center py-10">
                  <span className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : reviewsError ? (
                <GlassCard className="p-4 text-center">
                  <p className="text-red-500 dark:text-red-400 text-sm">{reviewsError}</p>
                </GlassCard>
              ) : reviews.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <p className="text-4xl mb-3">🎬</p>
                  <p className="font-bold text-zinc-900 dark:text-white mb-1">
                    Sé el primero en reseñar {selected.contentType === 'tv' ? 'esta serie' : 'esta película'}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Tu opinión puede ayudar a otros usuarios</p>
                </motion.div>
              ) : (
                <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
                  {reviews.map((r) => (
                    <motion.div key={r.id} variants={fadeUp}>
                      <ReviewCard
                        review={r}
                        currentUserId={user?.id}
                        onAuthorClick={handleAuthorClick}
                        onLike={likeReview}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20"
            >
              <p className="text-5xl mb-4">🔍</p>
              <p className="font-bold text-zinc-900 dark:text-white mb-1">Buscá una película o serie</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Para leer o escribir reseñas de la comunidad
              </p>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
