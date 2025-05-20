
import { useBreakpoint, BreakpointType } from '../hooks/use-mobile';

/**
 * Fixed breakpoint hook that returns just the breakpoint string
 * This helps fixing type errors in multiple components
 */
export function useFixedBreakpoint(): BreakpointType {
  const { breakpoint } = useBreakpoint();
  return breakpoint;
}

/**
 * Simple hook to check if current breakpoint is mobile
 */
export function useIsMobileBreakpoint(): boolean {
  const breakpoint = useFixedBreakpoint();
  return breakpoint === "mobile";
}

/**
 * Simple hook to check if current breakpoint is tablet
 */
export function useIsTabletBreakpoint(): boolean {
  const breakpoint = useFixedBreakpoint();
  return breakpoint === "tablet";
}

/**
 * Simple hook to check if current breakpoint is desktop
 */
export function useIsDesktopBreakpoint(): boolean {
  const breakpoint = useFixedBreakpoint();
  return breakpoint === "desktop";
}

/**
 * Helper to check equality with current breakpoint
 * @param current - The breakpoint to check against
 * @param toCompare - The breakpoint value to compare with
 * @returns boolean indicating if they are equal
 */
export function compareBreakpoint(current: ReturnType<typeof useBreakpoint>, toCompare: BreakpointType): boolean {
  return current.breakpoint === toCompare;
}
