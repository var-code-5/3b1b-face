import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isInitialized } = useAuth();
  
  // Wait for auth initialization before making redirect decision
  if (!isInitialized) {
    return null; // or a loading spinner
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />;
};

export default ProtectedRoute;
