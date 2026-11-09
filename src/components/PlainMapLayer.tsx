import { TileLayer } from 'react-leaflet'

// The map wrapper's tile provider (ADR 0011): OpenStreetMap's standard tiles. Fine for the demo; the
// public tile server's usage policy rules out heavy traffic, so production needs its own provider,
// which is a change to this file only. Leaflet draws the tiles itself, so they move and zoom in step
// with the markers.
//
// OSM serves 256 px tiles at 1x only, so a Retina screen stretched them 2x and they looked blurry.
// detectRetina makes Leaflet fetch the next zoom level at half size on such screens: sharp, at the
// cost of about 4x tile requests, smaller labels and one fewer zoom level (18). 1x screens are unchanged.
export default function PlainMapLayer() {
  return <TileLayer
    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
    maxZoom={19}
    detectRetina
    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  />
}
