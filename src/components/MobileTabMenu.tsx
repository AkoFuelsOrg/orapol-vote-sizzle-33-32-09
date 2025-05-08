
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Video } from 'lucide-react';
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
              "flex flex-col items-center justify-center w-full h-full text-xs", 
              path === '/' ? "text-primary" : "text-gray-500"
            )}
          >
            <Home size={24} className={cn(path === '/' ? "text-primary" : "text-gray-500")} />
            <span className="mt-1">Home</span>
          </Link>
          
          <Link 
            to="/vibezone" 
            className={cn(
              "flex flex-col items-center justify-center w-full h-full text-xs", 
              path === '/vibezone' || path.startsWith('/vibezone/') ? "text-primary" : "text-gray-500"
            )}
          >
            <Video size={24} className={cn(
              path === '/vibezone' || path.startsWith('/vibezone/') ? "text-primary" : "text-gray-500"
            )} />
            <span className="mt-1">Vibezone</span>
          </Link>
          
          <Link 
            to={user ? "/messages" : "/auth"} 
            className={cn(
              "flex flex-col items-center justify-center w-full h-full text-xs", 
              path === '/messages' || path.startsWith('/messages/') ? "text-primary" : "text-gray-500"
            )}
          >
            <MessageSquare size={24} className={cn(
              path === '/messages' || path.startsWith('/messages/') ? "text-primary" : "text-gray-500"
            )} />
            <span className="mt-1">Messages</span>
          </Link>
          
          <button 
            onClick={openAIChat}
            className="flex flex-col items-center justify-center w-full h-full text-xs text-gray-500"
          >
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10">
              <span className="text-primary font-bold text-sm">AI</span>
            </div>
            <span className="mt-1">TGL AI</span>
          </button>
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
