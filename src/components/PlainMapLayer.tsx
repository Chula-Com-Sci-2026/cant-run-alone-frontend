import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import { Map as VectorMap } from 'maplibre-gl'
import { setWorkerUrl, type StyleSpecification } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'


setWorkerUrl(workerUrl)

// Keep geography readable without labels, POIs or traffic detail.
const style: StyleSpecification = {
  version: 8,
  sources: { geography: { type: 'vector', url: 'https://tiles.openfreemap.org/planet', attribution: '&copy; OpenStreetMap contributors · OpenFreeMap' } },
  layers: [
    { id: 'ground', type: 'background', paint: { 'background-color': '#ebe8df' } },
    { id: 'green', type: 'fill', source: 'geography', 'source-layer': 'landcover', paint: { 'fill-color': '#b2d49d' } },
    { id: 'parks', type: 'fill', source: 'geography', 'source-layer': 'park', paint: { 'fill-color': '#acd38d' } },
    { id: 'water', type: 'fill', source: 'geography', 'source-layer': 'water', paint: { 'fill-color': '#a7dff4' } },
    { id: 'buildings', type: 'fill', source: 'geography', 'source-layer': 'building', paint: { 'fill-color': '#d3d0c9' } },
    { id: 'roads', type: 'line', source: 'geography', 'source-layer': 'transportation', filter: ['!=', 'class', 'rail'], paint: { 'line-color': '#ffffff', 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 15, 5, 18, 18] }, layout: { 'line-cap': 'round', 'line-join': 'round' } },
  ],
}

export default function PlainMapLayer() {
  const map = useMap()
  useEffect(() => {
    const container = document.createElement('div')
    Object.assign(container.style, { position: 'absolute', inset: '0', zIndex: '0', pointerEvents: 'none' })
    map.getContainer().prepend(container)
    const center = map.getCenter()
    const renderer = new VectorMap({ container, style, center: [center.lng, center.lat], zoom: map.getZoom() - 1, interactive: false, attributionControl: false })
    const sync = () => {
      const position = map.getCenter()
      renderer.jumpTo({ center: [position.lng, position.lat], zoom: map.getZoom() - 1 })
    }
    const resize = () => { renderer.resize(); sync() }
    const observer = new ResizeObserver(resize)
    observer.observe(map.getContainer())
    map.on('move zoom', sync)
    const attribution = '&copy; OpenStreetMap contributors · OpenFreeMap'
    map.attributionControl?.addAttribution(attribution)
    return () => {
      observer.disconnect()
      map.off('move zoom', sync)
      map.attributionControl?.removeAttribution(attribution)
      renderer.remove()
      container.remove()
    }
  }, [map])
  return null
}
