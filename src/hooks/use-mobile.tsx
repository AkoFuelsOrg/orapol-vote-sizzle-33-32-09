
import { useState, useEffect } from 'react';

export type BreakpointType = "mobile" | "tablet" | "desktop";

export interface BreakpointState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: BreakpointType;
}

export const useBreakpoint = (): BreakpointState => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [breakpoint, setBreakpoint] = useState<BreakpointType>(
    window.innerWidth < 768 ? "mobile" : 
    window.innerWidth < 1024 ? "tablet" : "desktop"
  );

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setIsDesktop(width >= 1024);
      
      setBreakpoint(
        width < 768 ? "mobile" : 
        width < 1024 ? "tablet" : "desktop"
      );
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return { isMobile, isTablet, isDesktop, breakpoint };
};

// For backward compatibility with components using the old format
export const useIsMobile = (): boolean => {
  const { isMobile } = useBreakpoint();
  return isMobile;
};
