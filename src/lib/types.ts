
export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  imageUrl?: string | null; // Added imageUrl field for option images
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  author: User;
  createdAt: string;
  totalVotes: number;
  commentCount: number;
  userVoted?: string; // ID of the option the user voted for
  image?: string; // Optional image URL for the poll
}

export interface Post {
  id: string;
  content: string;
  author: User;
  createdAt: string;
  image?: string; // Optional image URL for the post
  commentCount: number;
  likeCount: number;
  userLiked?: boolean; // Whether the current user liked this post
}

export interface Comment {
  id: string;
  pollId: string;
  author: User;
  content: string;
  createdAt: string;
  likes: number;
  // parentId removed as it doesn't exist in the database
  replyCount?: number; // Number of replies to this comment
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
  attachment_url?: string;
  attachment_type?: 'image' | 'video' | 'document' | 'gif' | 'emoji';
}
