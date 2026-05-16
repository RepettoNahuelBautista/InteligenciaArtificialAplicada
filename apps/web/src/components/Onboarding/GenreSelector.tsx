import { FC } from 'react';
import { MOVIE_GENRES, TV_GENRES } from '../../schemas/genres';

interface GenreSelectorProps {
  selectedGenres: number[];
  onToggleGenre: (genreId: number) => void;
  contentType: 'movie' | 'tv';
  onContentTypeChange: (type: 'movie' | 'tv') => void;
  isValid: boolean;
}

export const GenreSelector: FC<GenreSelectorProps> = ({
  selectedGenres,
  onToggleGenre,
  contentType,
  onContentTypeChange,
  isValid,
}) => {
  const genres = contentType === 'tv' ? TV_GENRES : MOVIE_GENRES;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">¿Películas o Series?</h3>
        <div className="flex gap-4">
          <button
            onClick={() => onContentTypeChange('movie')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
              contentType === 'movie'
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🎬 Películas
          </button>
          <button
            onClick={() => onContentTypeChange('tv')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
              contentType === 'tv'
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📺 Series
          </button>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Selecciona tus géneros favoritos</h3>
          <span className={`text-sm ${selectedGenres.length >= 3 ? 'text-green-600' : 'text-gray-600'}`}>
            {selectedGenres.length}/3 mínimo
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {genres.map((genre: { id: number; name: string }) => (
            <button
              key={genre.id}
              onClick={() => onToggleGenre(genre.id)}
              className={`py-3 px-4 rounded-lg font-medium transition text-center ${
                selectedGenres.includes(genre.id)
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {genre.name}
            </button>
          ))}
        </div>

        {!isValid && selectedGenres.length > 0 && selectedGenres.length < 3 && (
          <p className="text-red-600 text-sm mt-4">
            ⚠️ Debes seleccionar al menos 3 géneros para continuar
          </p>
        )}
      </div>
    </div>
  );
};
