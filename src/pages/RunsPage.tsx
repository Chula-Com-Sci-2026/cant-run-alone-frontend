import { lazy, Suspense, useState } from 'react'
import { CalendarDays, List, LocateFixed, Map, MapPin, Plus, Route } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useUpcomingRuns } from '../api/hooks'
import { Button, Card, EmptyState, LoadingCards, WeatherStrip } from '../components/ui'
const RunMap = lazy(() => import('../components/RunMap'))

export default function RunsPage() {
  const { data = [], isPending } = useUpcomingRuns(); const [view, setView] = useState<'list' | 'map'>('list')
  return <div className="page"><header className="page-title"><div><span className="kicker">SHOW UP TOGETHER</span><h1>Runs around Bangkok</h1><p>Public meeting points, compatible paces, weather checked.</p></div><div className="header-actions"><Link to="/nearby"><Button variant="secondary"><LocateFixed size={18} /> Who's nearby?</Button></Link><Link to="/runs/new"><Button><Plus size={18} /> Create a run</Button></Link></div></header>
    <div className="view-toggle"><button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}><List size={17} /> List</button><button className={view === 'map' ? 'active' : ''} onClick={() => setView('map')}><Map size={17} /> Map</button></div>
    {isPending ? <LoadingCards /> : view === 'map' ? <Suspense fallback={<div className="map-placeholder">Loading map…</div>}><RunMap runs={data} /></Suspense> : data.length === 0 ? <EmptyState icon={<CalendarDays />} title="No upcoming runs yet" text="Be the first to set one up and invite a buddy." action={<Link to="/runs/new"><Button>Create a run</Button></Link>} /> : <div className="run-list">{data.map((run) => <Link to={`/runs/${run.id}`} key={run.id}><Card className="run-row"><div className="date-tile"><strong>{new Date(`${run.date}T00:00:00`).getDate()}</strong><span>{new Date(`${run.date}T00:00:00`).toLocaleString('en', { month: 'short' }).toUpperCase()}</span></div><div className="run-row__body"><div><h3>{run.title}</h3><p><MapPin size={15} /> {run.meetingPoint} · {run.area}</p></div><div className="run-meta"><span><CalendarDays size={16} /> {run.time} ICT</span><span><Route size={16} /> {run.distanceKm} km · {run.pace}</span><span>{run.participants}/{run.participantLimit} runners</span></div><WeatherStrip weather={run.weather} /></div></Card></Link>)}</div>}
  </div>
}
