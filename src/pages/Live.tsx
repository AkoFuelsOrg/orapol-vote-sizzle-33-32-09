
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Video, VideoOff, Users, Cast, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import SplashScreen from '@/components/SplashScreen';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  useEffect(() => {
    if (!roomCode) {
      toast.error('Invalid room code');
      navigate('/');
      return;
    }
    
    // Simulate connection to a live stream
    const timer = setTimeout(() => {
      setLoading(false);
      toast.success(isHost ? 'Your live stream has started!' : 'Connected to live stream!');
      
      // Start camera if host
      if (isHost) {
        startCamera();
        
        // Mock some viewers joining
        const viewerInterval = setInterval(() => {
          setViewers(prev => {
            const newCount = prev + Math.floor(Math.random() * 3);
            return Math.min(newCount, 25); // Cap at 25 viewers for demo
          });
        }, 5000);
        
        return () => clearInterval(viewerInterval);
      }
    }, 2000);
    
    return () => {
      clearTimeout(timer);
      stopCamera();
    };
  }, [roomCode, isHost, navigate]);
  
  const startCamera = async () => {
    try {
      if (!videoEnabled) return;
      
      const constraints = {
        audio: audioEnabled,
        video: videoEnabled
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      streamRef.current = stream;
      console.log('Camera started successfully');
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Could not access camera or microphone');
      setVideoEnabled(false);
    }
  };
  
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };
  
  const toggleAudio = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !audioEnabled;
      });
    }
    
    setAudioEnabled(prev => !prev);
    toast(audioEnabled ? 'Microphone muted' : 'Microphone unmuted');
    
    if (!streamRef.current && isHost) {
      // Restart camera with new audio setting
      startCamera();
    }
  };
  
  const toggleVideo = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !videoEnabled;
      });
    }
    
    setVideoEnabled(prev => !prev);
    toast(videoEnabled ? 'Video turned off' : 'Video turned on');
    
    if (!videoEnabled && !streamRef.current && isHost) {
      // If we're turning video back on and don't have a stream
      startCamera();
    }
  };
  
  const endStream = () => {
    stopCamera();
    toast.info('Ending stream...');
    setTimeout(() => {
      navigate('/');
    }, 1000);
  };
  
  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    
    const newMessage = {
      id: Math.random().toString(),
      user: user?.user_metadata?.username || 'Anonymous',
      message: chatMessage
    };
    
    setChatMessages(prev => [...prev, newMessage]);
    setChatMessage('');
  };
  
  if (loading) {
    return <SplashScreen message={isHost ? "Starting your live stream..." : "Joining live stream..."} />;
  }
  
  return (
    <div className="container mx-auto pt-14 pb-16 px-4 md:px-8 min-h-screen">
      <Card className="overflow-hidden rounded-xl shadow-lg border-none bg-gradient-to-br from-gray-900 to-black">
        <div className="flex flex-col md:flex-row h-[calc(100vh-180px)]">
          {/* Video area */}
          <div className="flex-1 relative bg-black">
            {isHost && videoEnabled ? (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                {videoEnabled ? (
                  <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                    <div className="text-white text-2xl font-bold">Live Stream</div>
                  </div>
                ) : (
                  <div className="bg-gray-800 p-8 rounded-full">
                    <VideoOff size={48} className="text-gray-400" />
                  </div>
                )}
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
