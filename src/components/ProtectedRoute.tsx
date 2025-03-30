
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import SplashScreen from './SplashScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useSupabase();
  
  if (loading) {
    return <SplashScreen message="Checking permissions..." />;
  }
  
  if (!user) {
    return <Navigate to="/auth" state={{ message: "Please log in to continue" }} />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;
