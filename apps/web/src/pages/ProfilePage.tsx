import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={fadeUp}
      className={`bg-white/60 dark:bg-white/5 border border-white/80 dark:border-white/10 backdrop-blur-sm rounded-2xl ${className}`}
    >
      {children}
    </motion.div>
  );
}

function PasswordInput({
  label, value, onChange, show, onToggle, hint, required,
}: {
  label: string; value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void; hint?: React.ReactNode; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 pr-10 border border-zinc-200 dark:border-white/10 rounded-xl bg-white/80 dark:bg-white/5 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          placeholder="••••••••"
          required={required}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 px-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
          tabIndex={-1}
        >
          {show ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
      {hint}
    </div>
  );
}

export const ProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateUser } = useAuth();
  const navState = location.state as { from?: string; selected?: unknown } | null;
  const fromReviews = navState?.from === 'reviews';
  const { profile, loading, error, refetch } = useProfile();

  const [editing, setEditing] = useState(false);
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

  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarPrompt, setAvatarPrompt] = useState('');
  const [avatarGenerating, setAvatarGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);
  const [avatarGenError, setAvatarGenError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    displayName: '', birthDate: '', country: '', language: 'es',
  });

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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await apiClient.post('/profile/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const avatarUrl = res.data?.data?.avatarUrl as string | undefined;
      if (avatarUrl) updateUser({ avatarUrl });
      await refetch();
    } catch { /* ignore */ } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const openAvatarModal = () => {
    setAvatarPrompt(''); setGeneratedPreview(null); setAvatarGenError(null);
    setShowAvatarModal(true);
  };

  const handleGenerateAvatar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!avatarPrompt.trim()) return;
    setAvatarGenerating(true); setAvatarGenError(null); setGeneratedPreview(null);
    try {
      const res = await apiClient.post('/profile/avatar/generate', { prompt: avatarPrompt });
      setGeneratedPreview(res.data.data.previewUrl);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'No se pudo generar la imagen.';
      setAvatarGenError(msg);
    } finally {
      setAvatarGenerating(false);
    }
  };

  const handleUseGeneratedAvatar = async () => {
    if (!generatedPreview) return;
    setAvatarUploading(true); setShowAvatarModal(false);
    try {
      const res = await fetch(generatedPreview);
      const blob = await res.blob();
      const file = new File([blob], 'generated-avatar.jpg', { type: blob.type });
      const fd = new FormData();
      fd.append('avatar', file);
      const uploadRes = await apiClient.post('/profile/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const avatarUrl = uploadRes.data?.data?.avatarUrl as string | undefined;
      if (avatarUrl) updateUser({ avatarUrl });
      await refetch();
    } catch { /* ignore */ } finally {
      setAvatarUploading(false);
    }
  };

  const validateNewPassword = (pw: string) => {
    const errs: string[] = [];
    if (pw.length < 8) errs.push('mínimo 8 caracteres');
    if (!/[A-Z]/.test(pw)) errs.push('al menos una mayúscula');
    if (!/[0-9]/.test(pw)) errs.push('al menos un número');
    return errs;
  };

  const openPasswordModal = () => {
    setPasswordForm({ current: '', newPass: '', confirm: '' });
    setPasswordError(null); setPasswordSuccess(false);
    setShowCurrentPw(false); setShowNewPw(false); setShowConfirmPw(false);
    setShowPasswordModal(true);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const pwErrs = validateNewPassword(passwordForm.newPass);
    if (pwErrs.length > 0) { setPasswordError(`La contraseña no cumple: ${pwErrs.join(', ')}`); return; }
    if (passwordForm.newPass !== passwordForm.confirm) { setPasswordError('Las contraseñas nuevas no coinciden'); return; }
    setPasswordSaving(true); setPasswordError(null);
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

  const openEdit = () => {
    if (profile?.personalInfo) {
      setFormData({
        displayName: profile.personalInfo.displayName ?? '',
        birthDate: profile.personalInfo.birthDate ? profile.personalInfo.birthDate.split('T')[0] : '',
        country: profile.personalInfo.country ?? '',
        language: profile.personalInfo.language ?? 'es',
      });
    }
    setSaveError(null); setSaveSuccess(false); setEditing(true);
  };

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setSaveError(null); setSaveSuccess(false);
    try {
      await apiClient.put('/profile/personal', {
        displayName: formData.displayName || null,
        birthDate: formData.birthDate || null,
        country: formData.country || null,
        language: formData.language || null,
      });
      if (formData.displayName) updateUser({ displayName: formData.displayName });
      setSaveSuccess(true);
      await refetch();
      setTimeout(() => setEditing(false), 1200);
    } catch {
      setSaveError('No se pudieron guardar los cambios. Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-indigo-500/20 animate-ping" />
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <GlassCard className="p-8 max-w-md w-full text-center">
          <p className="text-zinc-900 dark:text-white font-semibold mb-2">No se pudo cargar tu perfil</p>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">{error}</p>
          <button onClick={() => navigate('/home')} className="bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 transition text-sm font-medium">
            Volver al inicio
          </button>
        </GlassCard>
      </div>
    );
  }

  const pi = profile.personalInfo;
  const displayName = pi.displayName ?? profile.email.split('@')[0];
  const initials = displayName[0].toUpperCase();

  const STATS = [
    { icon: '🎬', label: 'Vistas',      value: profile.stats.moviesWatched,  num: 'text-sky-600 dark:text-sky-400',     bg: 'bg-sky-100 dark:bg-sky-500/15',     border: 'border-sky-200 dark:border-sky-500/25' },
    { icon: '👍', label: 'Me gustó',    value: profile.stats.moviesLiked,    num: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-500/15', border: 'border-emerald-200 dark:border-emerald-500/25' },
    { icon: '👎', label: 'No me gustó', value: profile.stats.moviesDisliked, num: 'text-rose-600 dark:text-rose-400',   bg: 'bg-rose-100 dark:bg-rose-500/15',   border: 'border-rose-200 dark:border-rose-500/25' },
    { icon: '🎭', label: 'Géneros',     value: profile.stats.genreCount,     num: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-500/15', border: 'border-violet-200 dark:border-violet-500/25' },
    { icon: '🎥', label: 'Directores',  value: profile.stats.directorCount,  num: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-500/15', border: 'border-amber-200 dark:border-amber-500/25' },
    { icon: '⭐', label: 'Actores',     value: profile.stats.actorCount,     num: 'text-pink-600 dark:text-pink-400',   bg: 'bg-pink-100 dark:bg-pink-500/15',   border: 'border-pink-200 dark:border-pink-500/25' },
  ];

  return (
    <div className="min-h-screen p-4 sm:p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto">

        {/* Back */}
        <motion.button
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => fromReviews
            ? navigate('/reviews', { state: { from: 'reviews-back', selected: navState?.selected } })
            : navigate('/home')}
          className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition text-sm font-medium mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </motion.button>

        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">

          {/* ── Hero card ─────────────────────────────────────────────────────── */}
          <GlassCard className="p-5">
            {/* Avatar + nombre + botones en una sola fila */}
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  onClick={() => !avatarUploading && openAvatarModal()}
                  className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center cursor-pointer ring-2 ring-indigo-300 dark:ring-indigo-700 shadow-lg"
                >
                  {avatarUploading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : pi.avatarUrl ? (
                    <img src={pi.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-white">{initials}</span>
                  )}
                </motion.div>
                <button
                  onClick={() => !avatarUploading && openAvatarModal()}
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-600 hover:bg-indigo-700 rounded-full flex items-center justify-center shadow border-2 border-white dark:border-zinc-900 transition"
                >
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-extrabold text-zinc-900 dark:text-white truncate">{displayName}</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{profile.email}</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                  Miembro desde {new Date(profile.createdAt).toLocaleDateString('es-AR', { year: 'numeric', month: 'long' })}
                </p>
              </div>
              {/* Botones de acción — derecha */}
              <div className="flex-shrink-0 flex flex-col gap-2 items-end">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={openEdit}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition shadow-sm shadow-indigo-500/30 whitespace-nowrap">
                  {pi.displayName ? 'Editar perfil' : 'Completar perfil'}
                </motion.button>
                <button onClick={openPasswordModal}
                  className="px-3 py-1.5 bg-white/80 dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 rounded-xl text-sm font-medium transition whitespace-nowrap">
                  Cambiar contraseña
                </button>
              </div>
            </div>

            {/* Social badges */}
            <div className="flex gap-3 mt-4">
              <button onClick={() => openSocialModal('followers')}
                className="flex items-center gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-sm font-semibold transition">
                <span className="font-bold">{profile.social?.followerCount ?? 0}</span>
                <span className="font-normal opacity-75">seguidores</span>
              </button>
              <button onClick={() => openSocialModal('following')}
                className="flex items-center gap-1.5 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-700 dark:text-violet-300 px-3 py-1 rounded-full text-sm font-semibold transition">
                <span className="font-bold">{profile.social?.followingCount ?? 0}</span>
                <span className="font-normal opacity-75">seguidos</span>
              </button>
            </div>

            {/* ── Inline edit form ─────────────────────────────────────────── */}
            <AnimatePresence>
              {editing && (
                <motion.form
                  onSubmit={handleSavePersonal}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="mt-6 pt-6 border-t border-white/60 dark:border-white/10 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: 'Nombre', key: 'displayName', placeholder: '¿Cómo te llamás?', type: 'text' },
                        { label: 'Fecha de nacimiento', key: 'birthDate', placeholder: '', type: 'date' },
                        { label: 'País', key: 'country', placeholder: 'Argentina', type: 'text' },
                      ].map(({ label, key, placeholder, type }) => (
                        <div key={key}>
                          <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">{label}</label>
                          <input
                            type={type}
                            value={formData[key as keyof typeof formData]}
                            onChange={(e) => setFormData((p) => ({ ...p, [key]: e.target.value }))}
                            placeholder={placeholder}
                            className="w-full px-3 py-2 border border-zinc-200 dark:border-white/10 rounded-xl bg-white/80 dark:bg-white/5 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition placeholder-zinc-400 dark:placeholder-zinc-600"
                          />
                        </div>
                      ))}
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Idioma preferido</label>
                        <select
                          value={formData.language}
                          onChange={(e) => setFormData((p) => ({ ...p, language: e.target.value }))}
                          className="w-full px-3 py-2 border border-zinc-200 dark:border-white/10 rounded-xl bg-white/80 dark:bg-white/5 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        >
                          {LANGUAGE_OPTIONS.map((l) => (
                            <option key={l.value} value={l.value}>{l.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <AnimatePresence>
                      {saveError && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="text-red-600 dark:text-red-400 text-sm bg-red-500/10 px-3 py-2 rounded-xl">
                          {saveError}
                        </motion.p>
                      )}
                      {saveSuccess && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="text-emerald-600 dark:text-emerald-400 text-sm bg-emerald-500/10 px-3 py-2 rounded-xl">
                          ✓ Guardado correctamente
                        </motion.p>
                      )}
                    </AnimatePresence>

                    <div className="flex gap-3">
                      <button type="button" onClick={() => setEditing(false)}
                        className="px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition">
                        Cancelar
                      </button>
                      <button type="submit" disabled={saving}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl transition disabled:opacity-50 font-semibold">
                        {saving ? 'Guardando...' : 'Guardar cambios'}
                      </button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Info rows when not editing */}
            <AnimatePresence>
              {!editing && (pi.country || pi.birthDate || pi.language) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-5 pt-5 border-t border-white/60 dark:border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-4"
                >
                  {pi.country && (
                    <div>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium mb-0.5">País</p>
                      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{pi.country}</p>
                    </div>
                  )}
                  {pi.birthDate && (
                    <div>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium mb-0.5">Nacimiento</p>
                      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                        {new Date(pi.birthDate.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  )}
                  {pi.language && (
                    <div>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium mb-0.5">Idioma</p>
                      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                        {LANGUAGE_OPTIONS.find((l) => l.value === pi.language)?.label ?? pi.language}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>

          {/* ── Stats row ─────────────────────────────────────────────────────── */}
          <motion.div variants={fadeUp} className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {STATS.map((s) => (
              <div key={s.label}
                className={`${s.bg} ${s.border} border backdrop-blur-sm rounded-2xl p-4 flex flex-col items-center gap-1 text-center`}>
                <span className="text-2xl">{s.icon}</span>
                <span className={`text-2xl font-extrabold ${s.num}`}>{s.value}</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-tight">{s.label}</span>
              </div>
            ))}
          </motion.div>

          {/* ── Preferences ───────────────────────────────────────────────────── */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Tus Preferencias</h2>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/onboarding?mode=edit')}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 font-semibold transition flex items-center gap-1"
              >
                Editar
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <PrefsSection
                label="Géneros"
                icon="🎭"
                items={profile.preferences.genres.map((id) => getGenreName(id))}
                color="indigo"
                empty="Sin géneros seleccionados"
              />
              <PrefsSection
                label="Directores"
                icon="🎥"
                items={profile.preferences.directors.map((d) => d.name)}
                color="violet"
                empty="Sin directores seleccionados"
              />
              <PrefsSection
                label="Actores"
                icon="⭐"
                items={profile.preferences.actors.map((a) => a.name)}
                color="pink"
                empty="Sin actores seleccionados"
              />
            </div>
          </GlassCard>

          {/* ── Recent movies ─────────────────────────────────────────────────── */}
          {profile.recentMovies.length > 0 && (
            <GlassCard className="p-6">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-5">Películas Recientes</h2>
              <div className="space-y-2">
                {profile.recentMovies.map((movie, i) => (
                  <motion.div
                    key={movie.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center justify-between px-4 py-3 bg-white/50 dark:bg-white/5 border border-white/70 dark:border-white/10 rounded-xl hover:bg-white/80 dark:hover:bg-white/10 transition"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-900 dark:text-white text-sm truncate">{movie.title}</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">
                        {new Date(movie.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ml-3 ${
                      movie.liked === true
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                        : movie.liked === false
                        ? 'bg-red-500/15 text-red-700 dark:text-red-400'
                        : 'bg-zinc-200/60 dark:bg-white/10 text-zinc-500 dark:text-zinc-400'
                    }`}>
                      {movie.liked === true ? '👍 Me gustó' : movie.liked === false ? '👎 No me gustó' : 'Sin calificar'}
                    </span>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          )}

        </motion.div>
      </div>

      {/* ── Avatar modal ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAvatarModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => { if (!avatarGenerating) setShowAvatarModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-md"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-white/10">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Cambiar foto de perfil</h2>
                {!avatarGenerating && (
                  <button onClick={() => setShowAvatarModal(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition text-xl leading-none">✕</button>
                )}
              </div>
              <div className="p-6">
                {!generatedPreview ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <button
                        onClick={() => { setShowAvatarModal(false); avatarInputRef.current?.click(); }}
                        className="flex flex-col items-center gap-3 p-5 border-2 border-zinc-200 dark:border-white/10 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition"
                      >
                        <span className="text-3xl">📁</span>
                        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 text-center">Subir desde mi PC</span>
                      </button>
                      <div className="flex flex-col items-center gap-3 p-5 border-2 border-indigo-200 dark:border-indigo-500/30 rounded-xl bg-indigo-50/50 dark:bg-indigo-500/5">
                        <span className="text-3xl">✨</span>
                        <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 text-center">Generar con IA</span>
                      </div>
                    </div>
                    <form onSubmit={handleGenerateAvatar} className="space-y-3">
                      <textarea
                        value={avatarPrompt}
                        onChange={(e) => setAvatarPrompt(e.target.value)}
                        placeholder="Ej: un astronauta con casco de vidrio reflejando galaxias, estilo pixel art"
                        rows={3}
                        className="w-full px-3 py-2 border border-zinc-200 dark:border-white/10 rounded-xl bg-white/80 dark:bg-white/5 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none placeholder-zinc-400 dark:placeholder-zinc-600"
                      />
                      {avatarGenError && <p className="text-red-600 dark:text-red-400 text-sm">{avatarGenError}</p>}
                      <button
                        type="submit"
                        disabled={!avatarPrompt.trim() || avatarGenerating}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl disabled:opacity-40 transition flex items-center justify-center gap-2"
                      >
                        {avatarGenerating ? (
                          <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generando...</>
                        ) : '✨ Generar avatar'}
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <img src={generatedPreview} alt="Avatar generado" className="w-48 h-48 rounded-full object-cover ring-4 ring-indigo-200 dark:ring-indigo-500/30 shadow-lg" />
                    </div>
                    <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">¿Querés usar esta imagen?</p>
                    <div className="flex gap-3">
                      <button onClick={() => setGeneratedPreview(null)}
                        className="flex-1 py-2.5 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 transition">
                        Generar otra
                      </button>
                      <button onClick={handleUseGeneratedAvatar}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition">
                        Usar esta ✓
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Password modal ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowPasswordModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-md"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-white/10">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Cambiar contraseña</h2>
                <button onClick={() => setShowPasswordModal(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition text-xl leading-none">✕</button>
              </div>
              <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                <AnimatePresence>
                  {passwordError && (
                    <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="bg-red-500/10 text-red-700 dark:text-red-400 text-sm p-3 rounded-xl">
                      {passwordError}
                    </motion.p>
                  )}
                  {passwordSuccess && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm p-3 rounded-xl">
                      ✓ ¡Contraseña actualizada!
                    </motion.p>
                  )}
                </AnimatePresence>

                <PasswordInput
                  label="Contraseña actual"
                  value={passwordForm.current}
                  onChange={(v) => setPasswordForm((p) => ({ ...p, current: v }))}
                  show={showCurrentPw}
                  onToggle={() => setShowCurrentPw((x) => !x)}
                  required
                />
                <PasswordInput
                  label="Nueva contraseña"
                  value={passwordForm.newPass}
                  onChange={(v) => setPasswordForm((p) => ({ ...p, newPass: v }))}
                  show={showNewPw}
                  onToggle={() => setShowNewPw((x) => !x)}
                  required
                  hint={passwordForm.newPass.length > 0 ? (
                    <p className={`text-xs mt-1 font-medium ${validateNewPassword(passwordForm.newPass).length === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {validateNewPassword(passwordForm.newPass).length === 0
                        ? '✓ Cumple con todos los requisitos'
                        : `✗ No cumple: ${validateNewPassword(passwordForm.newPass).join(', ')}`}
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-400 mt-1">Mínimo 8 caracteres, con mayúscula y número</p>
                  )}
                />
                <PasswordInput
                  label="Confirmar nueva contraseña"
                  value={passwordForm.confirm}
                  onChange={(v) => setPasswordForm((p) => ({ ...p, confirm: v }))}
                  show={showConfirmPw}
                  onToggle={() => setShowConfirmPw((x) => !x)}
                  required
                  hint={passwordForm.confirm.length > 0 && passwordForm.confirm !== passwordForm.newPass ? (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">✗ Las contraseñas no coinciden</p>
                  ) : undefined}
                />

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition">
                    Cancelar
                  </button>
                  <button type="submit" disabled={passwordSaving || passwordSuccess}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl transition disabled:opacity-50 font-semibold">
                    {passwordSaving ? 'Actualizando...' : 'Actualizar contraseña'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Social modal ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {socialModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSocialModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-white/10">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                  {socialModal === 'followers' ? 'Seguidores' : 'Seguidos'}
                </h2>
                <button onClick={() => setSocialModal(null)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition text-xl leading-none">✕</button>
              </div>
              <div className="overflow-y-auto flex-1 p-4">
                {socialLoading ? (
                  <div className="flex justify-center py-10">
                    <span className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : socialList.length === 0 ? (
                  <p className="text-center text-zinc-400 dark:text-zinc-500 py-10 text-sm">
                    {socialModal === 'followers' ? 'Nadie te sigue aún' : 'No seguís a nadie aún'}
                  </p>
                ) : (
                  <div className="space-y-1">
                    {socialList.map((u) => (
                      <button
                        key={u.userId}
                        onClick={() => { setSocialModal(null); navigate(`/users/${u.userId}`); }}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition text-left"
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-base font-bold text-white flex-shrink-0">
                          {u.avatarUrl
                            ? <img src={u.avatarUrl} alt={u.displayName} className="w-full h-full object-cover" />
                            : u.displayName[0].toUpperCase()
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-900 dark:text-white text-sm truncate">{u.displayName}</p>
                          <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">{u.email}</p>
                        </div>
                        <svg className="ml-auto w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function PrefsSection({ label, icon, items, color, empty }: {
  label: string; icon: string; items: string[]; color: 'indigo' | 'violet' | 'pink'; empty: string;
}) {
  const styles: Record<string, { header: string; chip: string; dot: string }> = {
    indigo: {
      header: 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-500/20',
      chip:   'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-200 border-indigo-200 dark:border-indigo-500/30',
      dot:    'bg-indigo-500',
    },
    violet: {
      header: 'text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-500/20',
      chip:   'bg-violet-100 dark:bg-violet-500/20 text-violet-800 dark:text-violet-200 border-violet-200 dark:border-violet-500/30',
      dot:    'bg-violet-500',
    },
    pink: {
      header: 'text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-500/20',
      chip:   'bg-pink-100 dark:bg-pink-500/20 text-pink-800 dark:text-pink-200 border-pink-200 dark:border-pink-500/30',
      dot:    'bg-pink-500',
    },
  };
  const s = styles[color];
  return (
    <div>
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider mb-3 ${s.header}`}>
        <span>{icon}</span>
        <span>{label}</span>
        <span className="opacity-60 font-normal">({items.length})</span>
      </div>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <span key={item} className={`border px-2.5 py-1 rounded-full text-xs font-semibold ${s.chip}`}>
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-400 dark:text-zinc-500">{empty}</p>
      )}
    </div>
  );
}
