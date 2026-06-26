import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../api/apiClient';
import { useAuth } from '../hooks/useAuth';

interface ConvSummary {
  id: string;
  otherUser: { id: string; displayName: string; avatarUrl: string | null };
  lastMessage: { text: string; senderId: string; createdAt: string } | null;
  unreadCount: number;
  updatedAt: string;
}

interface MessageItem {
  id: string;
  senderId: string;
  text: string;
  readAt: string | null;
  createdAt: string;
}

interface OpenChat {
  conversationId: string;
  otherUser: { id: string; displayName: string; avatarUrl: string | null };
  minimized: boolean;
}

function Avatar({ name, url, className }: { name: string; url: string | null; className: string }) {
  return (
    <div className={`rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden ${className}`}>
      {url
        ? <img src={url} alt={name} className="w-full h-full object-cover" />
        : (name[0] ?? '?').toUpperCase()}
    </div>
  );
}

function relTime(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'ahora';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

// ─── Mini chat window ────────────────────────────────────────────────────────

interface MiniChatProps {
  conversationId: string;
  otherUser: { id: string; displayName: string; avatarUrl: string | null };
  minimized: boolean;
  onClose: () => void;
  onToggleMinimize: () => void;
}

function MiniChat({ conversationId, otherUser, minimized, onClose, onToggleMinimize }: MiniChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastCountRef = useRef(0);

  const loadMessages = useCallback(async () => {
    try {
      const r = await apiClient.get(`/messages/${conversationId}`);
      const msgs: MessageItem[] = r.data.data.messages;
      setMessages(msgs);
      if (msgs.length > lastCountRef.current) {
        lastCountRef.current = msgs.length;
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
      apiClient.patch(`/messages/${conversationId}/read`).catch(() => {});
    } catch {}
  }, [conversationId]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 4000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    if (!minimized) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
        inputRef.current?.focus();
      }, 120);
    }
  }, [minimized]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText('');
    const opt: MessageItem = {
      id: `opt-${Date.now()}`,
      senderId: user?.id ?? '',
      text: trimmed,
      readAt: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => {
      lastCountRef.current = prev.length + 1;
      return [...prev, opt];
    });
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    try {
      await apiClient.post(`/messages/${conversationId}`, { text: trimmed });
      await loadMessages();
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== opt.id));
      setText(trimmed);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.18 }}
      className="w-72 flex flex-col rounded-t-2xl overflow-hidden shadow-2xl border border-white/20 dark:border-white/10"
      style={{ height: minimized ? 'auto' : '380px' }}
    >
      {/* Header */}
      <div
        onClick={onToggleMinimize}
        className="flex items-center gap-2.5 px-3 py-2.5 bg-indigo-600 text-white cursor-pointer select-none shrink-0"
      >
        <Avatar name={otherUser.displayName} url={otherUser.avatarUrl} className="w-7 h-7 text-xs" />
        <span className="flex-1 text-sm font-semibold truncate">{otherUser.displayName}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleMinimize(); }}
          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 transition text-xs font-bold"
          title={minimized ? 'Expandir' : 'Minimizar'}
        >
          {minimized ? '▲' : '▼'}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 transition text-xs font-bold"
          title="Cerrar"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <AnimatePresence>
        {!minimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col flex-1 overflow-hidden"
          >
            {/* Messages */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-900 px-3 py-3 space-y-1.5">
              {messages.length === 0 && (
                <p className="text-center text-zinc-400 dark:text-zinc-500 text-xs py-10">
                  Iniciá la conversación 👋
                </p>
              )}
              {messages.map((msg) => {
                const isMine = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[82%] px-3 py-1.5 rounded-2xl text-sm leading-relaxed break-words ${
                        isMine
                          ? 'bg-indigo-600 text-white rounded-br-sm'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-bl-sm'
                      } ${msg.id.startsWith('opt-') ? 'opacity-60' : ''}`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-white/10 px-3 py-2 flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSend(); } }}
                placeholder="Aa"
                className="flex-1 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full text-sm text-zinc-900 dark:text-white focus:outline-none placeholder-zinc-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500 transition"
              />
              <button
                onClick={handleSend}
                disabled={!text.trim() || sending}
                className="text-indigo-600 dark:text-indigo-400 disabled:opacity-30 font-bold text-base transition hover:text-indigo-700 dark:hover:text-indigo-300"
              >
                {sending ? '…' : '➤'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Core widget (all hooks here, never conditionally rendered) ───────────────

function ChatWidgetCore() {
  const navigate = useNavigate();
  const [panelOpen, setPanelOpen] = useState(false);
  const [conversations, setConversations] = useState<ConvSummary[]>([]);
  const [openChats, setOpenChats] = useState<OpenChat[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const r = await apiClient.get('/messages');
      setConversations(r.data.data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    }
    if (panelOpen) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [panelOpen]);

  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);

  const openChat = (conv: ConvSummary) => {
    setPanelOpen(false);
    setOpenChats((prev) => {
      const existing = prev.find((c) => c.conversationId === conv.id);
      if (existing) {
        return prev.map((c) =>
          c.conversationId === conv.id ? { ...c, minimized: false } : c
        );
      }
      const next: OpenChat = {
        conversationId: conv.id,
        otherUser: conv.otherUser,
        minimized: false,
      };
      return [next, ...prev].slice(0, 2);
    });
  };

  const closeChat = (id: string) =>
    setOpenChats((prev) => prev.filter((c) => c.conversationId !== id));

  const toggleMinimize = (id: string) =>
    setOpenChats((prev) =>
      prev.map((c) => c.conversationId === id ? { ...c, minimized: !c.minimized } : c)
    );

  return (
    <div className="fixed bottom-0 right-10 z-40 flex flex-row-reverse items-end gap-3 pointer-events-none">

      {/* Toggle button + panel */}
      <div ref={panelRef} className="relative pointer-events-auto mb-5">

        {/* Conversations panel */}
        <AnimatePresence>
          {panelOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-14 right-0 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-zinc-100 dark:border-white/10 flex items-center justify-between">
                <p className="text-sm font-bold text-zinc-900 dark:text-white">Mensajes</p>
                <button
                  onClick={() => { setPanelOpen(false); navigate('/messages'); }}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                >
                  Ver todos →
                </button>
              </div>

              {conversations.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-2xl mb-2">✉️</p>
                  <p className="text-sm text-zinc-400 dark:text-zinc-500">No tenés conversaciones aún</p>
                </div>
              ) : (
                <ul className="max-h-80 overflow-y-auto divide-y divide-zinc-100 dark:divide-white/5">
                  {conversations.map((conv) => (
                    <li key={conv.id}>
                      <button
                        onClick={() => openChat(conv)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition text-left"
                      >
                        <Avatar name={conv.otherUser.displayName} url={conv.otherUser.avatarUrl} className="w-9 h-9 text-sm" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-bold text-zinc-900 dark:text-white' : 'font-medium text-zinc-700 dark:text-zinc-300'}`}>
                              {conv.otherUser.displayName}
                            </p>
                            {conv.lastMessage && (
                              <span className="text-[10px] text-zinc-400 shrink-0">
                                {relTime(conv.lastMessage.createdAt)}
                              </span>
                            )}
                          </div>
                          <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-zinc-700 dark:text-zinc-300 font-medium' : 'text-zinc-400 dark:text-zinc-500'}`}>
                            {conv.lastMessage?.text ?? 'Sin mensajes aún'}
                          </p>
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="shrink-0 w-5 h-5 bg-indigo-600 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setPanelOpen((v) => !v)}
          className="relative w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-all duration-300 flex items-center justify-center"
          title="Mensajes"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
          </svg>
          <AnimatePresence>
            {totalUnread > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none"
              >
                {totalUnread > 99 ? '99+' : totalUnread}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Open mini chats */}
      <AnimatePresence>
        {openChats.map((chat) => (
          <div key={chat.conversationId} className="pointer-events-auto">
            <MiniChat
              conversationId={chat.conversationId}
              otherUser={chat.otherUser}
              minimized={chat.minimized}
              onClose={() => closeChat(chat.conversationId)}
              onToggleMinimize={() => toggleMinimize(chat.conversationId)}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Public export — hidden on /messages/* pages ─────────────────────────────

export function ChatWidget() {
  const location = useLocation();
  if (location.pathname.startsWith('/messages')) return null;
  return <ChatWidgetCore />;
}
