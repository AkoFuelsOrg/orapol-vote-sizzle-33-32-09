
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
  // Create a modified user object with the default avatar if needed
  const enhancedUser = {
    ...user,
    avatar_url: getAvatarUrl(user.avatar_url),
  };

  return (
    <UserProfileCard
      user={enhancedUser}
      onFollow={onFollow}
      onUnfollow={onUnfollow}
      isFollowing={isFollowing}
      isCurrentUser={isCurrentUser}
    />
  );
};
