import { TileLayer } from 'react-leaflet'

// The map wrapper's tile provider (ADR 0011): OpenStreetMap's standard tiles. Fine for the demo; the
// public tile server's usage policy rules out heavy traffic, so production needs its own provider,
// which is a change to this file only. Leaflet draws the tiles itself, so they move and zoom in step
// with the markers.
export default function PlainMapLayer() {
  return <TileLayer
    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
    maxZoom={19}
    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  />
}
