
/**
 * Utility functions for handling user avatars
 */

/**
 * Returns the appropriate avatar URL based on user data
 * Uses the default avatar if the user has no avatar set
 * Adds a cache-busting parameter to ensure fresh images
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
    const timestamp = new Date().getTime();
    
    // For Supabase Storage URLs or any URLs, add a timestamp parameter to prevent caching
    if (avatarUrl.includes('?')) {
      // URL already has parameters, append timestamp
      return `${avatarUrl}&t=${timestamp}`;
    } else {
      // URL has no parameters, add timestamp as first parameter
      return `${avatarUrl}?t=${timestamp}`;
    }
  }
  
  // Return the default avatar image
  return "/lovable-uploads/a031d96a-edf1-46c7-a8b5-2b75b8ff96ec.png";
};
