
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import { supabase } from '@/integrations/supabase/client';
import { Video, VideoComment, User } from '../lib/types';
import Header from '../components/Header';
import VideoCommentSection from '../components/VideoCommentSection';
import { Loader2, Heart, MessageSquare, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const WatchVideo: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useSupabase();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [viewRecorded, setViewRecorded] = useState(false);
  
  // Using useCallback to prevent recreating the function on each render
  const fetchVideo = useCallback(async () => {
    if (!id) return;
    
    try {
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .select(`
          *,
          author:profiles(
            id,
            username,
            avatar_url
          )
        `)
        .eq('id', id)
        .single();
      
      if (videoError) throw videoError;
      
      // Create a properly typed author object before setting video state
      const authorData = videoData.author as any;
      const processedVideo: Video = {
        ...videoData,
        author: authorData && typeof authorData !== 'string' ? {
          id: authorData.id || '',
          name: authorData.username || 'Unknown User',
          avatar: authorData.avatar_url || '',
          username: authorData.username || 'Unknown User',
          avatar_url: authorData.avatar_url || ''
        } : {
          id: '',
          name: 'Unknown User',
          avatar: '',
          username: 'Unknown User',
          avatar_url: ''
        }
      };

      setVideo(processedVideo);
      
      // Only check for likes if user is logged in and we haven't already set the liked state
      if (user) {
        const { data: likeData, error: likeError } = await supabase
          .from('video_likes')
          .select('id')
          .eq('video_id', id)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (!likeError) {
          setLiked(!!likeData);
        }
      }
    } catch (error) {
      console.error('Error fetching video:', error);
      toast.error('Failed to load video');
    } finally {
      setLoading(false);
    }
  }, [id, user]);
  
  // Separate function for recording view to avoid unnecessary re-renders
  const recordView = useCallback(async () => {
    if (!id || viewRecorded) return;
    
    try {
      const { error } = await supabase
        .from('video_views')
        .insert({
          video_id: id,
          user_id: user?.id || null,
        });
      
      if (error) throw error;
      
      setViewRecorded(true);
    } catch (error) {
      console.error('Error recording view:', error);
    }
  }, [id, user?.id, viewRecorded]);
  
  useEffect(() => {
    // Reset states when video ID changes
    setLoading(true);
    setLiked(false);
    setViewRecorded(false);
    
    fetchVideo();
    
    // Record view once per video session
    if (id && !viewRecorded) {
      recordView();
    }
    
    // Clean up function
    return () => {
      // Any cleanup if needed
    };
  }, [id, fetchVideo, recordView, viewRecorded]);
  
  const handleLike = async () => {
    if (!user) {
      toast.error('You must be logged in to like videos');
      return;
    }
    
    if (!id || !video) return;
    
    try {
      if (liked) {
        // Unlike
        const { error } = await supabase
          .from('video_likes')
          .delete()
          .eq('video_id', id)
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        setLiked(false);
        setVideo({ ...video, likes: video.likes - 1 });
      } else {
        // Like
        const { error } = await supabase
          .from('video_likes')
          .insert({
            video_id: id,
            user_id: user.id,
          });
        
        if (error) throw error;
        
        setLiked(true);
        setVideo({ ...video, likes: video.likes + 1 });
      }
    } catch (error) {
      console.error('Error liking video:', error);
      toast.error('Failed to like video');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center h-[70vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }
  
  if (!video) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-20 px-4 max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Video not found</h1>
          <p className="mb-6 text-muted-foreground">This video might have been removed or is unavailable.</p>
          <Link to="/vibezone" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
            Back to Vibezone
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="pt-20 px-4 max-w-6xl mx-auto pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-black rounded-t-xl overflow-hidden">
              <video 
                src={video.video_url} 
                controls 
                className="w-full aspect-video"
                controlsList="nodownload"
                poster={video.thumbnail_url}
              />
            </div>
            
            <div className="bg-white p-4 rounded-b-xl shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-bold">{video.title}</h1>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <span>{video.views} views</span>
                    <span className="mx-2">•</span>
                    <span>{formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}</span>
                    
                    {video.is_advertisement && (
                      <>
                        <span className="mx-2">•</span>
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          Advertisement
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-4">
                  <button 
                    onClick={handleLike}
                    className={`flex flex-col items-center ${liked ? 'text-red-500' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    <Heart className={`h-6 w-6 ${liked ? 'fill-current' : ''}`} />
                    <span className="text-xs mt-1">{video.likes}</span>
                  </button>
                  
                  <button className="flex flex-col items-center text-gray-600 hover:text-gray-900">
                    <MessageSquare className="h-6 w-6" />
                    <span className="text-xs mt-1">Comments</span>
                  </button>
                  
                  <button className="flex flex-col items-center text-gray-600 hover:text-gray-900">
                    <Share2 className="h-6 w-6" />
                    <span className="text-xs mt-1">Share</span>
                  </button>
                </div>
              </div>
              
              <div className="flex items-center mt-4 pb-4 border-b">
                <img 
                  src={video.author?.avatar_url || 'https://i.pravatar.cc/150'} 
                  alt="Author"
                  className="h-10 w-10 rounded-full mr-3 object-cover"
                />
                <div>
                  <Link to={`/user/${video.author?.id}`} className="font-medium hover:underline">
                    {video.author?.username || 'Anonymous'}
                  </Link>
                </div>
              </div>
              
              {video.description && (
                <div className="mt-4 text-sm text-gray-700 whitespace-pre-line">
                  {video.description}
                </div>
              )}
            </div>
            
            {id && <VideoCommentSection videoId={id} />}
          </div>
          
          <div className="hidden lg:block">
            {/* Recommended videos or sidebar content can go here */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-medium mb-3">Related Videos</h3>
              <p className="text-sm text-muted-foreground">Coming soon...</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WatchVideo;
