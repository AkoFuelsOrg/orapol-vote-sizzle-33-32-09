
/**
 * Utility functions for handling user avatars
 */

/**
 * Returns the appropriate avatar URL based on user data
 * Uses the default avatar if the user has no avatar set
 */
export const getAvatarUrl = (avatarUrl?: string | null): string => {
  if (avatarUrl) {
    return avatarUrl;
  }
  
  // Return the default avatar image
  return "/lovable-uploads/a4e9124a-4f86-442b-a248-deb01d8501eb.png";
};
