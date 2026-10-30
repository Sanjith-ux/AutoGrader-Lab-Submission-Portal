import { useCallback, useEffect, useRef } from 'react'

export default function useReviewPanel(selectedId) {
  const panelRef = useRef(null)
  const revealPanel = useCallback(() => {
    const panel = panelRef.current
    if (!panel) return
    panel.focus({ preventScroll: true })
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  // Wait for React to mount/update the selected record's panel before focusing it.
  useEffect(() => {
    if (selectedId) revealPanel()
  }, [selectedId, revealPanel])

  return { panelRef, revealPanel }
}
