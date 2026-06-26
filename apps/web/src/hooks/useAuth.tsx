import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  displayName?: string | null;
  avatarUrl?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('authToken');

    if (storedUser && storedToken) {
      const parsed = storedUser !== 'undefined' ? JSON.parse(storedUser) : null;
      if (parsed && !parsed.id) {
        try {
          const payload = JSON.parse(atob(storedToken.split('.')[1]));
          parsed.id = payload.userId;
          if (!parsed.email) parsed.email = payload.email;
          localStorage.setItem('user', JSON.stringify(parsed));
        } catch {
          // ignore — user will re-login when token expires
        }
      }
      setUserState(parsed);
      setToken(storedToken);
    }

    setIsLoading(false);
  }, []);

  const setUser = (u: User | null) => {
    setUserState(u);
  };

  const updateUser = (updates: Partial<User>) => {
    setUserState((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const logout = () => {
    setUserState(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, setUser, setToken, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
