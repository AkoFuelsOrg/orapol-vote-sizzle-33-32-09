
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

// Function to convert URLs in text to clickable links
const convertLinksToAnchors = (text: string) => {
  // Regular expression to match URLs starting with http:// or https://
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  // Split the text by URLs and URLs themselves
  const parts = text.split(urlRegex);
  
  // Find all URLs in the text
  const matches = text.match(urlRegex) || [];
  
  // Create an array to hold text and JSX anchor elements
  const result: (string | JSX.Element)[] = [];
  
  // Reconstruct the content with URLs replaced by anchor elements
  parts.forEach((part, index) => {
    if (matches.includes(part)) {
      // This part is a URL, make it an anchor
      result.push(
        <a 
          key={`link-${index}`}
          href={part}
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline break-all"
        >
          {part}
        </a>
      );
    } else if (part) {
      // This is regular text
      result.push(part);
    }
  });
  
  return result;
};

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
  // and convert content with URLs to be clickable
  const enhancedPost = {
    ...post,
    author: {
      ...post.author,
      avatar: getAvatarUrl(post.author.avatar),
    },
    // Store the original content for editing purposes
    originalContent: post.content,
    // Add the processed content with links as a new property
    contentWithLinks: convertLinksToAnchors(post.content)
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
