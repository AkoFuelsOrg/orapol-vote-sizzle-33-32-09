
import React, { useState } from 'react';
import { Image, ListPlus, ChevronRight, Camera, PenLine } from 'lucide-react';
import CreatePostModal from './CreatePostModal';
import { useSupabase } from '../context/SupabaseContext';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card } from '@/components/ui/card';

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
      <Card className={`relative overflow-hidden ${isMobile ? 'rounded-xl mb-4' : 'rounded-xl mb-8'} border-none shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-gray-50`}>
        <div className="absolute inset-0 bg-primary/5 -z-10"></div>
        
        <div className={`${isMobile ? 'px-4 py-3.5' : 'p-5'}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-md group-hover:blur-lg opacity-30 group-hover:opacity-70 transition-all duration-300"></div>
              <img 
                src={profile?.avatar_url || user.user_metadata?.avatar_url || "https://i.pravatar.cc/150"} 
                alt="Your avatar" 
                className="w-10 h-10 rounded-full border border-white object-cover shadow-sm relative z-10"
              />
            </div>
            <button 
              onClick={() => setModalOpen(true)}
              className="flex-1 bg-white/80 hover:bg-white text-gray-500 text-left rounded-full px-4 py-2.5 transition-colors shadow-sm border border-gray-100"
            >
              What's on your mind?
            </button>
          </div>
          
          <div className={`flex justify-between ${isMobile ? 'border-t pt-3' : 'border-t pt-3.5'}`}>
            <button 
              onClick={() => setModalOpen(true)}
              className="flex items-center justify-center gap-2 py-2.5 px-3 hover:bg-blue-50 rounded-lg flex-1 transition-colors"
            >
              <Camera size={isMobile ? 18 : 20} className="text-blue-500" />
              <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-700`}>Photo</span>
            </button>
            
            <div className="w-px h-8 bg-gray-200/70 self-center mx-2"></div>
            
            <button 
              onClick={() => navigate('/create')}
              className="flex items-center justify-center gap-2 py-2.5 px-3 hover:bg-green-50 rounded-lg flex-1 transition-colors"
            >
              <PenLine size={isMobile ? 18 : 20} className="text-green-500" />
              <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-700`}>Create Poll</span>
            </button>
          </div>
        </div>
      </Card>
      
      <CreatePostModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
      />
    </>
  );
};

export default CreatePostInterface;
