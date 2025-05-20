// This file is no longer needed as we've replaced Daily.co with Jitsi Meet
// We'll keep this empty for backward compatibility in case any imports still reference it
import { useState } from 'react';

export type DailyCallState = 'idle' | 'creating' | 'joining' | 'joined' | 'left' | 'error';

interface UseDailyProps {
  roomUrl?: string;
  token?: string;
  userName?: string;
  isHost?: boolean;
}

// This is just a stub - we've replaced Daily with Jitsi
export const useDaily = () => {
  console.warn('useDaily hook is deprecated. Please use Jitsi Meet implementation instead.');
  return {
    callObject: null,
    callState: 'idle' as DailyCallState,
    participants: [],
    startCamera: () => {},
    stopCamera: () => {},
    startScreenShare: () => {},
    stopScreenShare: () => {},
    joinCall: () => {},
    leaveCall: () => {},
    toggleAudio: () => {},
    toggleVideo: () => {},
    isAudioEnabled: false,
    isVideoEnabled: false,
    isSharingScreen: false,
    error: null
  };
};
