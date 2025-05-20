
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import { Mic, MicOff, Video, VideoOff, Users, MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import SplashScreen from '@/components/SplashScreen';
import DailyIframe from '@/components/DailyIframe';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useBreakpoint } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { LiveMessage } from '@/lib/types';

// Daily.co API key
const DAILY_API_KEY = '2f003ab69d81366c11dde4098ab14bb7bf0092acfb6511c0a3bf8cb13096d6d1';

// Define the global DailyIframe type
declare global {
  interface Window {
    DailyIframe?: {
      createFrame: (container: HTMLElement, options: any) => any;
      createCallObject: (options: any) => any;
    }
  }
}

// Define interfaces for our database tables
interface LiveStream {
  id?: string;
  title: string;
  description?: string;
  user_id: string;
  stream_key: string;
  created_at?: string;
  viewer_count?: number;
  ended_at?: string;
  status?: string;
  thumbnail_url?: string;
  playback_url?: string;
}

// Simple chat message type
interface ChatMessage {
  id: string;
  user: string;
  message: string;
}

const Live: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const [searchParams] = useSearchParams();
  const isHost = searchParams.get('host') === 'true';
  const { user } = useSupabase();
  const navigate = useNavigate();
  const { breakpoint } = useBreakpoint();
  const isMobile = breakpoint === "mobile";
  const [loading, setLoading] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(isHost); // Only host starts with audio enabled
  const [videoEnabled, setVideoEnabled] = useState(true);   // Everyone starts with video enabled
  const [viewers, setViewers] = useState(1);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [dailyCallObject, setDailyCallObject] = useState<any>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const dailyInitialized = useRef(false);
  
  useEffect(() => {
    // Clear any existing listeners to prevent duplicates
    if (dailyCallObject) {
      try {
        dailyCallObject.destroy();
        setDailyCallObject(null);
      } catch (error) {
        console.error('Error cleaning up previous Daily.co instance:', error);
      }
    }
    
    // Reset initialization flag
    dailyInitialized.current = false;
    
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
    
    const createOrJoinRoom = async () => {
      try {
        setLoading(true);
        
        // If host, create a room
        if (isHost) {
          try {
            const response = await fetch(`https://api.daily.co/v1/rooms/${roomCode}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DAILY_API_KEY}`
              }
            });

            // If room doesn't exist, create it
            if (response.status === 404) {
              const createResponse = await fetch(`https://api.daily.co/v1/rooms`, {
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
                    enable_screenshare: true,
                    enable_chat: true,
                    signaling_impl: 'ws', // Use WebSocket signaling for better reliability
                    exp: Math.floor(Date.now() / 1000) + 3600, // Room expires in 1 hour
                    eject_at_room_exp: true,
                    max_participants: 20
                  }
                })
              });
              
              if (!createResponse.ok) {
                const errorData = await createResponse.json();
                throw new Error(errorData.info?.msg || 'Failed to create room');
              }
            } else if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.info?.msg || 'Error checking room existence');
            }
            
            // If we're the host, record the live stream in our database
            if (user) {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', user.id)
                .single();
                
              const hostName = profileData?.username || user.user_metadata?.username || 'Anonymous';
              
              // Store the live stream in our database
              const { error: liveError } = await supabase
                .from('lives')
                .insert({
                  title: `${hostName}'s Stream`,
                  description: 'Live stream',
                  user_id: user.id,
                  stream_key: roomCode, // Using room code as stream key
                  viewer_count: 1,
                  status: 'active'
                } as LiveStream);
                
              if (liveError) {
                console.error('Error storing live stream:', liveError);
              }
            }
            
            toast.success('Your live stream is starting!');
          } catch (error: any) {
            console.error('Error creating room:', error);
            // If room already exists (409 error), we'll just use it
            console.log('Room may already exist, attempting to join anyway');
          }
        } else {
          toast.success('Joined the live stream!');
          
          // Update viewer count
          if (user) {
            const { data: liveData } = await supabase
              .from('lives')
              .select('id, viewer_count')
              .eq('stream_key', roomCode)
              .single();
              
            if (liveData?.id) {
              await supabase
                .from('lives')
                .update({
                  viewer_count: (liveData.viewer_count || 0) + 1
                })
                .eq('id', liveData.id);
            }
          }
        }
        
        // Room URL to join - Updated with correct domain
        const url = `https://tuwaye.daily.co/${roomCode}`;
        setRoomUrl(url);
        
      } catch (error: any) {
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
        try {
          console.log("Cleaning up Daily call object on component unmount");
          dailyCallObject.destroy();
          
          // Update the database when leaving (if viewer but not host)
          if (!isHost && user) {
            const updateViewCount = async () => {
              // Get the live stream
              const { data: liveData } = await supabase
                .from('lives')
                .select('id, viewer_count')
                .eq('stream_key', roomCode)
                .single();
                
              if (liveData?.id) {
                // Decrement viewer count (but never below 1 which is the host)
                const newCount = Math.max((liveData.viewer_count || 1) - 1, 1);
                await supabase
                  .from('lives')
                  .update({ viewer_count: newCount })
                  .eq('id', liveData.id);
              }
            };
            
            updateViewCount();
          }
          
          // End the stream in database if host
          if (isHost && user && roomCode) {
            supabase
              .from('lives')
              .update({ 
                status: 'ended',
                ended_at: new Date().toISOString()
              })
              .eq('stream_key', roomCode)
              .then(({ error }) => {
                if (error) console.error('Error ending live stream in database:', error);
              });
          }
        } catch (error) {
          console.error('Error destroying Daily.co instance:', error);
        }
        setDailyCallObject(null);
      }
    };
  }, [roomCode, isHost, navigate, user]);
  
  const toggleAudio = async () => {
    if (dailyCallObject) {
      try {
        await dailyCallObject.setLocalAudio(!audioEnabled);
        setAudioEnabled(prev => !prev);
        toast(audioEnabled ? 'Microphone muted' : 'Microphone unmuted');
      } catch (error) {
        console.error('Error toggling audio:', error);
        toast.error('Failed to toggle microphone');
      }
    }
  };
  
  const toggleVideo = async () => {
    if (dailyCallObject) {
      try {
        await dailyCallObject.setLocalVideo(!videoEnabled);
        setVideoEnabled(prev => !prev);
        toast(videoEnabled ? 'Video turned off' : 'Video turned on');
      } catch (error) {
        console.error('Error toggling video:', error);
        toast.error('Failed to toggle camera');
      }
    }
  };
  
  const endStream = async () => {
    if (dailyCallObject) {
      try {
        dailyCallObject.destroy();
        setDailyCallObject(null);
        
        // Update database if host
        if (isHost && user) {
          const { error } = await supabase
            .from('lives')
            .update({ 
              status: 'ended',
              ended_at: new Date().toISOString()
            })
            .eq('stream_key', roomCode);
            
          if (error) {
            console.error('Error ending stream in database:', error);
          }
        } else if (!isHost && user) {
          // Update viewer count
          const { data: liveData } = await supabase
            .from('lives')
            .select('id, viewer_count')
            .eq('stream_key', roomCode)
            .single();
            
          if (liveData?.id) {
            // Decrement viewer count (but never below 1 which is the host)
            const newCount = Math.max((liveData.viewer_count || 1) - 1, 1);
            await supabase
              .from('lives')
              .update({ viewer_count: newCount })
              .eq('id', liveData.id);
          }
        }
      } catch (error) {
        console.error('Error ending stream:', error);
      }
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
    
    // Store chat message in database
    if (user && roomCode) {
      const chatData = {
        room_code: roomCode,
        user_id: user.id,
        content: chatMessage,
        username: user.user_metadata?.username || 'Anonymous'
      };
      
      // Store chat message
      supabase
        .from('live_chat_messages')
        .insert(chatData)
        .then(({ error }) => {
          if (error) console.error('Error storing chat message:', error);
        });
    }
  };
  
  const handleDailyInit = (callObject: any) => {
    if (dailyInitialized.current) {
      console.log("Daily already initialized, skipping duplicate initialization");
      return;
    }
    
    console.log("Daily call object initialized", callObject);
    setDailyCallObject(callObject);
    dailyInitialized.current = true;
    
    // Set up event handlers for Daily.co events
    callObject.on('participant-joined', (event: any) => {
      console.log("Participant joined:", event);
      setViewers(prev => prev + 1);
    });
    
    callObject.on('participant-left', (event: any) => {
      console.log("Participant left:", event);
      setViewers(prev => Math.max(prev - 1, 1)); // Ensure at least 1 viewer (the host)
    });
    
    callObject.on('app-message', (event: any) => {
      console.log("Received app message:", event);
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
    
    // Track camera and mic state changes
    callObject.on('track-started', (event: any) => {
      console.log('Track started:', event);
      if (event.track.kind === 'video') {
        setVideoEnabled(true);
      } else if (event.track.kind === 'audio') {
        setAudioEnabled(true);
      }
    });
    
    callObject.on('track-stopped', (event: any) => {
      console.log('Track stopped:', event);
      if (event.track.kind === 'video') {
        setVideoEnabled(false);
      } else if (event.track.kind === 'audio') {
        setAudioEnabled(false);
      }
    });
    
    // Load previous messages
    if (roomCode) {
      supabase
        .from('live_chat_messages')
        .select('content, username, created_at')
        .eq('room_code', roomCode)
        .order('created_at', { ascending: true })
        .limit(50)
        .then(({ data, error }) => {
          if (error) {
            console.error('Error loading chat history:', error);
          } else if (data) {
            const oldMessages = data.map(msg => ({
              id: Math.random().toString(),
              user: msg.username || 'Anonymous',
              message: msg.content
            }));
            setChatMessages(oldMessages);
          }
        });
    }
  };
  
  if (loading) {
    return <SplashScreen message={isHost ? "Starting your live stream..." : "Joining live stream..."} />;
  }
  
  return (
    <div className="h-screen w-screen overflow-hidden bg-black relative">
      {/* Full screen video area */}
      <div className="h-full w-full">
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
      </div>
      
      {/* Top overlay - Room info and viewers count */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="bg-red-600 text-white text-sm font-medium px-3 py-1 rounded-md flex items-center gap-1.5 shadow-lg">
            <span className="h-2 w-2 bg-white rounded-full animate-pulse"></span>
            LIVE
          </div>
          <div className="bg-black/60 backdrop-blur-sm text-white text-sm flex items-center gap-1.5 px-3 py-1 rounded-md shadow-lg">
            <Users size={14} />
            {viewers}
          </div>
          <div className="bg-black/60 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-md shadow-lg hidden sm:block">
            Room: {roomCode}
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="icon" 
          className="bg-black/60 backdrop-blur-sm border-none rounded-full text-white hover:bg-black/80"
          onClick={() => navigate('/live-streams')}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Bottom controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4 z-10">
        <Button
          variant="outline"
          size="icon"
          className={`rounded-full h-12 w-12 ${audioEnabled ? 'bg-gray-800/70 backdrop-blur-sm' : 'bg-red-500'}`}
          onClick={toggleAudio}
          disabled={!isHost} // Only host can use mic
        >
          {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className={`rounded-full h-12 w-12 ${videoEnabled ? 'bg-gray-800/70 backdrop-blur-sm' : 'bg-red-500'}`}
          onClick={toggleVideo}
        >
          {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </Button>
        
        {isHost ? (
          <Button
            variant="outline"
            className="rounded-full bg-red-500 hover:bg-red-600 text-white px-6 py-5"
            onClick={endStream}
          >
            End Stream
          </Button>
        ) : (
          <Button
            variant="outline"
            className="rounded-full bg-gray-700/80 backdrop-blur-sm hover:bg-gray-600 text-white px-6 py-5"
            onClick={endStream}
          >
            Leave Stream
          </Button>
        )}
      </div>
      
      {/* Chat panel as a side drawer */}
      <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
        <SheetTrigger asChild>
          <Button 
            className="absolute bottom-8 right-6 rounded-full bg-primary/90 backdrop-blur-sm z-20"
            size="icon"
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-gray-900/95 backdrop-blur-md border-gray-800 p-0">
          <div className="flex flex-col h-full">
            <div className="p-3 border-b border-gray-800">
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
            
            <form onSubmit={sendChatMessage} className="p-3 border-t border-gray-800 flex gap-2">
              <Input
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Type a message..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
              />
              <Button type="submit" size="sm" className="bg-primary">Send</Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Live;
