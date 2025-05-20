import React, { useState, useEffect, useRef } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area"
import { useBreakpoint } from "@/hooks/use-mobile";
import { isBreakpoint } from '@/utils/breakpoint-utils';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  sender_username: string;
  sender_avatar_url: string;
}

const Messages: React.FC = () => {
  const { user, supabase } = useSupabase();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const breakpointState = useBreakpoint();
  const isTablet = isBreakpoint(breakpointState, "tablet");
  
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', user.id);
        
        if (error) {
          setError(error.message);
        } else {
          setProfiles(data);
          
          // Select the first user by default if no user is selected
          if (!selectedUserId && data.length > 0) {
            setSelectedUserId(data[0].id);
            setSelectedUser(data[0]);
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfiles();
  }, [user, navigate, supabase, selectedUserId]);
  
  useEffect(() => {
    if (!user || !selectedUserId) return;
    
    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('messages')
          .select(`
            id, 
            content, 
            sender_id, 
            receiver_id, 
            created_at,
            sender_username:profiles (username),
            sender_avatar_url:profiles (avatar_url)
          `)
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .or(`sender_id.eq.${selectedUserId},receiver_id.eq.${selectedUserId}`)
          .order('created_at', { ascending: true });
        
        if (error) {
          setError(error.message);
        } else {
          // Transform the data to match the Message interface
          const transformedMessages = data.map(msg => ({
            id: msg.id,
            content: msg.content,
            sender_id: msg.sender_id,
            receiver_id: msg.receiver_id,
            created_at: msg.created_at,
            sender_username: msg.sender_username ? msg.sender_username.username : 'Unknown',
            sender_avatar_url: msg.sender_avatar_url ? msg.sender_avatar_url.avatar_url : null,
          }));
          setMessages(transformedMessages);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
    
    // Subscribe to new messages
    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, async payload => {
        if (payload.new) {
          // Fetch the new message with the profile data
          const { data: newMessageData, error: newMessageError } = await supabase
            .from('messages')
            .select(`
              id, 
              content, 
              sender_id, 
              receiver_id, 
              created_at,
              sender_username:profiles (username),
              sender_avatar_url:profiles (avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();
          
          if (newMessageError) {
            console.error('Error fetching new message:', newMessageError);
          } else {
            // Transform the new message to match the Message interface
            const transformedMessage = {
              id: newMessageData.id,
              content: newMessageData.content,
              sender_id: newMessageData.sender_id,
              receiver_id: newMessageData.receiver_id,
              created_at: newMessageData.created_at,
              sender_username: newMessageData.sender_username ? newMessageData.sender_username.username : 'Unknown',
              sender_avatar_url: newMessageData.sender_avatar_url ? newMessageData.sender_avatar_url.avatar_url : null,
            };
            
            // Update the messages state if the new message is relevant to the current chat
            if (
              (transformedMessage.sender_id === user.id && transformedMessage.receiver_id === selectedUserId) ||
              (transformedMessage.sender_id === selectedUserId && transformedMessage.receiver_id === user.id)
            ) {
              setMessages(prevMessages => [...prevMessages, transformedMessage]);
            }
          }
        }
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase, selectedUserId]);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !selectedUserId) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          content: newMessage,
          sender_id: user.id,
          receiver_id: selectedUserId,
          sender_username: user.user_metadata?.username,
          sender_avatar_url: user.user_metadata?.avatar_url,
        });
      
      if (error) {
        toast.error('Failed to send message');
        console.error('Error sending message:', error);
      } else {
        setNewMessage('');
      }
    } catch (err: any) {
      toast.error('Failed to send message');
      console.error('Error sending message:', err);
    }
  };
  
  const handleUserSelect = (profile: any) => {
    setSelectedUserId(profile.id);
    setSelectedUser(profile);
  };
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading messages...</div>;
  }
  
  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">Error: {error}</div>;
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="container mx-auto max-w-4xl flex flex-col md:flex-row gap-4">
        {/* User List */}
        <div className="w-full md:w-1/3 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-700">Users</h2>
          </div>
          <ScrollArea className="h-[400px] p-2">
            {profiles.map(profile => (
              <div
                key={profile.id}
                className={`flex items-center p-3 rounded-md hover:bg-gray-100 cursor-pointer ${selectedUserId === profile.id ? 'bg-gray-100' : ''}`}
                onClick={() => handleUserSelect(profile)}
              >
                <Avatar className="w-8 h-8 mr-3">
                  <AvatarImage src={profile.avatar_url} alt={profile.username} />
                  <AvatarFallback>{profile.username?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-800">{profile.username}</span>
              </div>
            ))}
          </ScrollArea>
        </div>
        
        {/* Chat Area */}
        <div className="w-full md:w-2/3 bg-white rounded-lg shadow-md flex flex-col">
          {selectedUser ? (
            <>
              <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                <Avatar className="w-8 h-8 mr-3">
                  <AvatarImage src={selectedUser.avatar_url} alt={selectedUser.username} />
                  <AvatarFallback>{selectedUser.username?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <h2 className="text-lg font-semibold text-gray-700">{selectedUser.username}</h2>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto">
                <ScrollArea className="h-[400px]">
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`mb-2 flex flex-col ${message.sender_id === user.id ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${message.sender_id === user.id ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                        {message.content}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {message.sender_id === user.id ? 'You' : message.sender_username} - {new Date(message.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </ScrollArea>
              </div>
              
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center">
                  <Input
                    type="text"
                    placeholder="Type your message..."
                    className="flex-1 rounded-l-md border-gray-300 focus:ring-0 focus:border-blue-300"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        sendMessage();
                      }
                    }}
                  />
                  <Button
                    className="rounded-l-none"
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                  >
                    Send
                    <Send className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Select a user to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
