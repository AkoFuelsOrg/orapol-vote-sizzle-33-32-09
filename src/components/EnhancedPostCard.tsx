
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
  showComments,
  onLike,
  onFavorite,
  onComment,
  onShare,
  onPostClick,
  onUserClick,
}) => {
  // Create a modified post with the author's avatar updated using our utility
  const enhancedPost = {
    ...post,
    author: {
      ...post.author,
      avatar: getAvatarUrl(post.author.avatar),
    }
  };

  // Pass all relevant props to PostCard component
  return (
    <PostCard
      post={enhancedPost}
      onPostUpdate={() => {
        if (onPostClick) onPostClick(post.id);
      }}
      onPostDeleted={() => {}}
      showComments={showComments}
      onLike={onLike ? () => onLike(post.id) : undefined}
      onComment={onComment ? () => onComment(post.id) : undefined}
      onShare={onShare ? () => onShare(post.id) : undefined}
      onUserClick={onUserClick}
    />
  );
};
