
import React, { useState } from 'react';
import { Image, PlusCircle, List } from 'lucide-react';
import CreatePostModal from './CreatePostModal';
import { useSupabase } from '../context/SupabaseContext';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

const CreatePostInterface = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const { user, profile } = useSupabase();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  if (!user) {
    return null;
  }
  
  return (
    <>
      <div className={`bg-white ${isMobile ? 'rounded-none shadow-sm border-t border-b border-x-0 px-3 py-3 mb-2' : 'rounded-xl p-4 shadow-sm border border-border/50 mb-6'} animate-fade-in`}>
        <div className="flex items-center gap-3 mb-2">
          <img 
            src={profile?.avatar_url || user.user_metadata?.avatar_url || "https://i.pravatar.cc/150"} 
            alt="Your avatar" 
            className="w-10 h-10 rounded-full border border-gray-200 object-cover"
          />
          <button 
            onClick={() => setModalOpen(true)}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-500 text-left rounded-full px-4 py-2.5 transition-colors"
          >
            What's on your mind?
          </button>
        </div>
        
        <div className={`flex justify-between ${isMobile ? 'border-t pt-2' : 'border-t pt-3'}`}>
          <button 
            onClick={() => setModalOpen(true)}
            className="flex items-center justify-center gap-2 p-2 hover:bg-gray-100 rounded-lg flex-1 transition-colors"
          >
            <Image size={isMobile ? 18 : 20} className="text-blue-500" />
            <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-700`}>Photo</span>
          </button>
          
          <button 
            onClick={() => navigate('/create')}
            className="flex items-center justify-center gap-2 p-2 hover:bg-gray-100 rounded-lg flex-1 transition-colors"
          >
            <List size={isMobile ? 18 : 20} className="text-green-500" />
            <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-700`}>Poll</span>
          </button>
        </div>
      </div>
      
      <CreatePostModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
      />
    </>
  );
};

export default CreatePostInterface;
