import React, { useState, useEffect, useRef } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { supabase } from '../integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Send, Smile, Image, FileText, Paperclip } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import UserProfileCard from './UserProfileCard';
import { Message } from '../lib/types';
import EmojiPicker from './EmojiPicker';
import GifSelector from './GifSelector';

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
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentType, setAttachmentType] = useState<'image' | 'video' | 'document' | 'gif' | 'emoji' | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifSelector, setShowGifSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
  
  const { data: messages, isLoading: messagesLoading, refetch } = useQuery({
    queryKey: ['messages', user?.id, userId],
    queryFn: async () => {
      if (!user) return [];
      
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
  
  useEffect(() => {
    if (messages && messages.length > 0) {
      scrollToBottom();
      
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
  
  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prevMessage => prevMessage + emoji);
    setShowEmojiPicker(false);
  };
  
  const handleGifSelect = async (gifUrl: string) => {
    if (!user || !userId || !canMessage) return;
    
    setSending(true);
    
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: userId,
          content: '🖼️ Sent a GIF',
          attachment_url: gifUrl,
          attachment_type: 'gif',
        });
        
      if (error) throw error;
      
      setShowGifSelector(false);
      refetch();
      toast.success('GIF sent successfully');
    } catch (error: any) {
      toast.error(`Failed to send GIF: ${error.message}`);
    } finally {
      setSending(false);
    }
  };
  
  const handleFileSelect = (type: 'image' | 'video' | 'document') => {
    setAttachmentType(type);
    if (fileInputRef.current) {
      switch (type) {
        case 'image':
          fileInputRef.current.accept = 'image/jpeg,image/png,image/jpg';
          break;
        case 'video':
          fileInputRef.current.accept = 'video/*';
          break;
        case 'document':
          fileInputRef.current.accept = '.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx';
          break;
      }
      fileInputRef.current.click();
    }
  };
  
  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File is too large. Maximum size is 10MB.");
        return;
      }
      
      setAttachmentFile(file);
      toast.success(`${attachmentType} selected: ${file.name}`);
    }
  };
  
  const removeAttachment = () => {
    setAttachmentFile(null);
    setAttachmentType(null);
  };
  
  const uploadAttachment = async (): Promise<string | null> => {
    if (!attachmentFile || !attachmentType || !user) return null;
    
    try {
      const fileExt = attachmentFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('chat_attachments')
        .upload(filePath, attachmentFile);
        
      if (error) throw error;
      
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
      
      if (attachmentFile && attachmentType) {
        attachmentUrl = await uploadAttachment();
        if (!attachmentUrl && !newMessage.trim()) {
          setSending(false);
          return;
        }
      }
      
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
      refetch();
    } catch (error: any) {
      toast.error(`Failed to send message: ${error.message}`);
    } finally {
      setSending(false);
    }
  };
  
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) {
      return 'just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffMinutes / 1440);
      if (days === 1) return 'yesterday';
      return `${days}d ago`;
    }
  };
  
  const renderAttachmentPreview = (url: string, type: string) => {
    switch (type) {
      case 'image':
        return <img src={url} alt="Image attachment" className="max-w-full max-h-60 rounded-lg object-contain" />;
      case 'gif':
        return <img src={url} alt="GIF" className="max-w-full max-h-60 rounded-lg object-contain" />;
      case 'video':
        return (
          <video controls className="max-w-full max-h-60 rounded-lg">
            <source src={url} />
            Your browser does not support the video tag.
          </video>
        );
      case 'document':
        return (
          <div className="flex items-center gap-2 p-2 border rounded-lg">
            <FileText className="h-5 w-5" />
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate max-w-[200px]">
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
                          <div className="mb-2 overflow-hidden rounded-lg">
                            {renderAttachmentPreview(message.attachment_url, message.attachment_type)}
                          </div>
                        )}
                        <p className="break-words">{message.content}</p>
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
            
            <div className="flex justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowEmojiPicker(true);
                  setShowGifSelector(false);
                }}
                className="flex-1 h-9 px-2 text-xs"
              >
                <Smile className="h-4 w-4 mr-1" /> Emoji
              </Button>
              <Button
                type="button" 
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowGifSelector(true);
                  setShowEmojiPicker(false);
                }}
                className="flex-1 h-9 px-2 text-xs"
              >
                <Image className="h-4 w-4 mr-1" /> GIF
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleFileSelect('document')}
                className="flex-1 h-9 px-2 text-xs"
              >
                <FileText className="h-4 w-4 mr-1" /> Doc
              </Button>
              <Button
                type="button" 
                variant="outline"
                size="sm"
                onClick={() => handleFileSelect('image')}
                className="flex-1 h-9 px-2 text-xs"
              >
                <Image className="h-4 w-4 mr-1" /> Image
              </Button>
            </div>
            
            <div className="absolute bottom-32 left-4 z-10">
              <EmojiPicker 
                onSelectEmoji={handleEmojiSelect} 
                onClose={() => setShowEmojiPicker(false)} 
              />
            </div>
            
            <div className="absolute bottom-32 left-4 z-10">
              <GifSelector 
                onSelectGif={handleGifSelect} 
                onClose={() => setShowGifSelector(false)} 
              />
            </div>
            
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
