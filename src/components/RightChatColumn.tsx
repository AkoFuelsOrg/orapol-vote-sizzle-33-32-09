
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import { supabase } from '../integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, X } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import ConversationList from './ConversationList';
import UserProfileCard from './UserProfileCard';

interface RightChatColumnProps {
  expanded?: boolean;
  onToggle?: () => void;
}

const RightChatColumn: React.FC<RightChatColumnProps> = ({ expanded = false, onToggle }) => {
  const { user } = useSupabase();
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(expanded);
  
  // Toggle expanded state
  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    if (onToggle) onToggle();
  };
  
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
  
  // If collapsed, show just the toggle button
  if (!isExpanded) {
    return (
      <div className="hidden lg:flex flex-col items-center fixed right-0 top-20 h-[calc(100vh-80px)] z-10">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-l-lg rounded-r-none bg-red-500 hover:bg-red-600 text-white h-12 w-12"
          onClick={handleToggle}
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      </div>
    );
  }
  
  // If expanded, show the chat list
  return (
    <div className="hidden lg:block fixed right-0 top-20 h-[calc(100vh-80px)] w-80 border-l bg-background shadow-lg z-10">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="font-semibold">Recent Chats</h2>
        <Button variant="ghost" size="icon" onClick={handleToggle}>
          <X className="h-4 w-4" />
        </Button>
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
