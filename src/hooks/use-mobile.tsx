import * as React from "react"

const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = React.useState<"mobile" | "tablet" | "desktop" | undefined>(
    undefined
  )

  React.useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      if (width < MOBILE_BREAKPOINT) {
        setBreakpoint("mobile")
      } else if (width < TABLET_BREAKPOINT) {
        setBreakpoint("tablet")
      } else {
        setBreakpoint("desktop")
      }
    }

    const mobileQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const tabletQuery = window.matchMedia(
      `(min-width: ${MOBILE_BREAKPOINT}px) and (max-width: ${TABLET_BREAKPOINT - 1}px)`
    )

    updateBreakpoint()
    window.addEventListener("resize", updateBreakpoint)

    return () => {
      window.removeEventListener("resize", updateBreakpoint)
    }
  }, [])

  return breakpoint
}

export function useOnClickOutside(ref: React.RefObject<HTMLElement>, handler: (event: MouseEvent | TouchEvent) => void) {
  React.useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}
