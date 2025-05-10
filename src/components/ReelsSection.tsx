
import React, { useState } from 'react';
import { Film, Plus, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useBreakpoint } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import AddReelModal from './AddReelModal';

interface ReelProps {
  imageUrl: string;
  username: string;
  isActive?: boolean;
  onClick?: () => void;
}

interface ReelItem {
  id: number;
  username: string;
  imageUrl: string;
  isActive?: boolean;
}

const ReelItem: React.FC<ReelProps> = ({ imageUrl, username, isActive = false, onClick }) => {
  return (
    <div className="flex flex-col items-center">
      <div 
        className={cn(
          "relative rounded-full overflow-hidden h-16 w-16 border-2 mb-1 cursor-pointer",
          isActive ? "border-gradient-to-r from-pink-500 via-red-500 to-yellow-500" : "border-gray-300"
        )}
        onClick={onClick}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 rounded-full p-0.5">
          <div className="rounded-full overflow-hidden h-full w-full border-2 border-white">
            <img 
              src={imageUrl} 
              alt={`${username}'s reel`} 
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
      <span className="text-xs text-center truncate max-w-[70px]">{username}</span>
    </div>
  );
};

const ReelsSection: React.FC = () => {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "mobile";
  const [isAddReelModalOpen, setIsAddReelModalOpen] = useState(false);
  const [expandedReel, setExpandedReel] = useState<ReelItem | null>(null);
  
  // Sample reel data with state
  const [reels, setReels] = useState<ReelItem[]>([
    { id: 1, username: "ridelink_inc", imageUrl: "/lovable-uploads/02736388-a56a-464b-b977-6c8483604473.png", isActive: true },
    { id: 2, username: "mukisad", imageUrl: "https://source.unsplash.com/random/300x300?portrait=2" },
    { id: 3, username: "muwonge", imageUrl: "https://source.unsplash.com/random/300x300?portrait=3" },
    { id: 4, username: "bchemla", imageUrl: "https://source.unsplash.com/random/300x300?portrait=4" },
    { id: 5, username: "samanta", imageUrl: "https://source.unsplash.com/random/300x300?portrait=5" },
    { id: 6, username: "jessica", imageUrl: "https://source.unsplash.com/random/300x300?portrait=6" },
  ]);

  // Display all reels on desktop, but only 4 on mobile
  const displayReels = isMobile ? reels.slice(0, 4) : reels;

  const handleAddReel = (newReel: { username: string; imageUrl: string }) => {
    // Generate new ID (in a real app, this would come from the backend)
    const newId = Math.max(...reels.map(reel => reel.id)) + 1;
    
    // Add new reel to the beginning of the array
    setReels([
      {
        id: newId,
        ...newReel
      },
      ...reels
    ]);
  };

  const handleReelClick = (reel: ReelItem) => {
    setExpandedReel(reel);
  };

  const closeExpandedReel = () => {
    setExpandedReel(null);
  };

  return (
    <div className="mb-6 bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-800 flex items-center gap-2">
          <Film size={18} className="text-primary" />
          <span>Reels</span>
        </h3>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary hover:text-primary/80 p-1 h-auto"
            onClick={() => setIsAddReelModalOpen(true)}
          >
            <Plus size={18} />
            <span className="text-xs">Add</span>
          </Button>
          <Link to="/reels" className="text-xs text-primary font-medium">
            See all
          </Link>
        </div>
      </div>
      <div className="flex overflow-x-auto gap-4 pb-2 no-scrollbar">
        {displayReels.map((reel) => (
          <ReelItem
            key={reel.id}
            username={reel.username}
            imageUrl={reel.imageUrl}
            isActive={reel.isActive}
            onClick={() => handleReelClick(reel)}
          />
        ))}
      </div>
      
      <AddReelModal 
        isOpen={isAddReelModalOpen}
        onClose={() => setIsAddReelModalOpen(false)}
        onAddReel={handleAddReel}
      />

      {/* Expanded Reel Modal */}
      <Dialog open={!!expandedReel} onOpenChange={closeExpandedReel}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <div className="relative w-full">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-2 top-2 z-10 bg-black/20 hover:bg-black/40 text-white rounded-full"
              onClick={closeExpandedReel}
            >
              <X size={18} />
            </Button>
            <div className="w-full h-full max-h-[80vh] overflow-hidden">
              {expandedReel && (
                <img 
                  src={expandedReel.imageUrl} 
                  alt={`${expandedReel.username}'s reel`}
                  className="w-full h-full object-contain"
                />
              )}
            </div>
            {expandedReel && (
              <div className="p-3 bg-white">
                <h3 className="font-medium text-sm">{expandedReel.username}</h3>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReelsSection;
