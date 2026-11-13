import { ArrowLeft, CalendarClock, MapPin, ShieldCheck, Star, UserCheck } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useState } from 'react'
import { useAnswerBuddyRequest, useBuddies, useBuddyRequest, useBuddyRequests, useCancelBuddyRequest, useMe, useRatingSummary, useRunner, useUpcomingRuns } from '../api/hooks'
import { ApiError } from '../api/gateway'
import { Avatar, Button, Card, LoadingCards, Status } from '../components/ui'
import { RunLine } from '../components/people'
import { buddyStatus, paceLabel } from '../components/runner'
import type { Runner } from '../types'

// What I can do with this runner depends on where we stand: a request goes out once, and buddies see
// each other's runs instead of a request form.
function BuddyBox({ runner }: { runner: Runner }) {
  const me = useMe(); const requests = useBuddyRequests(); const buddies = useBuddies(); const runs = useUpcomingRuns()
  const send = useBuddyRequest(); const cancel = useCancelBuddyRequest(); const answer = useAnswerBuddyRequest()
  const [note, setNote] = useState('Hi! Our pace and schedule look like a good match. Want to plan a run?')
  if (!me.data || !requests.data || !buddies.data) return <Card className="request-box"><p>{me.isError || requests.isError || buddies.isError ? 'Buddy status could not load. Check that you are signed in and the services are running.' : 'Checking your buddy status…'}</p></Card>
  if (me.data.id === runner.id) return <Card className="request-box"><div><ShieldCheck size={24} /><h2>This is you</h2><p>This is how other runners see your card.</p></div></Card>
  const status = buddyStatus(runner.id, me.data.id, requests.data, buddies.data)
  const busy = send.isPending || cancel.isPending || answer.isPending
  const failure = send.error ?? cancel.error ?? answer.error

  if (status.kind === 'buddies') {
    const theirRuns = (runs.data ?? []).filter((run) => run.organizerId === runner.id)
    return <Card className="buddy-box">
      <div className="buddy-box__head"><UserCheck size={24} /><div><h2>You and {runner.name} are running buddies</h2><p>Runs {runner.name} organises show up here and on your Activity page.</p></div><Status tone="success">Buddies</Status></div>
      {theirRuns.length ? <div className="run-lines">{theirRuns.map((run) => <RunLine key={run.id} run={run}>{run.joined && <Status tone="success">Joined</Status>}</RunLine>)}</div>
        : <p className="section-empty">{runner.name} has no upcoming runs. <Link to="/runs/new">Create one</Link> and invite them.</p>}
    </Card>
  }
  if (status.kind === 'sent') return <Card className="request-box"><div><ShieldCheck size={24} /><h2>Request sent</h2><p>Waiting for {runner.name} to answer. You'll see their answer on Activity.</p>{status.request.note && <blockquote className="request-note">{status.request.note}</blockquote>}</div>
    {failure && <p role="alert">{failure.message}</p>}<Button variant="secondary" disabled={busy} onClick={() => cancel.mutate(status.request.id)}>{cancel.isPending ? 'Cancelling…' : 'Cancel request'}</Button></Card>
  if (status.kind === 'received') return <Card className="request-box"><div><ShieldCheck size={24} /><h2>{runner.name} wants to run with you</h2><p>Accept to see each other's runs and invite each other.</p>{status.request.note && <blockquote className="request-note">{status.request.note}</blockquote>}</div>
    {failure && <p role="alert">{failure.message}</p>}<div className="button-row"><Button variant="secondary" disabled={busy} onClick={() => answer.mutate({ id: status.request.id, decision: 'rejected' })}>Decline</Button><Button disabled={busy} onClick={() => answer.mutate({ id: status.request.id, decision: 'accepted' })}>Accept request</Button></div></Card>

  // A 409 means the gateway found a request or friendship this screen had not loaded yet; the refetch
  // that follows every send shows it, so only other failures are worth a message.
  const sendFailure = send.error instanceof ApiError && send.error.status === 409 ? null : send.error
  return <Card className="request-box"><div><ShieldCheck size={24} /><h2>Run better together</h2><p>Your exact locations stay private. Share a public meeting point only when a run is confirmed.</p></div><label>Short note<textarea value={note} maxLength={180} onChange={(e) => setNote(e.target.value)} /></label>
    {sendFailure && <p role="alert">{sendFailure.message}</p>}<Button disabled={busy} onClick={() => send.mutate({ runnerId: runner.id, note })}>{send.isPending ? 'Sending…' : 'Send buddy request'}</Button></Card>
}

// Reputation keeps the average hidden until three ratings exist, so a newer runner shows the count.
function Reputation({ runner }: { runner: Runner }) {
  const { data: summary } = useRatingSummary(runner.id)
  const rating = summary?.rating ?? runner.rating
  const text = rating ? 'From verified runs' : summary?.count ? `${summary.count} of 3 reviews so far` : 'Rating appears after 3 reviews'
  return <Card><Star /><small>REPUTATION</small><strong>{rating ? `${rating} / 5` : 'New runner'}</strong><span>{text}</span></Card>
}

export default function RunnerPage() {
  const { id = '' } = useParams(); const { data: runner, isPending } = useRunner(id)
  if (isPending || !runner) return <div className="page"><LoadingCards /></div>
  return <div className="page narrow"><Link className="back" to="/discover"><ArrowLeft size={17} /> Back to discovery</Link><Card className="profile-hero"><Avatar runner={runner} large /><div><h1>{runner.name}</h1>{runner.bio && <p>{runner.bio}</p>}</div></Card>
    <div className="profile-facts"><Card><MapPin /><small>AREA</small><strong>{runner.area}</strong><span>Approximate area{runner.distanceKm !== undefined && ` · ${runner.distanceKm} km away`}</span></Card><Card><CalendarClock /><small>USUAL TIME</small><strong>{runner.availability ?? 'Not shared'}</strong><span>{paceLabel(runner.paceMin, runner.paceMax) ? `${paceLabel(runner.paceMin, runner.paceMax)} min/km` : 'Pace not shared'}</span></Card><Reputation runner={runner} /></div>
    <BuddyBox runner={runner} />
  </div>
}
