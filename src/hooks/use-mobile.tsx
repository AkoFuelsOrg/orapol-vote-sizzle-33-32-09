
import { useState, useEffect } from 'react';

export type BreakpointType = "mobile" | "tablet" | "desktop";

export interface BreakpointState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export const useBreakpoint = (): BreakpointState & { breakpoint: BreakpointType } => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Add a breakpoint string to make comparisons easier
  const breakpoint: BreakpointType = isMobile ? "mobile" : isTablet ? "tablet" : "desktop";
  
  return { isMobile, isTablet, isDesktop, breakpoint };
};

// For backward compatibility with components using the old format
export const useIsMobile = (): boolean => {
  const { isMobile } = useBreakpoint();
  return isMobile;
};
