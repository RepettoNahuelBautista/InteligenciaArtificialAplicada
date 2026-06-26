import { FC, useState, useEffect, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GenreSelector } from './GenreSelector';
import { PersonSelector } from './PersonSelector';
import { MovieRater } from './MovieRater';
import { useGenreSelector, useOnboarding } from '../../hooks/useOnboarding';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../../api/apiClient';

const STEPS = [
  { num: 1, label: 'Géneros' },
  { num: 2, label: 'Directores' },
  { num: 3, label: 'Actores' },
  { num: 4, label: 'Películas' },
  { num: 5, label: 'Listo' },
];

const SUMMARY_ITEMS = [
  { key: 'genres'    as const, icon: '🎭', label: 'géneros favoritos',    color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20' },
  { key: 'directors' as const, icon: '🎬', label: 'directores favoritos', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20' },
  { key: 'actors'    as const, icon: '⭐', label: 'actores favoritos',    color: 'text-pink-600 dark:text-pink-400',     bg: 'bg-pink-50 dark:bg-pink-500/10 border border-pink-100 dark:border-pink-500/20'         },
  { key: 'movies'    as const, icon: '🎥', label: 'películas valoradas',  color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20'     },
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 52 : -52, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.28, ease: 'easeOut' as const } },
  exit: (dir: number) => ({ x: dir > 0 ? -52 : 52, opacity: 0, transition: { duration: 0.2 } }),
};

export const OnboardingFlow: FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditMode = searchParams.get('mode') === 'edit';
  const { user } = useAuth();
  const {
    step,
    nextStep,
    prevStep,
    setSelectedGenres,
    isLoading,
    setIsLoading,
    error,
    setError,
  } = useOnboarding();

  const [direction, setDirection] = useState(1);
  const [selectedDirectorIds, setSelectedDirectorIds] = useState<number[]>([]);
  const [selectedActorIds, setSelectedActorIds] = useState<number[]>([]);
  const [summaryCounts, setSummaryCounts] = useState({ genres: 0, directors: 0, actors: 0, movies: 0 });

  const { selectedGenres: tempGenres, setSelectedGenres: setTempGenres, contentType, setContentType, toggleGenre, isValid } =
    useGenreSelector();

  useEffect(() => {
    const loadExistingGenres = async () => {
      try {
        const response = await apiClient.get('/profile');
        const existingGenres: number[] = response.data?.data?.preferences?.genres ?? [];
        if (existingGenres.length > 0) setTempGenres(existingGenres);
      } catch { /* ignore */ }
    };
    loadExistingGenres();
  }, []);

  useEffect(() => {
    if (step !== 5) return;
    const fetchCounts = async () => {
      try {
        const [profileRes, moviesRes] = await Promise.all([
          apiClient.get('/profile'),
          apiClient.get('/profile/watched-movies'),
        ]);
        const prefs = profileRes.data?.data?.preferences;
        const movieStats = moviesRes.data?.data?.stats;
        setSummaryCounts({
          genres: prefs?.genres?.length ?? 0,
          directors: prefs?.directors?.length ?? 0,
          actors: prefs?.actors?.length ?? 0,
          movies: movieStats?.total ?? 0,
        });
      } catch { /* ignore */ }
    };
    fetchCounts();
  }, [step]);

  const goNext = () => { setDirection(1); nextStep(); };
  const goPrev = () => { setDirection(-1); prevStep(); };

  const handleNext = async () => {
    if (step === 1) {
      if (!isValid) { setError('Debes seleccionar al menos 3 géneros'); return; }
      setSelectedGenres(tempGenres);
      setIsLoading(true);
      try {
        await apiClient.post('/profile/genres', { genreIds: tempGenres });
        setError('');
        goNext();
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: { message?: string } } } };
        setError(e.response?.data?.error?.message || 'Error guardando géneros');
      } finally {
        setIsLoading(false);
      }
    } else if (step === 2) {
      if (selectedDirectorIds.length > 0) {
        setIsLoading(true);
        try {
          await apiClient.post('/profile/people', { personIds: selectedDirectorIds, type: 'directors' });
          setError('');
        } catch (err: unknown) {
          const e = err as { response?: { data?: { error?: { message?: string } } } };
          setError(e.response?.data?.error?.message || 'Error guardando directores');
          setIsLoading(false);
          return;
        } finally {
          setIsLoading(false);
        }
      }
      goNext();
    } else if (step === 3) {
      if (selectedActorIds.length > 0) {
        setIsLoading(true);
        try {
          await apiClient.post('/profile/people', { personIds: selectedActorIds, type: 'actors' });
          setError('');
        } catch (err: unknown) {
          const e = err as { response?: { data?: { error?: { message?: string } } } };
          setError(e.response?.data?.error?.message || 'Error guardando actores');
          setIsLoading(false);
          return;
        } finally {
          setIsLoading(false);
        }
      }
      goNext();
    } else {
      goNext();
    }
  };

  const displayName = user?.displayName ?? user?.email?.split('@')[0] ?? 'Usuario';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-violet-50/30 dark:from-zinc-950 dark:via-indigo-950/20 dark:to-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-1">
            🎬 RecomiendaFilms
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Hola{' '}
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">{displayName}</span>
            , contanos sobre tus gustos
          </p>
        </motion.div>

        {/* Step indicator */}
        <div className="flex items-center mb-8 px-1">
          {STEPS.map((s, i) => (
            <Fragment key={s.num}>
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all duration-300 ${
                  step > s.num
                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                    : step === s.num
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-200 dark:ring-indigo-800 shadow-sm shadow-indigo-500/30'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600'
                }`}>
                  {step > s.num ? '✓' : s.num}
                </div>
                <span className={`text-[10px] font-semibold hidden sm:block whitespace-nowrap transition-colors duration-300 ${
                  step === s.num  ? 'text-indigo-600 dark:text-indigo-400' :
                  step > s.num    ? 'text-emerald-600 dark:text-emerald-500' :
                                    'text-zinc-400 dark:text-zinc-600'
                }`}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1.5 mb-5 rounded-full transition-all duration-500 ${
                  step > s.num ? 'bg-emerald-400 dark:bg-emerald-600' : 'bg-zinc-200 dark:bg-zinc-700'
                }`} />
              )}
            </Fragment>
          ))}
        </div>

        {/* Main card */}
        <div className="bg-white/70 dark:bg-white/5 border border-white/80 dark:border-white/10 backdrop-blur-sm rounded-2xl shadow-xl shadow-black/5 overflow-hidden mb-4">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="bg-red-500/10 border-b border-red-200 dark:border-red-500/20 px-6 py-3 text-red-700 dark:text-red-400 text-sm">
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="overflow-hidden">
            <AnimatePresence custom={direction} mode="wait">
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="p-6 sm:p-8"
              >
                {step === 1 && (
                  <GenreSelector
                    selectedGenres={tempGenres}
                    onToggleGenre={toggleGenre}
                    contentType={contentType}
                    onContentTypeChange={setContentType}
                    isValid={isValid}
                  />
                )}
                {step === 2 && (
                  <PersonSelector type="directors" onSelectionChange={setSelectedDirectorIds} />
                )}
                {step === 3 && (
                  <PersonSelector type="actors" onSelectionChange={setSelectedActorIds} />
                )}
                {step === 4 && <MovieRater />}
                {step === 5 && (
                  <div className="text-center py-4">
                    <motion.div
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                      className="text-6xl mb-4"
                    >
                      🎉
                    </motion.div>
                    <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white mb-2">
                      {isEditMode ? '¡Preferencias actualizadas!' : '¡Tu perfil está listo!'}
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
                      {isEditMode
                        ? 'Tus preferencias han sido actualizadas exitosamente'
                        : 'Ya podés recibir recomendaciones personalizadas basadas en tus gustos'}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {SUMMARY_ITEMS.map((item, i) => (
                        <motion.div
                          key={item.key}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + i * 0.07 }}
                          className={`${item.bg} rounded-xl p-4 flex items-center gap-3`}
                        >
                          <span className="text-2xl">{item.icon}</span>
                          <div className="text-left">
                            <p className={`text-2xl font-extrabold leading-none ${item.color}`}>
                              {summaryCounts[item.key]}
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{item.label}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {isEditMode && step === 1 ? (
            <button
              onClick={() => navigate('/home')}
              className="flex-1 py-3 bg-white/70 dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300 rounded-xl text-sm font-medium transition backdrop-blur-sm"
            >
              Cancelar
            </button>
          ) : (
            <button
              onClick={goPrev}
              disabled={step === 1 || isLoading}
              className="flex-1 py-3 bg-white/70 dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300 rounded-xl text-sm font-medium transition backdrop-blur-sm disabled:opacity-40"
            >
              ← Atrás
            </button>
          )}

          {step < 5 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNext}
              disabled={isLoading || (step === 1 && !isValid)}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition shadow-sm shadow-indigo-500/30 disabled:opacity-40"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </span>
              ) : 'Siguiente →'}
            </motion.button>
          )}

          {step === 5 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/home')}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition shadow-sm shadow-emerald-500/30"
            >
              {isEditMode ? 'Volver al perfil ✓' : 'Comenzar a explorar ✓'}
            </motion.button>
          )}
        </div>

        {isEditMode && step > 1 && step < 5 && (
          <div className="text-center mt-3">
            <button
              onClick={() => navigate('/home')}
              className="text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400 text-sm transition"
            >
              Cancelar y volver
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
