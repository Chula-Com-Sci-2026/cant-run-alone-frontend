import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Run } from '../types'

const icon = L.divIcon({ className: 'run-marker', html: '<span>⚡</span>', iconSize: [38, 38], iconAnchor: [19, 38] })
export default function RunMap({ runs }: { runs: Run[] }) {
  return <div className="map-wrap"><MapContainer center={[13.735, 100.545]} zoom={13} scrollWheelZoom className="map"><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />{runs.map((run) => <Marker key={run.id} position={[run.latitude, run.longitude]} icon={icon}><Popup><strong>{run.title}</strong><br />{run.time} · {run.distanceKm} km<br /><Link to={`/runs/${run.id}`}>View details</Link></Popup></Marker>)}</MapContainer><div className="map-note">Meeting points are public. Runner home locations are never shown.</div></div>
}
