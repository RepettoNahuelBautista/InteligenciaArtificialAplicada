import { FC, useState } from 'react';
import { useAuthForm } from '../../hooks/useAuthForm';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

function validatePassword(password: string): string[] {
  const errors: string[] = [];
  if (password.length < 8) errors.push('mínimo 8 caracteres');
  if (!/[A-Z]/.test(password)) errors.push('al menos una mayúscula');
  if (!/[0-9]/.test(password)) errors.push('al menos un número');
  return errors;
}

export const RegisterForm: FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const { email, setEmail, password, setPassword, error, isLoading, handleRegister } =
    useAuthForm();
  const [showPassword, setShowPassword] = useState(false);

  const passwordErrors = password.length > 0 ? validatePassword(password) : [];
  const isPasswordValid = password.length > 0 && passwordErrors.length === 0;
  const isEmailValid = email.includes('@') && email.includes('.');
  const canSubmit = isEmailValid && isPasswordValid && !isLoading;

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Crear Cuenta</h2>

      {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="tu@email.com"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Contraseña</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full px-4 py-2 pr-10 border rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:ring-2 focus:border-transparent ${
              password.length === 0
                ? 'border-zinc-300 dark:border-zinc-600 focus:ring-indigo-500'
                : isPasswordValid
                ? 'border-green-400 focus:ring-green-400'
                : 'border-red-400 focus:ring-red-400'
            }`}
            placeholder="••••••••"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
            tabIndex={-1}
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {password.length > 0 && (
          <p className={`text-xs mt-1 font-medium ${isPasswordValid ? 'text-green-600' : 'text-red-600'}`}>
            {isPasswordValid
              ? '✓ La contraseña cumple con todos los requisitos'
              : `✗ La contraseña no cumple: ${passwordErrors.join(', ')}`}
          </p>
        )}
        {password.length === 0 && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
            Mínimo 8 caracteres, con mayúscula y número
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        {isLoading ? 'Registrando...' : 'Registrarse'}
      </button>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        ¿Ya tenés cuenta?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
        >
          Iniciá sesión aquí
        </button>
      </p>
    </form>
  );
};
