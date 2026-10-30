import { useEffect, useId, useRef, useState } from 'react'

export default function TableScroll({ children, className = '', label }) {
  const viewportRef = useRef(null)
  const hintId = useId()
  const [hasOverflow, setHasOverflow] = useState(false)

  useEffect(() => {
    const viewport = viewportRef.current
    const observer = new ResizeObserver(() => {
      setHasOverflow(viewport.scrollWidth > viewport.clientWidth + 1)
    })
    observer.observe(viewport)
    if (viewport.firstElementChild) observer.observe(viewport.firstElementChild)
    return () => observer.disconnect()
  }, [children])

  return (
    <div className="table-region">
      {hasOverflow && <p className="table-scroll-hint" id={hintId}>Scroll horizontally to see all columns and actions.</p>}
      <div
        className={`table-scroll ${className}`}
        ref={viewportRef}
        role="region"
        aria-label={label}
        aria-describedby={hasOverflow ? hintId : undefined}
        tabIndex={hasOverflow ? 0 : undefined}
      >
        {children}
      </div>
    </div>
  )
}
