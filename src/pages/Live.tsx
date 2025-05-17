
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Video, VideoOff, Users, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import SplashScreen from '@/components/SplashScreen';
import DailyIframe from '@/components/DailyIframe';

// Daily.co API key - Updated with correct key
const DAILY_API_KEY = '2394ae7c60960a8c558245b3e23e359269b5308d435a925cd138613a5458f296';

// Define the global DailyIframe type
declare global {
  interface Window {
    DailyIframe?: {
      createCallObject: (options: any) => any;
    }
  }
}

const Live: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const [searchParams] = useSearchParams();
  const isHost = searchParams.get('host') === 'true';
  const { user } = useSupabase();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [viewers, setViewers] = useState(1);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{id: string, user: string, message: string}>>([]);
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [dailyCallObject, setDailyCallObject] = useState<any>(null);
  const dailyScriptLoaded = useRef(false);
  
  useEffect(() => {
    // Handle direct navigation to /live/new
    if (roomCode === 'new') {
      // Generate a random room code
      const newRoomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      navigate(`/live/${newRoomCode}?host=true`, { replace: true });
      return;
    }
    
    if (!roomCode) {
      toast.error('Invalid room code');
      navigate('/');
      return;
    }
    
    const loadDailyScript = () => {
      return new Promise<void>((resolve, reject) => {
        // Check if Daily.co script is already loaded
        if (window.DailyIframe || dailyScriptLoaded.current) {
          resolve();
          return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@daily-co/daily-js';
        script.async = true;
        
        script.onload = () => {
          dailyScriptLoaded.current = true;
          resolve();
        };
        
        script.onerror = () => {
          reject(new Error('Failed to load Daily.co script'));
        };
        
        document.body.appendChild(script);
      });
    };
    
    const createOrJoinRoom = async () => {
      try {
        setLoading(true);
        
        // Load the Daily.co script first
        await loadDailyScript();
        
        // If host, create a room
        if (isHost) {
          try {
            const response = await fetch(`https://api.daily.co/v1/rooms`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DAILY_API_KEY}`
              },
              body: JSON.stringify({
                name: roomCode,
                properties: {
                  start_audio_off: false,
                  start_video_off: false,
                }
              })
            });
            
            if (!response.ok && response.status !== 409) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Failed to create room');
            }
            
            toast.success('Your live stream is starting!');
          } catch (error) {
            console.error('Error creating room:', error);
            // If room already exists (409 error), we'll just use it
            console.log('Room may already exist, attempting to join anyway');
          }
        } else {
          toast.success('Joined the live stream!');
          
          // Mock some viewers joining for non-host users
          const viewerInterval = setInterval(() => {
            setViewers(prev => {
              const newCount = prev + Math.floor(Math.random() * 3);
              return Math.min(newCount, 25); // Cap at 25 viewers for demo
            });
          }, 5000);
          
          return () => clearInterval(viewerInterval);
        }
        
        // Room URL to join - Updated with correct domain
        const url = `https://worldwidehotspot.daily.co/${roomCode}`;
        setRoomUrl(url);
        
      } catch (error) {
        console.error('Error creating/joining room:', error);
        toast.error('Failed to start livestream');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    
    createOrJoinRoom();
    
    // Cleanup function
    return () => {
      if (dailyCallObject) {
        dailyCallObject.destroy();
      }
    };
  }, [roomCode, isHost, navigate]);
  
  const toggleAudio = () => {
    if (dailyCallObject) {
      dailyCallObject.setLocalAudio(audioEnabled ? false : true);
    }
    setAudioEnabled(prev => !prev);
    toast(audioEnabled ? 'Microphone muted' : 'Microphone unmuted');
  };
  
  const toggleVideo = () => {
    if (dailyCallObject) {
      dailyCallObject.setLocalVideo(videoEnabled ? false : true);
    }
    setVideoEnabled(prev => !prev);
    toast(videoEnabled ? 'Video turned off' : 'Video turned on');
  };
  
  const endStream = () => {
    if (dailyCallObject) {
      dailyCallObject.destroy();
    }
    toast.info('Ending stream...');
    setTimeout(() => {
      navigate('/live-streams');
    }, 1000);
  };
  
  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    
    if (dailyCallObject) {
      dailyCallObject.sendAppMessage({ type: 'chat', message: chatMessage }, '*');
    }
    
    const newMessage = {
      id: Math.random().toString(),
      user: user?.user_metadata?.username || 'Anonymous',
      message: chatMessage
    };
    
    setChatMessages(prev => [...prev, newMessage]);
    setChatMessage('');
  };
  
  const handleDailyInit = (callObject: any) => {
    setDailyCallObject(callObject);
    
    // Set up event handlers for Daily.co events
    callObject.on('participant-joined', (event: any) => {
      setViewers(prev => Math.min(prev + 1, 25)); // Cap at 25 viewers for UI
    });
    
    callObject.on('participant-left', (event: any) => {
      setViewers(prev => Math.max(prev - 1, 1)); // Ensure at least 1 viewer (the host)
    });
    
    callObject.on('app-message', (event: any) => {
      if (event.data.type === 'chat') {
        const newMessage = {
          id: Math.random().toString(),
          user: event.fromId === callObject.participants().local.user_id 
            ? user?.user_metadata?.username || 'Me'
            : callObject.participants()[event.fromId]?.user_name || 'Anonymous',
          message: event.data.message
        };
        
        setChatMessages(prev => [...prev, newMessage]);
      }
    });
  };
  
  if (loading) {
    return <SplashScreen message={isHost ? "Starting your live stream..." : "Joining live stream..."} />;
  }
  
  return (
    <div className="container mx-auto pt-14 pb-16 px-4 md:px-8 min-h-screen">
      <Card className="overflow-hidden rounded-xl shadow-lg border-none bg-gradient-to-br from-gray-900 to-black">
        <div className="flex flex-col md:flex-row h-[calc(100vh-180px)]">
          {/* Video area with Daily.co iframe */}
          <div className="flex-1 relative bg-black">
            {roomUrl ? (
              <DailyIframe 
                url={roomUrl}
                onCallObjectReady={handleDailyInit}
                isHost={isHost}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-gray-800 p-8 rounded-full">
                  <VideoOff size={48} className="text-gray-400" />
                </div>
              </div>
            )}
            
            {/* Live indicator and viewers count */}
            <div className="absolute top-4 left-4 flex items-center gap-3">
              <div className="bg-red-600 text-white text-sm font-medium px-3 py-1 rounded-md flex items-center gap-1.5">
                <span className="h-2 w-2 bg-white rounded-full animate-pulse"></span>
                LIVE
              </div>
              <div className="bg-black/60 text-white text-sm flex items-center gap-1.5 px-3 py-1 rounded-md">
                <Users size={14} />
                {viewers}
              </div>
            </div>
            
            {/* Room code */}
            <div className="absolute top-4 right-4 bg-black/60 text-white text-sm px-3 py-1 rounded-md">
              Room: {roomCode}
            </div>
            
            {/* Controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className={`rounded-full p-3 ${audioEnabled ? 'bg-gray-800/70' : 'bg-red-500'}`}
                onClick={toggleAudio}
              >
                {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                className={`rounded-full p-3 ${videoEnabled ? 'bg-gray-800/70' : 'bg-red-500'}`}
                onClick={toggleVideo}
              >
                {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </Button>
              
              {isHost && (
                <Button
                  variant="outline"
                  className="rounded-full bg-red-500 hover:bg-red-600 text-white px-6"
                  onClick={endStream}
                >
                  End Stream
                </Button>
              )}
              
              {!isHost && (
                <Button
                  variant="outline"
                  className="rounded-full bg-gray-700 hover:bg-gray-600 text-white px-6"
                  onClick={endStream}
                >
                  Leave Stream
                </Button>
              )}
            </div>
          </div>
          
          {/* Chat area */}
          <div className="w-full md:w-80 bg-gray-900 flex flex-col border-l border-gray-700">
            <div className="p-3 border-b border-gray-700">
              <h3 className="text-white font-medium flex items-center gap-2">
                <MessageCircle size={16} /> Live Chat
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {chatMessages.length === 0 ? (
                <div className="text-gray-400 text-sm text-center py-4">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                chatMessages.map(msg => (
                  <div key={msg.id} className="bg-gray-800/40 rounded-lg p-2">
                    <div className="font-medium text-sm text-blue-400">{msg.user}</div>
                    <div className="text-white text-sm">{msg.message}</div>
                  </div>
                ))
              )}
            </div>
            
            <form onSubmit={sendChatMessage} className="p-3 border-t border-gray-700 flex gap-2">
              <Input
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Type a message..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
              />
              <Button type="submit" size="sm">Send</Button>
            </form>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Live;
