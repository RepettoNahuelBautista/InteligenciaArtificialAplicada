import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { getGenreName } from '../schemas/genres';
import { apiClient } from '../api/apiClient';

const LANGUAGE_OPTIONS = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' },
  { value: 'ja', label: '日本語' },
];

export const ProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUser } = useAuth();
  const navState = location.state as { from?: string; selected?: unknown } | null;
  const fromReviews = navState?.from === 'reviews';
  const { profile, loading, error, refetch } = useProfile();

  const [showPersonalForm, setShowPersonalForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState({
    displayName: '',
    birthDate: '',
    country: '',
    language: 'es',
  });

  const openPersonalForm = () => {
    if (profile?.personalInfo) {
      setFormData({
        displayName: profile.personalInfo.displayName ?? '',
        birthDate: profile.personalInfo.birthDate
          ? profile.personalInfo.birthDate.split('T')[0]
          : '',
        country: profile.personalInfo.country ?? '',
        language: profile.personalInfo.language ?? 'es',
      });
    }
    setSaveError(null);
    setSaveSuccess(false);
    setShowPersonalForm(true);
  };

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await apiClient.put('/profile/personal', {
        displayName: formData.displayName || null,
        birthDate: formData.birthDate || null,
        country: formData.country || null,
        language: formData.language || null,
      });

      if (formData.displayName) {
        updateUser({ displayName: formData.displayName });
      }

      setSaveSuccess(true);
      await refetch();
      setTimeout(() => setShowPersonalForm(false), 1200);
    } catch {
      setSaveError('No se pudieron guardar los cambios. Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  };

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
          <p className="text-gray-700 mb-6">{error || 'No se pudo cargar tu perfil'}</p>
          <button onClick={() => navigate('/home')} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition">
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const pi = profile.personalInfo;
  const displayName = pi.displayName || user?.email?.split('@')[0] || 'Usuario';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => fromReviews
              ? navigate('/reviews', { state: { from: 'reviews-back', selected: navState?.selected } })
              : navigate('/home')}
            className="text-white hover:text-indigo-200 transition mb-6 flex items-center gap-2"
          >
            ← Volver
          </button>
          <h1 className="text-4xl font-bold text-white mb-1">Tu Perfil</h1>
          <p className="text-indigo-200">{displayName}</p>
        </div>

        {/* Información Personal */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Información Personal</h2>
            <button
              onClick={openPersonalForm}
              className="text-sm bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-lg hover:bg-indigo-200 transition font-medium"
            >
              {pi.displayName ? 'Editar' : 'Completar'}
            </button>
          </div>

          {showPersonalForm ? (
            <form onSubmit={handleSavePersonal} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData((p) => ({ ...p, displayName: e.target.value }))}
                    placeholder="¿Cómo te llamás?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData((p) => ({ ...p, birthDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData((p) => ({ ...p, country: e.target.value }))}
                    placeholder="Argentina"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Idioma preferido</label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData((p) => ({ ...p, language: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  >
                    {LANGUAGE_OPTIONS.map((l) => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {saveError && <p className="text-red-600 text-sm">{saveError}</p>}
              {saveSuccess && <p className="text-green-600 text-sm">¡Guardado correctamente!</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPersonalForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-medium"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <InfoRow label="Nombre" value={pi.displayName} />
              <InfoRow label="Correo electrónico" value={profile.email} />
              <InfoRow
                label="Fecha de nacimiento"
                value={pi.birthDate ? new Date(pi.birthDate).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }) : null}
              />
              <InfoRow label="País" value={pi.country} />
              <InfoRow
                label="Idioma preferido"
                value={pi.language ? (LANGUAGE_OPTIONS.find((l) => l.value === pi.language)?.label ?? pi.language) : null}
              />
              <InfoRow label="Miembro desde" value={new Date(profile.createdAt).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })} />
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <StatCard color="blue" label="Géneros" value={profile.stats.genreCount} />
          <StatCard color="purple" label="Directores" value={profile.stats.directorCount} />
          <StatCard color="pink" label="Actores" value={profile.stats.actorCount} />
          <StatCard color="green" label="Películas vistas" value={profile.stats.moviesWatched} />
          <StatCard color="yellow" label="Me gustó" value={profile.stats.moviesLiked} />
          <StatCard color="red" label="No me gustó" value={profile.stats.moviesDisliked} />
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Tus Preferencias</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PreferenceList
              title={`Géneros (${profile.preferences.genres.length})`}
              items={profile.preferences.genres.map((id) => ({ key: String(id), label: getGenreName(id) }))}
              color="blue"
              empty="Sin géneros seleccionados"
            />
            <PreferenceList
              title={`Directores (${profile.preferences.directors.length})`}
              items={profile.preferences.directors.map((d) => ({ key: String(d.id), label: d.name }))}
              color="purple"
              empty="Sin directores seleccionados"
            />
            <PreferenceList
              title={`Actores (${profile.preferences.actors.length})`}
              items={profile.preferences.actors.map((a) => ({ key: String(a.id), label: a.name }))}
              color="pink"
              empty="Sin actores seleccionados"
            />
          </div>
        </div>

        {/* Recent Movies */}
        {profile.recentMovies.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Películas Recientes</h2>
            <div className="space-y-4">
              {profile.recentMovies.map((movie) => (
                <div key={movie.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{movie.title}</h3>
                    <p className="text-sm text-gray-500">{new Date(movie.createdAt).toLocaleDateString('es-AR')}</p>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {movie.rating === 5 ? '👍 Me gustó' : '👎 No me gustó'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex gap-4 justify-center">
          <button onClick={() => navigate('/home')} className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition font-semibold">
            Volver al inicio
          </button>
          <button onClick={() => navigate('/onboarding')} className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition font-semibold">
            Editar preferencias
          </button>
        </div>
      </div>
    </div>
  );
};

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-gray-500 text-xs font-semibold uppercase mb-0.5">{label}</p>
      <p className="text-gray-900 font-medium">{value || <span className="text-gray-400 font-normal">Sin completar</span>}</p>
    </div>
  );
}

function StatCard({ color, label, value }: { color: string; label: string; value: number }) {
  const colors: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    pink: 'from-pink-500 to-pink-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    red: 'from-red-500 to-red-600',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-lg shadow-lg p-6 text-white`}>
      <p className="text-white/80 text-sm font-semibold uppercase">{label}</p>
      <p className="text-4xl font-bold">{value}</p>
    </div>
  );
}

function PreferenceList({ title, items, color, empty }: { title: string; items: { key: string; label: string }[]; color: string; empty: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
    pink: 'bg-pink-100 text-pink-700',
  };
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span key={item.key} className={`${colors[color]} px-3 py-1 rounded-full text-sm font-medium`}>
              {item.label}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">{empty}</p>
      )}
    </div>
  );
}
