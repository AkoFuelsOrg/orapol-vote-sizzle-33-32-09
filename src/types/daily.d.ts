
// Global type definitions for Daily.co

declare global {
  interface Window {
    DailyIframe?: {
      createCallObject: (options: any) => any;
      createFrame: (container: HTMLElement, options: any) => any;
    }
  }
}

export {};
