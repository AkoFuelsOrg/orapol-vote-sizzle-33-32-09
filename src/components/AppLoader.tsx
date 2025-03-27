
import React, { useEffect, useState } from 'react';
import SplashScreen from './SplashScreen';

interface AppLoaderProps {
  children: React.ReactNode;
}

const AppLoader: React.FC<AppLoaderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate app loading with a slightly longer delay to appreciate the splash screen
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SplashScreen message="Loading your experience..." />;
  }

  return <>{children}</>;
};

export default AppLoader;
