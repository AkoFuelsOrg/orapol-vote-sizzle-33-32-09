
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVibezone } from '@/context/VibezoneContext';
import { Video } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, FilmIcon, Plus, Sparkles, Heart, MessageCircle, Share2, User, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSupabase } from '@/context/SupabaseContext';
import { useBreakpoint } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { extractDominantColor } from '@/lib/image-utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Vibezone: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const { fetchVideos, loading } = useVibezone();
  const navigate = useNavigate();
  const { user } = useSupabase();
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "mobile";
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [dominantColors, setDominantColors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadVideos = async () => {
      try {
        setIsInitialLoading(true);
        const fetchedVideos = await fetchVideos();
        
        if (fetchedVideos) {
          const videoArray = Array.isArray(fetchedVideos) ? fetchedVideos : [];
          setVideos(videoArray);
          
          // Extract dominant colors from thumbnails
          videoArray.forEach(async (video) => {
            if (video.thumbnail_url) {
              try {
                const color = await extractDominantColor(video.thumbnail_url);
                setDominantColors(prev => ({
                  ...prev,
                  [video.id]: color
                }));
              } catch (error) {
                console.error('Error extracting color:', error);
              }
            }
          });
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

  const formatViews = (views: number): string => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M views`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K views`;
    } else {
      return `${views} views`;
    }
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const navigateToNextVideo = () => {
    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    }
  };

  const navigateToPreviousVideo = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
    }
  };

  // Skip skeleton state if videos are already loaded
  const shouldShowSkeleton = isInitialLoading && videos.length === 0;
  
  const currentVideo = videos[currentVideoIndex];
  const dominantColor = currentVideo ? dominantColors[currentVideo.id] || "#000000" : "#000000";

  return (
    <div className="min-h-screen bg-black">
      {/* Header with Upload Button */}
      <div className="fixed top-0 left-0 right-0 z-10 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Vibezone</h1>
          <Sparkles className="h-5 w-5 text-primary/70 ml-2 animate-pulse-slow" />
        </div>
        <Button 
          onClick={() => navigate('/vibezone/upload')}
          className="bg-red-500 hover:bg-red-600 transition-all duration-300 hover:shadow-md"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Upload
        </Button>
      </div>

      {shouldShowSkeleton ? (
        <div className="flex justify-center items-center h-screen">
          <div className="w-full max-w-md p-4">
            <Skeleton className="h-[80vh] w-full rounded-xl mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <div className="flex items-center">
                <Skeleton className="w-10 h-10 rounded-full mr-2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
          </div>
        </div>
      ) : videos.length === 0 ? (
        <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
          <div className="empty-state text-center p-6">
            <div className="empty-state-icon mb-4">
              <FilmIcon className="h-12 w-12 text-primary/70 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No videos yet</h3>
            <p className="mt-1 text-sm text-gray-400 max-w-md mx-auto mb-6">
              Be the first to upload a video to Vibezone and start sharing your creativity with others!
            </p>
            <Button 
              onClick={() => navigate('/vibezone/upload')}
              className="bg-red-500 hover:bg-red-600 transition-all duration-300 hover:shadow-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              Upload Video
            </Button>
          </div>
        </div>
      ) : (
        <div className="relative h-screen w-full overflow-hidden">
          {currentVideo && (
            <div className="relative h-full">
              {/* Video Container */}
              <div 
                className="h-full w-full cursor-pointer"
                onClick={() => navigate(`/vibezone/watch/${currentVideo.id}`)}
                style={{ backgroundColor: 'black' }}
              >
                {currentVideo.thumbnail_url ? (
                  <div className="relative h-full">
                    <img 
                      src={currentVideo.thumbnail_url} 
                      alt={currentVideo.title || 'Video'} 
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ filter: 'brightness(0.8)' }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FilmIcon className="h-16 w-16 text-white/50" />
                    </div>
                    
                    {/* Navigation Indicators */}
                    <div className="absolute top-1/2 right-4 transform -translate-y-1/2 space-y-4">
                      <button 
                        className="w-10 h-10 bg-black/30 rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToNextVideo();
                        }}
                        disabled={currentVideoIndex >= videos.length - 1}
                      >
                        <ChevronUp className="h-6 w-6" />
                      </button>
                      <button 
                        className="w-10 h-10 bg-black/30 rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToPreviousVideo();
                        }}
                        disabled={currentVideoIndex <= 0}
                      >
                        <ChevronDown className="h-6 w-6" />
                      </button>
                    </div>

                    {/* Video Information Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
                      <h3 className="font-semibold text-lg text-white line-clamp-2 mb-2">
                        {currentVideo.title || 'Untitled Video'}
                      </h3>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Avatar className="w-10 h-10 border-2 border-primary/20">
                            {currentVideo.author?.avatar ? (
                              <AvatarImage 
                                src={currentVideo.author.avatar} 
                                alt={currentVideo.author.name || ''} 
                              />
                            ) : (
                              <AvatarFallback className="bg-primary/10">
                                <User className="h-5 w-5 text-primary/70" />
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="ml-2">
                            <p className="text-sm font-medium text-white">{currentVideo.author?.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-300">
                              {formatViews(currentVideo.views || 0)} • {formatDistanceToNow(new Date(currentVideo.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <button className="flex flex-col items-center">
                            <div className="w-9 h-9 bg-black/30 rounded-full flex items-center justify-center">
                              <Heart className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xs text-white mt-1">Like</span>
                          </button>
                          
                          <button className="flex flex-col items-center">
                            <div className="w-9 h-9 bg-black/30 rounded-full flex items-center justify-center">
                              <MessageCircle className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xs text-white mt-1">Comment</span>
                          </button>
                          
                          <button className="flex flex-col items-center">
                            <div className="w-9 h-9 bg-black/30 rounded-full flex items-center justify-center">
                              <Share2 className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xs text-white mt-1">Share</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                    <FilmIcon className="h-20 w-20 text-gray-600" />
                  </div>
                )}
              </div>
              
              {/* Video Progress Indicators */}
              <div className="absolute top-16 left-0 right-0 flex justify-center">
                <div className="flex space-x-1">
                  {videos.map((_, index) => (
                    <div 
                      key={`indicator-${index}`}
                      className={`h-1 ${index === currentVideoIndex ? 'w-6 bg-white' : 'w-4 bg-white/40'} rounded-full`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Vibezone;
