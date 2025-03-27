
import React from 'react';
import { Loader2, Users, MessageCircle, Heart } from 'lucide-react';

interface SplashScreenProps {
  message?: string;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex flex-col items-center justify-center z-50">
      <div className="max-w-md w-full mx-auto p-6 text-center">
        <div className="relative mb-6">
          {/* Logo container with modern social vibe */}
          <div className="absolute inset-0 bg-white/20 blur-xl opacity-40 rounded-full transform scale-110 animate-pulse-slow"></div>
          <div className="relative flex flex-col items-center">
            <div className="bg-white/20 backdrop-blur-md p-6 rounded-full border border-white/40 shadow-[0_0_40px_rgba(255,255,255,0.3)] mb-4">
              <h1 className="text-5xl font-bold text-white drop-shadow-lg tracking-tight">
                T
              </h1>
            </div>
            
            <h1 className="text-5xl font-bold text-white mb-2 drop-shadow-lg tracking-tight">
              TUWAYE
            </h1>
            
            <p className="text-xl text-white/90 font-medium mb-6 drop-shadow-md">
              Let's Talk
            </p>

            {/* Social media icon elements */}
            <div className="flex justify-center gap-6 mb-6">
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-full animate-float" style={{ animationDelay: '0s' }}>
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-full animate-float" style={{ animationDelay: '0.7s' }}>
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-full animate-float" style={{ animationDelay: '1.4s' }}>
                <Heart className="h-6 w-6 text-white" />
              </div>
            </div>
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
        <p className="text-white/80 text-sm animate-fade-in" style={{ animationDelay: '0.5s' }}>
          Connect, share, and engage with your community
        </p>
      </div>
      
      {/* Animated social media style elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[15%] left-[10%] w-20 h-20 bg-pink-400/20 rounded-full blur-xl animate-float" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute bottom-[25%] right-[15%] w-24 h-24 bg-purple-400/20 rounded-full blur-xl animate-float" style={{ animationDelay: '0.8s' }}></div>
        <div className="absolute top-[45%] right-[25%] w-16 h-16 bg-blue-300/20 rounded-full blur-xl animate-float" style={{ animationDelay: '2.2s' }}></div>
        
        {/* Notification-like dots */}
        <div className="absolute top-[20%] right-[30%] w-4 h-4 bg-red-400 rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-[30%] left-[25%] w-3 h-3 bg-green-400 rounded-full animate-pulse-slow" style={{ animationDelay: '1.2s' }}></div>
        <div className="absolute top-[60%] left-[20%] w-5 h-5 bg-yellow-400 rounded-full animate-pulse-slow" style={{ animationDelay: '0.6s' }}></div>
      </div>
    </div>
  );
};

export default SplashScreen;
