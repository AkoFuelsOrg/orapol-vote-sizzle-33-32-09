
import React, { useState } from 'react';
import { Image, PlusCircle, BarChart, Smile } from 'lucide-react';
import CreatePostModal from './CreatePostModal';
import CreatePollModal from './CreatePollModal';
import { useSupabase } from '../context/SupabaseContext';
import { useGroup } from '../context/GroupContext';
import { Button } from './ui/button';

interface GroupPostInterfaceProps {
  groupId: string;
}

const GroupPostInterface: React.FC<GroupPostInterfaceProps> = ({ groupId }) => {
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [pollModalOpen, setPollModalOpen] = useState(false);
  const { user, profile } = useSupabase();
  const { isGroupMember } = useGroup();
  const [isMember, setIsMember] = useState(false);
  
  React.useEffect(() => {
    if (user && groupId) {
      checkMembership();
    }
  }, [user, groupId]);
  
  const checkMembership = async () => {
    if (!user || !groupId) return;
    const memberStatus = await isGroupMember(groupId);
    setIsMember(memberStatus);
  };
  
  if (!user || !isMember) {
    return null;
  }
  
  return (
    <>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-border/50 mb-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-3">
          <img 
            src={profile?.avatar_url || user.user_metadata?.avatar_url || "https://i.pravatar.cc/150"} 
            alt="Your avatar" 
            className="w-10 h-10 rounded-full border-2 border-red-500 object-cover"
          />
          <button 
            onClick={() => setPostModalOpen(true)}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-500 text-left rounded-full px-4 py-2.5 transition-colors"
          >
            Share something with the group...
          </button>
        </div>
        
        <div className="flex justify-between border-t pt-3">
          <Button 
            onClick={() => setPostModalOpen(true)}
            variant="ghost"
            className="flex items-center justify-center gap-2 p-2 hover:bg-gray-100 rounded-lg flex-1 transition-colors"
          >
            <Image size={20} className="text-blue-500" />
            <span className="text-sm font-medium text-gray-700">Photo</span>
          </Button>
          
          <Button 
            onClick={() => setPollModalOpen(true)}
            variant="ghost"
            className="flex items-center justify-center gap-2 p-2 hover:bg-gray-100 rounded-lg flex-1 transition-colors"
          >
            <BarChart size={20} className="text-purple-500" />
            <span className="text-sm font-medium text-gray-700">Poll</span>
          </Button>
          
          <Button 
            onClick={() => setPostModalOpen(true)}
            variant="ghost"
            className="flex items-center justify-center gap-2 p-2 hover:bg-gray-100 rounded-lg flex-1 transition-colors"
          >
            <Smile size={20} className="text-yellow-500" />
            <span className="text-sm font-medium text-gray-700">Emoji</span>
          </Button>
        </div>
      </div>
      
      <CreatePostModal 
        isOpen={postModalOpen} 
        onClose={() => setPostModalOpen(false)} 
        groupId={groupId}
      />
      
      <CreatePollModal 
        isOpen={pollModalOpen} 
        onClose={() => setPollModalOpen(false)}
        groupId={groupId}
      />
    </>
  );
};

export default GroupPostInterface;
