
import React from 'react';
import SplashScreen from './SplashScreen';

export const AppLoader: React.FC<{children?: React.ReactNode}> = ({ children }) => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      {children}
    </div>
  );
};

export default AppLoader;
