
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import { useVibezone } from '../context/VibezoneContext';
import Header from '../components/Header';
import { Loader2, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Vibezone: React.FC = () => {
  const { user } = useSupabase();
  const { videos, loading, fetchVideos } = useVibezone();
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);
  
  const regularVideos = videos.filter(video => !video.is_advertisement);
  const advertisementVideos = videos.filter(video => video.is_advertisement);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="pt-20 px-4 max-w-6xl mx-auto pb-20">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Vibezone</h1>
            <p className="text-muted-foreground">Watch videos from your community</p>
          </div>
          
          {user && (
            <button
              onClick={() => navigate('/upload-video')}
              className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="mr-2 h-4 w-4" />
              Upload Video
            </button>
          )}
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Videos</TabsTrigger>
            <TabsTrigger value="ads">
              Advertisements
              {advertisementVideos.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {advertisementVideos.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : regularVideos.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-border/50">
                <h2 className="text-xl font-medium mb-2">No videos yet</h2>
                <p className="text-muted-foreground mb-4">Be the first to upload a video!</p>
                {user && (
                  <button
                    onClick={() => navigate('/upload-video')}
                    className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Upload Video
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {regularVideos.map((video) => (
                  <div
                    key={video.id}
                    className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-border/50"
                    onClick={() => navigate(`/watch/${video.id}`)}
                  >
                    <div className="aspect-video bg-gray-200 relative">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No Thumbnail
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                        {video.duration ? (
                          `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}`
                        ) : (
                          '0:00'
                        )}
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm line-clamp-2 mb-1">{video.title}</h3>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{video.author?.name || 'Anonymous'}</span>
                        <span>{video.views} views</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="ads">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : advertisementVideos.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-border/50">
                <h2 className="text-xl font-medium mb-2">No advertisement videos yet</h2>
                <p className="text-muted-foreground mb-4">Upload a video and mark it as an advertisement</p>
                {user && (
                  <button
                    onClick={() => navigate('/upload-video')}
                    className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Upload Advertisement
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {advertisementVideos.map((video) => (
                  <div
                    key={video.id}
                    className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-border/50"
                    onClick={() => navigate(`/watch/${video.id}`)}
                  >
                    <div className="aspect-video bg-gray-200 relative">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No Thumbnail
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                        {video.duration ? (
                          `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}`
                        ) : (
                          '0:00'
                        )}
                      </div>
                      <Badge 
                        variant="secondary"
                        className="absolute top-2 left-2 bg-primary text-white"
                      >
                        Advertisement
                      </Badge>
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm line-clamp-2 mb-1">{video.title}</h3>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{video.author?.name || 'Anonymous'}</span>
                        <span>{video.views} views</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Vibezone;
