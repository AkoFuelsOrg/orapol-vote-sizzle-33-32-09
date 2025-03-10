
import React, { useState, useEffect, useRef } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { supabase } from '../integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Send, Smile, Image, FileText, Film, Paperclip } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import UserProfileCard from './UserProfileCard';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
  attachment_url?: string;
  attachment_type?: 'image' | 'video' | 'document' | 'gif';
}

interface Profile {
  id: string;
  username: string;
  avatar_url: string;
}

interface ChatInterfaceProps {
  userId: string;
  onBack: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ userId, onBack }) => {
  const { user } = useSupabase();
  const [newMessage, setNewMessage] = useState('');
  const [canMessage, setCanMessage] = useState(false);
  const [sending, setSending] = useState(false);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentType, setAttachmentType] = useState<'image' | 'video' | 'document' | 'gif' | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get the other user's profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      return data as Profile;
    }
  });
  
  // Check if messaging is allowed
  const { data: messageAllowed } = useQuery({
    queryKey: ['can-message', user?.id, userId],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .rpc('can_message', { user_id_1: user.id, user_id_2: userId });
        
      if (error) {
        console.error('Error checking messaging permission:', error);
        return false;
      }
      
      return data as boolean;
    },
    enabled: !!user && !!userId,
  });
  
  useEffect(() => {
    setCanMessage(!!messageAllowed);
  }, [messageAllowed]);
  
  // Get the conversation history
  const { data: messages, isLoading: messagesLoading, refetch } = useQuery({
    queryKey: ['messages', user?.id, userId],
    queryFn: async () => {
      if (!user) return [];
      
      // Get all messages where:
      // (sender is current user AND receiver is other user) OR (sender is other user AND receiver is current user)
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`
        )
        .order('created_at', { ascending: true });
        
      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }
      
      // Mark messages as read
      const unreadMessages = (data as Message[])
        .filter(msg => msg.receiver_id === user.id && !msg.read);
        
      if (unreadMessages.length > 0) {
        const unreadIds = unreadMessages.map(msg => msg.id);
        await supabase
          .from('messages')
          .update({ read: true })
          .in('id', unreadIds);
      }
      
      return data as Message[];
    },
    enabled: !!user && !!userId,
  });
  
  useEffect(() => {
    // Set up subscription for real-time updates
    if (!user || !userId) return;
    
    const channel = supabase
      .channel('messages-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `(sender_id=eq.${user.id} AND receiver_id=eq.${userId}) OR (sender_id=eq.${userId} AND receiver_id=eq.${user.id})`,
      }, () => {
        refetch();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, userId, refetch]);
  
  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages && messages.length > 0) {
      scrollToBottom();
      
      // Mark messages as read
      const unreadMessages = messages
        .filter(msg => msg.receiver_id === user?.id && !msg.read);
        
      if (unreadMessages.length > 0) {
        const unreadIds = unreadMessages.map(msg => msg.id);
        supabase
          .from('messages')
          .update({ read: true })
          .in('id', unreadIds)
          .then(() => {
            // Silent update, no need to handle response
          });
      }
    }
  }, [messages, user?.id]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleFileSelect = (type: 'image' | 'video' | 'document' | 'gif') => {
    setAttachmentType(type);
    if (fileInputRef.current) {
      // Set accepted file types based on the selected type
      switch (type) {
        case 'image':
          fileInputRef.current.accept = 'image/*';
          break;
        case 'video':
          fileInputRef.current.accept = 'video/*';
          break;
        case 'document':
          fileInputRef.current.accept = '.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx';
          break;
        case 'gif':
          fileInputRef.current.accept = 'image/gif';
          break;
      }
      fileInputRef.current.click();
    }
  };
  
  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachmentFile(e.target.files[0]);
      toast.success(`${attachmentType} selected: ${e.target.files[0].name}`);
    }
  };
  
  const removeAttachment = () => {
    setAttachmentFile(null);
    setAttachmentType(null);
  };
  
  const uploadAttachment = async (): Promise<string | null> => {
    if (!attachmentFile || !attachmentType || !user) return null;
    
    try {
      // Create a unique file path using UUID
      const fileExt = attachmentFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      // Upload the file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('chat_attachments')
        .upload(filePath, attachmentFile);
        
      if (error) throw error;
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('chat_attachments')
        .getPublicUrl(filePath);
        
      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error(`Failed to upload file: ${error.message}`);
      return null;
    }
  };
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !userId || !canMessage) return;
    if (!newMessage.trim() && !attachmentFile) return;
    
    setSending(true);
    
    try {
      let attachmentUrl = null;
      
      // If there's an attachment, upload it first
      if (attachmentFile && attachmentType) {
        attachmentUrl = await uploadAttachment();
        if (!attachmentUrl && !newMessage.trim()) {
          // If upload failed and there's no message text, stop
          setSending(false);
          return;
        }
      }
      
      // Send the message with or without attachment
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: userId,
          content: newMessage.trim() || (attachmentFile ? `Sent ${attachmentType}` : ''),
          attachment_url: attachmentUrl,
          attachment_type: attachmentUrl ? attachmentType : null,
        });
        
      if (error) throw error;
      
      setNewMessage('');
      setAttachmentFile(null);
      setAttachmentType(null);
      setShowAttachmentOptions(false);
      refetch();
    } catch (error: any) {
      toast.error(`Failed to send message: ${error.message}`);
    } finally {
      setSending(false);
    }
  };
  
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
  
  // Helper function to render attachment preview
  const renderAttachmentPreview = (url: string, type: string) => {
    switch (type) {
      case 'image':
      case 'gif':
        return <img src={url} alt="Image attachment" className="max-w-full max-h-64 rounded-lg" />;
      case 'video':
        return (
          <video controls className="max-w-full max-h-64 rounded-lg">
            <source src={url} />
            Your browser does not support the video tag.
          </video>
        );
      case 'document':
        return (
          <div className="flex items-center gap-2 p-2 border rounded-lg">
            <FileText className="h-5 w-5" />
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate">
              View Document
            </a>
          </div>
        );
      default:
        return <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Attachment</a>;
    }
  };
  
  const isLoading = profileLoading || messagesLoading;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="p-4">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="text-center text-red-500">User not found</div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-[70vh]">
      <div className="flex items-center space-x-2 p-3 border-b">
        <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        <UserProfileCard 
          userId={profile.id} 
          username={profile.username || 'User'} 
          avatarUrl={profile.avatar_url || `https://i.pravatar.cc/150?u=${profile.id}`}
          minimal 
          hideFollowButton 
        />
      </div>
      
      {!canMessage ? (
        <div className="flex flex-col items-center justify-center flex-1 p-4 text-center">
          <p className="text-muted-foreground mb-2">
            You can't message this user yet
          </p>
          <p className="text-sm text-muted-foreground">
            One of you needs to follow the other first
          </p>
        </div>
      ) : (
        <>
          <ScrollArea className="flex-1 p-4">
            {messages && messages.length > 0 ? (
              <div className="space-y-4">
                {messages.map((message) => {
                  const isOutgoing = message.sender_id === user?.id;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                          isOutgoing
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground'
                        }`}
                      >
                        {message.attachment_url && message.attachment_type && (
                          <div className="mb-2">
                            {renderAttachmentPreview(message.attachment_url, message.attachment_type)}
                          </div>
                        )}
                        <p>{message.content}</p>
                        <p className={`text-xs mt-1 ${isOutgoing ? 'text-primary-foreground/70' : 'text-secondary-foreground/70'}`}>
                          {formatMessageTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="text-center text-muted-foreground flex items-center justify-center h-full">
                <p>No messages yet. Say hello!</p>
              </div>
            )}
          </ScrollArea>
          
          <form onSubmit={handleSendMessage} className="border-t p-3 space-y-2">
            {attachmentFile && (
              <div className="flex items-center justify-between p-2 bg-secondary/20 rounded-lg">
                <div className="flex items-center space-x-2 truncate">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm truncate">{attachmentFile.name}</span>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={removeAttachment}
                  className="h-6 px-2"
                >
                  Remove
                </Button>
              </div>
            )}
            
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1"
                disabled={sending}
              />
              <Button type="submit" size="icon" disabled={sending || (!newMessage.trim() && !attachmentFile)}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleFileSelect('image')}
                className="flex-1"
              >
                <Image className="h-4 w-4 mr-1" /> Image
              </Button>
              <Button
                type="button" 
                variant="outline"
                size="sm"
                onClick={() => handleFileSelect('gif')}
                className="flex-1"
              >
                <Smile className="h-4 w-4 mr-1" /> GIF
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleFileSelect('document')}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-1" /> Doc
              </Button>
              <Button
                type="button" 
                variant="outline"
                size="sm"
                onClick={() => handleFileSelect('video')}
                className="flex-1"
              >
                <Film className="h-4 w-4 mr-1" /> Video
              </Button>
            </div>
            
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAttachmentChange}
              className="hidden"
            />
          </form>
        </>
      )}
    </div>
  );
};

export default ChatInterface;
