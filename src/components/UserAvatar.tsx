
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
  forceAvatarUrl?: string | null; // Add optional prop to force a specific avatar URL
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  user, 
  size = 'md',
  className = '',
  forceAvatarUrl = null
}) => {
  const [key, setKey] = useState(Date.now());
  
  // Force re-render when avatar URL changes
  useEffect(() => {
    setKey(Date.now());
  }, [user?.avatar_url, forceAvatarUrl]);

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
  const avatarUrl = forceAvatarUrl !== null 
    ? getAvatarUrl(forceAvatarUrl) 
    : getAvatarUrl(user?.avatar_url);
  
  const initials = user?.username 
    ? user.username.substring(0, 2).toUpperCase() 
    : '?';

  return (
    <Avatar className={`${getSize()} ${className}`}>
      <AvatarImage 
        key={key} // Add key to force re-render when URL changes
        src={avatarUrl} 
        alt={user?.username || 'User'}
      />
      <AvatarFallback className="bg-blue-100 text-blue-800 flex items-center justify-center">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
