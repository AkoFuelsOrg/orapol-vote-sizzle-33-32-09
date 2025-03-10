
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import { User } from '@supabase/supabase-js';
import { Loader2, UserCheck, UserPlus, MessageSquare } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { Button } from './ui/button';

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
  const [canMessage, setCanMessage] = useState<boolean>(false);
  
  useEffect(() => {
    if (user) {
      checkFollowingStatus();
      checkCanMessage();
    }
  }, [user, userId]);
  
  const checkFollowingStatus = async () => {
    if (user) {
      const following = await isFollowing(userId);
      setIsFollowingUser(following);
    }
  };
  
  const checkCanMessage = async () => {
    if (user && userId) {
      try {
        const { data, error } = await supabase
          .rpc('can_message', { user_id_1: user.id, user_id_2: userId });
          
        if (error) throw error;
        setCanMessage(!!data);
      } catch (error) {
        console.error('Error checking messaging permission:', error);
        setCanMessage(false);
      }
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
      await checkCanMessage();
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
          className="w-8 h-8 rounded-full border-2 border-red-500 object-cover"
        />
        <span className="font-medium text-red-500">{username || 'Anonymous'}</span>
      </Link>
    );
  }
  
  return (
    <div className="flex flex-col p-3 border border-border/50 rounded-lg bg-white">
      <Link to={`/user/${userId}`} className="flex items-center space-x-3 mb-3">
        <img 
          src={avatarUrl || `https://i.pravatar.cc/150?u=${userId}`} 
          alt={username} 
          className="w-10 h-10 rounded-full border-2 border-red-500 object-cover"
        />
        <div>
          <p className="font-medium text-red-500">{username || 'Anonymous'}</p>
          <p className="text-xs text-muted-foreground">View profile</p>
        </div>
      </Link>
      
      {(showFollowButton || (canMessage && user && user.id !== userId)) && (
        <div className="flex space-x-2 mt-1">
          {showFollowButton && (
            <Button
              onClick={handleFollowAction}
              disabled={actionLoading}
              variant={isFollowingUser ? "secondary" : "default"}
              size="sm"
              className="flex-1"
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
            </Button>
          )}
          
          {canMessage && user && user.id !== userId && (
            <Button 
              asChild
              variant="secondary"
              size="sm"
              className="flex-1"
            >
              <Link to={`/messages/${userId}`}>
                <MessageSquare className="h-4 w-4 mr-1" />
                <span>Message</span>
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default UserProfileCard;
