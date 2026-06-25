import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useFeed } from '../hooks/useFeed';
import { FeedMovieCard, FeedMovieCardSkeleton } from '../components/Feed/FeedMovieCard';

const MOOD_CHIPS = [
  { emoji: '😄', label: 'Alegre' },
  { emoji: '😢', label: 'Melancólico' },
  { emoji: '😱', label: 'Adrenalina' },
  { emoji: '🤔', label: 'Reflexivo' },
  { emoji: '😍', label: 'Romántico' },
  { emoji: '😂', label: 'Para reír' },
];

const QUICK_ACTIONS = [
  {
    to: '/onboarding?mode=edit',
    icon: '🎯',
    title: 'Mis Preferencias',
    desc: 'Géneros, directores y actores favoritos',
    color: 'from-indigo-600 to-indigo-500',
  },
  {
    to: '/history',
    icon: '📜',
    title: 'Historial',
    desc: 'Recomendaciones previas',
    color: 'from-amber-600 to-orange-500',
  },
  {
    to: '/reviews',
    icon: '⭐',
    title: 'Reseñas',
    desc: 'Opiniones de la comunidad',
    color: 'from-yellow-500 to-amber-400',
  },
  {
    to: '/lists',
    icon: '📋',
    title: 'Mis Listas',
    desc: 'Organizá tus favoritas',
    color: 'from-teal-600 to-cyan-500',
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

export function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.displayName ?? user?.email?.split('@')[0] ?? 'Usuario';
  const { data: feed, isLoading: feedLoading } = useFeed();

  return (
    <div className="min-h-screen text-zinc-900 dark:text-white">

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-100/60 via-violet-50 to-purple-100/50 dark:from-zinc-900 dark:via-indigo-950 dark:to-zinc-900 px-8 pt-16 pb-20">
        <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-indigo-300/30 dark:bg-indigo-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 right-0 w-80 h-80 rounded-full bg-violet-300/25 dark:bg-purple-600/15 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative max-w-3xl"
        >
          <p className="text-indigo-500 dark:text-indigo-400 font-semibold text-sm tracking-widest uppercase mb-3">
            Bienvenido de vuelta, {displayName} 👋
          </p>
          <h1 className="text-5xl font-extrabold leading-tight mb-4 text-zinc-900 dark:text-white">
            ¿Qué vas a ver<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400">
              esta noche?
            </span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg mb-8 max-w-xl">
            Tu motor de recomendación inteligente de películas y series, personalizado para vos.
          </p>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/recommendation')}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-4 rounded-2xl text-lg shadow-lg shadow-indigo-500/20 dark:shadow-indigo-900/50 transition-colors"
          >
            ✨ Obtener recomendación
          </motion.button>
        </motion.div>

        {/* Mood chips */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
          className="relative mt-10 flex flex-wrap gap-3"
        >
          <span className="text-zinc-400 dark:text-zinc-500 text-sm self-center mr-1">¿Cómo te sentís?</span>
          {MOOD_CHIPS.map(({ emoji, label }) => (
            <button
              key={label}
              onClick={() => navigate('/recommendation')}
              className="flex items-center gap-1.5 bg-white/80 hover:bg-indigo-50 border border-zinc-200 hover:border-indigo-300 text-zinc-600 hover:text-indigo-700 dark:bg-zinc-800/80 dark:hover:bg-indigo-700/60 dark:border-zinc-700 dark:hover:border-indigo-500 dark:text-zinc-300 dark:hover:text-white text-sm px-3.5 py-1.5 rounded-full transition-all duration-150"
            >
              <span>{emoji}</span>
              <span>{label}</span>
            </button>
          ))}
        </motion.div>
      </section>

      {/* ── Quick access grid ──────────────────────────────── */}
      <section className="px-8 py-12 max-w-5xl">
        <h2 className="text-zinc-400 text-xs font-semibold tracking-widest uppercase mb-6">Acceso rápido</h2>
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {QUICK_ACTIONS.map(({ to, icon, title, desc, color }) => (
            <motion.div key={to} variants={item}>
              <button
                onClick={() => navigate(to)}
                className="w-full text-left group bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-zinc-300 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 dark:border-zinc-700/60 dark:hover:border-zinc-600 rounded-2xl p-5 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-xl mb-4 shadow-lg`}>
                  {icon}
                </div>
                <p className="text-zinc-900 dark:text-white font-semibold text-sm mb-1">{title}</p>
                <p className="text-zinc-500 text-xs leading-snug">{desc}</p>
              </button>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Trending on platform ──────────────────────────── */}
      {(feedLoading || (feed && feed.trending.length > 0)) && (
        <section className="px-8 pb-10">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-lg">🔥</span>
            <h2 className="text-zinc-900 dark:text-white font-bold text-lg">Tendencias en RecomiendaFilms</h2>
            <span className="text-zinc-400 dark:text-zinc-500 text-sm ml-1">· lo más visto por la comunidad</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
            {feedLoading
              ? Array.from({ length: 8 }).map((_, i) => <FeedMovieCardSkeleton key={i} />)
              : feed!.trending.map((movie, i) => (
                  <FeedMovieCard key={movie.tmdbId} movie={movie} index={i} />
                ))}
          </div>
        </section>
      )}

      {/* ── From people you follow ─────────────────────────── */}
      {!feedLoading && feed && feed.fromFollowing.length > 0 && (
        <section className="px-8 pb-10">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-lg">👥</span>
            <h2 className="text-zinc-900 dark:text-white font-bold text-lg">Porque seguís a...</h2>
            <span className="text-zinc-400 dark:text-zinc-500 text-sm ml-1">· gustos de las personas que seguís</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
            {feed.fromFollowing.map((movie, i) => (
              <FeedMovieCard key={movie.tmdbId} movie={movie} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* ── Users discovery ───────────────────────────────── */}
      <section className="px-8 pb-12">
        <div
          onClick={() => navigate('/users/search')}
          className="cursor-pointer max-w-5xl bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-zinc-300 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 dark:border-zinc-700/50 dark:hover:border-zinc-600 rounded-2xl p-6 flex items-center gap-5 transition-all duration-200 hover:shadow-xl group"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-2xl shadow-lg shrink-0">
            👥
          </div>
          <div>
            <p className="text-zinc-900 dark:text-white font-semibold mb-0.5">Buscar usuarios</p>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">Encontrá otros usuarios, mirá sus reseñas y seguílos.</p>
          </div>
          <svg className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-600 dark:group-hover:text-zinc-300 ml-auto transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </section>

    </div>
  );
}
