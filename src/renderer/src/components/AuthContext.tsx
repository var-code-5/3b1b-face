import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  user: any | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, file: Blob) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user from local storage", e);
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const data = await response.json();
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, file: Blob): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      formData.append('file', file, 'voice_sample.wav');

      const response = await fetch('http://localhost:8000/signup', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Signup failed');
      }

      // Signup successful, but user needs to verify email.
      // We don't log them in automatically yet.
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Get OAuth URL from backend
      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'google' })
      });

      if (!response.ok) {
        throw new Error('Failed to get Google login URL');
      }

      const { url } = await response.json();

      // 2. Open login window via Electron IPC
      console.log('window.api:', window.api);

      if (!window.api || typeof window.api.authGoogle !== 'function') {
        throw new Error('Google Login is not supported in this environment (API missing). Please restart the app.');
      }

      const result = await window.api.authGoogle(url);

      if (result && result.access_token) {
        // 3. Set session
        localStorage.setItem('access_token', result.access_token);
        // We might need to fetch user details separately or decode the token
        // For now, let's try to fetch user details from Supabase or backend if possible
        // Or just use the token to set the user state (decoding JWT)

        // Decode JWT to get user info (simplified)
        const base64Url = result.access_token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const userPayload = JSON.parse(jsonPayload);
        const userObj = { email: userPayload.email, id: userPayload.sub, ...userPayload };

        localStorage.setItem('user', JSON.stringify(userObj));
        setUser(userObj);
        return true;
      }
      return false;
    } catch (err: any) {
      console.error("Google login error:", err);
      setError(err.message || 'Google login failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, loginWithGoogle, logout, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
};
