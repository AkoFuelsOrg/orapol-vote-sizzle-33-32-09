
import React from "react";
import { PostCard } from "./PostCard";
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
  showComments,
  onLike,
  onFavorite,
  onComment,
  onShare,
  onPostClick,
  onUserClick,
}) => {
  // Pass all props to the original PostCard component
  return (
    <PostCard
      post={post}
      showComments={showComments}
      onLike={onLike}
      onFavorite={onFavorite}
      onComment={onComment}
      onShare={onShare}
      onPostClick={onPostClick}
      onUserClick={onUserClick}
    />
  );
};
