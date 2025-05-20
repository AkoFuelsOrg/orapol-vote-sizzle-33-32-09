
import React, { useRef, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useSupabase } from '@/context/SupabaseContext';
import { toast } from 'sonner';

interface DailyIframeProps {
  url: string;
  onCallObjectReady: (callObject: any) => void;
  isHost: boolean;
}

// Define the global DailyIframe type
declare global {
  interface Window {
    DailyIframe?: {
      createFrame: (container: HTMLElement, options: any) => any;
    }
  }
}

const DailyIframe: React.FC<DailyIframeProps> = ({ url, onCallObjectReady, isHost }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const { user } = useSupabase();
  const frameRef = useRef<any>(null);
  
  useEffect(() => {
    console.log("DailyIframe component mounted, URL:", url);
    let isDestroyed = false;
    
    // Load Daily.co script if not already loaded
    const loadDailyScript = () => {
      if (window.DailyIframe) {
        console.log("Daily.co script already loaded");
        createDailyIframe();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@daily-co/daily-js';
      script.async = true;
      script.crossOrigin = 'anonymous';
      
      script.onload = () => {
        console.log("Daily.co script loaded successfully");
        if (!isDestroyed) {
          createDailyIframe();
        }
      };
      
      script.onerror = () => {
        console.error("Failed to load Daily.co script");
        toast.error("Failed to load video call service");
        setLoading(false);
      };
      
      document.body.appendChild(script);
    };
    
    // Check for media permissions
    const checkMediaPermissions = async () => {
      try {
        console.log("Checking media permissions...");
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        console.log("Media permissions granted!", stream.getTracks().map(t => `${t.kind} (${t.label})`));
        stream.getTracks().forEach(track => track.stop()); // Release devices
        return true;
      } catch (error: any) {
        console.error("Media permission error:", error);
        setDeviceError(error.message || "Camera or microphone access denied");
        toast.error(`Camera/microphone error: ${error.message || "Access denied"}`);
        return false;
      }
    };
    
    // Create the Daily iframe
    const createDailyIframe = async () => {
      if (isDestroyed || !window.DailyIframe) return;
      
      // Check permissions first
      const hasPermissions = await checkMediaPermissions();
      if (!hasPermissions) {
        setLoading(false);
        return;
      }
      
      try {
        // Ensure we have a container element
        if (!containerRef.current) {
          console.error("Container ref is not available");
          return;
        }
        
        // Destroy any existing frame to prevent duplicates
        if (frameRef.current) {
          try {
            frameRef.current.destroy();
          } catch (e) {
            console.error("Error destroying previous Daily frame:", e);
          }
          frameRef.current = null;
        }
        
        // Create Daily frame with embedded UI
        const callFrame = window.DailyIframe.createFrame(containerRef.current, {
          url: url,
          showLeaveButton: true,
          showFullscreenButton: true,
          userName: user?.user_metadata?.username || 'Anonymous',
          iframeStyle: {
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: '0',
          }
        });
        
        frameRef.current = callFrame;
        
        callFrame.on('loaded', () => {
          console.log('Daily iframe loaded');
        });
        
        callFrame.on('joining-meeting', () => {
          console.log('Joining meeting...');
        });
        
        callFrame.on('joined-meeting', () => {
          console.log('Successfully joined meeting!');
          setLoading(false);
          
          // Pass call object to parent
          if (onCallObjectReady) {
            onCallObjectReady(callFrame);
          }
        });
        
        callFrame.on('camera-error', (event: any) => {
          console.error('Camera error:', event);
          toast.error(`Camera error: ${event?.errorMsg || 'Unknown error'}`);
        });
        
        callFrame.on('error', (error: any) => {
          console.error('Daily.co error:', error);
          toast.error(`Video call error: ${error?.errorMsg || 'Unknown error'}`);
        });
        
        // Join with audio based on host status
        if (!isHost) {
          callFrame.setLocalAudio(false);
        }
        
        callFrame.join();
        console.log("Join call initiated");
        
      } catch (error: any) {
        console.error("Error in Daily.co initialization:", error);
        toast.error(`Failed to initialize video call: ${error.message || 'Unknown error'}`);
        setLoading(false);
      }
    };
    
    loadDailyScript();
    
    // Clean up on unmount
    return () => {
      console.log("DailyIframe component unmounting");
      isDestroyed = true;
      
      if (frameRef.current) {
        try {
          frameRef.current.destroy();
        } catch (e) {
          console.error("Error destroying Daily frame:", e);
        }
        frameRef.current = null;
      }
    };
  }, [url, isHost, user, onCallObjectReady]);
  
  return (
    <div className="w-full h-full relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-white text-sm">{isHost ? 'Setting up your call...' : 'Joining call...'}</p>
          </div>
        </div>
      )}
      
      {deviceError && !loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-10">
          <div className="bg-red-500/10 border border-red-500 p-4 rounded-lg max-w-md">
            <h3 className="text-lg font-semibold text-white mb-2">Camera/Microphone Error</h3>
            <p className="text-white/80 mb-4">{deviceError}</p>
            <p className="text-white/80 text-sm">Please ensure your browser has permission to access your camera and microphone.</p>
          </div>
        </div>
      )}
      
      <div 
        id="daily-container"
        ref={containerRef}
        className="w-full h-full"
      />
    </div>
  );
};

export default DailyIframe;
