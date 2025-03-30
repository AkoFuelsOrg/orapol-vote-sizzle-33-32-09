
/**
 * Utility to handle authentication errors
 */

// Function to handle profile creation errors
export const handleProfileCreationError = (error: any): string => {
  // Check if it's an RLS policy violation error
  if (error?.message?.includes("violates row-level security policy")) {
    console.log("Profile creation RLS error handled silently");
    return ""; // Return empty string to not show error to user
  }
  
  // For other errors, return the message to be displayed
  return error?.message || "An error occurred during authentication";
};
