
import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface UserAvatarProps {
  user: {
    avatar_url?: string | null;
    username?: string | null;
  } | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  user, 
  size = 'md',
  className = '' 
}) => {
  const getSize = () => {
    switch (size) {
      case 'sm': return 'h-8 w-8';
      case 'md': return 'h-10 w-10';
      case 'lg': return 'h-14 w-14';
      case 'xl': return 'h-20 w-20';
      default: return 'h-10 w-10';
    }
  };

  // Update default avatar URL to use the new image
  const defaultAvatarUrl = "/lovable-uploads/d731e3a9-5c0f-466c-8468-16c2465aca8a.png";
  
  const initials = user?.username 
    ? user.username.substring(0, 2).toUpperCase() 
    : '?';

  return (
    <Avatar className={`${getSize()} ${className}`}>
      {user?.avatar_url ? (
        <AvatarImage 
          src={user.avatar_url} 
          alt={user?.username || 'User'} 
        />
      ) : (
        <AvatarImage 
          src={defaultAvatarUrl} 
          alt={user?.username || 'User'} 
        />
      )}
      <AvatarFallback className="bg-blue-100 text-blue-800 flex items-center justify-center">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
