
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
import { useBreakpoint } from '../hooks/use-mobile';

interface Profile {
  id: string;
  username: string;
  avatar_url: string;
}

interface ChatInterfaceProps {
  userId: string;
  onBack: (() => void) | undefined;
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
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "mobile";
  const isDesktop = breakpoint === "desktop";
  
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
  
  if (isDesktop) {
    return (
      <div className="flex flex-col h-full bg-white desktop-chat-interface">
        <div className="desktop-chat-header shadow-sm z-10">
          <UserProfileCard 
            userId={profile.id} 
            username={profile.username || 'User'} 
            avatarUrl={profile.avatar_url || `https://i.pravatar.cc/150?u=${profile.id}`}
            minimal 
            hideFollowButton 
          />
          
          <div className="ml-auto flex items-center space-x-2">
            {/* Desktop-only action buttons could go here */}
          </div>
        </div>
        
        {!canMessage ? (
          <div className="flex flex-col items-center justify-center flex-1 p-8 bg-gray-50/50">
            <div className="text-center max-w-md p-6 rounded-xl bg-white shadow-sm border border-gray-100">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Cannot message this user</h3>
              <p className="text-gray-600 mb-4">One of you needs to follow the other first</p>
              <Button variant="outline" size="sm">Visit Profile</Button>
            </div>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 p-6 bg-gray-50 desktop-chat-messages">
              {messages && messages.length > 0 ? (
                <div className="space-y-5 max-w-4xl mx-auto">
                  {messages.map((message, index) => {
                    const isOutgoing = message.sender_id === user?.id;
                    const showAvatar = index === 0 || 
                      (messages[index - 1] && messages[index - 1].sender_id !== message.sender_id);
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isOutgoing && showAvatar && (
                          <Avatar className="h-9 w-9 mr-2 mt-1">
                            <AvatarImage src={profile.avatar_url || `https://i.pravatar.cc/150?u=${profile.id}`} />
                            <AvatarFallback>{profile.username?.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className={isOutgoing ? 'desktop-message-bubble-sent' : 'desktop-message-bubble-received'}>
                          {message.attachment_url && message.attachment_type && (
                            <div className="mb-3 overflow-hidden rounded-lg">
                              {renderAttachmentPreview(message.attachment_url, message.attachment_type)}
                            </div>
                          )}
                          <p className="break-words">{message.content}</p>
                          <p className={`text-xs mt-1 ${isOutgoing ? 'text-primary-foreground/70' : 'text-secondary-foreground/70'}`}>
                            {formatMessageTime(message.created_at)}
                          </p>
                        </div>
                        
                        {isOutgoing && showAvatar && (
                          <Avatar className="h-9 w-9 ml-2 mt-1 border-2 border-red-100">
                            <AvatarImage src={user?.user_metadata?.avatar_url || ''} />
                            <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="text-center p-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No messages yet</h3>
                  <p className="text-gray-500">Send a message to start the conversation!</p>
                </div>
              )}
            </ScrollArea>
            
            <form onSubmit={handleSendMessage} className="desktop-chat-input-container">
              {attachmentFile && (
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg mb-3">
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
                <div className="flex space-x-2 mr-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowEmojiPicker(!showEmojiPicker);
                      setShowGifSelector(false);
                    }}
                    className="h-10 w-10 rounded-full"
                  >
                    <Smile className="h-5 w-5 text-gray-500" />
                  </Button>
                  <Button
                    type="button" 
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowGifSelector(!showGifSelector);
                      setShowEmojiPicker(false);
                    }}
                    className="h-10 w-10 rounded-full"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 4a2 2 0 012-2h4a1 1 0 010 2H4v2a1 1 0 01-2 0V4zm16 0a2 2 0 00-2-2h-4a1 1 0 100 2h4v2a1 1 0 102 0V4zm0 12a2 2 0 01-2 2h-4a1 1 0 110-2h4v-2a1 1 0 012 0v2zM2 16a2 2 0 002 2h4a1 1 0 100-2H4v-2a1 1 0 10-2 0v2z" />
                    </svg>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleFileSelect('document')}
                    className="h-10 w-10 rounded-full"
                  >
                    <FileText className="h-5 w-5 text-gray-500" />
                  </Button>
                  <Button
                    type="button" 
                    variant="ghost"
                    size="icon"
                    onClick={() => handleFileSelect('image')}
                    className="h-10 w-10 rounded-full"
                  >
                    <Image className="h-5 w-5 text-gray-500" />
                  </Button>
                </div>
                
                <Input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 rounded-full bg-gray-100 border-gray-200 focus:border-red-300"
                  disabled={sending}
                />
                <Button type="submit" size="icon" disabled={sending || (!newMessage.trim() && !attachmentFile)} className="h-10 w-10 rounded-full">
                  {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
              </div>
              
              {showEmojiPicker && (
                <div className="absolute bottom-20 right-20 z-10">
                  <EmojiPicker 
                    onSelectEmoji={handleEmojiSelect} 
                    onClose={() => setShowEmojiPicker(false)} 
                  />
                </div>
              )}
              
              <div className="absolute bottom-20 right-20 z-10">
                <GifSelector 
                  onSelectGif={handleGifSelect} 
                  onClose={() => setShowGifSelector(false)} 
                  isVisible={showGifSelector}
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
  }
  
  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="flex items-center space-x-2 p-3 border-b bg-white dark:bg-gray-900 shadow-sm">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        
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
          <ScrollArea className="flex-1 px-2 py-4 md:p-4">
            {messages && messages.length > 0 ? (
              <div className="space-y-3">
                {messages.map((message) => {
                  const isOutgoing = message.sender_id === user?.id;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-3 py-2 ${
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
                        <p className="break-words text-sm">{message.content}</p>
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
          
          <form onSubmit={handleSendMessage} className="border-t p-3 space-y-2 bg-background">
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
            
            <div className="flex justify-between gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker);
                  setShowGifSelector(false);
                }}
                className="flex-1 h-9 px-1 text-xs"
              >
                <Smile className="h-4 w-4 mr-1" /> Emoji
              </Button>
              <Button
                type="button" 
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowGifSelector(!showGifSelector);
                  setShowEmojiPicker(false);
                }}
                className="flex-1 h-9 px-1 text-xs"
              >
                <Image className="h-4 w-4 mr-1" /> GIF
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleFileSelect('document')}
                className="flex-1 h-9 px-1 text-xs"
              >
                <FileText className="h-4 w-4 mr-1" /> Doc
              </Button>
              <Button
                type="button" 
                variant="outline"
                size="sm"
                onClick={() => handleFileSelect('image')}
                className="flex-1 h-9 px-1 text-xs"
              >
                <Image className="h-4 w-4 mr-1" /> Image
              </Button>
            </div>
            
            {showEmojiPicker && (
              <div className={`${isMobile ? 'fixed bottom-20 left-2 right-2' : 'absolute bottom-32 left-4'} z-10`}>
                <EmojiPicker 
                  onSelectEmoji={handleEmojiSelect} 
                  onClose={() => setShowEmojiPicker(false)} 
                />
              </div>
            )}
            
            <div className={`${isMobile ? 'fixed bottom-20 left-2 right-2' : 'absolute bottom-32 left-4'} z-10`}>
              <GifSelector 
                onSelectGif={handleGifSelect} 
                onClose={() => setShowGifSelector(false)} 
                isVisible={showGifSelector}
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
