
export interface User {
  id: string;
  name?: string;
  avatar?: string;
  email?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
  username?: string;
  avatar_url?: string;
  user_metadata?: {
    username?: string;
    avatar_url?: string;
  };
}

export interface Video {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
  views: number;
  duration?: number;
  likes: number;
  author?: User;
  is_advertisement?: boolean;
  subscribers?: number;
}

export interface VideoComment {
  id: string;
  video_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  author?: User;
  likes: number;
  parent_id?: string; 
  replies?: VideoComment[];
  user_has_liked?: boolean;
  username?: string;     // Adding the missing property
  user_avatar?: string;  // Adding the missing property
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
  attachment_url?: string;
  attachment_type?: string;
}

export interface LiveMessage {
  id: string;
  user_id: string;
  room_code: string;
  content: string;
  created_at: string;
  username: string;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  author: User;
  createdAt: string;
  totalVotes: number;
  commentCount: number;
  userVoted?: string;
  image?: string;
  groupId?: string;
  marketplace_id?: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  imageUrl?: string | null;
  poll_id?: string;
}

export interface Post {
  id: string;
  content: string;
  author: User;
  createdAt: string;
  image?: string;
  commentCount: number;
  likeCount: number;
  userLiked: boolean;
  groupId?: string;
  marketplace_id?: string;
  isDeleted?: boolean; // New field to track deletion status
  shared_from_post_id?: string; // Added field for sharing functionality
}

// Add PostWithAuthor interface that matches the requirements in PostCard.tsx
export interface PostWithAuthor {
  id: string;
  title?: string;
  content: string;
  created_at: string;
  image_url?: string;
  author?: {
    id: string;
    username?: string;
    avatar_url?: string;
  };
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
  is_saved?: boolean;
}

export interface Comment {
  id: string;
  pollId: string;
  author: User;
  content: string;
  createdAt: string;
  likes: number;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  cover_url?: string;
  created_at: string;
  created_by: string;
  member_count: number;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
  role: 'admin' | 'moderator' | 'member';
  user: {
    username: string;
    avatar_url: string;
  };
}

export interface Marketplace {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  cover_url?: string;
  created_at: string;
  created_by: string;
  member_count: number;
}

export interface MarketplaceMember {
  id: string;
  marketplace_id: string;
  user_id: string;
  joined_at: string;
  role: 'admin' | 'moderator' | 'member';
  user: {
    username: string;
    avatar_url: string;
  };
}
