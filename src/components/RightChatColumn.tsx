
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import { ScrollArea } from './ui/scroll-area';
import ConversationList from './ConversationList';
import { MessageSquare } from 'lucide-react';

const RightChatColumn: React.FC = () => {
  const { user } = useSupabase();
  const navigate = useNavigate();
  const location = useLocation();
  
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
    <div className="hidden lg:block fixed right-0 top-16 h-[calc(100vh-64px)] w-80 border-l bg-white shadow-sm z-10">
      <div className="p-4 border-b flex items-center space-x-2">
        <MessageSquare size={18} className="text-red-500" />
        <h2 className="font-semibold text-gray-800">Recent Chats</h2>
      </div>
      
      <ScrollArea className="h-[calc(100%-60px)] p-4">
        <ConversationList 
          onSelectConversation={handleSelectConversation}
        />
      </ScrollArea>
    </div>
  );
};

export default RightChatColumn;
