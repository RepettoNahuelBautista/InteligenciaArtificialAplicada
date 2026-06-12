import { useState, useRef } from 'react';
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

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [socialModal, setSocialModal] = useState<'followers' | 'following' | null>(null);
  const [socialList, setSocialList] = useState<{ userId: string; displayName: string; email: string; avatarUrl: string | null }[]>([]);
  const [socialLoading, setSocialLoading] = useState(false);

  const openSocialModal = async (type: 'followers' | 'following') => {
    setSocialModal(type);
    setSocialList([]);
    setSocialLoading(true);
    try {
      const res = await apiClient.get(`/profile/${type}`);
      setSocialList(res.data.data);
    } catch {
      setSocialList([]);
    } finally {
      setSocialLoading(false);
    }
  };

  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarPrompt, setAvatarPrompt] = useState('');
  const [avatarGenerating, setAvatarGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);
  const [avatarGenError, setAvatarGenError] = useState<string | null>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      await apiClient.post('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await refetch();
    } catch {
      // silently ignore — user can try again
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const [formData, setFormData] = useState({
    displayName: '',
    birthDate: '',
    country: '',
    language: 'es',
  });

  const openAvatarModal = () => {
    setAvatarPrompt('');
    setGeneratedPreview(null);
    setAvatarGenError(null);
    setShowAvatarModal(true);
  };

  const handleGenerateAvatar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!avatarPrompt.trim()) return;
    setAvatarGenerating(true);
    setAvatarGenError(null);
    setGeneratedPreview(null);
    try {
      const res = await apiClient.post('/profile/avatar/generate', { prompt: avatarPrompt });
      setGeneratedPreview(res.data.data.previewUrl);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message
        ?? 'No se pudo generar la imagen. Intentá de nuevo.';
      setAvatarGenError(msg);
    } finally {
      setAvatarGenerating(false);
    }
  };

  const handleUseGeneratedAvatar = async () => {
    if (!generatedPreview) return;
    setAvatarUploading(true);
    setShowAvatarModal(false);
    try {
      const response = await fetch(generatedPreview);
      const blob = await response.blob();
      const file = new File([blob], 'generated-avatar.jpg', { type: blob.type });
      const formData = new FormData();
      formData.append('avatar', file);
      await apiClient.post('/profile/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      await refetch();
    } catch {
      // silently ignore — user can try again
    } finally {
      setAvatarUploading(false);
    }
  };

  const validateNewPassword = (pw: string): string[] => {
    const errs: string[] = [];
    if (pw.length < 8) errs.push('mínimo 8 caracteres');
    if (!/[A-Z]/.test(pw)) errs.push('al menos una mayúscula');
    if (!/[0-9]/.test(pw)) errs.push('al menos un número');
    return errs;
  };

  const openPasswordModal = () => {
    setPasswordForm({ current: '', newPass: '', confirm: '' });
    setPasswordError(null);
    setPasswordSuccess(false);
    setShowCurrentPw(false);
    setShowNewPw(false);
    setShowConfirmPw(false);
    setShowPasswordModal(true);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const pwErrors = validateNewPassword(passwordForm.newPass);
    if (pwErrors.length > 0) { setPasswordError(`La contraseña no cumple: ${pwErrors.join(', ')}`); return; }
    if (passwordForm.newPass !== passwordForm.confirm) { setPasswordError('Las contraseñas nuevas no coinciden'); return; }
    setPasswordSaving(true);
    setPasswordError(null);
    try {
      await apiClient.put('/auth/password', { currentPassword: passwordForm.current, newPassword: passwordForm.newPass });
      setPasswordSuccess(true);
      setTimeout(() => setShowPasswordModal(false), 1500);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setPasswordError(e.response?.data?.error?.message || 'Error al cambiar la contraseña');
    } finally {
      setPasswordSaving(false);
    }
  };

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
      <div className="min-h-screen bg-gradient-to-br from-stone-300 via-amber-100 to-stone-300 dark:from-indigo-900 dark:via-purple-900 dark:to-indigo-900 flex items-center justify-center">
        <div className="text-zinc-800 dark:text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-white mx-auto mb-4"></div>
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-300 via-amber-100 to-stone-300 dark:from-indigo-900 dark:via-purple-900 dark:to-indigo-900 flex items-center justify-center p-4">
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-300 via-amber-100 to-stone-300 dark:from-indigo-900 dark:via-purple-900 dark:to-indigo-900 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => fromReviews
              ? navigate('/reviews', { state: { from: 'reviews-back', selected: navState?.selected } })
              : navigate('/home')}
            className="text-zinc-600 dark:text-white hover:text-zinc-900 dark:hover:text-indigo-200 transition mb-6 flex items-center gap-2"
          >
            ← Volver
          </button>
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white">Tu Perfil</h1>
        </div>

        {/* Información Personal */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div
                  onClick={() => !avatarUploading && openAvatarModal()}
                  className="w-16 h-16 rounded-full overflow-hidden bg-indigo-500 flex items-center justify-center cursor-pointer ring-2 ring-indigo-200 hover:ring-indigo-400 transition"
                  title="Cambiar foto"
                >
                  {avatarUploading ? (
                    <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                  ) : pi.avatarUrl ? (
                    <img src={pi.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-white">
                      {(pi.displayName ?? profile.email)[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => !avatarUploading && openAvatarModal()}
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-600 hover:bg-indigo-700 rounded-full flex items-center justify-center text-white text-xs shadow transition"
                  title="Cambiar foto"
                >
                  📷
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Información Personal</h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={openPersonalForm}
                className="text-sm bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-lg hover:bg-indigo-200 transition font-medium"
              >
                {pi.displayName ? 'Editar' : 'Completar'}
              </button>
              <button
                onClick={openPasswordModal}
                className="text-sm bg-gray-100 text-gray-700 px-4 py-1.5 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Cambiar contraseña
              </button>
            </div>
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
                value={pi.birthDate ? new Date(pi.birthDate.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }) : null}
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

        {/* Social stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <StatCard color="teal" label="Seguidores" value={profile.social?.followerCount ?? 0} onClick={() => openSocialModal('followers')} />
          <StatCard color="cyan" label="Seguidos" value={profile.social?.followingCount ?? 0} onClick={() => openSocialModal('following')} />
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
                    {movie.liked === true ? '👍 Me gustó' : movie.liked === false ? '👎 No me gustó' : '—'}
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
          <button onClick={() => navigate('/onboarding?mode=edit')} className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition font-semibold">
            Editar preferencias
          </button>
        </div>
      </div>

      {/* Avatar source modal */}
      {showAvatarModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => { if (!avatarGenerating) setShowAvatarModal(false); }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Cambiar foto de perfil</h2>
              {!avatarGenerating && (
                <button onClick={() => setShowAvatarModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
              )}
            </div>

            <div className="p-6">
              {/* Sin preview generado: mostrar opciones o formulario de prompt */}
              {!generatedPreview && (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <button
                      onClick={() => { setShowAvatarModal(false); avatarInputRef.current?.click(); }}
                      className="flex flex-col items-center gap-3 p-5 border-2 border-gray-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition"
                    >
                      <span className="text-3xl">📁</span>
                      <span className="text-sm font-semibold text-gray-700 text-center">Subir desde mi PC</span>
                    </button>
                    <button
                      onClick={() => { setAvatarPrompt(''); setAvatarGenError(null); }}
                      className="flex flex-col items-center gap-3 p-5 border-2 border-indigo-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition bg-indigo-50/50"
                    >
                      <span className="text-3xl">✨</span>
                      <span className="text-sm font-semibold text-indigo-700 text-center">Generar con IA</span>
                    </button>
                  </div>

                  <form onSubmit={handleGenerateAvatar} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Describí el avatar que querés generar</label>
                      <textarea
                        value={avatarPrompt}
                        onChange={(e) => setAvatarPrompt(e.target.value)}
                        placeholder="Ej: un astronauta con casco de vidrio reflejando galaxias, estilo pixel art"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
                      />
                    </div>
                    {avatarGenError && <p className="text-red-600 text-sm">{avatarGenError}</p>}
                    <button
                      type="submit"
                      disabled={!avatarPrompt.trim() || avatarGenerating}
                      className="w-full py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition flex items-center justify-center gap-2"
                    >
                      {avatarGenerating ? (
                        <>
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                          Generando imagen...
                        </>
                      ) : '✨ Generar'}
                    </button>
                  </form>
                </>
              )}

              {/* Con preview generado: mostrar imagen y opciones */}
              {generatedPreview && (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <img
                      src={generatedPreview}
                      alt="Avatar generado"
                      className="w-48 h-48 rounded-full object-cover ring-4 ring-indigo-200 shadow-lg"
                    />
                  </div>
                  <p className="text-center text-sm text-gray-500">¿Querés usar esta imagen como foto de perfil?</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setGeneratedPreview(null)}
                      className="flex-1 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
                    >
                      Generar otra
                    </button>
                    <button
                      onClick={handleUseGeneratedAvatar}
                      className="flex-1 py-2.5 bg-green-500 text-white text-sm font-semibold rounded-lg hover:bg-green-600 transition"
                    >
                      Usar esta foto ✓
                    </button>
                  </div>
                  <button
                    onClick={() => setShowAvatarModal(false)}
                    className="w-full text-sm text-gray-400 hover:text-gray-600 transition"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Password change modal */}
      {showPasswordModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowPasswordModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Cambiar contraseña</h2>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              {passwordError && <p className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{passwordError}</p>}
              {passwordSuccess && <p className="bg-green-50 text-green-700 text-sm p-3 rounded-lg">¡Contraseña actualizada correctamente!</p>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña actual</label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    value={passwordForm.current}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, current: e.target.value }))}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    placeholder="••••••••"
                    required
                  />
                  <button type="button" onClick={() => setShowCurrentPw((v) => !v)} className="absolute inset-y-0 right-0 px-3 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                    {showCurrentPw ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={passwordForm.newPass}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, newPass: e.target.value }))}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:border-transparent text-sm ${
                      passwordForm.newPass.length === 0
                        ? 'border-gray-300 focus:ring-indigo-500'
                        : validateNewPassword(passwordForm.newPass).length === 0
                        ? 'border-green-400 focus:ring-green-400'
                        : 'border-red-400 focus:ring-red-400'
                    }`}
                    placeholder="••••••••"
                    required
                  />
                  <button type="button" onClick={() => setShowNewPw((v) => !v)} className="absolute inset-y-0 right-0 px-3 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                    {showNewPw ? '🙈' : '👁'}
                  </button>
                </div>
                {passwordForm.newPass.length > 0 ? (
                  <p className={`text-xs mt-1 font-medium ${validateNewPassword(passwordForm.newPass).length === 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {validateNewPassword(passwordForm.newPass).length === 0
                      ? '✓ La contraseña cumple con todos los requisitos'
                      : `✗ No cumple: ${validateNewPassword(passwordForm.newPass).join(', ')}`}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">Mínimo 8 caracteres, con mayúscula y número</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nueva contraseña</label>
                <div className="relative">
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:border-transparent text-sm ${
                      passwordForm.confirm.length > 0 && passwordForm.confirm !== passwordForm.newPass
                        ? 'border-red-400 focus:ring-red-400'
                        : 'border-gray-300 focus:ring-indigo-500'
                    }`}
                    placeholder="••••••••"
                    required
                  />
                  <button type="button" onClick={() => setShowConfirmPw((v) => !v)} className="absolute inset-y-0 right-0 px-3 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                    {showConfirmPw ? '🙈' : '👁'}
                  </button>
                </div>
                {passwordForm.confirm.length > 0 && passwordForm.confirm !== passwordForm.newPass && (
                  <p className="text-xs text-red-600 mt-1">✗ Las contraseñas no coinciden</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={passwordSaving || passwordSuccess}
                  className="flex-1 px-6 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-medium"
                >
                  {passwordSaving ? 'Actualizando...' : 'Actualizar contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Followers / Following modal */}
      {socialModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSocialModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {socialModal === 'followers' ? 'Seguidores' : 'Seguidos'}
              </h2>
              <button onClick={() => setSocialModal(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
                ✕
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              {socialLoading ? (
                <div className="flex justify-center py-8">
                  <span className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-500" />
                </div>
              ) : socialList.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">
                  {socialModal === 'followers' ? 'Nadie te sigue aún' : 'No seguís a nadie aún'}
                </p>
              ) : (
                <div className="space-y-2">
                  {socialList.map((u) => (
                    <button
                      key={u.userId}
                      onClick={() => { setSocialModal(null); navigate(`/users/${u.userId}`); }}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-indigo-50 transition text-left"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-indigo-500 flex items-center justify-center text-base font-bold text-white flex-shrink-0">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={u.displayName} className="w-full h-full object-cover" />
                        ) : (
                          u.displayName[0].toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{u.displayName}</p>
                        <p className="text-xs text-gray-400 truncate">{u.email}</p>
                      </div>
                      <span className="ml-auto text-indigo-400 flex-shrink-0 text-sm">→</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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

function StatCard({ color, label, value, onClick }: { color: string; label: string; value: number; onClick?: () => void }) {
  const colors: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    pink: 'from-pink-500 to-pink-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    red: 'from-red-500 to-red-600',
    teal: 'from-teal-500 to-teal-600',
    cyan: 'from-cyan-500 to-cyan-600',
  };
  const base = `bg-gradient-to-br ${colors[color]} rounded-lg shadow-lg p-6 text-white`;
  if (onClick) {
    return (
      <button onClick={onClick} className={`${base} w-full text-left hover:brightness-110 transition`}>
        <p className="text-white/80 text-sm font-semibold uppercase">{label}</p>
        <p className="text-4xl font-bold">{value}</p>
        <p className="text-white/60 text-xs mt-1">Ver lista →</p>
      </button>
    );
  }
  return (
    <div className={base}>
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
