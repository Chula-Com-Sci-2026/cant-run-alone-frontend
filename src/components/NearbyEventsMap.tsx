import PinchZoomOnly from './PinchZoomOnly'
import PlainMapLayer from './PlainMapLayer'
import { Circle, MapContainer, Marker, Popup, useMap } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import L from 'leaflet'
import type { Coordinates } from '../hooks/useCurrentLocation'
import type { Run } from '../types'
import 'leaflet/dist/leaflet.css'

const eventIcon = L.divIcon({ className: 'run-marker', html: '<span>⚡</span>', iconSize: [38, 38], iconAnchor: [19, 38] })
const meIcon = L.divIcon({ className: 'me-marker', html: '<span></span>', iconSize: [24, 24], iconAnchor: [12, 12] })

// Re-centres only when the location really moves (Recenter, a new fix). The map opens already
// centred, and a fly animation on open read as the map shaking.
function FollowLocation({ coordinates }: { coordinates: Coordinates }) {
  const map = useMap()
  const { latitude, longitude } = coordinates
  useEffect(() => {
    if (!map.getCenter().equals([latitude, longitude], 1e-5)) map.setView([latitude, longitude], 15, { animate: true })
  }, [latitude, longitude, map])
  return null
}

export default function NearbyEventsMap({ coordinates, runs, distances }: { coordinates: Coordinates; runs: Run[]; distances: Record<string, number> }) {
  return <div className="map-wrap nearby-map"><MapContainer center={[coordinates.latitude, coordinates.longitude]} zoom={15} scrollWheelZoom className="map"><PinchZoomOnly /><FollowLocation coordinates={coordinates} /><PlainMapLayer /><Circle center={[coordinates.latitude, coordinates.longitude]} radius={1000} pathOptions={{ color: '#176b4d', fillColor: '#c8ff3d', fillOpacity: 0.08, weight: 2 }} /><Marker position={[coordinates.latitude, coordinates.longitude]} icon={meIcon}><Popup><strong>You are here</strong><br />Location is visible only to you.</Popup></Marker>{runs.map((run) => <Marker key={run.id} position={[run.latitude, run.longitude]} icon={eventIcon}><Popup><strong>{run.title}</strong><br />{Math.round(distances[run.id] * 1000)} m away · {run.time}<br /><Link to={`/runs/${run.id}`}>View run details</Link></Popup></Marker>)}</MapContainer><div className="map-legend"><span><i className="legend-me" /> You</span><span><i className="legend-run" /> Running event</span><span>Circle = 1 km</span></div></div>
}
