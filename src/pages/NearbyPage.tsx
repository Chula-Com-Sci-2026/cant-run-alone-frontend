import { lazy, Suspense, useMemo } from 'react'
import { ArrowLeft, Crosshair, LocateFixed, MapPin, Navigation, Route } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useRuns } from '../api/hooks'
import { Button, Card, EmptyState } from '../components/ui'
import { distanceKm, useCurrentLocation } from '../hooks/useCurrentLocation'
const NearbyEventsMap = lazy(() => import('../components/NearbyEventsMap'))

export default function NearbyPage() {
  const location = useCurrentLocation(); const { data: runs = [] } = useRuns()
  const distances = useMemo(() => location.coordinates ? Object.fromEntries(runs.map((run) => [run.id, distanceKm(location.coordinates!, { latitude: run.latitude, longitude: run.longitude })])) : {}, [location.coordinates, runs])
  const nearby = runs.filter((run) => distances[run.id] <= 1)
  return <div className="page"><Link className="back" to="/runs"><ArrowLeft size={17} /> Back to runs</Link><header className="page-title nearby-title"><div><span className="kicker">LIVE LOCAL DISCOVERY</span><h1>Who's nearby?</h1><p>Running events within 1 km of your current location.</p></div>{location.status === 'ready' && <Button variant="secondary" onClick={location.locate}><Crosshair size={17} /> Recenter</Button>}</header>
    {location.status === 'loading' && <Card className="location-prompt"><div className="location-radar"><LocateFixed /></div><div><h2>Finding your location…</h2><p>Your browser may ask for permission. Your live position stays on this device and is never shown to other runners.</p></div></Card>}
    {(location.status === 'denied' || location.status === 'unavailable') && <EmptyState icon={<Navigation />} title="We need your location" text={`${location.message} Enable location access and retry, or explore with a demo position near Lumphini Park.`} action={<div className="button-row"><Button variant="secondary" onClick={location.locate}>Try again</Button><Button onClick={location.useDemoLocation}>Use demo location</Button></div>} />}
    {location.coordinates && <div className="nearby-layout"><Suspense fallback={<div className="map-placeholder">Opening the nearby map…</div>}><NearbyEventsMap coordinates={location.coordinates} runs={nearby} distances={distances} /></Suspense><aside className="nearby-results"><div className="nearby-summary"><strong>{nearby.length}</strong><span>events within 1 km</span></div>{location.message && <p className="demo-location-note">{location.message}</p>}{nearby.length ? nearby.sort((a, b) => distances[a.id] - distances[b.id]).map((run) => <Link to={`/runs/${run.id}`} key={run.id}><Card className="nearby-run-card"><div><h3>{run.title}</h3><p><MapPin size={14} /> {run.meetingPoint}</p></div><strong>{Math.round(distances[run.id] * 1000)} m</strong><div className="run-meta"><span><Route size={15} /> {run.distanceKm} km</span><span>{run.time} ICT</span><span>{run.participants}/{run.participantLimit} runners</span></div></Card></Link>) : <EmptyState icon={<MapPin />} title="No events inside 1 km" text="Move around or browse all Bangkok events. The map still shows your search area." action={<Link to="/runs"><Button variant="secondary">Browse all runs</Button></Link>} />}</aside></div>}
  </div>
}
