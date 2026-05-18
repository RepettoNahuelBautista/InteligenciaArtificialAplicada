import { FC } from 'react';
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

  const passwordErrors = password.length > 0 ? validatePassword(password) : [];
  const isPasswordValid = password.length > 0 && passwordErrors.length === 0;
  const isEmailValid = email.includes('@') && email.includes('.');
  const canSubmit = isEmailValid && isPasswordValid && !isLoading;

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Crear Cuenta</h2>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="tu@email.com"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
            password.length === 0
              ? 'border-gray-300 focus:ring-indigo-500'
              : isPasswordValid
              ? 'border-green-400 focus:ring-green-400'
              : 'border-red-400 focus:ring-red-400'
          }`}
          placeholder="••••••••"
          required
        />
        {password.length > 0 && (
          <p className={`text-xs mt-1 font-medium ${isPasswordValid ? 'text-green-600' : 'text-red-600'}`}>
            {isPasswordValid
              ? '✓ La contraseña cumple con todos los requisitos'
              : `✗ La contraseña no cumple: ${passwordErrors.join(', ')}`}
          </p>
        )}
        {password.length === 0 && (
          <p className="text-xs text-gray-400 mt-1">
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

      <p className="text-center text-sm text-gray-600">
        ¿Ya tenés cuenta?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-indigo-600 font-medium hover:underline"
        >
          Iniciá sesión aquí
        </button>
      </p>
    </form>
  );
};
