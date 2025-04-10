
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVibezone } from '@/context/VibezoneContext';
import { Video } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, FilmIcon, Plus, Sparkles, Heart, MessageCircle, Share2, BookmarkIcon, Volume2, VolumeX, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSupabase } from '@/context/SupabaseContext';
import { useBreakpoint } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Avatar } from '@/components/ui/avatar';

const Vibezone: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const { fetchVideos, loading, hasLikedVideo, likeVideo, unlikeVideo } = useVibezone();
  const navigate = useNavigate();
  const { user } = useSupabase();
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "mobile";
  const videoRefs = useRef<HTMLVideoElement[]>([]);

  useEffect(() => {
    const loadVideos = async () => {
      try {
        setIsInitialLoading(true);
        const fetchedVideos = await fetchVideos();
        
        if (fetchedVideos) {
          setVideos(Array.isArray(fetchedVideos) ? fetchedVideos : []);
        } else {
          setVideos([]);
        }
      } catch (error) {
        console.error("Error loading videos:", error);
        toast.error("Failed to load videos");
        setVideos([]);
      } finally {
        setIsInitialLoading(false);
      }
    };
    
    loadVideos();
    
    // Set up real-time subscription for video changes
    const videosChannel = supabase
      .channel('vibezone_videos_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'videos'
        }, 
        () => {
          loadVideos();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(videosChannel);
    };
  }, [fetchVideos]);

  useEffect(() => {
    const videoElements = videoRefs.current;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) {
          // Play the video when it comes into view
          video.play().catch(err => console.error("Error playing video:", err));
          
          // Update current video index
          const index = videoElements.indexOf(video);
          if (index !== -1) {
            setCurrentVideoIndex(index);
          }
        } else {
          // Pause the video when it's out of view
          video.pause();
        }
      });
    }, { threshold: 0.7 }); // When 70% of the video is visible
    
    videoElements.forEach(video => {
      if (video) {
        observer.observe(video);
      }
    });
    
    return () => {
      videoElements.forEach(video => {
        if (video) {
          observer.unobserve(video);
        }
      });
    };
  }, [videos]);

  const formatViews = (views: number): string => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    } else {
      return `${views}`;
    }
  };

  const handleVideoRef = (element: HTMLVideoElement | null, index: number) => {
    if (element) {
      videoRefs.current[index] = element;
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(prev => !prev);
    
    videoRefs.current.forEach(video => {
      if (video) {
        video.muted = !isMuted;
      }
    });
  };

  const handleLikeVideo = async (e: React.MouseEvent, video: Video) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Please sign in to like videos");
      return;
    }

    const isLiked = await hasLikedVideo(video.id);
    if (isLiked) {
      await unlikeVideo(video.id);
    } else {
      await likeVideo(video.id);
    }
  };

  const handleShareVideo = (e: React.MouseEvent, video: Video) => {
    e.stopPropagation();
    const videoUrl = `${window.location.origin}/vibezone/watch/${video.id}`;
    
    if (navigator.share) {
      navigator.share({
        title: video.title || 'Check out this video',
        url: videoUrl,
      }).catch(err => console.error('Error sharing:', err));
    } else {
      navigator.clipboard.writeText(videoUrl)
        .then(() => toast.success('Link copied to clipboard'))
        .catch(err => console.error('Could not copy link:', err));
    }
  };

  // Skip skeleton state if videos are already loaded
  const shouldShowSkeleton = isInitialLoading && videos.length === 0;

  return (
    <div className="bg-black min-h-screen">
      {/* Fixed header with upload button */}
      <div className="fixed top-16 sm:top-4 left-0 w-full z-30 px-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-white flex items-center">
            Vibezone
            <Sparkles className="h-4 w-4 text-yellow-400 ml-1 animate-pulse-slow" />
          </h1>
        </div>
        <Button 
          onClick={() => navigate('/vibezone/upload')}
          variant="ghost"
          className="rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500 p-2"
          size="icon"
        >
          <Plus className="h-5 w-5 text-white" />
        </Button>
      </div>

      {shouldShowSkeleton ? (
        <div className="pt-20 pb-16 px-2 flex flex-col items-center gap-4">
          {[...Array(2)].map((_, index) => (
            <div key={`skeleton-${index}`} className="relative w-full max-w-md aspect-[9/16] bg-gray-800 rounded-xl overflow-hidden">
              <Skeleton className="w-full h-full" />
              <div className="absolute bottom-0 left-0 w-full p-4">
                <div className="flex items-center">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="ml-2 space-y-2 flex-1">
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              </div>
              <div className="absolute right-2 bottom-20 flex flex-col gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="w-10 h-10 rounded-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="pt-20 pb-16 px-4 flex flex-col items-center justify-center min-h-[80vh] text-center">
          <div className="bg-gray-800/50 p-8 rounded-xl">
            <FilmIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No videos yet</h3>
            <p className="mt-1 text-sm text-gray-400 max-w-md mx-auto mb-6">
              Be the first to upload a video to Vibezone and start sharing your creativity with others!
            </p>
            <Button 
              onClick={() => navigate('/vibezone/upload')}
              className="bg-red-500 hover:bg-red-600 transition-all duration-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              Upload Video
            </Button>
          </div>
        </div>
      ) : (
        <div className="snap-y snap-mandatory h-[calc(100vh-4rem)] overflow-y-scroll scrollbar-hide">
          {videos.map((video, index) => (
            <div 
              key={video.id || `video-${index}`}
              className="snap-start h-[calc(100vh-4rem)] w-full flex items-center justify-center relative"
              onClick={() => navigate(`/vibezone/watch/${video.id}`)}
            >
              <div className="relative w-full h-full max-w-md mx-auto bg-black">
                {/* Video player */}
                <video 
                  ref={(el) => handleVideoRef(el, index)}
                  src={video.video_url}
                  className="w-full h-full object-contain"
                  loop
                  playsInline
                  muted={isMuted}
                  preload="metadata"
                  poster={video.thumbnail_url || undefined}
                />
                
                {/* Video controls overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 pointer-events-none" />
                
                {/* Video info */}
                <div className="absolute bottom-4 left-0 p-4 w-full pr-20">
                  <h3 className="font-semibold text-white line-clamp-2 text-lg">
                    {video.title || 'Untitled Video'}
                  </h3>
                  <div className="flex items-center mt-2">
                    <div className="flex-shrink-0">
                      {video.author?.avatar ? (
                        <Avatar className="w-8 h-8 border-2 border-red-500">
                          <img 
                            src={video.author.avatar} 
                            alt={video.author.name || ''} 
                            className="object-cover"
                          />
                        </Avatar>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-red-500/30 flex items-center justify-center">
                          <FilmIcon className="h-4 w-4 text-red-500" />
                        </div>
                      )}
                    </div>
                    <div className="ml-2 overflow-hidden">
                      <p className="text-sm font-medium text-white">
                        @{video.author?.username || 'unknown'}
                      </p>
                      <p className="text-xs text-gray-300">
                        {formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="absolute right-3 bottom-16 flex flex-col gap-6">
                  {/* Like button */}
                  <button 
                    className="flex flex-col items-center"
                    onClick={(e) => handleLikeVideo(e, video)}
                  >
                    <div className="bg-gray-800/50 p-2 rounded-full hover:bg-gray-700/70 transition-colors">
                      <Heart className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-white text-xs mt-1">
                      {formatViews(video.likes || 0)}
                    </span>
                  </button>
                  
                  {/* Comment button */}
                  <button 
                    className="flex flex-col items-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/vibezone/watch/${video.id}`);
                    }}
                  >
                    <div className="bg-gray-800/50 p-2 rounded-full hover:bg-gray-700/70 transition-colors">
                      <MessageCircle className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-white text-xs mt-1">
                      {formatViews(video.comments_count || 0)}
                    </span>
                  </button>
                  
                  {/* Share button */}
                  <button 
                    className="flex flex-col items-center"
                    onClick={(e) => handleShareVideo(e, video)}
                  >
                    <div className="bg-gray-800/50 p-2 rounded-full hover:bg-gray-700/70 transition-colors">
                      <Share2 className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-white text-xs mt-1">
                      Share
                    </span>
                  </button>
                  
                  {/* Sound button */}
                  <button 
                    className="flex flex-col items-center" 
                    onClick={toggleMute}
                  >
                    <div className="bg-gray-800/50 p-2 rounded-full hover:bg-gray-700/70 transition-colors">
                      {isMuted ? (
                        <VolumeX className="h-6 w-6 text-white" />
                      ) : (
                        <Volume2 className="h-6 w-6 text-white" />
                      )}
                    </div>
                  </button>
                </div>

                {/* Music info */}
                <div className="absolute bottom-28 left-4 flex items-center">
                  <Music className="h-4 w-4 text-white mr-2 animate-spin-slow" />
                  <div className="overflow-hidden max-w-[60%]">
                    <p className="text-xs text-white whitespace-nowrap overflow-hidden text-ellipsis">
                      {video.title ? `Original audio - ${video.title}` : 'Original audio'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Vibezone;
