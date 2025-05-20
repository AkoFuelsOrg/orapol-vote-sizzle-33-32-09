
/**
 * This utility file helps with converting breakpoint-related code to the proper TypeScript types
 * 
 * Use these functions to patch any component that uses useBreakpoint incorrectly
 */

import { useBreakpoint } from '../hooks/use-mobile';

/**
 * Helper hook to safely get breakpoint type for any file that directly compares with string values
 */
export const useBreakpointCompat = () => {
  const result = useBreakpoint();
  return result;
};

/**
 * Helper function to safely check if the current breakpoint is a specific type
 * @param check breakpoint type to check for
 */
export const isBreakpoint = (breakpointState: ReturnType<typeof useBreakpoint>, check: "mobile" | "tablet" | "desktop") => {
  return breakpointState.breakpoint === check;
};
