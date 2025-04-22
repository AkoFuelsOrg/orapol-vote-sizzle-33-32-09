
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
  // Add timestamp to URL to ensure the latest avatar is displayed
  const enhancedAvatarUrl = getAvatarUrl(user.avatar_url);
  
  // Pass props that match UserProfileCard requirements
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

export default EnhancedUserProfileCard;
