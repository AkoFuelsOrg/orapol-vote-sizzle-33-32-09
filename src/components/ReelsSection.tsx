
import React from 'react';
import { Film } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useBreakpoint } from '@/hooks/use-mobile';

interface ReelProps {
  imageUrl: string;
  username: string;
  isActive?: boolean;
}

const ReelItem: React.FC<ReelProps> = ({ imageUrl, username, isActive = false }) => {
  return (
    <Link to={`/reels/${username}`} className="flex flex-col items-center">
      <div className={cn(
        "relative rounded-full overflow-hidden h-16 w-16 border-2 mb-1",
        isActive ? "border-gradient-to-r from-pink-500 via-red-500 to-yellow-500" : "border-gray-300"
      )}>
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
    </Link>
  );
};

const ReelsSection: React.FC = () => {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "mobile";
  
  // Sample reel data
  const reels = [
    { id: 1, username: "ridelink_inc", imageUrl: "/lovable-uploads/02736388-a56a-464b-b977-6c8483604473.png", isActive: true },
    { id: 2, username: "mukisad", imageUrl: "https://source.unsplash.com/random/300x300?portrait=2" },
    { id: 3, username: "muwonge", imageUrl: "https://source.unsplash.com/random/300x300?portrait=3" },
    { id: 4, username: "bchemla", imageUrl: "https://source.unsplash.com/random/300x300?portrait=4" },
    { id: 5, username: "samanta", imageUrl: "https://source.unsplash.com/random/300x300?portrait=5" },
    { id: 6, username: "jessica", imageUrl: "https://source.unsplash.com/random/300x300?portrait=6" },
  ];

  // Display all reels on desktop, but only 4 on mobile
  const displayReels = isMobile ? reels.slice(0, 4) : reels;

  return (
    <div className="mb-6 bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-800 flex items-center gap-2">
          <Film size={18} className="text-primary" />
          <span>Reels</span>
        </h3>
        <Link to="/reels" className="text-xs text-primary font-medium">
          See all
        </Link>
      </div>
      <div className="flex overflow-x-auto gap-4 pb-2 no-scrollbar">
        {displayReels.map((reel) => (
          <ReelItem
            key={reel.id}
            username={reel.username}
            imageUrl={reel.imageUrl}
            isActive={reel.isActive}
          />
        ))}
      </div>
    </div>
  );
};

export default ReelsSection;
