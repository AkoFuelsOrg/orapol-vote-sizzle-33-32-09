
import React from "react";
import UserAvatar from "./UserAvatar";
import { getAvatarUrl } from "../lib/avatar-utils";
import { User } from "../lib/types";

interface DefaultUserAvatarProps {
  user: User | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const DefaultUserAvatar: React.FC<DefaultUserAvatarProps> = ({
  user,
  size,
  className,
}) => {
  // Use the utility function to get the avatar URL
  const avatarUrl = user?.avatar_url ? getAvatarUrl(user.avatar_url) : getAvatarUrl(null);
  
  // Create a modified user object with the default avatar
  const userWithDefaultAvatar = user
    ? {
        ...user,
        avatar_url: avatarUrl,
      }
    : null;

  return (
    <UserAvatar
      user={userWithDefaultAvatar}
      size={size}
      className={className}
    />
  );
};
