
import React, { useState } from 'react';
import { Image, PenLine, Camera } from 'lucide-react';
import CreatePostModal from './CreatePostModal';
import { useSupabase } from '../context/SupabaseContext';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import UserAvatar from './UserAvatar';
import { useLocation } from 'react-router-dom';

const CreatePostInterface = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const { user, profile } = useSupabase();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const location = useLocation();
  
  // Check if on index page (root path)
  const isIndexPage = location.pathname === '/';
  
  if (!user) {
    return null;
  }

  const handlePostCreated = () => {
    // Force a refresh of the content
    window.dispatchEvent(new CustomEvent('post-created'));
  };
  
  return (
    <>
      <Card 
        className={`relative overflow-hidden ${isMobile ? 'rounded-xl mb-4' : 'rounded-xl mb-8'} border-none shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-gray-50`}
        style={{ display: isIndexPage ? 'none' : 'block' }}
      >
        <div className="absolute inset-0 bg-primary/5 -z-10"></div>
        
        <div className={`${isMobile ? 'px-4 py-3.5' : 'p-5'}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-md group-hover:blur-lg opacity-30 group-hover:opacity-70 transition-all duration-300"></div>
              <UserAvatar 
                user={profile} 
                size="md"
                className="border border-white shadow-sm relative z-10"
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
              style={{ display: 'none' }}
            >
              <PenLine size={isMobile ? 18 : 20} className="text-green-500" />
              <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-700`}>Create Poll</span>
            </button>
          </div>
        </div>
      </Card>
      
      <CreatePostModal 
        isOpen={modalOpen} 
        onClose={() => {
          setModalOpen(false);
          handlePostCreated();
        }} 
        onPostUpdate={handlePostCreated}
      />
    </>
  );
};

export default CreatePostInterface;
