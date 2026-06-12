import { useState } from 'react';
import { LoginForm } from '../components/Auth/LoginForm';
import { RegisterForm } from '../components/Auth/RegisterForm';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-300 via-amber-100 to-stone-300 dark:from-indigo-950 dark:via-purple-950 dark:to-violet-950 p-4">
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
