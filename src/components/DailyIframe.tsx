
import React, { useRef, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useSupabase } from '@/context/SupabaseContext';

// We'll remove the global declaration from here since it's causing conflicts

interface DailyIframeProps {
  url: string;
  onCallObjectReady: (callObject: any) => void;
  isHost: boolean;
}

const DailyIframe: React.FC<DailyIframeProps> = ({ url, onCallObjectReady, isHost }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const callObjectRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useSupabase();

  useEffect(() => {
    console.log("DailyIframe component mounted, URL:", url);
    
    // Check if Daily.co script is already loaded
    if (!window.DailyIframe) {
      console.error('Daily.co SDK not loaded');
      return;
    }
    
    // Create a call object
    try {
      console.log("Creating Daily call object");
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
      
      console.log("Joining call with options:", joinOptions);
      
      const joinCall = async () => {
        try {
          console.log("Attempting to join call");
          await callObject.join(joinOptions);
          console.log("Successfully joined call");
          
          // Attach the call to our container element
          if (containerRef.current) {
            callObject.iframe().style.width = '100%';
            callObject.iframe().style.height = '100%';
            callObject.iframe().style.border = 'none';
            containerRef.current.appendChild(callObject.iframe());
            console.log("Attached Daily iframe to container");
          } else {
            console.error("Container ref is null, cannot attach iframe");
          }
          
          setLoading(false);
          onCallObjectReady(callObject);
        } catch (error) {
          console.error('Error joining Daily.co call:', error);
        }
      };
      
      joinCall();
    } catch (error) {
      console.error("Error in Daily.co initialization:", error);
    }
    
    return () => {
      console.log("DailyIframe component unmounting");
      if (callObjectRef.current) {
        callObjectRef.current.destroy();
        console.log("Daily call object destroyed");
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
        ref={containerRef}
        className="w-full h-full"
      ></div>
    </div>
  );
};

export default DailyIframe;
