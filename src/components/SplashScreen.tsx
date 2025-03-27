
import React from 'react';
import { Loader2 } from 'lucide-react';

interface SplashScreenProps {
  message?: string;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-primary flex flex-col items-center justify-center z-50">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
          TUWAYE
        </h1>
        
        <p className="text-xl text-white/90 font-medium mb-8">
          Let's Talk
        </p>

        <div className="flex justify-center mb-8">
          <Loader2 className="h-10 w-10 text-white animate-spin" />
        </div>
        
        {message && (
          <p className="text-white text-base font-medium tracking-wide">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default SplashScreen;
