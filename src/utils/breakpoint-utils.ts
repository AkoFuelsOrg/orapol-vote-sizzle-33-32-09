
/**
 * This utility file helps with converting breakpoint-related code to the proper TypeScript types
 * 
 * Use these functions to patch any component that uses useBreakpoint incorrectly
 */

import { useBreakpoint, BreakpointType } from '../hooks/use-mobile';

/**
 * Helper hook to safely get breakpoint type for any file that directly compares with string values
 */
export const useBreakpointCompat = () => {
  const result = useBreakpoint();
  return result;
};

/**
 * Helper function to safely check if the current breakpoint is a specific type
 * @param breakpointState breakpoint state from useBreakpoint hook
 * @param check breakpoint type to check for
 */
export const isBreakpoint = (breakpointState: ReturnType<typeof useBreakpoint>, check: BreakpointType) => {
  return breakpointState.breakpoint === check;
};

/**
 * Helper function to get the breakpoint property directly
 * @returns the current breakpoint type string
 */
export const getBreakpoint = (): BreakpointType => {
  const { breakpoint } = useBreakpoint();
  return breakpoint;
};

/**
 * Helper function to check if the current breakpoint is mobile
 */
export const useIsMobileBreakpoint = (): boolean => {
  const { breakpoint } = useBreakpoint();
  return breakpoint === "mobile";
};

/**
 * Helper function to check if the current breakpoint is desktop
 */
export const useIsDesktopBreakpoint = (): boolean => {
  const { breakpoint } = useBreakpoint();
  return breakpoint === "desktop";
};

/**
 * Helper function to check if the current breakpoint is tablet
 */
export const useIsTabletBreakpoint = (): boolean => {
  const { breakpoint } = useBreakpoint();
  return breakpoint === "tablet";
};

/**
 * Apply this function to fix the breakpoint state in any components
 * directly comparing useBreakpoint() result with a string
 */
export const fixBreakpointComparison = (component: React.FC): React.FC => {
  // This is just a utility type function, it doesn't actually transform the component
  // It's meant to be used as documentation
  return component;
};
