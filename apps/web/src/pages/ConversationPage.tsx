import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../api/apiClient';
import { useAuth } from '../hooks/useAuth';

interface MessageItem {
  id: string;
  senderId: string;
  text: string;
  readAt: string | null;
  createdAt: string;
}

interface ConversationDetail {
  id: string;
  otherUser: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  messages: MessageItem[];
}

function Avatar({ user, size = 'md' }: { user: { displayName: string; avatarUrl: string | null }; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
  return (
    <div className={`${dim} rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden`}>
      {user.avatarUrl
        ? <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
        : user.displayName[0]?.toUpperCase()}
    </div>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function formatDateSeparator(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Hoy';
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });
}

function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

export function ConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  const fetchDetail = useCallback(async (silent = false) => {
    if (!conversationId) return;
    try {
      const r = await apiClient.get(`/messages/${conversationId}`);
      const data: ConversationDetail = r.data.data;
      setDetail(data);

      const newLastId = data.messages[data.messages.length - 1]?.id ?? null;
      const hasNew = newLastId !== lastMessageIdRef.current;
      lastMessageIdRef.current = newLastId;

      if (hasNew || !silent) {
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: silent ? 'smooth' : 'instant' }), 50);
      }

      // Mark as read in background
      apiClient.patch(`/messages/${conversationId}/read`).catch(() => {});
    } catch {
      if (!silent) setError('No se pudo cargar la conversación');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [conversationId]);

  // Initial load
  useEffect(() => {
    fetchDetail(false);
  }, [fetchDetail]);

  // Polling every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchDetail(true), 4000);
    return () => clearInterval(interval);
  }, [fetchDetail]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || !conversationId) return;
    setSending(true);
    setText('');

    // Optimistic update
    const optimistic: MessageItem = {
      id: `opt-${Date.now()}`,
      senderId: user?.id ?? '',
      text: trimmed,
      readAt: null,
      createdAt: new Date().toISOString(),
    };
    setDetail((prev) => prev ? { ...prev, messages: [...prev.messages, optimistic] } : prev);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    try {
      await apiClient.post(`/messages/${conversationId}`, { text: trimmed });
      await fetchDetail(true);
    } catch {
      // Revert optimistic on error
      setDetail((prev) => prev ? { ...prev, messages: prev.messages.filter((m) => m.id !== optimistic.id) } : prev);
      setText(trimmed);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-zinc-500 dark:text-zinc-400">{error ?? 'Conversación no encontrada'}</p>
        <button onClick={() => navigate('/messages')} className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline">
          ← Volver a mensajes
        </button>
      </div>
    );
  }

  const messages = detail.messages;

  return (
    <div className="flex flex-col h-full max-h-screen">

      {/* Header */}
      <div className="shrink-0 bg-white/80 dark:bg-[#0a0a1a]/80 backdrop-blur-sm border-b border-zinc-200 dark:border-white/10 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/messages')}
          className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 mr-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <Avatar user={detail.otherUser} />
        <div>
          <p className="font-semibold text-zinc-900 dark:text-white text-sm">{detail.otherUser.displayName}</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">En línea recientemente</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        <AnimatePresence initial={false}>
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <p className="text-4xl mb-3">👋</p>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                Iniciá la conversación con <strong>{detail.otherUser.displayName}</strong>
              </p>
            </motion.div>
          )}

          {messages.map((msg, idx) => {
            const isMine = msg.senderId === user?.id;
            const showDate = idx === 0 || !isSameDay(messages[idx - 1].createdAt, msg.createdAt);
            const prevSameSender = idx > 0 && messages[idx - 1].senderId === msg.senderId && !showDate;

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-zinc-200 dark:bg-white/10" />
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">{formatDateSeparator(msg.createdAt)}</span>
                    <div className="flex-1 h-px bg-zinc-200 dark:bg-white/10" />
                  </div>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${prevSameSender ? 'mt-0.5' : 'mt-3'}`}
                >
                  <div className={`flex items-end gap-2 max-w-[75%] ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!isMine && !prevSameSender && <Avatar user={detail.otherUser} size="sm" />}
                    {!isMine && prevSameSender && <div className="w-7 shrink-0" />}
                    <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words whitespace-pre-wrap ${
                        isMine
                          ? 'bg-indigo-600 text-white rounded-br-sm'
                          : 'bg-white/80 dark:bg-white/10 text-zinc-900 dark:text-white border border-white/80 dark:border-white/10 rounded-bl-sm'
                      } ${msg.id.startsWith('opt-') ? 'opacity-70' : ''}`}>
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 px-1">
                        {formatTime(msg.createdAt)}
                        {isMine && msg.readAt && ' · leído'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 bg-white/80 dark:bg-[#0a0a1a]/80 backdrop-blur-sm border-t border-zinc-200 dark:border-white/10 px-4 py-3">
        <div className="flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Escribí un mensaje... (Enter para enviar)"
            className="flex-1 resize-none px-3.5 py-2.5 border border-zinc-200 dark:border-white/10 rounded-xl bg-white/80 dark:bg-white/5 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition placeholder-zinc-400 dark:placeholder-zinc-600 max-h-32 overflow-y-auto"
            style={{ height: 'auto' }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
            }}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition shrink-0 shadow-sm shadow-indigo-500/30"
          >
            {sending
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
            }
          </motion.button>
        </div>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-600 mt-1 text-right">Shift+Enter para nueva línea</p>
      </div>

    </div>
  );
}
