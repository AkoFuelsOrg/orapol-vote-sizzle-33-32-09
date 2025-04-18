
import React from "react";
import UserProfileCard from "./UserProfileCard";
import { User } from "../lib/types";
import { getAvatarUrl } from "../lib/avatar-utils";

interface EnhancedUserProfileCardProps {
  user: User;
  onFollow?: () => void;
  onUnfollow?: () => void;
  isFollowing?: boolean;
  isCurrentUser?: boolean;
}

export const EnhancedUserProfileCard: React.FC<EnhancedUserProfileCardProps> = ({
  user,
  onFollow,
  onUnfollow,
  isFollowing,
  isCurrentUser,
}) => {
  // Ensure the avatar URL is properly set
  const enhancedAvatarUrl = getAvatarUrl(user.avatar_url);
  
  // UserProfileCard handles its own follow/unfollow logic internally
  // Only pass props it actually accepts according to its interface
  return (
    <UserProfileCard
      userId={user.id}
      username={user.username || "Anonymous"}
      avatarUrl={enhancedAvatarUrl}
      hideFollowButton={isCurrentUser}
      minimal={false}
    />
  );
};
