export interface User {
  id: string;
  name?: string;
  avatar?: string;
  email?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
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
  author?: User;
}

export interface VideoComment {
  id: string;
  video_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  author?: User;
}
