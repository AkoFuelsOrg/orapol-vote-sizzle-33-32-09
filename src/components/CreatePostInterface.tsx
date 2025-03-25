
import React, { useState } from 'react';
import { Image, ListPlus, ChevronRight } from 'lucide-react';
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
      <div className={`bg-white ${isMobile ? 'rounded-xl shadow-sm border border-gray-100 px-4 py-3.5 mb-4' : 'rounded-xl p-5 shadow-md border border-gray-100 mb-8'} animate-fade-in hover:shadow-lg transition-all duration-300`}>
        <div className="flex items-center gap-3 mb-3">
          <img 
            src={profile?.avatar_url || user.user_metadata?.avatar_url || "https://i.pravatar.cc/150"} 
            alt="Your avatar" 
            className="w-10 h-10 rounded-full border border-gray-200 object-cover shadow-sm"
          />
          <button 
            onClick={() => setModalOpen(true)}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-500 text-left rounded-full px-4 py-2.5 transition-colors"
          >
            What's on your mind?
          </button>
        </div>
        
        <div className={`flex justify-between ${isMobile ? 'border-t pt-3' : 'border-t pt-3.5'}`}>
          <button 
            onClick={() => setModalOpen(true)}
            className="flex items-center justify-center gap-2 py-2.5 px-3 hover:bg-blue-50 rounded-lg flex-1 transition-colors"
          >
            <Image size={isMobile ? 18 : 20} className="text-blue-500" />
            <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-700`}>Photo</span>
          </button>
          
          <div className="w-px h-8 bg-gray-200 self-center mx-2"></div>
          
          <button 
            onClick={() => navigate('/create')}
            className="flex items-center justify-center gap-2 py-2.5 px-3 hover:bg-green-50 rounded-lg flex-1 transition-colors"
          >
            <ListPlus size={isMobile ? 18 : 20} className="text-green-500" />
            <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-700`}>Create Poll</span>
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
