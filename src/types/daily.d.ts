// Global type definitions for Daily.co

declare module '@daily-co/daily-js' {
  export default DailyIframe;

  export interface DailyEventObject {
    action: string;
    [key: string]: any;
  }
  
  export interface DailyParticipant {
    session_id: string;
    user_id?: string;
    user_name?: string;
    video: boolean;
    audio: boolean;
    screen: boolean;
    local: boolean;
  }

  class DailyIframe {
    static createCallObject(options?: any): DailyCall;
    
    static wrap(iframe: HTMLIFrameElement): DailyCall;
    
    static createFrame(container: HTMLElement | null, options?: any): DailyCall;
  }
  
  interface DailyCall {
    join(options?: any): Promise<void>;
    leave(): Promise<void>;
    destroy(): void;
    
    iframe(): HTMLIFrameElement | null;
    meetingState(): string;
    participants(): Record<string, DailyParticipant>;
    
    startScreenShare(): Promise<void>;
    stopScreenShare(): Promise<void>;
    
    setLocalAudio(enabled: boolean): void;
    setLocalVideo(enabled: boolean): void;
    
    localAudio(): boolean;
    localVideo(): boolean;
    
    on(event: string, callback: (event?: any) => void): void;
    off(event: string, callback: (event?: any) => void): void;
    
    // Other methods that might be needed
    [key: string]: any;
  }
}

// For global window access (legacy support)
declare global {
  interface Window {
    DailyIframe?: {
      createCallObject: (options: any) => any;
      createFrame: (container: HTMLElement, options: any) => any;
    }
  }
}

export {};
