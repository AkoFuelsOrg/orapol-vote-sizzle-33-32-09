
import React, { useRef, useEffect, useState, memo } from 'react';
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
      createFrame: (container: HTMLElement | null, options: any) => any;
    }
  }
}

const CHAT_ICON_URL = 'https://cdn.jsdelivr.net/npm/lucide-static/icons/message-square.svg';

const DailyIframe: React.FC<DailyIframeProps> = memo(({ url, onCallObjectReady, isHost }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const { user } = useSupabase();
  const frameRef = useRef<any>(null);
  const scriptLoadedRef = useRef(false);
  const isMountedRef = useRef(true);
  
  // Only load the script once when the component mounts
  useEffect(() => {
    isMountedRef.current = true;
    console.log("DailyIframe component mounted, URL:", url);
    
    const loadDailyScript = async () => {
      if (!isMountedRef.current) return;
      
      if (window.DailyIframe) {
        console.log("Daily.co script already loaded");
        scriptLoadedRef.current = true;
        initializeDaily();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@daily-co/daily-js';
      script.async = true;
      script.crossOrigin = 'anonymous';
      
      script.onload = async () => {
        console.log("Daily.co script loaded successfully");
        if (isMountedRef.current) {
          scriptLoadedRef.current = true;
          await initializeDaily();
        }
      };
      
      script.onerror = () => {
        console.error("Failed to load Daily.co script");
        if (isMountedRef.current) {
          toast.error("Failed to load video call service");
          setLoading(false);
        }
      };
      
      document.body.appendChild(script);
    };
    
    loadDailyScript();
    
    // Clean up on unmount
    return () => {
      console.log("DailyIframe component unmounting");
      isMountedRef.current = false;
      
      if (frameRef.current) {
        try {
          frameRef.current.destroy();
          frameRef.current = null;
        } catch (e) {
          console.error("Error destroying Daily frame:", e);
        }
      }
    };
  }, [url]);
  
  // Create the Daily iframe
  const initializeDaily = async () => {
    if (!isMountedRef.current || !window.DailyIframe) return;
    
    // Skip device enumeration and permission check
    // Instead, we'll let Daily.co handle permissions when joining
    
    try {
      // Check if we already have a frame instance for this URL
      const existingFrame = document.querySelector('iframe[src*="daily.co"]');
      if (existingFrame && frameRef.current) {
        console.log("Reusing existing Daily frame");
        setLoading(false);
        
        // Pass call object to parent
        if (onCallObjectReady) {
          onCallObjectReady(frameRef.current);
        }
        return;
      }
      
      // Destroy any existing frame to prevent duplicates
      if (frameRef.current) {
        try {
          frameRef.current.destroy();
          frameRef.current = null;
        } catch (e) {
          console.error("Error destroying previous Daily frame:", e);
        }
      }
      
      // Create Daily frame with embedded UI
      const callFrame = window.DailyIframe.createFrame(containerRef.current, {
        url: url,
        showLeaveButton: true,
        showFullscreenButton: true,
        iframeStyle: {
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: '0',
        },
        userName: user?.user_metadata?.username || 'Anonymous',
        // Use Daily.co's embedded UI
        customTrayButtons: {
          chat: {
            label: 'Chat',
            tooltip: 'Toggle chat',
            iconPath: CHAT_ICON_URL,
          },
        },
      });
      
      // Store the call frame reference
      frameRef.current = callFrame;
      
      callFrame.on('loaded', () => {
        if (isMountedRef.current) console.log('Daily iframe loaded');
      });
      
      callFrame.on('joining-meeting', () => {
        if (isMountedRef.current) console.log('Joining meeting...');
      });
      
      callFrame.on('joined-meeting', () => {
        if (isMountedRef.current) {
          console.log('Successfully joined meeting!');
          setLoading(false);
          
          // Pass call object to parent
          if (onCallObjectReady) {
            onCallObjectReady(callFrame);
          }
        }
      });
      
      callFrame.on('camera-error', (event: any) => {
        console.error('Camera error:', event);
        if (isMountedRef.current) {
          toast.error(`Camera error: ${event?.errorMsg || 'Unknown error'}`);
        }
      });
      
      callFrame.on('error', (error: any) => {
        console.error('Daily.co error:', error);
        if (isMountedRef.current) {
          toast.error(`Video call error: ${error?.errorMsg || 'Unknown error'}`);
        }
      });
      
      // Set initial audio based on host status
      if (!isHost) {
        callFrame.setLocalAudio(false);
      }
      
      console.log("Joining call with options:", {
        url: url,
        showLeaveButton: true,
        showFullscreenButton: true,
        startVideoOff: false,
        startAudioOff: !isHost,
      });
      
      // Join the call
      callFrame.join();
      
    } catch (error: any) {
      console.error("Error in Daily.co initialization:", error);
      if (isMountedRef.current) {
        toast.error(`Failed to initialize video call: ${error.message || 'Unknown error'}`);
        setLoading(false);
      }
    }
  };
  
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
});

export default DailyIframe;

