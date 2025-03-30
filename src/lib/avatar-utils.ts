
/**
 * Utility functions for handling user avatars
 */

/**
 * Returns the appropriate avatar URL based on user data
 * Uses the default avatar if the user has no avatar set
 */
export const getAvatarUrl = (avatarUrl?: string | null): string => {
  // Check if we have a valid avatar URL that's not a placeholder
  if (avatarUrl && 
      avatarUrl.trim() !== '' && 
      !avatarUrl.includes('i.pravatar.cc') && 
      !avatarUrl.includes('avatar.com') && 
      !avatarUrl.includes('placeholder') &&
      !avatarUrl.includes('dicebear')
  ) {
    return avatarUrl;
  }
  
  // Return the default avatar image
  return "/lovable-uploads/default-avatar.png";
};
