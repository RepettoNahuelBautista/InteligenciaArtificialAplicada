import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

const NAV_ITEMS = [
  { to: '/home',           icon: '🏠', label: 'Inicio' },
  { to: '/recommendation', icon: '✨', label: 'Recomendar' },
  { to: '/history',        icon: '📜', label: 'Historial' },
  { to: '/reviews',        icon: '⭐', label: 'Reseñas' },
  { to: '/lists',          icon: '📋', label: 'Mis Listas' },
  { to: '/users/search',   icon: '👥', label: 'Usuarios' },
  { to: '/profile',        icon: '👤', label: 'Mi Perfil' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.displayName ?? user?.email?.split('@')[0] ?? 'Usuario';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="flex flex-col h-screen bg-white border-r border-zinc-200 dark:bg-[#0a0a1a] dark:border-indigo-900/50 shrink-0 overflow-hidden z-20"
    >
      {/* Logo + collapse toggle */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-zinc-200 dark:border-indigo-900/50">
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="text-zinc-900 dark:text-white font-bold text-lg tracking-tight whitespace-nowrap"
            >
              🎬 RecomiendaFilms
            </motion.span>
          )}
        </AnimatePresence>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 ml-auto"
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {collapsed
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            }
          </svg>
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm font-medium transition-all duration-150
              ${isActive
                ? 'bg-indigo-600 text-white'
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800'}`
            }
          >
            <span className="text-xl shrink-0">{icon}</span>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="whitespace-nowrap overflow-hidden"
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div className="border-t border-zinc-200 dark:border-indigo-900/50 p-3">
        <div className={`flex items-center gap-3 px-2 py-2 rounded-lg ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              : displayName[0].toUpperCase()
            }
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex-1 min-w-0"
              >
                <p className="text-zinc-900 dark:text-white text-sm font-medium truncate">{displayName}</p>
                <p className="text-zinc-400 dark:text-zinc-500 text-xs truncate">{user?.email}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          className={`mt-2 flex items-center gap-2 w-full px-2 py-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-zinc-800 transition text-sm font-medium ${collapsed ? 'justify-center' : ''}`}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
          </svg>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                Cerrar sesión
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
