import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    mql.addEventListener("change", onChange)

    // Avoid triggering setState directly in the effect body
    // by running initial update via the event loop.
    const initial = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    initial()

    return () => mql.removeEventListener("change", onChange)
  }, [])


  return !!isMobile
}
