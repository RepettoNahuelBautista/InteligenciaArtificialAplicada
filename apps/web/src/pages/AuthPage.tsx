import { useState } from 'react';
import { LoginForm } from '../components/Auth/LoginForm';
import { RegisterForm } from '../components/Auth/RegisterForm';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50 to-violet-50 dark:from-zinc-950 dark:via-indigo-950 dark:to-zinc-950 p-4">
      <div className="pointer-events-none fixed -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-indigo-300/30 dark:bg-indigo-600/20 blur-3xl" />
      <div className="pointer-events-none fixed bottom-0 right-1/4 w-96 h-96 rounded-full bg-violet-300/25 dark:bg-purple-600/15 blur-3xl" />
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border border-zinc-200">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">🎬 RecomiendaFilms</h1>
          <p className="text-zinc-500">Recomendaciones de películas personalizadas por IA</p>
        </div>

        {isLogin ? (
          <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
        ) : (
          <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
}
