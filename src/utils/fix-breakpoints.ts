
/**
 * This is a utility type to correctly handle breakpoints throughout the application
 * Any component that compares breakpoint directly to a string value should use this pattern:
 * 
 * Before:
 *   const breakpoint = useBreakpoint();
 *   if (breakpoint === "mobile") { ... }
 * 
 * After:
 *   const { breakpoint } = useBreakpoint();
 *   if (breakpoint === "mobile") { ... }
 * 
 * This ensures correct TypeScript typing
 */

// This file doesn't need to be run as actual code, it just documents the fix
// being applied to all components with TypeScript errors
