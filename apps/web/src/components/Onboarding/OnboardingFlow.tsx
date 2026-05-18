import { FC, useState, useEffect } from 'react';
import { GenreSelector } from './GenreSelector';
import { PersonSelector } from './PersonSelector';
import { MovieRater } from './MovieRater';
import { useGenreSelector, useOnboarding } from '../../hooks/useOnboarding';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';

export const OnboardingFlow: FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    step,
    nextStep,
    prevStep,
    selectedGenres,
    setSelectedGenres,
    isLoading,
    setIsLoading,
    error,
    setError,
  } = useOnboarding();

  // Person preferences
  const [selectedDirectorIds, setSelectedDirectorIds] = useState<number[]>([]);
  const [selectedActorIds, setSelectedActorIds] = useState<number[]>([]);

  // Summary counts (fetched from API when reaching step 5)
  const [summaryCounts, setSummaryCounts] = useState({ genres: 0, directors: 0, actors: 0, movies: 0 });

  const { selectedGenres: tempGenres, setSelectedGenres: setTempGenres, genres, contentType, setContentType, toggleGenre, isValid } =
    useGenreSelector();

  // Pre-cargar géneros existentes del perfil
  useEffect(() => {
    const loadExistingGenres = async () => {
      try {
        const response = await apiClient.get('/profile');
        const existingGenres: number[] = response.data?.data?.preferences?.genres ?? [];
        if (existingGenres.length > 0) {
          setTempGenres(existingGenres);
        }
      } catch {
        // Perfil no encontrado, comenzar desde cero
      }
    };
    loadExistingGenres();
  }, []);

  // Cuando llega al resumen, carga los conteos reales desde la API
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
      } catch {
        // ignore
      }
    };
    fetchCounts();
  }, [step]);

  const handleNext = async () => {
    if (step === 1) {
      // Step 1: Genres - validate and save
      if (!isValid) {
        setError('Debes seleccionar al menos 3 géneros');
        return;
      }

      setSelectedGenres(tempGenres);
      setIsLoading(true);

      try {
        await apiClient.post('/profile/genres', {
          genreIds: tempGenres,
        });

        setError('');
        nextStep();
      } catch (err: unknown) {
        const error = err as { response?: { data?: { error?: { message?: string } } } };
        setError(error.response?.data?.error?.message || 'Error guardando géneros');
      } finally {
        setIsLoading(false);
      }
    } else if (step === 2) {
      // Step 2: Directors - save if any selected
      if (selectedDirectorIds.length > 0) {
        setIsLoading(true);
        try {
          await apiClient.post('/profile/people', {
            personIds: selectedDirectorIds,
            type: 'directors',
          });
          setError('');
        } catch (err: unknown) {
          const error = err as { response?: { data?: { error?: { message?: string } } } };
          setError(error.response?.data?.error?.message || 'Error guardando directores');
          setIsLoading(false);
          return;
        } finally {
          setIsLoading(false);
        }
      }
      nextStep();
    } else if (step === 3) {
      // Step 3: Actors - save if any selected
      if (selectedActorIds.length > 0) {
        setIsLoading(true);
        try {
          await apiClient.post('/profile/people', {
            personIds: selectedActorIds,
            type: 'actors',
          });
          setError('');
        } catch (err: unknown) {
          const error = err as { response?: { data?: { error?: { message?: string } } } };
          setError(error.response?.data?.error?.message || 'Error guardando actores');
          setIsLoading(false);
          return;
        } finally {
          setIsLoading(false);
        }
      }
      nextStep();
    } else if (step === 4) {
      // Step 4: Movies - no validation needed (optional)
      nextStep();
    } else {
      nextStep();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🎬 RecomiendaFilms</h1>
          <p className="text-indigo-100">
            Cuéntanos tus gustos (Paso {step}/5)
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 flex gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full transition ${
                s <= step ? 'bg-white' : 'bg-indigo-300'
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>
          )}

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
            <PersonSelector
              type="directors"
              onSelectionChange={setSelectedDirectorIds}
            />
          )}

          {step === 3 && (
            <PersonSelector
              type="actors"
              onSelectionChange={setSelectedActorIds}
            />
          )}

          {step === 4 && (
            <MovieRater />
          )}

          {step === 5 && (
            <div className="text-center py-12">
              <p className="text-2xl font-bold text-gray-800 mb-4">
                ¡Tu perfil está listo! 🎉
              </p>
              <p className="text-gray-600 mb-6">
                Hemos guardado tus preferencias:
              </p>
              <div className="space-y-2 text-left bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <span className="font-semibold">{summaryCounts.genres}</span> géneros favoritos
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">{summaryCounts.directors}</span> directores favoritos
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">{summaryCounts.actors}</span> actores favoritos
                </p>
                <p className="text-gray-700 border-t pt-2 mt-2">
                  <span className="font-semibold">{summaryCounts.movies}</span> películas valoradas
                </p>
              </div>
              <p className="text-gray-500 mt-6">
                Ahora puedes empezar a recibir recomendaciones personalizadas basadas en tus gustos
              </p>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            onClick={prevStep}
            disabled={step === 1 || isLoading}
            className="flex-1 bg-white text-primary py-3 rounded-lg font-medium hover:bg-gray-100 disabled:opacity-50"
          >
            ← Atrás
          </button>

          {step < 5 && (
            <button
              onClick={handleNext}
              disabled={isLoading || (step === 1 && !isValid)}
              className="flex-1 bg-white text-primary py-3 rounded-lg font-medium hover:bg-gray-100 disabled:opacity-50"
            >
              {isLoading ? 'Guardando...' : 'Siguiente →'}
            </button>
          )}

          {step === 5 && (
            <button
              onClick={() => navigate('/home')}
              className="flex-1 bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600"
            >
              Comenzar ✓
            </button>
          )}
        </div>

        {/* User info */}
        <div className="text-center text-white mt-8 text-sm">
          <p>
            {user?.displayName ?? user?.email?.split('@')[0] ?? 'Usuario'}, contanos sobre vos
          </p>
        </div>
      </div>
    </div>
  );
};
