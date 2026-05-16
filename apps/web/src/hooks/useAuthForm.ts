import { useState } from 'react';
import { authApi } from '../api/apiClient';
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
      const { data: userData, token: userToken } = response.data.data;

      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('authToken', userToken);

      setUser(userData);
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
      const { data: userData, token: userToken } = response.data.data;

      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('authToken', userToken);

      setUser(userData);
      setToken(userToken);
      navigate('/onboarding');
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
