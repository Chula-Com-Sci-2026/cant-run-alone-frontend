import PlainMapLayer from './PlainMapLayer'
import { MapContainer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const pinIcon = L.divIcon({ className: 'run-marker', html: '<span>⚡</span>', iconSize: [38, 38], iconAnchor: [19, 38] })

function Picker({ position, onChange }: { position: [number, number]; onChange: (latitude: number, longitude: number) => void }) {
  useMapEvents({ click: (event) => onChange(event.latlng.lat, event.latlng.lng) })
  return <Marker position={position} icon={pinIcon} />
}

export default function MeetingPointMap({ latitude, longitude, onChange }: { latitude: number; longitude: number; onChange: (latitude: number, longitude: number) => void }) {
  return <div className="meeting-picker"><MapContainer center={[latitude, longitude]} zoom={15} scrollWheelZoom className="map"><PlainMapLayer /><Picker position={[latitude, longitude]} onChange={onChange} /></MapContainer><p>Click the map to move the meeting pin. Use +/− or scroll to zoom.</p></div>
}
