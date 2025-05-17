
// Type definitions for Daily.co iframe API
interface Window {
  DailyIframe?: {
    createCallObject: (options: any) => any;
    createFrame: (options: any) => any;
  }
}

declare namespace Daily {
  interface CallObject {
    join: (options?: JoinOptions) => Promise<void>;
    leave: () => Promise<void>;
    destroy: () => void;
    participants: () => Record<string, Participant>;
    setLocalAudio: (enabled: boolean) => void;
    setLocalVideo: (enabled: boolean) => void;
    on: (event: string, callback: any) => void;
    sendAppMessage: (data: any, to: string) => void;
  }

  interface JoinOptions {
    url: string;
    token?: string;
    userName?: string;
    showLeaveButton?: boolean;
    startVideoOff?: boolean;
    startAudioOff?: boolean;
  }

  interface Participant {
    user_id: string;
    user_name?: string;
    local: boolean;
    session_id: string;
    video: boolean;
    audio: boolean;
  }
}
