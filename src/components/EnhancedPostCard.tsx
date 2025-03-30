
import React from "react";
import PostCard from "./PostCard";
import { Post } from "../lib/types";

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
  // Pass only the props that PostCard accepts
  return (
    <PostCard
      post={post}
      onPostUpdate={() => {}}
      onPostDeleted={() => {}}
    />
  );
};
