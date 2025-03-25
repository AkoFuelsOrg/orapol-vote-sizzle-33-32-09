
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import { ScrollArea } from './ui/scroll-area';
import ConversationList from './ConversationList';
import { MessageSquare, MessageCircle, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

const RightChatColumn: React.FC = () => {
  const { user } = useSupabase();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  
  // Handle selecting a conversation
  const handleSelectConversation = (userId: string) => {
    if (location.pathname.startsWith('/messages')) {
      // If already on messages page, just update the URL
      navigate(`/messages/${userId}`);
    } else {
      // If on another page, navigate to messages with a selected conversation
      navigate(`/messages/${userId}`);
    }
  };
  
  if (!user) return null;
  
  return (
    <div 
      className={`hidden lg:block fixed right-0 top-16 h-[calc(100vh-64px)] transition-all duration-300 ease-in-out ${
        collapsed ? 'w-16' : 'w-80'
      } bg-gradient-to-br from-white via-white to-gray-50 shadow-md z-10 border-l border-gray-100`}
    >
      <div className="relative">
        {/* Collapse Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -left-4 top-8 h-8 w-8 rounded-full bg-white shadow-md border border-gray-100 z-20 hover:bg-gray-50 transition-all"
        >
          <ChevronRight size={16} className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
        </Button>
        
        {collapsed ? (
          <div className="flex flex-col items-center py-6">
            <div className="p-2 bg-primary/10 rounded-full mb-1">
              <MessageCircle size={20} className="text-primary" />
            </div>
            <span className="text-[10px] text-gray-500 font-medium">Chats</span>
          </div>
        ) : (
          <>
            <div className="p-4 border-b flex items-center space-x-3 bg-gradient-to-r from-primary/10 to-transparent">
              <div className="p-1.5 bg-primary/15 rounded-full">
                <MessageSquare size={18} className="text-primary" />
              </div>
              <h2 className="font-semibold text-gray-800 tracking-tight">Recent Chats</h2>
            </div>
            
            <ScrollArea className="h-[calc(100%-60px)] py-2">
              <div className="px-2">
                <ConversationList 
                  onSelectConversation={handleSelectConversation}
                />
              </div>
            </ScrollArea>
          </>
        )}
      </div>
    </div>
  );
};

export default RightChatColumn;
