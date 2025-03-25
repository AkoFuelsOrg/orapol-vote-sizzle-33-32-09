
import React, { useEffect, useState } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { supabase } from '../integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';

interface Conversation {
  other_user_id: string;
  username: string;
  avatar_url: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

interface ConversationListProps {
  onSelectConversation: (userId: string) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({ onSelectConversation }) => {
  const { user } = useSupabase();

  const { data: conversations, isLoading, error, refetch } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .rpc('get_conversations', { user_id: user.id });
        
      if (error) {
        throw new Error(error.message);
      }
      
      return data as Conversation[];
    },
    enabled: !!user,
  });
  
  useEffect(() => {
    // Set up subscription for real-time updates
    if (!user) return;
    
    const channel = supabase
      .channel('messages-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${user.id}` || `receiver_id=eq.${user.id}`,
      }, () => {
        refetch();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetch]);
  
  // Helper function to format timestamps in a more compact way
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) {
      return 'just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffMinutes < 1440) { // Less than a day
      const hours = Math.floor(diffMinutes / 60);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffMinutes / 1440);
      if (days === 1) return 'yesterday';
      return `${days}d ago`;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p className="text-sm">Something went wrong loading your conversations.</p>
      </div>
    );
  }
  
  if (!conversations || conversations.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="py-8 flex flex-col items-center">
          <div className="h-14 w-14 bg-primary/5 rounded-full flex items-center justify-center mb-4">
            <MessageCircle className="h-7 w-7 text-primary/70" />
          </div>
          <p className="mb-2 font-medium text-gray-700">No conversations yet</p>
          <p className="text-sm text-muted-foreground max-w-[200px]">
            Follow users to start chatting with them!
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-0.5">
      {conversations.map((conversation) => (
        <div 
          key={conversation.other_user_id}
          className="p-3 rounded-lg hover:bg-primary/5 transition-all duration-200 cursor-pointer flex items-center group"
          onClick={() => onSelectConversation(conversation.other_user_id)}
        >
          <div className="relative">
            <Avatar className="h-10 w-10 mr-3 border border-white shadow-sm">
              <AvatarImage 
                src={conversation.avatar_url || `https://i.pravatar.cc/150?u=${conversation.other_user_id}`} 
                alt={conversation.username} 
              />
              <AvatarFallback className="bg-primary/10 text-primary">
                {conversation.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {conversation.unread_count > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-primary text-white">
                {conversation.unread_count}
              </Badge>
            )}
          </div>
          
          <div className="flex-1 min-w-0 border-b border-gray-100 pb-3 group-last:border-0">
            <div className="flex justify-between items-start mb-0.5">
              <h3 className="font-medium text-gray-800 truncate">{conversation.username || 'User'}</h3>
              <span className="text-xs text-gray-400 flex-shrink-0">
                {formatMessageTime(conversation.last_message_time)}
              </span>
            </div>
            
            <p className={`text-sm truncate ${conversation.unread_count > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
              {conversation.last_message}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConversationList;
