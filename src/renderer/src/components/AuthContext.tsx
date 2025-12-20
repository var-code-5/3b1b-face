import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  user: string | null;
  login: (email: string, password: string) => boolean;
  signup: (email: string, password: string) => boolean;
  logout: () => void;
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
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  const login = (email: string, password: string): boolean => {
    // Simple check: if email exists in localStorage
    // const storedPassword = localStorage.getItem(`password_${email}`);
    // if (storedPassword === password) {
    //   setUser(email);
    //   localStorage.setItem('user', email);
    //   return true;
    // }
    // return false;
    setUser(email);
    localStorage.setItem('user', email);
    return true;
  };

  const signup = (email: string, password: string): boolean => {
    // Check if user already exists
    if (localStorage.getItem(`password_${email}`)) {
      return false; // User exists
    }
    localStorage.setItem(`password_${email}`, password);
    setUser(email);
    localStorage.setItem('user', email);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
