
import React from 'react';
import { Loader2 } from 'lucide-react';

interface SplashScreenProps {
  message?: string;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50 animate-fade-in">
      <h1 className="text-4xl font-bold text-primary mb-4 animate-pulse-slow">
        TUWAYE
      </h1>
      
      <img 
        src="/lovable-uploads/a9a6666f-a21a-4a74-b484-3fb5f3184fdc.png" 
        alt="Let's Talk" 
        className="w-40 h-auto mb-6 drop-shadow-md"
      />
      
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      
      {message && (
        <p className="text-muted-foreground text-sm">{message}</p>
      )}
    </div>
  );
};

export default SplashScreen;
