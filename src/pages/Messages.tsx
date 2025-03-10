
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import { supabase } from '../integrations/supabase/client';
import Header from '../components/Header';
import ConversationList from '../components/ConversationList';
import ChatInterface from '../components/ChatInterface';
import SplashScreen from '../components/SplashScreen';

const Messages: React.FC = () => {
  const { id: conversationUserId } = useParams();
  const { user, loading } = useSupabase();
  const navigate = useNavigate();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(conversationUserId || null);
  const [showConversations, setShowConversations] = useState(!conversationUserId);
  
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);
  
  useEffect(() => {
    setSelectedUserId(conversationUserId || null);
    setShowConversations(!conversationUserId);
  }, [conversationUserId]);
  
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
