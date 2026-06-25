import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';

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

  return (
    <div className="flex h-screen overflow-hidden relative bg-gradient-to-br from-slate-50 via-indigo-50 to-violet-50 dark:from-zinc-950 dark:via-indigo-950 dark:to-zinc-950">

      {/* Decorative blobs — shared across all pages */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-indigo-300/30 dark:bg-indigo-600/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-violet-300/25 dark:bg-purple-600/15 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 right-0 w-72 h-72 rounded-full bg-purple-200/20 dark:bg-indigo-500/10 blur-3xl" />

      <Sidebar />

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
