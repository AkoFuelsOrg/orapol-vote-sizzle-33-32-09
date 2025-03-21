import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useVibezone } from '@/context/VibezoneContext';
import { useSupabase } from '@/context/SupabaseContext';
import { Video, VideoComment } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, ThumbsUp, MessageSquare, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import VideoCommentSection from '@/components/VideoCommentSection';
import { Card, CardContent } from '@/components/ui/card';

const WatchVideo: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { fetchVideo, fetchVideos, hasLikedVideo, likeVideo, unlikeVideo, viewVideo } = useVibezone();
  const { user } = useSupabase();
  const [video, setVideo] = useState<Video | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const viewRecorded = useRef(false);
  const relatedVideosLoaded = useRef(false);
  
  useEffect(() => {
    const loadVideo = async () => {
      if (!id) return;
      setLoading(true);
      
      try {
        const videoData = await fetchVideo(id);
        if (videoData) {
          setVideo(videoData);
          setLikesCount(videoData.likes || 0);
          
          // Check if the user has liked this video
          if (user) {
            const userLiked = await hasLikedVideo(id);
            setLiked(userLiked);
          }
        }
      } catch (error) {
        console.error('Error loading video:', error);
        toast.error('Failed to load video');
      } finally {
        setLoading(false);
      }
    };
    
    loadVideo();
    
    // Reset refs when video ID changes
    viewRecorded.current = false;
    relatedVideosLoaded.current = false;
    
  }, [id, fetchVideo, hasLikedVideo, user]);
  
  // Load related videos (all videos except current one) - only once
  useEffect(() => {
    const loadRelatedVideos = async () => {
      if (!id || relatedVideosLoaded.current) return;
      setLoadingRelated(true);
      
      try {
        const allVideos = await fetchVideos(20);
        // Filter out the current video
        const filteredVideos = allVideos.filter(v => v.id !== id);
        setRelatedVideos(filteredVideos);
        relatedVideosLoaded.current = true;
      } catch (error) {
        console.error('Error loading related videos:', error);
      } finally {
        setLoadingRelated(false);
      }
    };
    
    loadRelatedVideos();
  }, [id, fetchVideos]);
  
  // Record a view when the video starts playing
  const handleVideoPlay = async () => {
    if (!id || viewRecorded.current) return;
    
    try {
      const success = await viewVideo(id);
      if (success) {
        viewRecorded.current = true;
        if (video) {
          setVideo({
            ...video,
            views: video.views + 1
          });
        }
      }
    } catch (error) {
      console.error('Error recording view:', error);
    }
  };
  
  const handleLike = async () => {
    if (!user) {
      toast.error('You must be logged in to like videos');
      return;
    }
    
    if (!id) return;
    
    try {
      if (liked) {
        const success = await unlikeVideo(id);
        if (success) {
          setLiked(false);
          setLikesCount(prev => prev - 1);
        }
      } else {
        const success = await likeVideo(id);
        if (success) {
          setLiked(true);
          setLikesCount(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  };
  
  const formatViews = (views: number): string => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M views`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K views`;
    } else {
      return `${views} ${views === 1 ? 'view' : 'views'}`;
    }
  };
  
  const renderVideoSkeleton = () => (
    <div className="bg-black rounded-lg overflow-hidden aspect-video">
      <Skeleton className="w-full h-full" />
    </div>
  );
  
  const renderVideoInfoSkeleton = () => (
    <div className="mt-4 space-y-2">
      <Skeleton className="h-8 w-4/5" />
      <div className="flex items-center justify-between mt-2">
        <Skeleton className="h-5 w-1/4" />
        <div className="flex space-x-4">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  );
  
  const renderUserSkeleton = () => (
    <div className="flex items-center">
      <Skeleton className="h-10 w-10 rounded-full" />
      <Skeleton className="h-5 w-32 ml-3" />
    </div>
  );

  const renderRelatedVideoItem = (relatedVideo: Video) => (
    <Link to={`/watch/${relatedVideo.id}`} key={relatedVideo.id} className="block">
      <Card className="mb-4 hover:bg-gray-50 transition-colors">
        <CardContent className="p-3">
          <div className="flex">
            <div className="flex-shrink-0 w-32 h-20 bg-gray-200 rounded overflow-hidden">
              {relatedVideo.thumbnail_url ? (
                <img 
                  src={relatedVideo.thumbnail_url} 
                  alt={relatedVideo.title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-500 text-xs">
                  No thumbnail
                </div>
              )}
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <h4 className="text-sm font-medium line-clamp-2">{relatedVideo.title}</h4>
              <p className="text-xs text-gray-500 mt-1">
                {relatedVideo.author?.name || relatedVideo.author?.username || 'Unknown'}
              </p>
              <p className="text-xs text-gray-500">
                {formatViews(relatedVideo.views)} • {formatDistanceToNow(new Date(relatedVideo.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
  
  const renderRelatedVideosSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((_, index) => (
        <Card key={index} className="mb-4">
          <CardContent className="p-3">
            <div className="flex">
              <Skeleton className="flex-shrink-0 w-32 h-20 rounded" />
              <div className="ml-3 space-y-2 flex-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
  
  if (loading && !video) {
    return (
      <div className="container mx-auto py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {renderVideoSkeleton()}
            {renderVideoInfoSkeleton()}
            <Separator className="my-4" />
            {renderUserSkeleton()}
          </div>
          <div className="hidden lg:block">
            <Skeleton className="h-6 w-32 mb-4" />
            {renderRelatedVideosSkeleton()}
          </div>
        </div>
      </div>
    );
  }
  
  if (!video && !loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Video not found</h2>
          <p className="mt-2 text-gray-600">The video you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      {video && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Video Player */}
            <div className="bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                src={video.video_url}
                className="w-full h-auto"
                controls
                onPlay={handleVideoPlay}
                poster={video.thumbnail_url}
              />
            </div>
            
            {/* Video Info */}
            <div className="mt-4">
              <h1 className="text-2xl font-bold">{video.title}</h1>
              <div className="flex items-center justify-between mt-2">
                <div className="text-sm text-gray-600">
                  {formatViews(video.views)} • {formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}
                </div>
                <div className="flex space-x-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex items-center" 
                    onClick={handleLike}
                  >
                    <ThumbsUp 
                      className={`h-5 w-5 mr-1 ${liked ? 'fill-red-500 text-red-500' : ''}`} 
                    />
                    {likesCount > 0 && <span>{likesCount}</span>}
                  </Button>
                  <Button variant="ghost" size="sm" className="flex items-center">
                    <Share2 className="h-5 w-5 mr-1" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            {/* Channel Info */}
            <div className="flex items-center">
              <Avatar className="h-10 w-10">
                <img 
                  src={video.author?.avatar || video.author?.avatar_url || "https://via.placeholder.com/40"} 
                  alt={video.author?.name || video.author?.username || 'Author'} 
                  className="rounded-full"
                />
              </Avatar>
              <div className="ml-3">
                <h3 className="font-semibold">{video.author?.name || video.author?.username || 'Unknown'}</h3>
              </div>
            </div>
            
            {/* Video Description */}
            {video.description && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-line">{video.description}</p>
              </div>
            )}
            
            <Separator className="my-6" />
            
            {/* Comments Section - Using a dedicated component */}
            {id && <VideoCommentSection videoId={id} />}
          </div>
          
          {/* Related Videos */}
          <div className="hidden lg:block">
            <h3 className="font-semibold mb-4">Related Videos</h3>
            {loadingRelated ? (
              renderRelatedVideosSkeleton()
            ) : relatedVideos.length > 0 ? (
              <div className="space-y-2">
                {relatedVideos.map(relatedVideo => renderRelatedVideoItem(relatedVideo))}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">
                <p>No related videos found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WatchVideo;
