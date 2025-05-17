
import React from "react";
import PostCard from "./PostCard";
import { Post } from "../lib/types";
import { getAvatarUrl } from "../lib/avatar-utils";
import { useGroup } from "../context/GroupContext";

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
  // Create a modified post with the author's avatar updated using our utility
  const enhancedPost = {
    ...post,
    author: {
      ...post.author,
      avatar: getAvatarUrl(post.author.avatar),
    }
  };
  
  const handlePostUpdate = () => {
    if (onLike && post.id) {
      onLike(post.id);
    }
  };

  // Pass the props to PostCard with empty handlers for required props that aren't needed here
  return (
    <PostCard
      post={enhancedPost}
      onPostUpdate={handlePostUpdate}
      onPostDeleted={() => {}}
    />
  );
};
