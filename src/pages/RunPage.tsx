import { ArrowLeft, CalendarDays, Flag, MapPin, Route, ShieldCheck, Users } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { hasEnded, hasStarted, useFinishRun, useRun, useToggleRun } from '../api/hooks'
import { Button, Card, LoadingCards, WeatherStrip } from '../components/ui'
import { InviteBuddies, InvitedBanner, RunParticipants } from '../components/RunPeople'
import type { Run } from '../types'
const MeetingPointMap = lazy(() => import('../components/MeetingPointMap'))

// Offers only what Run Scheduling will accept: nobody joins or leaves once a run has started, and the
// organizer stays with their run. Once it has started, the organizer can finish it early so everyone
// can confirm attendance, rate and log the run without waiting out the hour.
function RunMembership({ run }: { run: Run }) {
  const toggle = useToggleRun()
  const finish = useFinishRun()
  const started = hasStarted(run)
  if (started && run.organizer === 'You' && !hasEnded(run)) return <Card className="join-card"><div><Flag /><h3>Your run is underway</h3><p>Finish it when everyone is back. Runners can then confirm attendance, rate each other and log the run on Activity.</p>{finish.error && <p role="alert">{finish.error.message || 'That didn’t work. Please try again.'}</p>}</div><Button disabled={finish.isPending} onClick={() => finish.mutate(run.id)}>{finish.isPending ? 'Finishing…' : 'Finish run'}</Button></Card>
  if (started) return <Card className="join-card"><div><ShieldCheck /><h3>This run has started</h3><p>{!run.joined ? 'Joining and leaving are closed.' : hasEnded(run) ? 'Joining and leaving are closed. Confirm attendance, rate your buddy and log your run on Activity.' : 'Joining and leaving are closed. Attendance, ratings and logging open on Activity once the organizer finishes the run.'}</p></div>{run.joined && <Link to="/activity"><Button variant="secondary">Go to Activity</Button></Link>}</Card>
  if (run.organizer === 'You') return <Card className="join-card"><div><ShieldCheck /><h3>You’re organizing this run</h3><p>Organizers stay with their run. Changes and important weather updates will appear here.</p></div></Card>
  return <Card className="join-card"><div><ShieldCheck /><h3>Ready to run?</h3><p>Changes and important weather updates will appear here.</p>{toggle.error && <p role="alert">{toggle.error.message || 'That didn’t work. Please try again.'}</p>}</div><Button variant={run.joined ? 'secondary' : 'primary'} disabled={toggle.isPending} onClick={() => toggle.mutate({ id: run.id, join: !run.joined })}>{toggle.isPending ? 'Updating…' : run.joined ? 'Leave run' : 'Join run'}</Button></Card>
}

export default function RunPage() {
  const { id = '' } = useParams(); const { data: run, isPending } = useRun(id)
  const [params] = useSearchParams()
  const invitedBy = params.get('invitedBy')
  if (isPending || !run) return <div className="page"><LoadingCards /></div>
  // Inviting makes sense while the run can still be joined, by someone already going.
  const canInvite = !hasStarted(run) && (run.joined || run.organizer === 'You')
  return <div className="page narrow"><Link className="back" to="/runs"><ArrowLeft size={17} /> Back to runs</Link><header className="run-detail"><span className="kicker">{run.visibility.toUpperCase()} RUN</span><h1>{run.title}</h1><p>Organized by {run.organizer}</p></header>
    {invitedBy && !run.joined && <InvitedBanner inviterId={invitedBy} />}
    <WeatherStrip weather={run.weather} /><div className="detail-grid"><Card><CalendarDays /><small>WHEN</small><strong>{new Date(`${run.date}T00:00:00`).toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}</strong><span>{run.time} ICT</span></Card><Card><Route /><small>RUN PLAN</small><strong>{run.distanceKm} km</strong><span>{run.pace} min/km</span></Card><Card><Users /><small>RUNNERS</small><strong>{run.participants} of {run.participantLimit}</strong><span>{run.participantLimit - run.participants} places left</span></Card></div>
    <Card className="meeting-card"><div className="meeting-map"><MapPin size={28} /></div><div><small>PUBLIC MEETING POINT</small><h2>{run.meetingPoint}</h2><p>{run.area && run.area !== run.meetingPoint && `${run.area} · `}{run.joined ? 'Exact pin shared with joined runners only.' : 'Join this run to see the exact pin.'}</p>
      {run.joined && <a className="text-link" href={`https://www.google.com/maps/search/?api=1&query=${run.latitude},${run.longitude}`} target="_blank" rel="noreferrer">Open in Google Maps</a>}</div>
      {/* Scheduling sends the exact coordinates only to participants; before joining they are rounded to ~1 km. */}
      {run.joined && <div className="meeting-card__pin"><Suspense fallback={<div className="map-placeholder">Opening map…</div>}><MeetingPointMap latitude={run.latitude} longitude={run.longitude} hint="" /></Suspense></div>}</Card>
    <RunMembership run={run} />
    <RunParticipants run={run} />
    {canInvite && <InviteBuddies run={run} justCreated={params.get('created') === '1'} />}
  </div>
}
