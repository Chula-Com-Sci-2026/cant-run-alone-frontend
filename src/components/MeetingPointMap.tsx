import PinchZoomOnly from './PinchZoomOnly'
import PlainMapLayer from './PlainMapLayer'
import { MapContainer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const pinIcon = L.divIcon({ className: 'run-marker', html: '<span>⚡</span>', iconSize: [38, 38], iconAnchor: [19, 38] })

function Picker({ position, onChange }: { position: [number, number]; onChange: (latitude: number, longitude: number) => void }) {
  useMapEvents({ click: (event) => onChange(event.latlng.lat, event.latlng.lng) })
  return <Marker position={position} icon={pinIcon} />
}

// Without onChange the pin only shows where a place is, e.g. a run's exact meeting point once joined.
export default function MeetingPointMap({ latitude, longitude, onChange, hint = 'Click the map to move the meeting pin. Use +/− or pinch to zoom.' }: { latitude: number; longitude: number; onChange?: (latitude: number, longitude: number) => void; hint?: string }) {
  const position: [number, number] = [latitude, longitude]
  return <div className="meeting-picker"><MapContainer center={position} zoom={onChange ? 15 : 16} scrollWheelZoom={Boolean(onChange)} className="map"><PinchZoomOnly /><PlainMapLayer />{onChange ? <Picker position={position} onChange={onChange} /> : <Marker position={position} icon={pinIcon} />}</MapContainer>{hint && <p>{hint}</p>}</div>
}
