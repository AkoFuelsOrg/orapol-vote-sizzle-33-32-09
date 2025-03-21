
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVibezone } from '@/context/VibezoneContext';
import { Video } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, FilmIcon, BadgeAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSupabase } from '@/context/SupabaseContext';
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Vibezone: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [advertisementVideos, setAdvertisementVideos] = useState<Video[]>([]);
  const { fetchVideos, loading } = useVibezone();
  const navigate = useNavigate();
  const { user } = useSupabase();

  useEffect(() => {
    const loadVideos = async () => {
      const fetchedVideos = await fetchVideos();
      
      // Separate videos and ads
      const ads: Video[] = [];
      const regularVideos: Video[] = [];
      
      fetchedVideos.forEach(video => {
        if (video.is_advertisement) {
          ads.push(video);
        } else {
          regularVideos.push(video);
        }
      });
      
      setVideos(regularVideos);
      setAdvertisementVideos(ads);
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

  const renderVideoGrid = (videoList: Video[]) => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      );
    }

    if (videoList.length === 0) {
      return (
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
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {videoList.map((video) => (
          <Card 
            key={video.id} 
            className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-200"
            onClick={() => navigate(`/vibezone/watch/${video.id}`)}
          >
            <div className="relative aspect-video bg-gray-100">
              {video.thumbnail_url ? (
                <img 
                  src={video.thumbnail_url} 
                  alt={video.title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <FilmIcon className="h-12 w-12 text-gray-400" />
                </div>
              )}
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-1 py-0.5 rounded">
                {formatDuration(video.duration)}
              </div>
              {video.is_advertisement && (
                <div className="absolute top-2 left-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 flex items-center gap-1">
                    <BadgeAlert className="h-3 w-3" />
                    Ad
                  </Badge>
                </div>
              )}
            </div>
            <CardContent className="p-3">
              <h3 className="font-semibold text-sm line-clamp-2">{video.title}</h3>
              <div className="mt-2 flex items-center">
                <div className="flex-shrink-0">
                  {video.author?.avatar ? (
                    <img 
                      src={video.author.avatar} 
                      alt={video.author.name || ''} 
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-300"></div>
                  )}
                </div>
                <div className="ml-2">
                  <p className="text-xs text-gray-600">{video.author?.name || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">
                    {formatViews(video.views)} • {formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Vibezone</h1>
        <Button 
          onClick={() => navigate('/vibezone/upload')}
          className="bg-red-500 hover:bg-red-600"
        >
          Upload Video
        </Button>
      </div>

      <Tabs defaultValue="regular" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="regular">Regular Videos</TabsTrigger>
          <TabsTrigger value="ads">Advertisement Videos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="regular">
          {renderVideoGrid(videos)}
        </TabsContent>
        
        <TabsContent value="ads">
          {renderVideoGrid(advertisementVideos)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Vibezone;
