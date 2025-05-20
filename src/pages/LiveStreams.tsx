
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Video, Eye } from 'lucide-react';
import { toast } from 'sonner';
import SplashScreen from '@/components/SplashScreen';
import { useSupabase } from '@/context/SupabaseContext';

interface LiveStream {
  id: string;
  roomCode: string;
  title: string;
  hostName: string;
  viewers: number;
  thumbnail?: string;
  startedAt: Date;
}

const LiveStreams: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const navigate = useNavigate();
  const { user } = useSupabase();
  
  useEffect(() => {
    // In a real app, we would fetch this data from the backend
    // For now, we'll create mock data
    const fetchLiveStreams = async () => {
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data
        const mockStreams: LiveStream[] = [
          {
            id: '1',
            roomCode: 'ABC123',
            title: 'Morning Talk Show',
            hostName: 'Sarah Johnson',
            viewers: 24,
            thumbnail: 'https://source.unsplash.com/random/300x200?broadcast',
            startedAt: new Date(Date.now() - 1000 * 60 * 15) // 15 minutes ago
          },
          {
            id: '2',
            roomCode: 'XYZ456',
            title: 'Live Music Session',
            hostName: 'Mike Turner',
            viewers: 78,
            thumbnail: 'https://source.unsplash.com/random/300x200?music',
            startedAt: new Date(Date.now() - 1000 * 60 * 45) // 45 minutes ago
          },
          {
            id: '3',
            roomCode: 'DEF789',
            title: 'Cooking with Chef Alex',
            hostName: 'Alex Rodriguez',
            viewers: 56,
            thumbnail: 'https://source.unsplash.com/random/300x200?cooking',
            startedAt: new Date(Date.now() - 1000 * 60 * 5) // 5 minutes ago
          },
          {
            id: '4',
            roomCode: 'GHI101',
            title: 'Tech News Today',
            hostName: 'Taylor Kim',
            viewers: 32,
            thumbnail: 'https://source.unsplash.com/random/300x200?technology',
            startedAt: new Date(Date.now() - 1000 * 60 * 20) // 20 minutes ago
          }
        ];
        
        setLiveStreams(mockStreams);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching live streams:', error);
        toast.error('Failed to load live streams');
        setLoading(false);
      }
    };
    
    fetchLiveStreams();
  }, []);
  
  const joinStream = (roomCode: string) => {
    navigate(`/live/${roomCode}`);
  };
  
  const formatTimeElapsed = (startTime: Date) => {
    const elapsed = Date.now() - startTime.getTime();
    const minutes = Math.floor(elapsed / (1000 * 60));
    
    if (minutes < 60) {
      return `${minutes} min ago`;
    } else {
      const hours = Math.floor(minutes / 60);
      return `${hours} hr ago`;
    }
  };
  
  if (loading) {
    return <SplashScreen message="Loading live streams..." />;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black pt-6 pb-10 px-4 md:px-8">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Live Streams</h1>
          <Button 
            onClick={() => navigate('/live/new?host=true')}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white"
          >
            <Video size={18} />
            Start Streaming
          </Button>
        </div>
        
        {liveStreams.length === 0 ? (
          <Card className="p-8 text-center bg-gray-800 border-gray-700">
            <h2 className="text-xl font-medium mb-2 text-white">No Live Streams</h2>
            <p className="text-gray-400 mb-4">There are no live streams at the moment.</p>
            <Button 
              onClick={() => navigate('/live/new?host=true')}
              className="flex items-center gap-2 mx-auto bg-red-500 hover:bg-red-600"
            >
              <Video size={18} />
              Be the First to Stream
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveStreams.map(stream => (
              <Card 
                key={stream.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer bg-gray-800/50 border-gray-700"
                onClick={() => joinStream(stream.roomCode)}
              >
                <div className="relative">
                  <div className="aspect-video bg-gray-800 overflow-hidden">
                    {stream.thumbnail ? (
                      <img 
                        src={stream.thumbnail} 
                        alt={stream.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-900">
                        <Video size={40} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <div className="bg-red-600 text-white text-xs font-medium px-2 py-1 rounded flex items-center gap-1">
                      <span className="h-1.5 w-1.5 bg-white rounded-full animate-pulse"></span>
                      LIVE
                    </div>
                    <div className="bg-black/60 text-white text-xs px-2 py-1 rounded">
                      {formatTimeElapsed(stream.startedAt)}
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-medium text-lg mb-1 line-clamp-1 text-white">{stream.title}</h3>
                  <p className="text-sm text-gray-400 mb-2">Hosted by {stream.hostName}</p>
                  
                  <div className="flex items-center text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Eye size={16} />
                      <span>{stream.viewers}</span>
                    </div>
                    <div className="ml-auto">
                      <Button 
                        size="sm"
                        className="bg-primary text-white hover:bg-primary/90"
                        onClick={(e) => {
                          e.stopPropagation();
                          joinStream(stream.roomCode);
                        }}
                      >
                        Join Stream
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        
        {/* Create stream promo for logged in users */}
        {user && (
          <div className="mt-12 bg-gradient-to-r from-purple-900/50 to-blue-900/50 p-6 rounded-xl border border-purple-800/50">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Want to start your own stream?</h2>
                <p className="text-gray-300">Share your talents, thoughts or just hang out with your friends.</p>
              </div>
              <Button
                size="lg" 
                onClick={() => navigate('/live/new?host=true')}
                className="bg-red-500 hover:bg-red-600 text-white whitespace-nowrap"
              >
                Start Streaming Now
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveStreams;
