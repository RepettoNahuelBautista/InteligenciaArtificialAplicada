import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import apiClient from '../api/apiClient';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return 'Buenos días';
  if (h >= 12 && h < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

function MarkdownText({ text }: { text: string }) {
  // Very simple inline rendering: bold, code, line breaks
  const lines = text.split('\n');
  return (
    <div className="space-y-1 leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith('### ')) return <p key={i} className="font-bold text-base mt-2">{line.slice(4)}</p>;
        if (line.startsWith('## '))  return <p key={i} className="font-bold text-lg mt-2">{line.slice(3)}</p>;
        if (line.startsWith('# '))   return <p key={i} className="font-bold text-xl mt-2">{line.slice(2)}</p>;
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return <p key={i} className="ml-3 before:content-['•'] before:mr-2 before:text-indigo-400">{line.slice(2)}</p>;
        }
        if (line.trim() === '') return <div key={i} className="h-1" />;
        // inline bold: **text**
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i}>
            {parts.map((part, j) =>
              part.startsWith('**') && part.endsWith('**')
                ? <strong key={j}>{part.slice(2, -2)}</strong>
                : part
            )}
          </p>
        );
      })}
    </div>
  );
}

export function ChatPage() {
  const { user } = useAuth();
  const displayName = user?.displayName ?? user?.email?.split('@')[0] ?? 'Usuario';
  const greeting = getGreeting();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, text: m.text }));
      const res = await apiClient.post<{ success: boolean; data: { text: string } }>(
        '/chat',
        { message: text, history }
      );
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: res.data.data.text,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'model', text: 'Ocurrió un error. Intentá de nuevo.' },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full">

      {/* Header greeting — shown when chat is empty */}
      <AnimatePresence>
        {isEmpty && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="flex flex-col items-center justify-center flex-1 px-6 pb-40 text-center"
          >
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-3">
              {greeting}, <span className="text-indigo-500 dark:text-indigo-400">{displayName}</span>
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-lg">
              ¿En qué puedo ayudarte hoy?
            </p>
            <p className="text-zinc-400 dark:text-zinc-600 text-sm mt-2">
              Preguntame sobre películas, series, actores o directores.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      {!isEmpty && (
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'model' && (
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm shrink-0 mr-3 mt-0.5">
                    🎬
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white rounded-bl-sm shadow-sm'
                  }`}
                >
                  {msg.role === 'model'
                    ? <MarkdownText text={msg.text} />
                    : <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  }
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm shrink-0 mr-3 mt-0.5">
                🎬
              </div>
              <div className="bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center h-5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-indigo-400"
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>
      )}

      {/* Input bar */}
      <div className={`px-4 sm:px-8 pb-6 ${isEmpty ? '' : 'pt-2'}`}>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-white/10 rounded-2xl shadow-lg px-4 py-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
              }}
              onKeyDown={handleKey}
              placeholder="Preguntame sobre una película o serie..."
              rows={1}
              className="flex-1 resize-none bg-transparent text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-sm outline-none leading-relaxed"
              style={{ maxHeight: '160px' }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="shrink-0 w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed text-white flex items-center justify-center transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-center text-xs text-zinc-400 dark:text-zinc-600 mt-2">
            Presioná Enter para enviar · Shift+Enter para nueva línea
          </p>
        </div>
      </div>

    </div>
  );
}
