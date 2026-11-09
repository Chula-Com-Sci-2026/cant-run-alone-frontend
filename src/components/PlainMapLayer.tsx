import { TileLayer } from 'react-leaflet'

// The map wrapper's tile provider (ADR 0011). Esri's Light Gray Canvas base has no labels or points
// of interest, so streets, parks and water read at a glance and pins stand out, and it needs no API
// key. Leaflet draws the tiles itself, so they move and zoom in step with the markers.
export default function PlainMapLayer() {
  return <TileLayer
    url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
    maxZoom={18}
    maxNativeZoom={16}
    attribution='Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors'
  />
}
