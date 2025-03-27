
import React from 'react';
import { Loader2 } from 'lucide-react';

interface SplashScreenProps {
  message?: string;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-500 to-blue-700 flex flex-col items-center justify-center z-50">
      <div className="max-w-md w-full mx-auto p-6 text-center">
        <div className="relative mb-6">
          {/* Logo container with glow effect */}
          <div className="absolute inset-0 bg-blue-400 blur-xl opacity-30 rounded-full transform scale-110 animate-pulse-slow"></div>
          <div className="relative flex flex-col items-center">
            <div className="bg-white/20 backdrop-blur-md p-6 rounded-full border-2 border-white/40 shadow-[0_0_40px_rgba(59,130,246,0.5)] mb-4">
              <img 
                src="/lovable-uploads/26f8f928-28ac-46f3-857a-e06edd03c91d.png" 
                alt="Tuwaye Logo" 
                className="w-28 h-28 object-contain animate-float"
              />
            </div>
            
            <h1 className="text-5xl font-bold text-white mb-2 drop-shadow-lg tracking-tight">
              TUWAYE
            </h1>
            
            <p className="text-xl text-white/90 font-medium mb-4 drop-shadow-md animate-pulse-slow">
              Let's Talk
            </p>
          </div>
        </div>
        
        {message && (
          <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-xl border border-white/20 inline-flex items-center gap-3 shadow-lg transition-all duration-500 animate-fade-in">
            <div className="p-2 bg-white/20 rounded-full">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            </div>
            <p className="text-white text-base font-medium tracking-wide">
              {message}
            </p>
          </div>
        )}
      </div>
      
      <div className="absolute bottom-8 w-full text-center">
        <p className="text-white/70 text-sm animate-fade-in" style={{ animationDelay: '0.5s' }}>
          Connect, share, and engage with your community
        </p>
      </div>
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[15%] w-64 h-64 bg-blue-300/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-[40%] right-[20%] w-48 h-48 bg-blue-200/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>
    </div>
  );
};

export default SplashScreen;
