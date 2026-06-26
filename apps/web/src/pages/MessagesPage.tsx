import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../api/apiClient';
import { useAuth } from '../hooks/useAuth';

interface OtherUser {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

interface ConversationSummary {
  id: string;
  otherUser: OtherUser;
  lastMessage: { text: string; senderId: string; createdAt: string } | null;
  unreadCount: number;
  updatedAt: string;
}

interface SearchUser {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  email: string;
}

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white/60 dark:bg-white/5 border border-white/80 dark:border-white/10 backdrop-blur-sm rounded-2xl shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function Avatar({ user, size = 'md' }: { user: { displayName: string; avatarUrl: string | null }; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return (
    <div className={`${dim} rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden`}>
      {user.avatarUrl
        ? <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
        : user.displayName[0]?.toUpperCase()}
    </div>
  );
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'ahora';
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  return `hace ${d}d`;
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };

export function MessagesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiClient.get('/messages')
      .then((r) => setConversations(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!showSearch) { setQuery(''); setSearchResults([]); return; }
    setTimeout(() => searchRef.current?.focus(), 80);
  }, [showSearch]);

  useEffect(() => {
    if (!query.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await apiClient.get('/users/search', { params: { q: query } });
        setSearchResults((r.data.data as SearchUser[]).filter((u) => u.userId !== user?.id));
      } catch {}
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query, user?.id]);

  const startChat = async (otherUserId: string) => {
    setStarting(otherUserId);
    setStartError(null);
    try {
      const r = await apiClient.post('/messages/start', { otherUserId });
      navigate(`/messages/${r.data.data.id}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setStartError(e.response?.data?.error?.message ?? e.message ?? 'Error al iniciar la conversación');
      setStarting(null);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white">Mensajes</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Conversaciones con otros usuarios</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowSearch((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition shadow-sm shadow-indigo-500/30"
          >
            <span className="text-lg leading-none">{showSearch ? '✕' : '✉️'}</span>
            {showSearch ? 'Cancelar' : 'Nuevo chat'}
          </motion.button>
        </motion.div>

        {/* New conversation search */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden mb-5"
            >
              <GlassCard className="p-4">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Buscar usuario</p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">🔍</span>
                  <input
                    ref={searchRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Nombre o email..."
                    className="w-full pl-9 pr-3 py-2 border border-zinc-200 dark:border-white/10 rounded-xl bg-white/80 dark:bg-white/5 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition placeholder-zinc-400 dark:placeholder-zinc-600"
                  />
                </div>
                <AnimatePresence>
                  {startError && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="mt-2 text-red-600 dark:text-red-400 text-sm bg-red-500/10 px-3 py-2 rounded-xl">
                      {startError}
                    </motion.p>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {(searching || searchResults.length > 0) && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="mt-2 space-y-1"
                    >
                      {searching && (
                        <div className="flex justify-center py-4">
                          <span className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                      {!searching && searchResults.map((u) => (
                        <button
                          key={u.userId}
                          onClick={() => startChat(u.userId)}
                          disabled={starting === u.userId}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/8 transition text-left disabled:opacity-60"
                        >
                          <Avatar user={u} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{u.displayName}</p>
                            <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">{u.email}</p>
                          </div>
                          {starting === u.userId
                            ? <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            : <span className="text-zinc-300 dark:text-zinc-600 text-xs">→</span>}
                        </button>
                      ))}
                      {!searching && query.trim() && searchResults.length === 0 && (
                        <p className="text-center text-zinc-400 dark:text-zinc-500 text-sm py-4">No se encontraron usuarios</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Conversation list */}
        {loading ? (
          <div className="flex justify-center py-20">
            <span className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
            <p className="text-5xl mb-4">✉️</p>
            <p className="font-bold text-zinc-900 dark:text-white mb-1">Aún no tenés mensajes</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Iniciá una conversación con otro usuario</p>
          </motion.div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2">
            {conversations.map((conv) => (
              <motion.div key={conv.id} variants={fadeUp}>
                <button onClick={() => navigate(`/messages/${conv.id}`)} className="w-full text-left group">
                  <GlassCard className="px-4 py-3.5 hover:bg-white/80 dark:hover:bg-white/10 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <Avatar user={conv.otherUser} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className={`text-sm font-semibold truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition ${conv.unreadCount > 0 ? 'text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>
                            {conv.otherUser.displayName}
                          </p>
                          <span className="text-xs text-zinc-400 dark:text-zinc-500 shrink-0 ml-2">
                            {conv.lastMessage ? relativeTime(conv.lastMessage.createdAt) : relativeTime(conv.updatedAt)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-zinc-700 dark:text-zinc-300 font-medium' : 'text-zinc-400 dark:text-zinc-500'}`}>
                            {conv.lastMessage
                              ? (conv.lastMessage.senderId === user?.id ? 'Vos: ' : '') + conv.lastMessage.text
                              : 'Sin mensajes aún'}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="shrink-0 w-5 h-5 bg-indigo-600 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                              {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}

      </div>
    </div>
  );
}
