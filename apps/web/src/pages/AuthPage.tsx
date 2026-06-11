import { useState } from 'react';
import { LoginForm } from '../components/Auth/LoginForm';
import { RegisterForm } from '../components/Auth/RegisterForm';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-100 via-zinc-50 to-stone-100 dark:from-indigo-950 dark:via-purple-950 dark:to-violet-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-8 border border-zinc-200 dark:border-zinc-700">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary dark:text-indigo-400 mb-2">🎬 RecomiendaFilms</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Recomendaciones de películas personalizadas por IA</p>
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
