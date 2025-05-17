
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Video, Film } from 'lucide-react';
import { useSupabase } from '../context/SupabaseContext';
import { cn } from '@/lib/utils';
import { AIChatModal } from './AIChatModal';

const MobileTabMenu: React.FC = () => {
  const location = useLocation();
  const { user } = useSupabase();
  const path = location.pathname;
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  
  // Don't show on auth pages or profile setup
  if (path === '/auth' || path === '/profile-setup' || path === '/find-friends') {
    return null;
  }
  
  const openAIChat = () => {
    setIsAIChatOpen(true);
  };
  
  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 md:hidden">
        <div className="flex justify-around items-center h-16">
          <Link 
            to="/" 
            className={cn(
              "flex flex-col items-center justify-center w-full h-full text-xs transition-colors", 
              path === '/' ? "text-primary font-medium" : "text-gray-500"
            )}
          >
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full mb-0.5",
              path === '/' ? "bg-primary/10" : "bg-transparent"
            )}>
              <Home size={22} strokeWidth={3.5} className={cn(path === '/' ? "text-primary" : "text-gray-500")} />
            </div>
            <span className="text-[10px]">Home</span>
          </Link>
          
          <Link 
            to="/vibezone" 
            className={cn(
              "flex flex-col items-center justify-center w-full h-full text-xs transition-colors", 
              path === '/vibezone' || path.startsWith('/vibezone/') ? "text-primary font-medium" : "text-gray-500"
            )}
          >
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full mb-0.5",
              path === '/vibezone' || path.startsWith('/vibezone/') ? "bg-primary/10" : "bg-transparent"
            )}>
              <Video size={22} strokeWidth={3.5} className={cn(
                path === '/vibezone' || path.startsWith('/vibezone/') ? "text-primary" : "text-gray-500"
              )} />
            </div>
            <span className="text-[10px]">Vibezone</span>
          </Link>
          
          {/* AI Chat Button - Icon is text "AI", no strokeWidth prop here */}
          <button 
            onClick={openAIChat}
            className="flex flex-col items-center justify-center w-full h-full text-xs text-gray-500 transition-colors"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 mb-0.5">
              <span className="text-primary font-bold text-base">AI</span>
            </div>
            <span className="text-[10px]">TGL AI</span>
          </button>
          
          <Link 
            to="/reels" 
            className={cn(
              "flex flex-col items-center justify-center w-full h-full text-xs transition-colors", 
              path === '/reels' || path.startsWith('/reels/') ? "text-primary font-medium" : "text-gray-500"
            )}
          >
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full mb-0.5",
              path === '/reels' || path.startsWith('/reels/') ? "bg-primary/10" : "bg-transparent"
            )}>
              <Film size={22} strokeWidth={3.5} className={cn(
                path === '/reels' || path.startsWith('/reels/') ? "text-primary" : "text-gray-500"
              )} />
            </div>
            <span className="text-[10px]">Reels</span>
          </Link>
          
          <Link 
            to={user ? "/messages" : "/auth"} 
            className={cn(
              "flex flex-col items-center justify-center w-full h-full text-xs transition-colors", 
              path === '/messages' || path.startsWith('/messages/') ? "text-primary font-medium" : "text-gray-500"
            )}
          >
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full mb-0.5",
              path === '/messages' || path.startsWith('/messages/') ? "bg-primary/10" : "bg-transparent"
            )}>
              <MessageSquare size={22} strokeWidth={3.5} className={cn(
                path === '/messages' || path.startsWith('/messages/') ? "text-primary" : "text-gray-500"
              )} />
            </div>
            <span className="text-[10px]">Messages</span>
          </Link>
        </div>
      </div>
      
      <AIChatModal 
        isOpen={isAIChatOpen} 
        onClose={() => setIsAIChatOpen(false)} 
      />
    </>
  );
};

export default MobileTabMenu;
