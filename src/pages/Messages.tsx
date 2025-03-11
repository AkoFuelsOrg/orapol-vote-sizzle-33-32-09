import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import { supabase } from '../integrations/supabase/client';
import Header from '../components/Header';
import ConversationList from '../components/ConversationList';
import ChatInterface from '../components/ChatInterface';
import SplashScreen from '../components/SplashScreen';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../components/ui/resizable';
import { useBreakpoint } from '../hooks/use-mobile';

const Messages: React.FC = () => {
  const { id: conversationUserId } = useParams();
  const { user, loading } = useSupabase();
  const navigate = useNavigate();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(conversationUserId || null);
  const [showConversations, setShowConversations] = useState(!conversationUserId);
  const breakpoint = useBreakpoint();
  const isDesktop = breakpoint === "desktop";
  
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);
  
  useEffect(() => {
    setSelectedUserId(conversationUserId || null);
    if (!isDesktop) {
      setShowConversations(!conversationUserId);
    }
  }, [conversationUserId, isDesktop]);
  
  const handleSelectConversation = (userId: string) => {
    navigate(`/messages/${userId}`);
  };
  
  const handleBackToList = () => {
    navigate('/messages');
  };
  
  if (loading) {
    return <SplashScreen message="Loading messages..." />;
  }
  
  if (!user) {
    return null; // Will redirect via the first useEffect
  }
  
  if (isDesktop) {
    return (
      <div className="flex flex-col min-h-screen pb-20">
        <Header />
        <div className="container max-w-7xl mx-auto px-4 pt-8 flex-1 flex flex-col">
          <h1 className="text-2xl font-bold mb-6 animate-fade-in">Messages</h1>
          
          <div className="flex-1 rounded-lg overflow-hidden">
            <ResizablePanelGroup 
              direction="horizontal" 
              className="min-h-[700px] rounded-lg border glass-card"
            >
              <ResizablePanel defaultSize={30} minSize={20}>
                <div className="h-full p-4">
                  <ConversationList 
                    onSelectConversation={handleSelectConversation} 
                  />
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={70}>
                <div className="h-full">
                  {selectedUserId ? (
                    <ChatInterface 
                      userId={selectedUserId} 
                      onBack={undefined} 
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Select a conversation to start messaging
                    </div>
                  )}
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen pb-20">
      <Header />
      <div className="container max-w-lg mx-auto px-4 pt-20 flex-1 flex flex-col">
        <h1 className="text-2xl font-bold mb-6 animate-fade-in">Messages</h1>
        
        <div className="flex-1 glass-card rounded-lg p-4">
          {showConversations ? (
            <ConversationList 
              onSelectConversation={handleSelectConversation} 
            />
          ) : (
            <ChatInterface 
              userId={selectedUserId!} 
              onBack={handleBackToList} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
