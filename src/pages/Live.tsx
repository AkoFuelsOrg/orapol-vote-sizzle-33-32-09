
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import { toast } from 'sonner';
import SplashScreen from '@/components/SplashScreen';
import JitsiMeet from '@/components/DailyIframe';
import { isBreakpoint } from '@/utils/breakpoint-utils';
import { useBreakpoint } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

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
  const breakpointState = useBreakpoint();
  const isMobile = isBreakpoint(breakpointState, "mobile");
  const [loading, setLoading] = useState(true);
  const [jitsiApi, setJitsiApi] = useState<any>(null);
  const [liveStreamId, setLiveStreamId] = useState<string | null>(null);
  
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
    
    const setupLiveStream = async () => {
      try {
        setLoading(true);
        
        // If we're the host, record the live stream in our database
        if (user) {
          if (isHost) {
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
              
              // Validate status to ensure it matches the enum
              const validStatus: LiveStream['status'] = 'active';
              
              // Store the live stream in our database
              const { data: liveData, error: liveError } = await supabase
                .from('lives')
                .insert({
                  title: `${hostName}'s Stream`,
                  description: 'Live stream',
                  user_id: user.id,
                  stream_key: roomCode,
                  viewer_count: 1,
                  status: validStatus
                } as LiveStream)
                .select()
                .single();
                
              if (liveError) {
                console.error('Error storing live stream:', liveError);
              } else if (liveData) {
                setLiveStreamId(liveData.id);
              }
            }
            
            toast.success('Your live stream is starting!');
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
              await supabase
                .from('lives')
                .update({
                  viewer_count: (liveData.viewer_count || 0) + 1
                })
                .eq('id', liveData.id);
            }
          }
        }
        
        setLoading(false);
      } catch (error: any) {
        console.error('Error setting up live stream:', error);
        toast.error('Failed to start livestream');
        navigate('/');
        setLoading(false);
      }
    };
    
    setupLiveStream();
    
    // Cleanup function
    return () => {
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
    };
  }, [roomCode, isHost, navigate, user]);
  
  const handleJitsiReady = (api: any) => {
    console.log("Jitsi API initialized:", api);
    setJitsiApi(api);
    
    // Add any additional event handlers if needed
    api.addEventListener('videoConferenceLeft', () => {
      console.log('Left the conference');
      navigate('/live-streams');
    });
  };
  
  if (loading) {
    return <SplashScreen message={isHost ? "Starting your live stream..." : "Joining live stream..."} />;
  }
  
  return (
    <div className="h-screen w-screen overflow-hidden bg-black">
      {roomCode ? (
        <JitsiMeet 
          roomName={roomCode}
          onApiReady={handleJitsiReady}
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
