
import React from 'react';
import { Loader2 } from 'lucide-react';

interface SplashScreenProps {
  message?: string;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-r from-[#3eb0ff]/80 to-[#3eb0ff] flex flex-col items-center justify-center z-50 animate-fade-in">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-3 drop-shadow-md tracking-tight">
          TUWAYE
        </h1>
        
        <div className="mb-6 relative">
          <img 
            src="/lovable-uploads/a9a6666f-a21a-4a74-b484-3fb5f3184fdc.png" 
            alt="Let's Talk" 
            className="w-40 h-auto mx-auto drop-shadow-lg"
          />
        </div>
        
        <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg inline-flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-white" />
          {message && (
            <p className="text-white text-sm font-medium">{message}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
