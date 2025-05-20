import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import { toast } from 'sonner';
import SplashScreen from '@/components/SplashScreen';
import DailyIframe from '@/components/DailyIframe';
import { useBreakpoint } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

// Daily.co API key
const DAILY_API_KEY = '2f003ab69d81366c11dde4098ab14bb7bf0092acfb6511c0a3bf8cb13096d6d1';

// Define interfaces for database tables
interface LiveStream {
  id?: string;
  title: string;
  description?: string;
  user_id: string;
  stream_key: string;
  created_at?: string;
  viewer_count?: number;
  ended_at?: string;
  status: 'active' | 'ended' | 'scheduled';
  thumbnail_url?: string;
  playback_url?: string;
}

interface LiveChatMessage {
  id?: string;
  live_id: string;
  user_id: string;
  content: string;
  created_at?: string;
}

// Simple chat message for UI
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
  const [loading, setLoading] = useState(true);
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [dailyCallObject, setDailyCallObject] = useState<any>(null);
  const [liveStreamId, setLiveStreamId] = useState<string | null>(null);
  const dailyInitializedRef = useRef(false);
  
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
            // First check if room exists to prevent redundant API calls
            const response = await fetch(`https://api.daily.co/v1/rooms/${roomCode}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DAILY_API_KEY}`
              }
            });

            // If room doesn't exist, create it
            if (response.status === 404) {
              console.log("Room doesn't exist, creating new room:", roomCode);
              
              const createResponse = await fetch(`https://api.daily.co/v1/rooms`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${DAILY_API_KEY}`
                },
                body: JSON.stringify({
                  name: roomCode,
                  properties: {
                    enable_network_ui: true,
                    enable_screenshare: true,
                    enable_chat: true,
                    start_video_off: false,
                    start_audio_off: false,
                    owner_only_broadcast: false,
                    enable_knocking: false,
                    enable_prejoin_ui: true,
                    enable_people_ui: true
                  }
                })
              });
              
              if (!createResponse.ok) {
                const errorData = await createResponse.json();
                throw new Error(errorData.info?.msg || 'Failed to create room');
              }
              
              console.log("Room created successfully");
            } else if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.info?.msg || 'Error checking room existence');
            } else {
              console.log("Room already exists, joining:", roomCode);
            }
            
            // If we're the host, record the live stream in our database
            if (user) {
              // First check if livestream already exists for this room
              const { data: existingStream } = await supabase
                .from('lives')
                .select('id')
                .eq('stream_key', roomCode)
                .eq('status', 'active')
                .maybeSingle();
              
              if (existingStream) {
                console.log('Stream already exists, using existing record:', existingStream);
                setLiveStreamId(existingStream.id);
              } else {
                const { data: profileData } = await supabase
                  .from('profiles')
                  .select('username')
                  .eq('id', user.id)
                  .single();
                  
                const hostName = profileData?.username || user.user_metadata?.username || 'Anonymous';
                
                // Store the live stream in our database
                const { data: liveData, error: liveError } = await supabase
                  .from('lives')
                  .insert({
                    title: `${hostName}'s Stream`,
                    description: 'Live stream',
                    user_id: user.id,
                    stream_key: roomCode,
                    viewer_count: 1,
                    status: 'active'
                  } as LiveStream)
                  .select()
                  .single();
                  
                if (liveError) {
                  console.error('Error storing live stream:', liveError);
                } else if (liveData) {
                  setLiveStreamId(liveData.id);
                }
              }
            }
            
            toast.success('Your live stream is starting!');
          } catch (error: any) {
            console.error('Error creating room:', error);
            console.log('Room may already exist, attempting to join anyway');
          }
        } else {
          toast.success('Joined the live stream!');
          
          // Get the live stream ID
          const { data: liveData } = await supabase
            .from('lives')
            .select('id, viewer_count')
            .eq('stream_key', roomCode)
            .eq('status', 'active')
            .single();
            
          if (liveData?.id) {
            setLiveStreamId(liveData.id);
            
            // Update viewer count
            if (user) {
              await supabase
                .from('lives')
                .update({
                  viewer_count: (liveData.viewer_count || 0) + 1
                })
                .eq('id', liveData.id);
            }
          }
        }
        
        // Room URL to join - ensure proper https format
        const url = `https://tuwaye.daily.co/${roomCode}`;
        console.log("Setting room URL:", url);
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
          
          // Update the database when leaving
          if (liveStreamId) {
            if (isHost) {
              // End the stream if host
              supabase
                .from('lives')
                .update({ 
                  status: 'ended',
                  ended_at: new Date().toISOString()
                })
                .eq('id', liveStreamId)
                .then(({ error }) => {
                  if (error) console.error('Error ending live stream:', error);
                });
            } else if (user) {
              // Decrement viewer count if viewer
              supabase
                .from('lives')
                .select('viewer_count')
                .eq('id', liveStreamId)
                .single()
                .then(({ data, error }) => {
                  if (!error && data) {
                    const newCount = Math.max((data.viewer_count || 1) - 1, 1);
                    supabase
                      .from('lives')
                      .update({ viewer_count: newCount })
                      .eq('id', liveStreamId);
                  }
                });
            }
          }
        } catch (error) {
          console.error('Error destroying Daily.co instance:', error);
        }
      }
    };
  }, [roomCode, isHost, navigate, user]);
  
  const handleDailyInit = (callObject: any) => {
    console.log("Daily call object initialized", callObject);
    // Only set if not already initialized to prevent rerender cycle
    if (!dailyInitializedRef.current) {
      dailyInitializedRef.current = true;
      setDailyCallObject(callObject);
      
      // You can still add custom event handlers if needed
      callObject.on('participant-joined', (event: any) => {
        console.log("Participant joined:", event);
      });
      
      callObject.on('participant-left', (event: any) => {
        console.log("Participant left:", event);
      });
    }
  };
  
  if (loading) {
    return <SplashScreen message={isHost ? "Starting your live stream..." : "Joining live stream..."} />;
  }
  
  return (
    <div className="h-screen w-screen overflow-hidden bg-black">
      {roomUrl ? (
        <DailyIframe 
          url={roomUrl}
          onCallObjectReady={handleDailyInit}
          isHost={isHost}
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="bg-gray-800 p-8 rounded-lg">
            <p className="text-white">Unable to connect to live stream.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Live;
