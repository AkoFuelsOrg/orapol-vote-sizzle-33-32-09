
import React from 'react';

export const DEFAULT_AVATAR_URL = '/lovable-uploads/a031d96a-edf1-46c7-a8b5-2b75b8ff96ec.png';
export const USER_AVATAR_FALLBACK = '/lovable-uploads/a031d96a-edf1-46c7-a8b5-2b75b8ff96ec.png';

export const DefaultAvatarProvider: React.FC = () => {
  return (
    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200">
      <img 
        src={DEFAULT_AVATAR_URL} 
        alt="Default user avatar" 
        className="w-full h-full rounded-full object-cover"
      />
    </div>
  );
};
