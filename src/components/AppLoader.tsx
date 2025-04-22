
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import SplashScreen from './SplashScreen';

interface AppLoaderProps {
  children: React.ReactNode;
}

const AppLoader: React.FC<AppLoaderProps> = ({ children }) => {
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { session } = useSupabase();
  const location = useLocation();
  
  useEffect(() => {
    // Only show splash screen on initial app load
    if (isInitialLoad) {
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isInitialLoad]);
  
  // Show splash screen only on:
  // 1. Initial app load
  // 2. Auth page
  // 3. When session changes (login/logout)
  const shouldShowSplash = 
    isInitialLoad || 
    location.pathname === '/auth' ||
    location.pathname === '/profile-setup';
    
  if (shouldShowSplash) {
    return <SplashScreen message="Connecting to your social world..." />;
  }
  
  return <>{children}</>;
};

export default AppLoader;

