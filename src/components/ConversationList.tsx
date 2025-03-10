
import React, { useEffect, useState } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { supabase } from '../integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Loader2 } from 'lucide-react';
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
        Something went wrong loading your conversations.
      </div>
    );
  }
  
  if (!conversations || conversations.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p className="mb-2">No conversations yet</p>
        <p className="text-sm">Follow users to start chatting with them!</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {conversations.map((conversation) => (
        <div 
          key={conversation.other_user_id}
          className="p-3 rounded-lg hover:bg-secondary/20 transition-colors cursor-pointer flex items-center"
          onClick={() => onSelectConversation(conversation.other_user_id)}
        >
          <Avatar className="h-12 w-12 mr-3 border-2 border-red-500">
            <AvatarImage 
              src={conversation.avatar_url || `https://i.pravatar.cc/150?u=${conversation.other_user_id}`} 
              alt={conversation.username} 
            />
            <AvatarFallback className="bg-secondary">{conversation.username?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <h3 className="font-medium text-red-500 truncate">{conversation.username || 'User'}</h3>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(conversation.last_message_time), { addSuffix: true })}
              </span>
            </div>
            
            <p className="text-sm text-muted-foreground truncate">{conversation.last_message}</p>
          </div>
          
          {conversation.unread_count > 0 && (
            <Badge variant="destructive" className="ml-2">
              {conversation.unread_count}
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
};

export default ConversationList;
