import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  // Wait for auth to initialize from localStorage
  if (isLoading) return null;

  // After login React state might not have updated yet but localStorage is already set
  const hasSession =
    !!user ||
    (!!localStorage.getItem('authToken') && !!localStorage.getItem('user'));

//  if (!hasSession) return <Navigate to="/" replace />;

  return <>{children}</>;
};
