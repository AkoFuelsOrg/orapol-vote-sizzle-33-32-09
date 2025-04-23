
import React, { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getAvatarUrl } from '../lib/avatar-utils';

interface UserAvatarProps {
  user: {
    avatar_url?: string | null;
    username?: string | null;
  } | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  forceAvatarUrl?: string | null;
  forceRefresh?: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  user, 
  size = 'md',
  className = '',
  forceAvatarUrl = null,
  forceRefresh = false
}) => {
  // Use a more robust key that will definitely change when needed
  const [key, setKey] = useState(() => `avatar-${Date.now()}`);
  
  // Force re-render when avatar URL changes or when forceRefresh is true
  useEffect(() => {
    const newKey = `avatar-${Date.now()}-${forceRefresh ? 'refresh' : 'normal'}-${user?.avatar_url || 'none'}-${forceAvatarUrl || 'none'}`;
    setKey(newKey);
  }, [user?.avatar_url, forceAvatarUrl, forceRefresh]);

  const getSize = () => {
    switch (size) {
      case 'sm': return 'h-8 w-8';
      case 'md': return 'h-10 w-10';
      case 'lg': return 'h-14 w-14';
      case 'xl': return 'h-20 w-20';
      default: return 'h-10 w-10';
    }
  };

  // Use forced avatar URL if provided, otherwise get from user
  // The getAvatarUrl function now always adds a cache-busting timestamp
  const avatarUrl = forceAvatarUrl !== null 
    ? getAvatarUrl(forceAvatarUrl) 
    : getAvatarUrl(user?.avatar_url);
  
  const initials = user?.username 
    ? user.username.substring(0, 2).toUpperCase() 
    : '?';

  return (
    <Avatar className={`${getSize()} ${className}`}>
      <AvatarImage 
        key={key}
        src={avatarUrl} 
        alt={user?.username || 'User'}
        className="object-cover" // Added object-fit: cover style
      />
      <AvatarFallback className="bg-blue-100 text-blue-800 flex items-center justify-center">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
