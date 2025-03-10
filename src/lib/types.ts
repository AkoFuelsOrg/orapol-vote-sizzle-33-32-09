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

export interface Comment {
  id: string;
  pollId: string;
  author: User;
  content: string;
  createdAt: string;
  likes: number;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}
