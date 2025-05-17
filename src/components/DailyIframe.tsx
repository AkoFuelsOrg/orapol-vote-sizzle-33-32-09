
import React, { useRef, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useSupabase } from '@/context/SupabaseContext';

interface DailyIframeProps {
  url: string;
  onCallObjectReady: (callObject: any) => void;
  isHost: boolean;
}

const DailyIframe: React.FC<DailyIframeProps> = ({ url, onCallObjectReady, isHost }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const callObjectRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useSupabase();

  useEffect(() => {
    if (!window.DailyIframe) {
      console.error('Daily.co SDK not loaded');
      return;
    }
    
    // Create a call object
    const callObject = window.DailyIframe.createCallObject({
      url: url,
      dailyConfig: {
        experimentalChromeVideoMuteLightOff: true,
      }
    });
    
    callObjectRef.current = callObject;
    
    // Join the call
    const joinOptions: any = {
      url: url,
      showLeaveButton: false,
    };
    
    if (isHost) {
      joinOptions.startVideoOff = false;
      joinOptions.startAudioOff = false;
    } else {
      // For viewers, default to audio/video off
      joinOptions.startVideoOff = true;
      joinOptions.startAudioOff = true;
    }
    
    // Set username from authenticated user if available
    if (user) {
      joinOptions.userName = user.user_metadata?.username || 'Anonymous';
    }
    
    const joinCall = async () => {
      try {
        await callObject.join(joinOptions);
        setLoading(false);
        onCallObjectReady(callObject);
      } catch (error) {
        console.error('Error joining Daily.co call:', error);
      }
    };
    
    joinCall();
    
    return () => {
      if (callObjectRef.current) {
        callObjectRef.current.destroy();
      }
    };
  }, [url, isHost, onCallObjectReady, user]);

  return (
    <div className="w-full h-full relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <div 
        id="daily-container"
        className="w-full h-full"
        ref={iframeRef}
      ></div>
    </div>
  );
};

export default DailyIframe;
