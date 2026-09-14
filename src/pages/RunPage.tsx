import { ArrowLeft, CalendarDays, MapPin, Route, ShieldCheck, Users } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useRun, useToggleRun } from '../api/hooks'
import { Button, Card, LoadingCards, WeatherStrip } from '../components/ui'

export default function RunPage() {
  const { id = '' } = useParams(); const { data: run, isPending } = useRun(id); const toggle = useToggleRun()
  if (isPending || !run) return <div className="page"><LoadingCards /></div>
  return <div className="page narrow"><Link className="back" to="/runs"><ArrowLeft size={17} /> Back to runs</Link><header className="run-detail"><span className="kicker">{run.visibility.toUpperCase()} RUN</span><h1>{run.title}</h1><p>Organized by {run.organizer}</p></header>
    <WeatherStrip weather={run.weather} /><div className="detail-grid"><Card><CalendarDays /><small>WHEN</small><strong>{new Date(`${run.date}T00:00:00`).toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}</strong><span>{run.time} ICT</span></Card><Card><Route /><small>RUN PLAN</small><strong>{run.distanceKm} km</strong><span>{run.pace} min/km</span></Card><Card><Users /><small>RUNNERS</small><strong>{run.participants} of {run.participantLimit}</strong><span>{run.participantLimit - run.participants} places left</span></Card></div>
    <Card className="meeting-card"><div className="meeting-map"><MapPin size={28} /></div><div><small>PUBLIC MEETING POINT</small><h2>{run.meetingPoint}</h2><p>{run.area} · The exact meeting point is shared because you joined this run.</p></div></Card>
    <Card className="join-card"><div><ShieldCheck /><h3>Ready to run?</h3><p>Changes and important weather updates will appear here.</p></div><Button variant={run.joined ? 'secondary' : 'primary'} disabled={toggle.isPending} onClick={() => toggle.mutate({ id: run.id, join: !run.joined })}>{toggle.isPending ? 'Updating…' : run.joined ? 'Leave run' : 'Join run'}</Button></Card>
  </div>
}
