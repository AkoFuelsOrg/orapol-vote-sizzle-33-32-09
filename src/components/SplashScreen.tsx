
import React from 'react';
import { Loader2 } from 'lucide-react';

interface SplashScreenProps {
  message?: string;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-r from-[#3eb0ff]/80 to-[#3eb0ff] flex flex-col items-center justify-center z-50 animate-fade-in">
      <div className="text-center">
        <div className="flex flex-col items-center mb-2">
          <img 
            src="/lovable-uploads/26f8f928-28ac-46f3-857a-e06edd03c91d.png" 
            alt="Tuwaye Logo" 
            className="w-20 h-20 mb-2 drop-shadow-lg"
          />
          <h1 className="text-5xl font-bold text-white drop-shadow-md tracking-tight">
            TUWAYE
          </h1>
        </div>
        
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
