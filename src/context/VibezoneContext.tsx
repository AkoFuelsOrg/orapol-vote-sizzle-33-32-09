
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSupabase } from './SupabaseContext';
import { Video, VideoComment } from '@/lib/types';

type VibezoneContextType = {
  fetchVideos: (limit?: number) => Promise<Video[]>;
  fetchVideo: (id: string) => Promise<Video | null>;
  fetchVideoComments: (videoId: string) => Promise<VideoComment[]>;
  addVideoComment: (videoId: string, content: string) => Promise<VideoComment | null>;
  likeVideo: (videoId: string) => Promise<boolean>;
  unlikeVideo: (videoId: string) => Promise<boolean>;
  viewVideo: (videoId: string) => Promise<boolean>;
  uploadVideo: (videoData: Partial<Video>, videoFile: File, thumbnailFile?: File) => Promise<Video | null>;
  hasLikedVideo: (videoId: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
};

const VibezoneContext = createContext<VibezoneContextType | undefined>(undefined);

export const VibezoneProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useSupabase();

  // Fetch videos from the database
  const fetchVideos = async (limit = 20): Promise<Video[]> => {
    try {
      setLoading(true);
      setError(null);
      
      // First, get the videos
      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (videosError) throw videosError;
      
      // Transform the data to match our Video type
      const transformedVideos = await Promise.all(videosData.map(async (video) => {
        // Fetch the author info separately
        let authorInfo = null;
        if (video.user_id) {
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', video.user_id)
            .single();
          
          if (!userError && userData) {
            authorInfo = {
              id: userData.id || '',
              name: userData.username || 'Unknown User',
              avatar: userData.avatar_url || '',
              username: userData.username || 'Unknown User',
              avatar_url: userData.avatar_url || ''
            };
          }
        }
        
        // Safely add author to the video object
        const videoWithAuthor = {
          ...video,
          author: authorInfo || { 
            id: '', 
            name: 'Unknown User', 
            avatar: '', 
            username: 'Unknown User', 
            avatar_url: '' 
          }
        } as Video;
        
        return videoWithAuthor;
      }));
      
      return transformedVideos;
    } catch (error: any) {
      setError(error.message);
      console.error('Error fetching videos:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch a single video by ID
  const fetchVideo = async (id: string): Promise<Video | null> => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch the video
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      // Fetch the author info separately
      let authorInfo = null;
      if (data.user_id) {
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user_id)
          .single();
        
        if (!userError && userData) {
          authorInfo = {
            id: userData.id || '',
            name: userData.username || 'Unknown User',
            avatar: userData.avatar_url || '',
            username: userData.username || 'Unknown User',
            avatar_url: userData.avatar_url || ''
          };
        }
      }
      
      // Safely add author to the video object
      const transformedVideo = {
        ...data,
        author: authorInfo || { 
          id: '', 
          name: 'Unknown User', 
          avatar: '', 
          username: 'Unknown User', 
          avatar_url: '' 
        }
      } as Video;
      
      return transformedVideo;
    } catch (error: any) {
      setError(error.message);
      console.error('Error fetching video:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Fetch comments for a video
  const fetchVideoComments = async (videoId: string): Promise<VideoComment[]> => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch the comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('video_comments')
        .select('*')
        .eq('video_id', videoId)
        .order('created_at', { ascending: true });
      
      if (commentsError) throw commentsError;
      
      // Transform the data to match our VideoComment type
      const transformedComments = await Promise.all(commentsData.map(async (comment) => {
        // Fetch the author info separately
        let authorInfo = null;
        if (comment.user_id) {
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', comment.user_id)
            .single();
          
          if (!userError && userData) {
            authorInfo = {
              id: userData.id || '',
              name: userData.username || 'Unknown User',
              avatar: userData.avatar_url || '',
              username: userData.username || 'Unknown User',
              avatar_url: userData.avatar_url || ''
            };
          }
        }
        
        // Safely add author to the comment object
        const commentWithAuthor = {
          ...comment,
          author: authorInfo || { 
            id: '', 
            name: 'Unknown User', 
            avatar: '', 
            username: 'Unknown User', 
            avatar_url: '' 
          }
        } as VideoComment;
        
        return commentWithAuthor;
      }));
      
      return transformedComments;
    } catch (error: any) {
      setError(error.message);
      console.error('Error fetching video comments:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Add a comment to a video
  const addVideoComment = async (videoId: string, content: string): Promise<VideoComment | null> => {
    if (!user) {
      toast.error('You must be logged in to comment');
      return null;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Insert the comment
      const { data, error } = await supabase
        .from('video_comments')
        .insert({
          video_id: videoId,
          user_id: user.id,
          content
        })
        .select('*')
        .single();
      
      if (error) throw error;
      
      // Fetch the author info separately
      let authorInfo = null;
      if (user.id) {
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (!userError && userData) {
          authorInfo = {
            id: userData.id || '',
            name: userData.username || 'Unknown User',
            avatar: userData.avatar_url || '',
            username: userData.username || 'Unknown User',
            avatar_url: userData.avatar_url || ''
          };
        }
      }
      
      // Safely add author to the comment object
      const transformedComment = {
        ...data,
        author: authorInfo || { 
          id: '', 
          name: 'Unknown User', 
          avatar: '', 
          username: 'Unknown User', 
          avatar_url: '' 
        }
      } as VideoComment;
      
      toast.success('Comment added successfully');
      return transformedComment;
    } catch (error: any) {
      setError(error.message);
      toast.error('Failed to add comment');
      console.error('Error adding comment:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Like a video
  const likeVideo = async (videoId: string): Promise<boolean> => {
    if (!user) {
      toast.error('You must be logged in to like videos');
      return false;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase
        .from('video_likes')
        .insert({
          video_id: videoId,
          user_id: user.id
        });
      
      if (error) throw error;
      
      return true;
    } catch (error: any) {
      // If the error is a duplicate key error, it means the user has already liked the video
      if (error.code === '23505') {
        return true;
      }
      
      setError(error.message);
      console.error('Error liking video:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Unlike a video
  const unlikeVideo = async (videoId: string): Promise<boolean> => {
    if (!user) {
      toast.error('You must be logged in to unlike videos');
      return false;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase
        .from('video_likes')
        .delete()
        .eq('video_id', videoId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      return true;
    } catch (error: any) {
      setError(error.message);
      console.error('Error unliking video:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Check if user has liked a video
  const hasLikedVideo = async (videoId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase
        .from('video_likes')
        .select('id')
        .eq('video_id', videoId)
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        throw error;
      }
      
      return !!data;
    } catch (error: any) {
      console.error('Error checking if user liked video:', error);
      return false;
    }
  };

  // Record a view for a video
  const viewVideo = async (videoId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const viewData: any = {
        video_id: videoId
      };
      
      // If user is logged in, associate the view with their account
      if (user) {
        viewData.user_id = user.id;
      } else {
        // Otherwise, record the IP address (in a real app, would get this from the backend)
        viewData.ip_address = '127.0.0.1'; // Placeholder IP
      }
      
      const { error } = await supabase
        .from('video_views')
        .insert(viewData);
      
      if (error) throw error;
      
      return true;
    } catch (error: any) {
      setError(error.message);
      console.error('Error recording video view:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Upload a video
  const uploadVideo = async (
    videoData: Partial<Video>, 
    videoFile: File,
    thumbnailFile?: File
  ): Promise<Video | null> => {
    if (!user) {
      toast.error('You must be logged in to upload videos');
      return null;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log("Starting video upload process");
      
      // 1. Upload the video file to Storage - using avatars bucket as a fallback
      // Since we see the bucket not found error, let's use an existing bucket
      const videoFileName = `${user.id}/${Date.now()}-${videoFile.name.replace(/\s+/g, '-')}`;
      console.log("Uploading video to storage:", videoFileName);
      
      const { data: videoUploadData, error: videoUploadError } = await supabase.storage
        .from('avatars')
        .upload(videoFileName, videoFile);
      
      if (videoUploadError) {
        console.error("Video upload error:", videoUploadError);
        throw videoUploadError;
      }
      
      // Get the public URL for the video
      const { data: { publicUrl: videoUrl } } = await supabase.storage
        .from('avatars')
        .getPublicUrl(videoFileName);
      
      console.log("Video uploaded successfully. URL:", videoUrl);
      
      // 2. Upload the thumbnail if provided
      let thumbnailUrl = '';
      if (thumbnailFile) {
        console.log("Uploading thumbnail");
        const thumbnailFileName = `${user.id}/${Date.now()}-${thumbnailFile.name.replace(/\s+/g, '-')}`;
        const { data: thumbnailUploadData, error: thumbnailUploadError } = await supabase.storage
          .from('avatars')
          .upload(thumbnailFileName, thumbnailFile);
        
        if (thumbnailUploadError) {
          console.error("Thumbnail upload error:", thumbnailUploadError);
          throw thumbnailUploadError;
        }
        
        // Get the public URL for the thumbnail
        const { data: { publicUrl } } = await supabase.storage
          .from('avatars')
          .getPublicUrl(thumbnailFileName);
        
        thumbnailUrl = publicUrl;
        console.log("Thumbnail uploaded successfully. URL:", thumbnailUrl);
      }
      
      // 3. Insert the video record in the database
      console.log("Inserting video record in database");
      const { data, error } = await supabase
        .from('videos')
        .insert({
          title: videoData.title || 'Untitled Video',
          description: videoData.description || '',
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl || null,
          duration: videoData.duration || 0,
          user_id: user.id
        })
        .select('*')
        .single();
      
      if (error) {
        console.error("Database insert error:", error);
        throw error;
      }
      
      toast.success('Video uploaded successfully');
      console.log("Video uploaded and inserted successfully:", data);
      return data as Video;
    } catch (error: any) {
      setError(error.message);
      toast.error('Failed to upload video: ' + error.message);
      console.error('Error uploading video:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    fetchVideos,
    fetchVideo,
    fetchVideoComments,
    addVideoComment,
    likeVideo,
    unlikeVideo,
    viewVideo,
    uploadVideo,
    hasLikedVideo,
    loading,
    error
  };

  return (
    <VibezoneContext.Provider value={value}>
      {children}
    </VibezoneContext.Provider>
  );
};

export const useVibezone = (): VibezoneContextType => {
  const context = useContext(VibezoneContext);
  if (context === undefined) {
    throw new Error('useVibezone must be used within a VibezoneProvider');
  }
  return context;
};
