import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';

/**
 * ProfilePage - Displays user's complete profile with statistics and recent movies
 */
export const ProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading, error } = useProfile();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">
            {error || 'No se pudo cargar tu perfil'}
          </p>
          <button
            onClick={() => navigate('/home')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/home')}
            className="text-white hover:text-indigo-200 transition mb-6 flex items-center gap-2"
          >
            ← Volver
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">Tu Perfil</h1>
          <p className="text-indigo-200">{profile.email}</p>
        </div>

        {/* User Info */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-gray-600 text-sm font-semibold uppercase">
                Correo
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {profile.email}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-semibold uppercase">
                Miembro desde
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(profile.createdAt).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <p className="text-blue-100 text-sm font-semibold uppercase">
              Géneros
            </p>
            <p className="text-4xl font-bold">{profile.stats.genreCount}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <p className="text-purple-100 text-sm font-semibold uppercase">
              Directores
            </p>
            <p className="text-4xl font-bold">{profile.stats.directorCount}</p>
          </div>

          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg shadow-lg p-6 text-white">
            <p className="text-pink-100 text-sm font-semibold uppercase">
              Actores
            </p>
            <p className="text-4xl font-bold">{profile.stats.actorCount}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
            <p className="text-green-100 text-sm font-semibold uppercase">
              Películas vistas
            </p>
            <p className="text-4xl font-bold">{profile.stats.moviesWatched}</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-lg p-6 text-white">
            <p className="text-yellow-100 text-sm font-semibold uppercase">
              Me gustó
            </p>
            <p className="text-4xl font-bold">{profile.stats.moviesLiked}</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
            <p className="text-red-100 text-sm font-semibold uppercase">
              No me gustó
            </p>
            <p className="text-4xl font-bold">{profile.stats.moviesDisliked}</p>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Tus Preferencias
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Genres */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Géneros seleccionados ({profile.preferences.genres.length})
              </h3>
              {profile.preferences.genres.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.preferences.genres.map((genreId) => (
                    <span
                      key={genreId}
                      className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      #{genreId}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Sin géneros seleccionados</p>
              )}
            </div>

            {/* Directors */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Directores favoritos ({profile.preferences.directors.length})
              </h3>
              {profile.preferences.directors.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.preferences.directors.map((directorId) => (
                    <span
                      key={directorId}
                      className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      #{directorId}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Sin directores seleccionados</p>
              )}
            </div>

            {/* Actors */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Actores favoritos ({profile.preferences.actors.length})
              </h3>
              {profile.preferences.actors.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.preferences.actors.map((actorId) => (
                    <span
                      key={actorId}
                      className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      #{actorId}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Sin actores seleccionados</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Movies */}
        {profile.recentMovies.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Películas Recientes
            </h2>

            <div className="space-y-4">
              {profile.recentMovies.map((movie) => (
                <div
                  key={movie.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {movie.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(movie.createdAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">
                      {movie.rating === 5 ? '👍' : '👎'}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {movie.rating === 5 ? 'Me gustó' : 'No me gustó'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4 justify-center">
          <button
            onClick={() => navigate('/home')}
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition font-semibold"
          >
            Volver al inicio
          </button>
          <button
            onClick={() => navigate('/onboarding')}
            className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition font-semibold"
          >
            Editar perfil
          </button>
        </div>
      </div>
    </div>
  );
};
