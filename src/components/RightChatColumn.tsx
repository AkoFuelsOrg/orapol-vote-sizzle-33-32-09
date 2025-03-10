
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import { ScrollArea } from './ui/scroll-area';
import ConversationList from './ConversationList';

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
    <div className="hidden lg:block fixed right-0 top-20 h-[calc(100vh-80px)] w-80 border-l bg-background shadow-lg z-10">
      <div className="p-4 border-b">
        <h2 className="font-semibold">Recent Chats</h2>
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
