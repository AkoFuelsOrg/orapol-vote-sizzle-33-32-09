
/**
 * Utility functions for handling user avatars
 */

/**
 * Returns the appropriate avatar URL based on user data
 * Uses the default avatar if the user has no avatar set
 */
export const getAvatarUrl = (avatarUrl?: string | null): string => {
  if (avatarUrl && avatarUrl.trim() !== '') {
    return avatarUrl;
  }
  
  // Return the default avatar image
  return "/lovable-uploads/default-avatar.png";
};
