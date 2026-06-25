import { motion } from 'framer-motion';
import { FeedMovie } from '../../hooks/useFeed';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w300';

interface FeedMovieCardProps {
  movie: FeedMovie;
  index: number;
}

/** Compact vertical card used in horizontal feed rows. */
export function FeedMovieCard({ movie, index }: FeedMovieCardProps) {
  const subtitle = movie.likedByCount !== undefined
    ? `${movie.likedByCount} ${movie.likedByCount === 1 ? 'persona la vio' : 'personas la vieron'}`
    : movie.likedBy && movie.likedBy.length > 0
      ? `Le gustó a ${movie.likedBy.slice(0, 2).join(' y ')}${movie.likedBy.length > 2 ? ` y ${movie.likedBy.length - 2} más` : ''}`
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="shrink-0 w-36 group cursor-default"
    >
      {/* Poster */}
      <div className="relative w-36 h-52 rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 mb-2">
        {movie.posterPath ? (
          <img
            src={`${TMDB_IMAGE_BASE}${movie.posterPath}`}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            🎬
          </div>
        )}

        {/* Liked-by count badge for trending */}
        {movie.likedByCount !== undefined && (
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-1">
            <span>❤️</span>
            <span>{movie.likedByCount}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <p className="text-zinc-900 dark:text-white text-xs font-semibold leading-tight line-clamp-2 mb-0.5">
        {movie.title}
      </p>
      {subtitle && (
        <p className="text-zinc-500 text-xs leading-tight line-clamp-2">{subtitle}</p>
      )}
    </motion.div>
  );
}

/** Skeleton placeholder shown while the feed is loading. */
export function FeedMovieCardSkeleton() {
  return (
    <div className="shrink-0 w-36 animate-pulse">
      <div className="w-36 h-52 rounded-xl bg-zinc-200 dark:bg-zinc-800 mb-2" />
      <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-4/5 mb-1" />
      <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-3/5" />
    </div>
  );
}
