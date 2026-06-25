import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className="text-lg">{star <= value ? '★' : '☆'}</span>
      ))}
    </div>
  );
}

export function PublicProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [lists, setLists] = useState<ListSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followLoading, setFollowLoading] = useState(false);

  const navState = location.state as { from?: string; selected?: unknown } | null;
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
        if (prevLike === 1) likeCount--;
        if (prevLike === -1) dislikeCount--;
        if (next === 1) likeCount++;
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
    } catch {
      // silently fail — state already updated optimistically
    }
  };

  const handleFollow = async () => {
    if (!profile || followLoading) return;
    setFollowLoading(true);
    const wasFollowing = profile.isFollowing;
    setProfile((p) => p ? {
      ...p,
      isFollowing: !wasFollowing,
      followerCount: p.followerCount + (wasFollowing ? -1 : 1),
    } : p);
    try {
      if (wasFollowing) {
        await apiClient.delete(`/users/${userId}/follow`);
      } else {
        await apiClient.post(`/users/${userId}/follow`);
      }
    } catch {
      // revert on error
      setProfile((p) => p ? {
        ...p,
        isFollowing: wasFollowing,
        followerCount: p.followerCount + (wasFollowing ? 1 : -1),
      } : p);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-zinc-900 dark:text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-white mx-auto mb-4" />
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <p className="text-4xl mb-4">👤</p>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Usuario no encontrado</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button onClick={handleBack} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition">
            Volver
          </button>
        </div>
      </div>
    );
  }

  const { stats } = profile;

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button onClick={handleBack} className="text-zinc-600 dark:text-white hover:text-zinc-900 dark:hover:text-indigo-200 transition mb-6 flex items-center gap-2 text-sm">
            ← Volver
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-indigo-500 flex items-center justify-center text-3xl font-bold text-white flex-shrink-0">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.displayName ?? 'Avatar'} className="w-full h-full object-cover" />
              ) : (
                (profile.displayName ?? 'U')[0].toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white truncate">{profile.displayName ?? 'Usuario'}</h1>
              <p className="text-zinc-500 dark:text-indigo-300 text-sm">
                Miembro desde {new Date(profile.memberSince).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={`flex-shrink-0 px-5 py-2 rounded-xl font-semibold text-sm transition ${
                profile.isFollowing
                  ? 'bg-white border border-zinc-200 text-zinc-800 hover:bg-red-50 hover:border-red-300 hover:text-red-600 dark:bg-white/10 dark:border-white/30 dark:text-white dark:hover:bg-red-500/20 dark:hover:border-red-400/50 dark:hover:text-red-300'
                  : 'bg-indigo-500 hover:bg-indigo-400 text-white'
              } disabled:opacity-50`}
            >
              {followLoading ? '...' : profile.isFollowing ? 'Siguiendo' : '+ Seguir'}
            </button>
          </div>

          {/* Follow counts */}
          <div className="flex gap-6 mt-4 ml-20">
            <div className="text-center">
              <p className="text-zinc-900 dark:text-white font-bold text-lg">{profile.followerCount}</p>
              <p className="text-zinc-500 dark:text-indigo-300 text-xs">seguidores</p>
            </div>
            <div className="text-center">
              <p className="text-zinc-900 dark:text-white font-bold text-lg">{profile.followingCount}</p>
              <p className="text-zinc-500 dark:text-indigo-300 text-xs">seguidos</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Películas vistas', value: stats.moviesWatched, color: 'from-green-500 to-green-600' },
            { label: 'Le gustaron', value: stats.moviesLiked, color: 'from-yellow-500 to-yellow-600' },
            { label: 'No le gustaron', value: stats.moviesDisliked, color: 'from-red-500 to-red-600' },
            { label: 'Géneros favoritos', value: stats.genreCount, color: 'from-blue-500 to-blue-600' },
            { label: 'Directores', value: stats.directorCount, color: 'from-purple-500 to-purple-600' },
            { label: 'Actores', value: stats.actorCount, color: 'from-pink-500 to-pink-600' },
          ].map((s) => (
            <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-xl p-4 text-white`}>
              <p className="text-white/80 text-xs font-semibold uppercase">{s.label}</p>
              <p className="text-3xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Favorite genres */}
        {profile.favoriteGenres.length > 0 && (
          <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-5 mb-6 dark:bg-white/10 dark:border-white/20 dark:backdrop-blur-md">
            <h2 className="text-zinc-900 dark:text-white font-semibold mb-3">Géneros favoritos</h2>
            <div className="flex flex-wrap gap-2">
              {profile.favoriteGenres.map((id) => (
                <span key={id} className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/30 dark:text-indigo-100 px-3 py-1 rounded-full text-sm font-medium">
                  {getGenreName(id)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Public lists */}
        {lists.length > 0 && (
          <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-5 mb-6 dark:bg-white/10 dark:border-white/20 dark:backdrop-blur-md">
            <h2 className="text-zinc-900 dark:text-white font-semibold mb-4">
              Listas<span className="text-indigo-300 font-normal text-sm ml-2">({lists.length})</span>
            </h2>
            <div className="space-y-2">
              {lists.map((l) => (
                <button
                  key={l.id}
                  onClick={() => navigate(`/lists/${l.id}`)}
                  className="w-full text-left bg-zinc-50 rounded-xl p-3 border border-zinc-200 hover:bg-zinc-100 transition flex items-center justify-between gap-3 dark:bg-white/10 dark:border-white/10 dark:hover:bg-white/20"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-zinc-900 dark:text-white font-medium text-sm truncate">{l.name}</p>
                    {l.description && <p className="text-zinc-500 dark:text-indigo-400 text-xs truncate">{l.description}</p>}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-zinc-900 dark:text-white font-bold text-sm">{l.itemCount}</p>
                    <p className="text-zinc-500 dark:text-indigo-400 text-xs">{l.itemCount === 1 ? 'título' : 'títulos'}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Reviews by this user */}
        <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-5 dark:bg-white/10 dark:border-white/20 dark:backdrop-blur-md">
          <h2 className="text-white font-semibold mb-4">
            Reseñas{reviews.length > 0 && <span className="text-indigo-300 font-normal text-sm ml-2">({reviews.length})</span>}
          </h2>
          {reviews.length === 0 ? (
            <p className="text-zinc-500 dark:text-indigo-300 text-sm text-center py-4">Este usuario aún no escribió reseñas</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="bg-zinc-50 rounded-xl p-4 border border-zinc-200 dark:bg-white/10 dark:border-white/10">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="text-zinc-900 dark:text-white font-semibold text-sm truncate">{r.title}</p>
                      <p className="text-zinc-500 dark:text-indigo-400 text-xs">{r.contentType === 'tv' ? 'Serie' : 'Película'}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {r.liked !== null && (
                        <span className={`text-base ${r.liked ? 'text-green-400' : 'text-red-400'}`}>
                          {r.liked ? '👍' : '👎'}
                        </span>
                      )}
                      <StarRating value={r.rating} />
                    </div>
                  </div>
                  <p className="text-zinc-700 dark:text-indigo-100 text-sm leading-relaxed">{r.text}</p>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-zinc-500 dark:text-indigo-400 text-xs">
                      {new Date(r.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLike(r.id, 1)}
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition ${
                          r.userLike === 1
                            ? 'bg-green-500/30 text-green-300 font-semibold'
                            : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-indigo-400 dark:hover:bg-white/10 dark:hover:text-indigo-200'
                        }`}
                      >
                        👍{r.likeCount > 0 && <span>{r.likeCount}</span>}
                      </button>
                      <button
                        onClick={() => handleLike(r.id, -1)}
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition ${
                          r.userLike === -1
                            ? 'bg-red-500/30 text-red-300 font-semibold'
                            : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-indigo-400 dark:hover:bg-white/10 dark:hover:text-indigo-200'
                        }`}
                      >
                        👎{r.dislikeCount > 0 && <span>{r.dislikeCount}</span>}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
