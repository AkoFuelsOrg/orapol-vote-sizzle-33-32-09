import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSupabase } from './SupabaseContext';
import { Video, VideoComment, PaginatedResponse } from '@/lib/types';
import { PostgrestSingleResponse, PostgrestResponse, SupabaseClient } from '@supabase/supabase-js';

type VibezoneContextType = {
  fetchVideos: (limit?: number, page?: number) => Promise<PaginatedResponse<Video>>;
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

type LikedStatusCache = Record<string, { status: boolean, timestamp: number }>;
type SubscriptionStatusCache = Record<string, { status: boolean, timestamp: number }>;

const CACHE_DURATION = 5 * 60 * 1000;
const likedStatusCache: LikedStatusCache = {};
const subscriptionStatusCache: SubscriptionStatusCache = {};

const fetchWithTimeout = async <T,>(
  promiseFn: () => Promise<T> | PromiseLike<T>, 
  timeoutMs: number = 10000
): Promise<T> => {
  let timeoutId: NodeJS.Timeout;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
  });

  try {
    const promise = Promise.resolve(promiseFn());
    const result = await Promise.race([promise, timeoutPromise]) as T;
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
};

const withRetry = async <T,>(
  fn: () => Promise<T> | PromiseLike<T>,
  retries: number = 2,
  delay: number = 1000
): Promise<T> => {
  try {
    return await Promise.resolve(fn());
  } catch (error) {
    if (retries <= 0) throw error;
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 1.5);
  }
};

export const VibezoneProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useSupabase();
  const [cachedVideos, setCachedVideos] = useState<Video[]>([]);
  const [pendingOperations, setPendingOperations] = useState<Set<string>>(new Set());

  const addPendingOperation = useCallback((opId: string) => {
    setPendingOperations(prev => new Set(prev).add(opId));
    return () => {
      setPendingOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(opId);
        return newSet;
      });
    };
  }, []);

  const isOperationPending = useCallback((opId: string) => {
    return pendingOperations.has(opId);
  }, [pendingOperations]);

  const fetchVideos = async (limit = 10, page = 1): Promise<PaginatedResponse<Video>> => {
    try {
      setLoading(true);
      setError(null);
      
      const offset = (page - 1) * limit;
      
      const { data: videosData, error: videosError } = await withRetry(
        () => supabase
            .from('videos')
            .select('*')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)
      );
      
      if (videosError) throw videosError;
      
      if (!videosData || videosData.length === 0) {
        console.log("No videos data returned from database");
        return {
          data: cachedVideos,
          hasMore: false
        };
      }
      
      const { count } = await supabase
        .from('videos')
        .select('*', { count: 'exact', head: true });
      
      const authorPromises = videosData.map(video => {
        if (!video.user_id) return Promise.resolve(null);
        
        return Promise.resolve(supabase
          .from('profiles')
          .select('*')
          .eq('id', video.user_id)
          .single())
          .then(({ data }) => data)
          .catch(() => null);
      });
      
      const authorResults = await Promise.allSettled(authorPromises);
      
      const transformedVideos = videosData.map((video, index) => {
        const authorResult = authorResults[index];
        const userData = authorResult.status === 'fulfilled' ? authorResult.value : null;
        
        const authorInfo = userData ? {
          id: userData.id || '',
          name: userData.username || 'Unknown User',
          avatar: userData.avatar_url || '',
          username: userData.username || 'Unknown User',
          avatar_url: userData.avatar_url || ''
        } : { 
          id: '', 
          name: 'Unknown User', 
          avatar: '', 
          username: 'Unknown User', 
          avatar_url: '' 
        };
        
        return {
          ...video,
          author: authorInfo
        } as Video;
      });
      
      if (transformedVideos.length > 0) {
        // Only store the first page in cache
        if (page === 1) {
          setCachedVideos(transformedVideos);
        }
      }
      
      const hasMore = videosData.length === limit && (offset + limit < (count || 0));
      
      return {
        data: transformedVideos,
        hasMore,
        nextPage: hasMore ? page + 1 : undefined
      };
    } catch (error: any) {
      setError(error.message);
      console.error('Error fetching videos:', error);
      
      if (cachedVideos.length > 0 && page === 1) {
        console.log("Returning cached videos due to fetch error");
        return {
          data: cachedVideos,
          hasMore: false
        };
      }
      
      return {
        data: [],
        hasMore: false
      };
    } finally {
      setLoading(false);
    }
  };

  const fetchVideo = async (id: string): Promise<Video | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await withRetry(
        () => supabase
            .from('videos')
            .select('*')
            .eq('id', id)
            .single()
      );
      
      if (error) throw error;
      if (!data) return null;
      
      let authorInfo = null;
      if (data.user_id) {
        try {
          const { data: userData, error: userError } = await withRetry(
            () => supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user_id)
                .single()
          );
          
          if (!userError && userData) {
            authorInfo = {
              id: userData.id || '',
              name: userData.username || 'Unknown User',
              avatar: userData.avatar_url || '',
              username: userData.username || 'Unknown User',
              avatar_url: userData.avatar_url || ''
            };
          }
        } catch (err) {
          console.error('Error fetching author info:', err);
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
          try {
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
          } catch (err) {
            console.error('Error fetching author for comment:', err);
          }
        }
        
        return {
          ...comment,
          author: authorInfo || { 
            id: '', 
            name: 'Unknown User', 
            avatar: '', 
            username: 'Unknown User', 
            avatar_url: '' 
          }
        } as VideoComment;
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

  const likeVideo = useCallback(async (videoId: string): Promise<boolean> => {
    if (!user) {
      toast.error('You must be logged in to like videos');
      return false;
    }
    
    const opId = `like_${videoId}`;
    if (isOperationPending(opId)) {
      return false;
    }
    
    try {
      const cleanup = addPendingOperation(opId);
      setLoading(true);
      setError(null);
      
      likedStatusCache[videoId] = { status: true, timestamp: Date.now() };
      
      const { error } = await supabase
        .from('video_likes')
        .insert({
          video_id: videoId,
          user_id: user.id
        });
      
      if (error) throw error;
      
      cleanup();
      return true;
    } catch (error: any) {
      if (error.code === '23505') {
        return true;
      }
      
      setError(error.message);
      console.error('Error liking video:', error);
      
      delete likedStatusCache[videoId];
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, addPendingOperation, isOperationPending]);

  const unlikeVideo = useCallback(async (videoId: string): Promise<boolean> => {
    if (!user) {
      toast.error('You must be logged in to unlike videos');
      return false;
    }
    
    const opId = `unlike_${videoId}`;
    if (isOperationPending(opId)) {
      return false;
    }
    
    try {
      const cleanup = addPendingOperation(opId);
      setLoading(true);
      setError(null);
      
      likedStatusCache[videoId] = { status: false, timestamp: Date.now() };
      
      const { error } = await supabase
        .from('video_likes')
        .delete()
        .eq('video_id', videoId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      cleanup();
      return true;
    } catch (error: any) {
      setError(error.message);
      console.error('Error unliking video:', error);
      
      delete likedStatusCache[videoId];
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, addPendingOperation, isOperationPending]);

  const hasLikedVideo = useCallback(async (videoId: string): Promise<boolean> => {
    if (!user) return false;
    
    const cachedStatus = likedStatusCache[videoId];
    if (cachedStatus && Date.now() - cachedStatus.timestamp < CACHE_DURATION) {
      return cachedStatus.status;
    }
    
    try {
      const { data, error } = await Promise.resolve(supabase
        .from('video_likes')
        .select('id')
        .eq('video_id', videoId)
        .eq('user_id', user.id)
        .single());
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      const liked = !!data;
      
      likedStatusCache[videoId] = { status: liked, timestamp: Date.now() };
      
      return liked;
    } catch (error: any) {
      console.error('Error checking if user liked video:', error);
      return false;
    }
  }, [user]);

  const subscribeToChannel = useCallback(async (channelUserId: string): Promise<boolean> => {
    if (!user) {
      toast.error('You must be logged in to subscribe');
      return false;
    }
    
    const opId = `subscribe_${channelUserId}`;
    if (isOperationPending(opId)) {
      return false;
    }
    
    try {
      const cleanup = addPendingOperation(opId);
      setLoading(true);
      setError(null);
      
      subscriptionStatusCache[channelUserId] = { status: true, timestamp: Date.now() };
      
      const { error } = await supabase
        .from('channel_subscriptions')
        .insert({
          channel_id: channelUserId,
          subscriber_id: user.id
        });
      
      if (error) throw error;
      
      toast.success('Subscribed successfully');
      cleanup();
      return true;
    } catch (error: any) {
      if (error.code === '23505') {
        return true;
      }
      
      setError(error.message);
      console.error('Error subscribing to channel:', error);
      toast.error('Failed to subscribe');
      
      delete subscriptionStatusCache[channelUserId];
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, addPendingOperation, isOperationPending]);

  const unsubscribeFromChannel = useCallback(async (channelUserId: string): Promise<boolean> => {
    if (!user) {
      toast.error('You must be logged in to unsubscribe');
      return false;
    }
    
    const opId = `unsubscribe_${channelUserId}`;
    if (isOperationPending(opId)) {
      return false;
    }
    
    try {
      const cleanup = addPendingOperation(opId);
      setLoading(true);
      setError(null);
      
      subscriptionStatusCache[channelUserId] = { status: false, timestamp: Date.now() };
      
      const { error } = await supabase
        .from('channel_subscriptions')
        .delete()
        .eq('channel_id', channelUserId)
        .eq('subscriber_id', user.id);
      
      if (error) throw error;
      
      toast.success('Unsubscribed successfully');
      cleanup();
      return true;
    } catch (error: any) {
      setError(error.message);
      console.error('Error unsubscribing from channel:', error);
      toast.error('Failed to unsubscribe');
      
      delete subscriptionStatusCache[channelUserId];
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, addPendingOperation, isOperationPending]);

  const hasSubscribedToChannel = useCallback(async (channelUserId: string): Promise<boolean> => {
    if (!user) return false;
    
    const cachedStatus = subscriptionStatusCache[channelUserId];
    if (cachedStatus && Date.now() - cachedStatus.timestamp < CACHE_DURATION) {
      return cachedStatus.status;
    }
    
    try {
      const { data, error } = await Promise.resolve(supabase
        .from('channel_subscriptions')
        .select('id')
        .eq('channel_id', channelUserId)
        .eq('subscriber_id', user.id)
        .maybeSingle());
      
      if (error) throw error;
      
      const subscribed = !!data;
      
      subscriptionStatusCache[channelUserId] = { status: subscribed, timestamp: Date.now() };
      
      return subscribed;
    } catch (error: any) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }, [user]);

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

  const getSubscriberCount = async (channelUserId: string): Promise<number> => {
    try {
      const { count, error } = await Promise.resolve(supabase
        .from('channel_subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('channel_id', channelUserId));
      
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

  useEffect(() => {
    const initialLoad = async () => {
      const videos = await fetchVideos();
      if (videos && videos.data.length > 0) {
        setCachedVideos(videos.data);
      }
    };
    
    initialLoad();
  }, []);

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
