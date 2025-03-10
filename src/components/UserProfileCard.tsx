
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import { User } from '@supabase/supabase-js';
import { Loader2, UserCheck, UserPlus } from 'lucide-react';

interface UserProfileCardProps {
  userId: string;
  username: string;
  avatarUrl: string;
  hideFollowButton?: boolean;
  minimal?: boolean;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({ 
  userId, 
  username, 
  avatarUrl, 
  hideFollowButton = false,
  minimal = false
}) => {
  const { user, followUser, unfollowUser, isFollowing, loading } = useSupabase();
  const [isFollowingUser, setIsFollowingUser] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  
  useEffect(() => {
    if (user) {
      checkFollowingStatus();
    }
  }, [user, userId]);
  
  const checkFollowingStatus = async () => {
    if (user) {
      const following = await isFollowing(userId);
      setIsFollowingUser(following);
    }
  };
  
  const handleFollowAction = async () => {
    if (!user) return;
    if (userId === user.id) return;
    
    setActionLoading(true);
    try {
      if (isFollowingUser) {
        await unfollowUser(userId);
      } else {
        await followUser(userId);
      }
      await checkFollowingStatus();
    } finally {
      setActionLoading(false);
    }
  };
  
  // Don't show follow button for own profile
  const showFollowButton = !hideFollowButton && user && user.id !== userId;
  
  if (minimal) {
    return (
      <Link to={`/user/${userId}`} className="flex items-center space-x-2 p-2 hover:bg-secondary/50 rounded-lg transition-colors">
        <img 
          src={avatarUrl || `https://i.pravatar.cc/150?u=${userId}`} 
          alt={username} 
          className="w-8 h-8 rounded-full object-cover"
        />
        <span className="font-medium">{username || 'Anonymous'}</span>
      </Link>
    );
  }
  
  return (
    <div className="flex items-center justify-between p-3 border border-border/50 rounded-lg bg-white">
      <Link to={`/user/${userId}`} className="flex items-center space-x-3">
        <img 
          src={avatarUrl || `https://i.pravatar.cc/150?u=${userId}`} 
          alt={username} 
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <p className="font-medium">{username || 'Anonymous'}</p>
          <p className="text-xs text-muted-foreground">View profile</p>
        </div>
      </Link>
      
      {showFollowButton && (
        <button
          onClick={handleFollowAction}
          disabled={actionLoading}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm transition-colors ${
            isFollowingUser 
              ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' 
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {actionLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isFollowingUser ? (
            <>
              <UserCheck className="h-4 w-4 mr-1" />
              <span>Following</span>
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-1" />
              <span>Follow</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default UserProfileCard;
