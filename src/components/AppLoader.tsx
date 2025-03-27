
import React, { useEffect, useState } from 'react';
import SplashScreen from './SplashScreen';

interface AppLoaderProps {
  children: React.ReactNode;
}

const AppLoader: React.FC<AppLoaderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simple loading timeout
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SplashScreen message="Connecting to your social world..." />;
  }

  return <>{children}</>;
};

export default AppLoader;
