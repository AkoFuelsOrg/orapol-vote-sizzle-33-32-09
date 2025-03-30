
import React from "react";
import PostCard from "./PostCard";
import { Post } from "../lib/types";
import { getAvatarUrl } from "../lib/avatar-utils";

interface EnhancedPostCardProps {
  post: Post;
  showComments?: boolean;
  onLike?: (postId: string) => void;
  onFavorite?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onPostClick?: (postId: string) => void;
  onUserClick?: (userId: string) => void;
}

export const EnhancedPostCard: React.FC<EnhancedPostCardProps> = ({
  post,
  onLike,
  onFavorite,
  onComment,
  onShare,
  onPostClick,
  onUserClick,
}) => {
  // Create a modified post with the author's avatar updated
  const enhancedPost = {
    ...post,
    author: {
      ...post.author,
      avatar: getAvatarUrl(post.author.avatar),
    }
  };

  // Pass only the props that PostCard accepts
  return (
    <PostCard
      post={enhancedPost}
      onPostUpdate={() => {}}
      onPostDeleted={() => {}}
    />
  );
};
