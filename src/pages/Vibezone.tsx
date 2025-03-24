
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVibezone } from '@/context/VibezoneContext';
import { Video } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, FilmIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSupabase } from '@/context/SupabaseContext';
import { useBreakpoint } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

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
        console.log("Fetched videos:", fetchedVideos);
        setVideos(fetchedVideos);
      } catch (error) {
        console.error("Error loading videos:", error);
        toast.error("Failed to load videos");
      } finally {
        setIsInitialLoading(false);
      }
    };
    
    loadVideos();
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

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Vibezone</h1>
        <Button 
          onClick={() => navigate('/vibezone/upload')}
          className="bg-red-500 hover:bg-red-600 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Upload Video
        </Button>
      </div>

      {isInitialLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(8)].map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <div className="aspect-video">
                <Skeleton className="w-full h-full" />
              </div>
              <CardContent className="p-3">
                <Skeleton className="h-5 w-3/4 mb-3" />
                <div className="flex items-center">
                  <Skeleton className="w-6 h-6 rounded-full mr-2" />
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
        <div className="text-center py-10">
          <FilmIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No videos yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Be the first to upload a video to Vibezone!
          </p>
          <div className="mt-6">
            <Button 
              onClick={() => navigate('/vibezone/upload')}
              className="bg-red-500 hover:bg-red-600"
            >
              Upload Video
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {videos.map((video) => (
            <Card 
              key={video.id} 
              className="overflow-hidden cursor-pointer hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]"
              onClick={() => navigate(`/vibezone/watch/${video.id}`)}
            >
              <div className="relative aspect-video bg-black">
                {video.thumbnail_url ? (
                  <img 
                    src={video.thumbnail_url} 
                    alt={video.title} 
                    className="w-full h-full object-cover transition-opacity duration-200"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <FilmIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-1.5 py-0.5 rounded">
                  {formatDuration(video.duration)}
                </div>
              </div>
              <CardContent className="p-3">
                <h3 className="font-semibold text-sm line-clamp-2 mb-1.5">{video.title}</h3>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {video.author?.avatar ? (
                      <img 
                        src={video.author.avatar} 
                        alt={video.author.name || ''} 
                        className="w-6 h-6 rounded-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                        <FilmIcon className="h-3 w-3 text-gray-500" />
                      </div>
                    )}
                  </div>
                  <div className="ml-2 overflow-hidden">
                    <p className="text-xs text-gray-600 truncate">{video.author?.name || 'Unknown'}</p>
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
