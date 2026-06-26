import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNewFollowers } from '../hooks/useNewFollowers';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { followers, count, markSeen } = useNewFollowers();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleBellClick = () => {
    const opening = !open;
    setOpen((prev) => !prev);
    if (opening && count > 0) markSeen();
  };

  return (
    <div ref={ref} className="fixed top-4 right-6 z-50">
      <button
        onClick={handleBellClick}
        title="Nuevos seguidores"
        className="relative p-2 rounded-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur border border-zinc-200 dark:border-white/10 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white shadow-sm hover:shadow-md transition"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-zinc-100 dark:border-white/10">
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                {followers.length > 0
                  ? `${followers.length} nuevo${followers.length > 1 ? 's' : ''} seguidor${followers.length > 1 ? 'es' : ''}`
                  : 'Sin seguidores nuevos'}
              </p>
            </div>

            {followers.length === 0 ? (
              <p className="px-4 py-6 text-sm text-zinc-400 text-center">
                No tenés seguidores nuevos por ahora.
              </p>
            ) : (
              <ul className="max-h-64 overflow-y-auto divide-y divide-zinc-100 dark:divide-white/5">
                {followers.map((f) => (
                  <li key={f.userId}>
                    <button
                      onClick={() => { setOpen(false); navigate(`/users/${f.userId}`); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition text-left"
                    >
                      <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
                        {f.avatarUrl
                          ? <img src={f.avatarUrl} alt={f.displayName} className="w-full h-full object-cover" />
                          : f.displayName[0].toUpperCase()
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{f.displayName}</p>
                        <p className="text-xs text-zinc-400 truncate">{f.email}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
