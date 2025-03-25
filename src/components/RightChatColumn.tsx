
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import { ScrollArea } from './ui/scroll-area';
import ConversationList from './ConversationList';
import SuggestedUsers from './SuggestedUsers';
import { MessageSquare, MessageCircle, ChevronRight, UserPlus } from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

const RightChatColumn: React.FC = () => {
  const { user } = useSupabase();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  
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
  
  return (
    <div 
      className={`hidden lg:block fixed right-0 top-16 h-[calc(100vh-64px)] transition-all duration-300 ease-in-out ${
        collapsed ? 'w-16' : 'w-80'
      } bg-gradient-to-br from-white via-white to-gray-50 shadow-md z-10 border-l border-gray-100`}
    >
      <div className="relative">
        {/* Collapse Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -left-4 top-8 h-8 w-8 rounded-full bg-white shadow-md border border-gray-100 z-20 hover:bg-gray-50 transition-all"
        >
          <ChevronRight size={16} className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
        </Button>
        
        {collapsed ? (
          <div className="flex flex-col items-center space-y-8 py-6">
            <div>
              <div className="p-2 bg-primary/10 rounded-full mb-1">
                <MessageCircle size={20} className="text-primary" />
              </div>
              <span className="text-[10px] text-gray-500 font-medium">Chats</span>
            </div>
            
            <div>
              <div className="p-2 bg-primary/10 rounded-full mb-1">
                <UserPlus size={20} className="text-primary" />
              </div>
              <span className="text-[10px] text-gray-500 font-medium">Follow</span>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="chats" className="h-full flex flex-col">
            <div className="border-b px-2 pt-2">
              <TabsList className="w-full grid grid-cols-2 h-10">
                <TabsTrigger value="chats" className="flex items-center gap-1">
                  <MessageSquare size={14} />
                  <span>Chats</span>
                </TabsTrigger>
                <TabsTrigger value="suggested" className="flex items-center gap-1">
                  <UserPlus size={14} />
                  <span>Suggested</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="chats" className="flex-1 overflow-hidden p-0 m-0">
              <div className="p-3 border-b flex items-center space-x-3 bg-gradient-to-r from-primary/10 to-transparent">
                <div className="p-1.5 bg-primary/15 rounded-full">
                  <MessageSquare size={18} className="text-primary" />
                </div>
                <h2 className="font-semibold text-gray-800 tracking-tight">Recent Chats</h2>
              </div>
              
              <ScrollArea className="h-[calc(100%-48px)] py-2">
                <div className="px-2">
                  <ConversationList 
                    onSelectConversation={handleSelectConversation}
                  />
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="suggested" className="flex-1 overflow-hidden p-0 m-0">
              <div className="p-3 border-b flex items-center space-x-3 bg-gradient-to-r from-primary/10 to-transparent">
                <div className="p-1.5 bg-primary/15 rounded-full">
                  <UserPlus size={18} className="text-primary" />
                </div>
                <h2 className="font-semibold text-gray-800 tracking-tight">Suggested Accounts</h2>
              </div>
              
              <ScrollArea className="h-[calc(100%-48px)] py-2">
                <div className="px-2">
                  <SuggestedUsers />
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default RightChatColumn;
