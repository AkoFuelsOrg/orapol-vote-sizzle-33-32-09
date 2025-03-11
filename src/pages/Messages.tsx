
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
          
          <div className="flex-1 rounded-lg overflow-hidden desktop-messages-container">
            <ResizablePanelGroup 
              direction="horizontal" 
              className="max-h-[60vh] rounded-lg border shadow-md bg-gradient-to-br from-white to-gray-50"
            >
              <ResizablePanel defaultSize={30} minSize={20} className="border-r">
                <div className="h-full flex flex-col">
                  <div className="p-4 border-b bg-gray-50/80">
                    <h2 className="font-semibold text-gray-800">Conversations</h2>
                  </div>
                  <div className="flex-1 overflow-y-auto overflow-x-hidden">
                    <ConversationList 
                      onSelectConversation={handleSelectConversation} 
                    />
                  </div>
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle className="bg-gray-100 hover:bg-gray-200 transition-colors" />
              <ResizablePanel defaultSize={70}>
                <div className="h-full flex flex-col">
                  {selectedUserId ? (
                    <ChatInterface 
                      userId={selectedUserId} 
                      onBack={undefined} 
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center p-10 bg-gray-50/50">
                      <div className="text-center max-w-md p-8 rounded-xl bg-white shadow-sm border border-gray-100">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No conversation selected</h3>
                        <p className="text-gray-500 mb-4">Select a conversation from the list to start messaging</p>
                      </div>
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
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="container mx-auto px-0 pt-16 flex-1 flex flex-col">
        {showConversations ? (
          <>
            <div className="px-4 pt-2 pb-2">
              <h1 className="text-xl font-bold animate-fade-in">Messages</h1>
            </div>
            <div className="flex-1">
              <ConversationList 
                onSelectConversation={handleSelectConversation} 
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col h-[calc(100vh-64px)]">
            <ChatInterface 
              userId={selectedUserId!} 
              onBack={handleBackToList} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
