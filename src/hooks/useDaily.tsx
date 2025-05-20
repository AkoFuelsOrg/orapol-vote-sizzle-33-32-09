
import { useState, useEffect, useRef, useCallback } from 'react';
import DailyIframe from '@daily-co/daily-js';
import { toast } from 'sonner';

export type DailyCallState = 'idle' | 'creating' | 'joining' | 'joined' | 'left' | 'error';

interface UseDailyProps {
  roomUrl?: string;
  token?: string;
  userName?: string;
  isHost?: boolean;
}

interface UseDailyReturn {
  callObject: any;
  callState: DailyCallState;
  participants: any[];
  startCamera: () => void;
  stopCamera: () => void;
  startScreenShare: () => void;
  stopScreenShare: () => void;
  joinCall: () => void;
  leaveCall: () => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isSharingScreen: boolean;
  error: Error | null;
}

export const useDaily = ({
  roomUrl,
  token,
  userName = 'Anonymous',
  isHost = false
}: UseDailyProps): UseDailyReturn => {
  const [callObject, setCallObject] = useState<any>(null);
  const [callState, setCallState] = useState<DailyCallState>('idle');
  const [participants, setParticipants] = useState<any[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(isHost);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  
  const callObjectRef = useRef<any>(null);

  // Create the callObject
  useEffect(() => {
    if (!roomUrl) return;
    
    try {
      // Clean up any existing call object
      if (callObjectRef.current) {
        callObjectRef.current.destroy();
      }
      
      const daily = DailyIframe.createCallObject({
        url: roomUrl,
        dailyConfig: {
          experimentalChromeVideoMuteLightOff: true,
        }
      });
      
      callObjectRef.current = daily;
      setCallObject(daily);
      console.log('Daily call object created');
      
      return () => {
        console.log('Cleaning up Daily call object');
        if (callObjectRef.current) {
          callObjectRef.current.destroy();
          callObjectRef.current = null;
        }
      };
    } catch (err) {
      console.error('Error creating Daily call object:', err);
      setError(err instanceof Error ? err : new Error('Failed to create call'));
      setCallState('error');
      toast.error('Failed to initialize video call');
    }
  }, [roomUrl]);

  // Set up event handlers
  useEffect(() => {
    if (!callObjectRef.current) return;
    
    const handleJoined = (event: any) => {
      console.log('Joined meeting', event);
      setCallState('joined');
      
      // Update initial state based on current settings
      setIsAudioEnabled(callObjectRef.current.localAudio());
      setIsVideoEnabled(callObjectRef.current.localVideo());
    };
    
    const handleLeft = () => {
      console.log('Left meeting');
      setCallState('left');
      setParticipants([]);
    };
    
    const handleError = (event: any) => {
      console.error('Daily error:', event);
      const errorMsg = event?.errorMsg || 'Unknown error occurred';
      setError(new Error(errorMsg));
      setCallState('error');
      toast.error(`Video call error: ${errorMsg}`);
    };
    
    const handleParticipantJoined = () => {
      updateParticipants();
    };
    
    const handleParticipantLeft = () => {
      updateParticipants();
    };
    
    const handleParticipantUpdated = () => {
      updateParticipants();
    };
    
    const updateParticipants = () => {
      if (!callObjectRef.current) return;
      
      const participants = callObjectRef.current.participants();
      if (participants) {
        const participantsArray = Object.values(participants);
        setParticipants(participantsArray);
      }
    };
    
    const daily = callObjectRef.current;
    
    daily.on('joined-meeting', handleJoined);
    daily.on('left-meeting', handleLeft);
    daily.on('error', handleError);
    daily.on('participant-joined', handleParticipantJoined);
    daily.on('participant-left', handleParticipantLeft);
    daily.on('participant-updated', handleParticipantUpdated);
    
    return () => {
      daily.off('joined-meeting', handleJoined);
      daily.off('left-meeting', handleLeft);
      daily.off('error', handleError);
      daily.off('participant-joined', handleParticipantJoined);
      daily.off('participant-left', handleParticipantLeft);
      daily.off('participant-updated', handleParticipantUpdated);
    };
  }, [callObject]);

  // Methods to control the call
  const joinCall = useCallback(() => {
    if (!callObjectRef.current || !roomUrl) return;
    
    setCallState('joining');
    console.log('Joining call:', roomUrl);
    
    try {
      callObjectRef.current.join({
        userName,
        startAudioOff: !isHost,
        startVideoOff: false,
      });
    } catch (err) {
      console.error('Error joining call:', err);
      setError(err instanceof Error ? err : new Error('Failed to join call'));
      setCallState('error');
      toast.error('Failed to join video call');
    }
  }, [roomUrl, userName, isHost]);

  const leaveCall = useCallback(() => {
    if (!callObjectRef.current) return;
    
    try {
      callObjectRef.current.leave();
    } catch (err) {
      console.error('Error leaving call:', err);
    }
  }, []);

  const toggleAudio = useCallback(() => {
    if (!callObjectRef.current) return;
    
    const newState = !isAudioEnabled;
    callObjectRef.current.setLocalAudio(newState);
    setIsAudioEnabled(newState);
  }, [isAudioEnabled]);

  const toggleVideo = useCallback(() => {
    if (!callObjectRef.current) return;
    
    const newState = !isVideoEnabled;
    callObjectRef.current.setLocalVideo(newState);
    setIsVideoEnabled(newState);
  }, [isVideoEnabled]);
  
  const startCamera = useCallback(() => {
    if (!callObjectRef.current) return;
    callObjectRef.current.setLocalVideo(true);
    setIsVideoEnabled(true);
  }, []);
  
  const stopCamera = useCallback(() => {
    if (!callObjectRef.current) return;
    callObjectRef.current.setLocalVideo(false);
    setIsVideoEnabled(false);
  }, []);
  
  const startScreenShare = useCallback(() => {
    if (!callObjectRef.current) return;
    
    callObjectRef.current.startScreenShare()
      .then(() => {
        setIsSharingScreen(true);
      })
      .catch((err: Error) => {
        console.error('Error starting screen share:', err);
        toast.error('Failed to start screen sharing');
      });
  }, []);
  
  const stopScreenShare = useCallback(() => {
    if (!callObjectRef.current) return;
    
    callObjectRef.current.stopScreenShare()
      .then(() => {
        setIsSharingScreen(false);
      })
      .catch((err: Error) => {
        console.error('Error stopping screen share:', err);
      });
  }, []);

  return {
    callObject,
    callState,
    participants,
    startCamera,
    stopCamera,
    startScreenShare,
    stopScreenShare,
    joinCall,
    leaveCall,
    toggleAudio,
    toggleVideo,
    isAudioEnabled,
    isVideoEnabled,
    isSharingScreen,
    error
  };
};
