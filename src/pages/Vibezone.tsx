
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVibezone } from '@/context/VibezoneContext';
import { Video } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, FilmIcon, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSupabase } from '@/context/SupabaseContext';
import { useBreakpoint } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const Vibezone: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const { fetchVideos, loading } = useVibezone();
  const navigate = useNavigate();
  const { user } = useSupabase();
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "mobile";

  useEffect(() => {
    const loadVideos = async () => {
      try {
        setIsInitialLoading(true);
        const fetchedVideos = await fetchVideos();
        
        // Set videos immediately and skip additional checks to improve loading speed
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
        // Ensure loading state is turned off
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

  // Skip skeleton state if videos are already loaded
  const shouldShowSkeleton = isInitialLoading && videos.length === 0;

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 animate-fade-in">
      <div className="section-header mb-8 bg-gradient-to-r from-primary/15 via-primary/10 to-transparent p-6 rounded-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Vibezone</h1>
            <Sparkles className="h-5 w-5 text-primary/70 ml-2 animate-pulse-slow" />
          </div>
          <Button 
            onClick={() => navigate('/vibezone/upload')}
            className="bg-red-500 hover:bg-red-600 transition-all duration-300 hover:shadow-md w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Upload Video
          </Button>
        </div>
        <p className="text-muted-foreground mt-2 max-w-xl">Discover and share videos with the community. Express yourself through visual storytelling.</p>
      </div>

      {shouldShowSkeleton ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {[...Array(8)].map((_, index) => (
            <Card key={`skeleton-${index}`} className="overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="aspect-video bg-gray-100">
                <Skeleton className="w-full h-full" />
              </div>
              <CardContent className="p-4">
                <Skeleton className="h-5 w-3/4 mb-3" />
                <div className="flex items-center">
                  <Skeleton className="w-8 h-8 rounded-full mr-2" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <FilmIcon className="h-12 w-12 text-primary/70" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No videos yet</h3>
          <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto mb-6">
            Be the first to upload a video to Vibezone and start sharing your creativity with others!
          </p>
          <Button 
            onClick={() => navigate('/vibezone/upload')}
            className="bg-red-500 hover:bg-red-600 transition-all duration-300 shadow-sm hover:shadow"
          >
            <Plus className="h-4 w-4 mr-2" />
            Upload Video
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {videos.map((video, index) => (
            <Card 
              key={video.id || `video-${index}`} 
              className="video-card overflow-hidden cursor-pointer border border-gray-100 shadow-sm hover:shadow-md bg-white"
              onClick={() => navigate(`/vibezone/watch/${video.id}`)}
            >
              <div className="relative aspect-video bg-gray-50 overflow-hidden">
                {video.thumbnail_url ? (
                  <img 
                    src={video.thumbnail_url} 
                    alt={video.title || 'Video'} 
                    className="video-thumbnail"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <FilmIcon className="h-12 w-12 text-gray-300" />
                  </div>
                )}
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-1.5 py-0.5 rounded">
                  {formatDuration(video.duration)}
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm line-clamp-2 mb-2 text-gray-800 hover:text-primary transition-colors">{video.title || 'Untitled Video'}</h3>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {video.author?.avatar ? (
                      <img 
                        src={video.author.avatar} 
                        alt={video.author.name || ''} 
                        className="w-8 h-8 rounded-full object-cover border border-gray-100"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <FilmIcon className="h-4 w-4 text-primary/70" />
                      </div>
                    )}
                  </div>
                  <div className="ml-2 overflow-hidden">
                    <p className="text-xs font-medium text-gray-700 truncate">{video.author?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">
                      {formatViews(video.views || 0)} • {formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Vibezone;
