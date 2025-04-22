
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
    // Add timestamp to force browser to reload the image and not use cache
    if (avatarUrl.includes('supabase.co')) {
      // For Supabase Storage URLs, add a timestamp parameter to prevent caching
      const timestamp = new Date().getTime();
      return `${avatarUrl}?t=${timestamp}`;
    }
    return avatarUrl;
  }
  
  // Return the default avatar image
  return "/lovable-uploads/a031d96a-edf1-46c7-a8b5-2b75b8ff96ec.png";
};
