import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

// Lets a trackpad pinch zoom the map while two-finger scrolling still scrolls the page. Browsers
// report a pinch as a wheel event with ctrlKey set; any other wheel event is stopped on its way down
// (capture phase), before Leaflet's wheel zoom sees it, and is left to scroll the page. Use it with
// scrollWheelZoom on. Touch screens pinch and drag through Leaflet's own touch handling.
export default function PinchZoomOnly() {
  const map = useMap()
  useEffect(() => {
    // On the parent, so this capture listener runs before Leaflet's listener on the map in every browser.
    const parent = map.getContainer().parentElement
    if (!parent) return
    const keepScroll = (event: WheelEvent) => { if (!event.ctrlKey) event.stopPropagation() }
    parent.addEventListener('wheel', keepScroll, { capture: true })
    return () => parent.removeEventListener('wheel', keepScroll, { capture: true })
  }, [map])
  return null
}
