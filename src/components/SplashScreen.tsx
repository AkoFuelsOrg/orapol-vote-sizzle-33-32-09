
import React from 'react';
import { Loader2 } from 'lucide-react';

interface SplashScreenProps {
  message?: string;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50 animate-fade-in">
      <h1 className="text-4xl font-bold text-red-500 mb-6 animate-pulse-slow">
        Orapol
      </h1>
      
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      
      {message && (
        <p className="text-muted-foreground text-sm">{message}</p>
      )}
    </div>
  );
};

export default SplashScreen;
