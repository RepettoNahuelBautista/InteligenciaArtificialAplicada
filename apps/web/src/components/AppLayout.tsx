import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { NotificationBell } from './NotificationBell';
import { ChatWidget } from './ChatWidget';
import { useAuth } from '../hooks/useAuth';
import apiClient from '../api/apiClient';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
};

interface AppLayoutProps {
  children: React.ReactNode;
}

/** Wraps all authenticated pages with the sidebar + animated content area. */
export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const { user, updateUser } = useAuth();

  // Sync avatarUrl / displayName from the server on first load for sessions
  // that were stored before those fields were added to the login response.
  useEffect(() => {
    if (!user) return;
    if (user.avatarUrl !== undefined && user.displayName !== undefined) return;
    apiClient.get('/profile').then((res) => {
      const info = res.data?.data?.personalInfo;
      if (!info) return;
      updateUser({
        displayName: info.displayName ?? null,
        avatarUrl: info.avatarUrl ?? null,
      });
    }).catch(() => { /* silent — non-critical */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen overflow-hidden relative">

      {/* Fixed background — covers the full viewport regardless of scroll or content height */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#f5f0e8] via-[#faf5ec] to-[#f0ebe0] dark:from-zinc-950 dark:via-indigo-950 dark:to-zinc-950" />

      {/* Decorative blobs — fixed so they don't cut at the fold */}
      <div className="pointer-events-none fixed -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-amber-200/20 dark:bg-indigo-600/20 blur-3xl -z-10" />
      <div className="pointer-events-none fixed bottom-0 right-1/4 w-96 h-96 rounded-full bg-orange-200/15 dark:bg-purple-600/15 blur-3xl -z-10" />
      <div className="pointer-events-none fixed top-1/2 right-0 w-72 h-72 rounded-full bg-yellow-100/25 dark:bg-indigo-500/10 blur-3xl -z-10" />

      <Sidebar />
      <NotificationBell />
      <ChatWidget />

      <motion.main
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="flex-1 overflow-y-auto relative"
      >
        {children}
      </motion.main>
    </div>
  );
}
