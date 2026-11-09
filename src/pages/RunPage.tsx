import { ArrowLeft, CalendarDays, MapPin, Route, ShieldCheck, Users } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { hasStarted, useRun, useToggleRun } from '../api/hooks'
import { Button, Card, LoadingCards, WeatherStrip } from '../components/ui'
import type { Run } from '../types'

// Offers only what Run Scheduling will accept: nobody joins or leaves once a run has started, and the
// organizer stays with their run.
function RunMembership({ run }: { run: Run }) {
  const toggle = useToggleRun()
  const started = hasStarted(run)
  if (started) return <Card className="join-card"><div><ShieldCheck /><h3>This run has started</h3><p>{run.joined ? 'Joining and leaving are closed. Confirm attendance, rate your buddy and log your run on Activity.' : 'Joining and leaving are closed.'}</p></div>{run.joined && <Link to="/activity"><Button variant="secondary">Go to Activity</Button></Link>}</Card>
  if (run.organizer === 'You') return <Card className="join-card"><div><ShieldCheck /><h3>You’re organizing this run</h3><p>Organizers stay with their run. Changes and important weather updates will appear here.</p></div></Card>
  return <Card className="join-card"><div><ShieldCheck /><h3>Ready to run?</h3><p>Changes and important weather updates will appear here.</p>{toggle.error && <p role="alert">{toggle.error.message || 'That didn’t work. Please try again.'}</p>}</div><Button variant={run.joined ? 'secondary' : 'primary'} disabled={toggle.isPending} onClick={() => toggle.mutate({ id: run.id, join: !run.joined })}>{toggle.isPending ? 'Updating…' : run.joined ? 'Leave run' : 'Join run'}</Button></Card>
}

export default function RunPage() {
  const { id = '' } = useParams(); const { data: run, isPending } = useRun(id)
  if (isPending || !run) return <div className="page"><LoadingCards /></div>
  return <div className="page narrow"><Link className="back" to="/runs"><ArrowLeft size={17} /> Back to runs</Link><header className="run-detail"><span className="kicker">{run.visibility.toUpperCase()} RUN</span><h1>{run.title}</h1><p>Organized by {run.organizer}</p></header>
    <WeatherStrip weather={run.weather} /><div className="detail-grid"><Card><CalendarDays /><small>WHEN</small><strong>{new Date(`${run.date}T00:00:00`).toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}</strong><span>{run.time} ICT</span></Card><Card><Route /><small>RUN PLAN</small><strong>{run.distanceKm} km</strong><span>{run.pace} min/km</span></Card><Card><Users /><small>RUNNERS</small><strong>{run.participants} of {run.participantLimit}</strong><span>{run.participantLimit - run.participants} places left</span></Card></div>
    <Card className="meeting-card"><div className="meeting-map"><MapPin size={28} /></div><div><small>PUBLIC MEETING POINT</small><h2>{run.meetingPoint}</h2><p>{run.area} · {run.joined ? 'Exact pin available to joined runners.' : 'Join this run to see the exact pin.'}</p></div></Card>
    <RunMembership run={run} />
  </div>
}
