
import React from 'react';
import { Loader2 } from 'lucide-react';

interface SplashScreenProps {
  message?: string;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-primary flex flex-col items-center justify-center z-50">
      <div className="text-center">
        <div className="flex justify-center items-center mb-6">
          <img 
            src="/lovable-uploads/95591de9-b621-4bd0-b1a8-c28c6d4e09c9.png" 
            alt="Tuwaye Logo" 
            className="h-20 w-20 object-contain"
          />
        </div>
        
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
          Tuwaye
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
