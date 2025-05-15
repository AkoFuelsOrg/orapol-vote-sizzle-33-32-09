
import React, { useState } from "react";
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

  const handlePostDeleted = (postId: string) => {
    // This function is required by PostCard but not used in EnhancedPostCard
    // Adding empty implementation to satisfy type requirements
    console.log("Post deleted:", postId);
  };

  // Pass both required props to PostCard
  return (
    <PostCard
      post={enhancedPost}
      onPostUpdate={handlePostUpdate}
      onPostDeleted={handlePostDeleted}
    />
  );
};
