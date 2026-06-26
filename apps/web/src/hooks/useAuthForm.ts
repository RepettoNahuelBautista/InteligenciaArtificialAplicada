import { useState } from 'react';
import { authApi, apiClient } from '../api/apiClient';
import { useAuth } from './useAuth';
import { useNavigate } from 'react-router-dom';

export function useAuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setUser, setToken } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authApi.register(email, password);
      const { token: userToken, ...userData } = response.data.data;

      const user = { ...userData, displayName: null };
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('authToken', userToken);

      setUser(user);
      setToken(userToken);
      navigate('/onboarding');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      setError(error.response?.data?.error?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authApi.login(email, password);
      const { token: userToken, ...userData } = response.data.data;

      localStorage.setItem('authToken', userToken);

      try {
        const profileResponse = await apiClient.get('/profile');
        const genres: number[] = profileResponse.data?.data?.preferences?.genres ?? [];
        const displayName: string | null = profileResponse.data?.data?.personalInfo?.displayName ?? null;
        const avatarUrl: string | null = profileResponse.data?.data?.personalInfo?.avatarUrl ?? null;

        const user = { ...userData, displayName, avatarUrl };
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        setToken(userToken);

        navigate(genres.length >= 3 ? '/home' : '/onboarding');
      } catch {
        const user = { ...userData, displayName: null };
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        setToken(userToken);
        navigate('/onboarding');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      setError(error.response?.data?.error?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    error,
    isLoading,
    handleRegister,
    handleLogin,
  };
}
