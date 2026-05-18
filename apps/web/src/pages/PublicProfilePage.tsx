import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import { useAuth } from '../hooks/useAuth';
import { getGenreName } from '../schemas/genres';

interface PublicProfile {
  userId: string;
  displayName: string | null;
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
}

export function PublicProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navState = location.state as { from?: string; selected?: unknown } | null;
  const fromReviews = navState?.from === 'reviews';

  const handleBack = () => {
    if (fromReviews) {
      navigate('/reviews', { state: { from: 'reviews-back', selected: navState?.selected } });
    } else {
      navigate(-1);
    }
  };

  // If the user is viewing their own profile, redirect to the full profile page
  useEffect(() => {
    if (userId && user?.id === userId) {
      navigate('/profile', { replace: true, state: location.state });
      return;
    }
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get(`/users/${userId}/profile`);
        setProfile(response.data.data);
      } catch {
        setError('No se pudo cargar el perfil de este usuario');
      } finally {
        setLoading(false);
      }
    };
    if (userId) load();
  }, [userId, user?.id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button onClick={handleBack} className="text-white hover:text-indigo-200 transition mb-6 flex items-center gap-2 text-sm">
            ← Volver
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center text-3xl font-bold text-white">
              {(profile.displayName ?? 'U')[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{profile.displayName ?? 'Usuario'}</h1>
              <p className="text-indigo-300 text-sm">
                Miembro desde {new Date(profile.memberSince).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
              </p>
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
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-5">
            <h2 className="text-white font-semibold mb-3">Géneros favoritos</h2>
            <div className="flex flex-wrap gap-2">
              {profile.favoriteGenres.map((id) => (
                <span key={id} className="bg-indigo-500/30 text-indigo-100 px-3 py-1 rounded-full text-sm font-medium">
                  {getGenreName(id)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
