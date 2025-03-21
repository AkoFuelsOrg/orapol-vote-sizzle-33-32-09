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
  subscribeToChannel: (channelUserId: string) => Promise<boolean>;
  unsubscribeFromChannel: (channelUserId: string) => Promise<boolean>;
  hasSubscribedToChannel: (channelUserId: string) => Promise<boolean>;
  getSubscriberCount: (channelUserId: string) => Promise<number>;
  downloadVideo: (videoUrl: string, videoTitle: string) => void;
  loading: boolean;
  error: string | null;
};

const VibezoneContext = createContext<VibezoneContextType | undefined>(undefined);

export const VibezoneProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useSupabase();

  const fetchVideos = async (limit = 20): Promise<Video[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (videosError) throw videosError;
      
      const transformedVideos = await Promise.all(videosData.map(async (video) => {
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

  const fetchVideo = async (id: string): Promise<Video | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
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

  const fetchVideoComments = async (videoId: string): Promise<VideoComment[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: commentsData, error: commentsError } = await supabase
        .from('video_comments')
        .select('*')
        .eq('video_id', videoId)
        .order('created_at', { ascending: false });
      
      if (commentsError) throw commentsError;
      
      const transformedComments = await Promise.all(commentsData.map(async (comment) => {
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

  const addVideoComment = async (videoId: string, content: string): Promise<VideoComment | null> => {
    if (!user) {
      toast.error('You must be logged in to comment');
      return null;
    }
    
    try {
      setLoading(true);
      setError(null);
      
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

  const hasLikedVideo = async (videoId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase
        .from('video_likes')
        .select('id')
        .eq('video_id', videoId)
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return !!data;
    } catch (error: any) {
      console.error('Error checking if user liked video:', error);
      return false;
    }
  };

  const viewVideo = async (videoId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const viewData: any = {
        video_id: videoId
      };
      
      if (user) {
        viewData.user_id = user.id;
      } else {
        viewData.ip_address = '127.0.0.1';
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
      
      const videoFileName = `${user.id}/${Date.now()}-${videoFile.name.replace(/\s+/g, '-')}`;
      console.log("Uploading video to storage:", videoFileName);
      
      const { data: videoUploadData, error: videoUploadError } = await supabase.storage
        .from('avatars')
        .upload(videoFileName, videoFile);
      
      if (videoUploadError) {
        console.error("Video upload error:", videoUploadError);
        throw videoUploadError;
      }
      
      const { data: { publicUrl: videoUrl } } = await supabase.storage
        .from('avatars')
        .getPublicUrl(videoFileName);
      
      console.log("Video uploaded successfully. URL:", videoUrl);
      
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
        
        const { data: { publicUrl } } = await supabase.storage
          .from('avatars')
          .getPublicUrl(thumbnailFileName);
        
        thumbnailUrl = publicUrl;
        console.log("Thumbnail uploaded successfully. URL:", thumbnailUrl);
      }
      
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

  const subscribeToChannel = async (channelUserId: string): Promise<boolean> => {
    if (!user) {
      toast.error('You must be logged in to subscribe');
      return false;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase
        .from('channel_subscriptions')
        .insert({
          channel_id: channelUserId,
          subscriber_id: user.id
        });
      
      if (error) throw error;
      
      toast.success('Subscribed successfully');
      return true;
    } catch (error: any) {
      if (error.code === '23505') {
        return true;
      }
      
      setError(error.message);
      console.error('Error subscribing to channel:', error);
      toast.error('Failed to subscribe');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const unsubscribeFromChannel = async (channelUserId: string): Promise<boolean> => {
    if (!user) {
      toast.error('You must be logged in to unsubscribe');
      return false;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase
        .from('channel_subscriptions')
        .delete()
        .eq('channel_id', channelUserId)
        .eq('subscriber_id', user.id);
      
      if (error) throw error;
      
      toast.success('Unsubscribed successfully');
      return true;
    } catch (error: any) {
      setError(error.message);
      console.error('Error unsubscribing from channel:', error);
      toast.error('Failed to unsubscribe');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const hasSubscribedToChannel = async (channelUserId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase
        .from('channel_subscriptions')
        .select('id')
        .eq('channel_id', channelUserId)
        .eq('subscriber_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      return !!data;
    } catch (error: any) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  };

  const getSubscriberCount = async (channelUserId: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('channel_subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('channel_id', channelUserId);
      
      if (error) throw error;
      
      return count || 0;
    } catch (error: any) {
      console.error('Error getting subscriber count:', error);
      return 0;
    }
  };

  const downloadVideo = (videoUrl: string, videoTitle: string) => {
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `${videoTitle.replace(/\s+/g, '_')}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast.success('Download started');
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
    subscribeToChannel,
    unsubscribeFromChannel,
    hasSubscribedToChannel,
    getSubscriberCount,
    downloadVideo,
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
