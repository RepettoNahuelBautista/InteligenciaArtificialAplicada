import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../api/apiClient';
import { useAuth } from '../hooks/useAuth';
import { getGenreName } from '../schemas/genres';

interface PublicProfile {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  memberSince: string;
  stats: {
    moviesWatched: number;
    moviesLiked: number;
    moviesDisliked: number;
    genreCount: number;
    directorCount: number;
    actorCount: number;
  };
  favoriteGenres: number[];
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
}

interface ReviewItem {
  id: string;
  tmdbId: string;
  title: string;
  contentType: string;
  rating: number;
  liked: boolean | null;
  text: string;
  createdAt: string;
  likeCount: number;
  dislikeCount: number;
  userLike: 1 | -1 | null;
}

interface ListSummary {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  itemCount: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white/60 dark:bg-white/5 border border-white/80 dark:border-white/10 backdrop-blur-sm rounded-2xl shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={`text-sm ${star <= value ? 'text-amber-400' : 'text-zinc-300 dark:text-zinc-600'}`}>★</span>
      ))}
    </div>
  );
}

const STATS_CFG = [
  { key: 'moviesWatched'  as const, icon: '🎬', label: 'Vistas',        num: 'text-sky-600 dark:text-sky-400',     bg: 'bg-sky-100 dark:bg-sky-500/15',     border: 'border-sky-200 dark:border-sky-500/25'     },
  { key: 'moviesLiked'    as const, icon: '👍', label: 'Le gustó',      num: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-500/15', border: 'border-emerald-200 dark:border-emerald-500/25' },
  { key: 'moviesDisliked' as const, icon: '👎', label: 'No le gustó',   num: 'text-rose-600 dark:text-rose-400',   bg: 'bg-rose-100 dark:bg-rose-500/15',   border: 'border-rose-200 dark:border-rose-500/25'   },
  { key: 'genreCount'     as const, icon: '🎭', label: 'Géneros',       num: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-500/15', border: 'border-violet-200 dark:border-violet-500/25' },
  { key: 'directorCount'  as const, icon: '🎥', label: 'Directores',    num: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-500/15', border: 'border-amber-200 dark:border-amber-500/25' },
  { key: 'actorCount'     as const, icon: '⭐', label: 'Actores',       num: 'text-pink-600 dark:text-pink-400',   bg: 'bg-pink-100 dark:bg-pink-500/15',   border: 'border-pink-200 dark:border-pink-500/25'   },
];

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const fadeUp  = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } } };

// ── Component ─────────────────────────────────────────────────────────────────

export function PublicProfilePage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { userId } = useParams<{ userId: string }>();
  const { user }  = useAuth();

  const [profile,       setProfile]       = useState<PublicProfile | null>(null);
  const [reviews,       setReviews]       = useState<ReviewItem[]>([]);
  const [lists,         setLists]         = useState<ListSummary[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [followLoading, setFollowLoading] = useState(false);

  const navState   = location.state as { from?: string; selected?: unknown } | null;
  const fromReviews = navState?.from === 'reviews';

  const handleBack = () => {
    if (fromReviews) {
      navigate('/reviews', { state: { from: 'reviews-back', selected: navState?.selected } });
    } else if (navState?.from === 'search') {
      navigate('/users/search');
    } else {
      navigate(-1);
    }
  };

  useEffect(() => {
    if (userId && user?.id === userId) {
      navigate('/profile', { replace: true, state: location.state });
      return;
    }
    if (!userId) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [profileRes, reviewsRes, listsRes] = await Promise.all([
          apiClient.get(`/users/${userId}/profile`),
          apiClient.get(`/users/${userId}/reviews`),
          apiClient.get(`/users/${userId}/lists`),
        ]);
        setProfile(profileRes.data.data);
        setReviews(reviewsRes.data.data);
        setLists(listsRes.data.data);
      } catch {
        setError('No se pudo cargar el perfil de este usuario');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId, user?.id, navigate, location.state]);

  const handleLike = async (reviewId: string, value: 1 | -1) => {
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id !== reviewId) return r;
        const prevLike = r.userLike;
        const next = prevLike === value ? null : value;
        let likeCount = r.likeCount;
        let dislikeCount = r.dislikeCount;
        if (prevLike === 1)  likeCount--;
        if (prevLike === -1) dislikeCount--;
        if (next === 1)  likeCount++;
        if (next === -1) dislikeCount++;
        return { ...r, userLike: next, likeCount, dislikeCount };
      })
    );
    try {
      const r = reviews.find((r) => r.id === reviewId);
      if (r?.userLike === value) {
        await apiClient.delete(`/reviews/${reviewId}/like`);
      } else {
        await apiClient.post(`/reviews/${reviewId}/like`, { value });
      }
    } catch { /* optimistic update — ignore error */ }
  };

  const handleFollow = async () => {
    if (!profile || followLoading) return;
    setFollowLoading(true);
    const wasFollowing = profile.isFollowing;
    setProfile((p) => p ? { ...p, isFollowing: !wasFollowing, followerCount: p.followerCount + (wasFollowing ? -1 : 1) } : p);
    try {
      if (wasFollowing) {
        await apiClient.delete(`/users/${userId}/follow`);
      } else {
        await apiClient.post(`/users/${userId}/follow`);
      }
    } catch {
      setProfile((p) => p ? { ...p, isFollowing: wasFollowing, followerCount: p.followerCount + (wasFollowing ? 1 : -1) } : p);
    } finally {
      setFollowLoading(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <GlassCard className="p-8 max-w-sm w-full text-center">
          <p className="text-4xl mb-4">👤</p>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Usuario no encontrado</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">{error}</p>
          <button
            onClick={handleBack}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition"
          >
            Volver
          </button>
        </GlassCard>
      </div>
    );
  }

  const { stats } = profile;
  const initials = (profile.displayName ?? 'U')[0].toUpperCase();
  const displayName = profile.displayName ?? 'Usuario';

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">

        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </motion.button>

        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">

          {/* ── Hero card ──────────────────────────────────────────────────── */}
          <motion.div variants={fadeUp}>
            <GlassCard className="p-5">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0 ring-2 ring-indigo-300 dark:ring-indigo-700 shadow-lg">
                  {profile.avatarUrl
                    ? <img src={profile.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                    : initials
                  }
                </div>

                {/* Name / date */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-extrabold text-zinc-900 dark:text-white truncate">{displayName}</h1>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                    Miembro desde {new Date(profile.memberSince).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                  </p>
                </div>

                {/* Follow button */}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 ${
                    profile.isFollowing
                      ? 'bg-white/80 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-300 dark:hover:border-red-500/30 hover:text-red-600 dark:hover:text-red-400'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/30'
                  }`}
                >
                  {followLoading ? (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                  ) : profile.isFollowing ? 'Siguiendo' : '+ Seguir'}
                </motion.button>
              </div>

              {/* Social counts */}
              <div className="flex gap-3 mt-4">
                <div className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-sm font-semibold">
                  <span className="font-bold">{profile.followerCount}</span>
                  <span className="font-normal opacity-75">seguidores</span>
                </div>
                <div className="flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-300 px-3 py-1 rounded-full text-sm font-semibold">
                  <span className="font-bold">{profile.followingCount}</span>
                  <span className="font-normal opacity-75">seguidos</span>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* ── Stats ──────────────────────────────────────────────────────── */}
          <motion.div variants={fadeUp} className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {STATS_CFG.map((s) => (
              <div key={s.key} className={`${s.bg} ${s.border} border backdrop-blur-sm rounded-2xl p-4 flex flex-col items-center gap-1 text-center`}>
                <span className="text-2xl">{s.icon}</span>
                <span className={`text-2xl font-extrabold ${s.num}`}>{stats[s.key]}</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-tight">{s.label}</span>
              </div>
            ))}
          </motion.div>

          {/* ── Favorite genres ────────────────────────────────────────────── */}
          <AnimatePresence>
            {profile.favoriteGenres.length > 0 && (
              <motion.div variants={fadeUp}>
                <GlassCard className="p-5">
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-lg text-xs">🎭 Géneros favoritos</span>
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {profile.favoriteGenres.map((id) => (
                      <span
                        key={id}
                        className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/25 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {getGenreName(id)}
                      </span>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Public lists ───────────────────────────────────────────────── */}
          <AnimatePresence>
            {lists.length > 0 && (
              <motion.div variants={fadeUp}>
                <GlassCard className="p-5">
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-lg text-xs">
                      📋 Listas públicas
                    </span>
                    <span className="text-zinc-400 dark:text-zinc-500 text-xs font-normal">{lists.length}</span>
                  </h2>
                  <div className="space-y-2">
                    {lists.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => navigate(`/lists/${l.id}`)}
                        className="w-full text-left bg-white/60 dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 hover:border-indigo-200 dark:hover:border-indigo-500/30 rounded-xl p-3 transition flex items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-zinc-900 dark:text-white font-semibold text-sm truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">{l.name}</p>
                          {l.description && <p className="text-zinc-400 dark:text-zinc-500 text-xs truncate mt-0.5">{l.description}</p>}
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-2">
                          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                            {l.itemCount} {l.itemCount === 1 ? 'título' : 'títulos'}
                          </span>
                          <svg className="w-3.5 h-3.5 text-zinc-400 group-hover:text-indigo-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Reviews ────────────────────────────────────────────────────── */}
          <motion.div variants={fadeUp}>
            <GlassCard className="p-5">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-lg text-xs">⭐ Reseñas</span>
                {reviews.length > 0 && (
                  <span className="text-zinc-400 dark:text-zinc-500 text-xs font-normal">{reviews.length}</span>
                )}
              </h2>

              {reviews.length === 0 ? (
                <p className="text-zinc-400 dark:text-zinc-500 text-sm text-center py-6">
                  Este usuario aún no escribió reseñas
                </p>
              ) : (
                <div className="space-y-3">
                  {reviews.map((r) => (
                    <div
                      key={r.id}
                      className="bg-white/60 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl p-4"
                    >
                      {/* Title row */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-900 dark:text-white text-sm truncate">{r.title}</p>
                          <p className="text-xs text-zinc-400 dark:text-zinc-500">
                            {r.contentType === 'tv' ? 'Serie' : 'Película'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {r.liked !== null && (
                            <span className="text-base">{r.liked ? '👍' : '👎'}</span>
                          )}
                          <StarRating value={r.rating} />
                        </div>
                      </div>

                      {/* Review text */}
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{r.text}</p>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100 dark:border-white/5">
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">
                          {new Date(r.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleLike(r.id, 1)}
                            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition font-medium ${
                              r.userLike === 1
                                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-zinc-700 dark:hover:text-zinc-200'
                            }`}
                          >
                            👍 {r.likeCount > 0 && r.likeCount}
                          </button>
                          <button
                            onClick={() => handleLike(r.id, -1)}
                            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition font-medium ${
                              r.userLike === -1
                                ? 'bg-rose-500/20 text-rose-700 dark:text-rose-400'
                                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-zinc-700 dark:hover:text-zinc-200'
                            }`}
                          >
                            👎 {r.dislikeCount > 0 && r.dislikeCount}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}
