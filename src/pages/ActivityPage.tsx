import type { ReactNode } from 'react'
import { useState } from 'react'
import { Check } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, gateway } from '../api/gateway'
import type { BuddyRequest, Notification, RunningRecord } from '../api/gateway'
import { Avatar, Button, Card, Status } from '../components/ui'
import type { Run } from '../types'

type Feedback = { tone: 'success' | 'danger'; text: string }

// Reputation rejects a second rating of the same buddy for the same run with 422 "...has already been taken".
const isAlreadyRated = (failure: unknown) => failure instanceof ApiError && failure.status === 422 && /taken/i.test(failure.message)

function Step({ number, title, done, children }: { number: number; title: string; done: boolean; children: ReactNode }) {
  return <div className={`run-step ${done ? 'run-step--done' : ''}`}>
    <span className="run-step__marker" aria-hidden="true">{done ? <Check size={14} /> : number}</span>
    <div className="run-step__body"><h4>{title}{done && <span className="visually-hidden"> (done)</span>}</h4>{children}</div>
  </div>
}

function RateBuddy({ id, rated, busy, onRate }: { id: string; rated: boolean; busy: boolean; onRate: (name: string) => void }) {
  const { data: buddy } = useQuery({ queryKey: ['runner', id], queryFn: () => gateway.getRunner(id), staleTime: 300_000, retry: false })
  const name = buddy?.name ?? 'buddy'
  if (rated) return <Status tone="success"><Check size={13} /> Rated {name}</Status>
  return <Button variant="secondary" disabled={busy} onClick={() => onRate(name)}>Rate {name}</Button>
}

// Requests and notifications carry only runner ids; the name and avatar come from Profile.
function useRunnerName(id: string) {
  const { data } = useQuery({ queryKey: ['runner', id], queryFn: () => gateway.getRunner(id), staleTime: 300_000, retry: false, enabled: Boolean(id) })
  return { name: data?.name ?? 'A runner', runner: { id, name: data?.name ?? '?', photoUrl: data?.photoUrl ?? null } }
}

function BuddyRequestRow({ request, myId }: { request: BuddyRequest; myId: string }) {
  const client = useQueryClient()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const incoming = request.recipientId === myId
  const { name, runner } = useRunnerName(incoming ? request.senderId : request.recipientId)
  const respond = async (decision: 'accepted' | 'rejected') => {
    setBusy(true)
    setError('')
    try { await gateway.respondToBuddyRequest(request.id, decision); await client.invalidateQueries() } catch (failure) { setError((failure as { message?: string }).message ?? 'Could not answer this request.') } finally { setBusy(false) }
  }
  const sentence = request.status === 'accepted' ? <>You and <strong>{name}</strong> are running buddies</>
    : request.status === 'rejected' ? (incoming ? <>You declined <strong>{name}</strong></> : <><strong>{name}</strong> declined your request</>)
    : incoming ? <><strong>{name}</strong> wants to run with you</> : <>Waiting for <strong>{name}</strong> to answer</>
  const chip = request.status === 'accepted' ? <Status tone="success">Buddies</Status>
    : request.status === 'rejected' ? <Status tone="neutral">Declined</Status>
    : incoming ? <Status tone="warning">Needs your answer</Status> : <Status tone="neutral">Sent</Status>
  return <Card className="activity-person">
    <Avatar runner={runner} />
    <div className="activity-person__text"><p>{sentence}</p>{chip}{error && <p role="alert" className="run-feedback run-feedback--danger">{error}</p>}</div>
    {incoming && request.status === 'pending' && <div className="activity-person__actions"><Button disabled={busy} onClick={() => void respond('accepted')}>Accept request</Button><Button variant="secondary" disabled={busy} onClick={() => void respond('rejected')}>Decline</Button></div>}
  </Card>
}

function NotificationRow({ item, busy, onRead }: { item: Notification; busy: boolean; onRead: () => void }) {
  // BuddyRequestSent goes to the recipient (the other runner is the sender); BuddyRequestAnswered goes to the sender.
  const sent = item.type === 'BuddyRequestSent'
  const { name, runner } = useRunnerName(sent ? item.data.senderId : item.data.recipientId)
  const text = sent ? <><strong>{name}</strong> sent you a buddy request</> : <><strong>{name}</strong> {item.data.status === 'accepted' ? 'accepted' : 'declined'} your buddy request</>
  return <Card className={`activity-person ${item.readAt ? '' : 'activity-person--unread'}`}>
    <Avatar runner={runner} />
    <div className="activity-person__text"><p>{text}</p><small>{new Date(item.occurredAt).toLocaleString('en', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</small></div>
    {!item.readAt && <div className="activity-person__actions"><Button variant="secondary" disabled={busy} onClick={onRead}>Mark read</Button></div>}
  </Card>
}

function PastRunCard({ run, myId, record }: { run: Run; myId: string; record?: RunningRecord }) {
  const client = useQueryClient()
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [score, setScore] = useState(5)
  const [rated, setRated] = useState<string[]>([])
  const [distance, setDistance] = useState(String(run.distanceKm * 1000))
  const [duration, setDuration] = useState('1800')
  const confirmed = run.confirmedIds?.includes(myId) ?? false
  const completed = run.status === 'completed'
  const unlocked = confirmed && completed
  const buddies = (run.confirmedIds ?? []).filter((id) => id !== myId)

  const act = async (operation: () => Promise<unknown>, success: string, onFailure?: (failure: unknown) => Feedback | null) => {
    setBusy(true)
    setFeedback(null)
    try {
      await operation()
      await client.invalidateQueries()
      setFeedback({ tone: 'success', text: success })
    } catch (failure) {
      setFeedback(onFailure?.(failure) ?? { tone: 'danger', text: (failure as { message?: string }).message ?? 'Could not complete this action.' })
    } finally { setBusy(false) }
  }
  const rate = (id: string, name: string) => act(async () => { await gateway.rateParticipant(run.id, id, score); setRated((list) => [...list, id]) }, `Rated ${name} ${score} out of 5.`,
    (failure) => { if (!isAlreadyRated(failure)) return null; setRated((list) => [...list, id]); return { tone: 'success', text: `You already rated ${name} for this run.` } })

  const done = unlocked && Boolean(record)
  const steps = <>
    <Step number={1} title="Confirm attendance" done={confirmed}>
      {confirmed
        ? <p>{completed ? 'You and your buddy both confirmed. The run is complete.' : 'You confirmed. Waiting for your buddy to confirm too.'}</p>
        : <><p>Confirm you showed up so you can rate your buddy and log your run.</p><Button disabled={busy} onClick={() => void act(() => gateway.confirmAttendance(run.id), 'Attendance confirmed.')}>Confirm attendance</Button></>}
    </Step>

    <Step number={2} title="Rate your buddy" done={unlocked && buddies.length > 0 && buddies.every((id) => rated.includes(id))}>
      {!unlocked ? <p>Opens once everyone has confirmed attendance.</p>
        : buddies.length === 0 ? <p>No other confirmed runners to rate.</p>
        : <div className="run-step__row"><label>Rating<select value={score} disabled={busy} onChange={(event) => setScore(Number(event.target.value))}>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} / 5</option>)}</select></label>
          {buddies.map((id) => <RateBuddy key={id} id={id} rated={rated.includes(id)} busy={busy} onRate={(name) => void rate(id, name)} />)}</div>}
    </Step>

    <Step number={3} title="Log your run" done={Boolean(record)}>
      {record ? <p>Logged {record.distance_meters / 1000} km in {Math.round(record.duration_seconds / 60)} minutes.</p>
        : !unlocked ? <p>Opens once everyone has confirmed attendance.</p>
        : <div className="run-step__row"><label>Distance (metres)<input type="number" min="1" value={distance} disabled={busy} onChange={(event) => setDistance(event.target.value)} /></label>
          <label>Duration (seconds)<input type="number" min="1" value={duration} disabled={busy} onChange={(event) => setDuration(event.target.value)} /></label>
          <Button disabled={busy} onClick={() => void act(() => gateway.logRecord(run.id, Number(distance), Number(duration)), 'Running record saved.')}>Save running record</Button></div>}
    </Step>
  </>

  return <Card className="activity-run">
    <header className="activity-run__header">
      <div><h3>{run.title}</h3><p>{new Date(`${run.date}T00:00:00`).toLocaleDateString('en', { day: 'numeric', month: 'short' })} · {run.time} ICT · {run.distanceKm} km</p></div>
      {done ? <Status tone="success">All done</Status> : <Status tone="warning">Action needed</Status>}
    </header>
    {/* A finished run stays folded so the runs that still need something are easy to find. */}
    {done ? <details className="activity-run__details"><summary>Show steps</summary>{steps}</details> : steps}

    {feedback && <p className={`run-feedback run-feedback--${feedback.tone}`} role={feedback.tone === 'danger' ? 'alert' : 'status'}>{feedback.text}</p>}
  </Card>
}

export default function ActivityPage() {
  const client = useQueryClient()
  const [now] = useState(() => Date.now())
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const requests = useQuery({ queryKey: ['requests'], queryFn: gateway.getBuddyRequests, refetchInterval: 5000 })
  const notifications = useQuery({ queryKey: ['notifications'], queryFn: gateway.getNotifications, refetchInterval: 5000 })
  const history = useQuery({ queryKey: ['history'], queryFn: gateway.getHistory })
  const runs = useQuery({ queryKey: ['runs'], queryFn: gateway.getRuns })
  const me = useQuery({ queryKey: ['me'], queryFn: gateway.getMyProfile })
  const act = async (operation: () => Promise<unknown>) => {
    setBusy(true)
    setMessage('')
    try { await operation(); await client.invalidateQueries() } catch (failure) { setMessage((failure as { message?: string }).message ?? 'Could not complete this action.') } finally { setBusy(false) }
  }
  const myId = me.data?.id ?? ''
  // Requests waiting for my answer first, then my pending ones, then answered ones.
  const requestRank = (request: BuddyRequest) => request.status !== 'pending' ? 2 : request.recipientId === myId ? 0 : 1
  // Once two runners are buddies, one row is enough however many accepted requests they have.
  const otherRunner = (request: BuddyRequest) => request.senderId === myId ? request.recipientId : request.senderId
  const orderedRequests = [...(requests.data ?? [])].sort((a, b) => requestRank(a) - requestRank(b) || a.id.localeCompare(b.id))
    .filter((request, index, list) => request.status !== 'accepted' || list.findIndex((other) => other.status === 'accepted' && otherRunner(other) === otherRunner(request)) === index)
  const recordFor = (runId: string) => history.data?.records.find((record) => record.run_id === runId)
  const pastRuns = (runs.data ?? []).filter((run) => run.joined && new Date(`${run.date}T${run.time}:00+07:00`).getTime() + 3600000 <= now)
  // Runs that still need something come first, then newest first. The id breaks ties so a card
  // never jumps when the runs list comes back in a different order after an action.
  const finished = (run: Run) => Boolean(run.confirmedIds?.includes(myId) && run.status === 'completed' && recordFor(run.id))
  const orderedRuns = [...pastRuns].sort((a, b) => Number(finished(a)) - Number(finished(b))
    || `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`) || a.id.localeCompare(b.id))

  return <div className="page narrow activity-page"><header className="page-title"><div><span className="kicker">KEEP YOUR MOMENTUM</span><h1>Your activity</h1><p>Catch up with your buddies and celebrate every run.</p></div></header>{message && <p role="alert">{message}</p>}
    {[requests, notifications, history, runs, me].some(query => query.isError) && <p role="alert">Some activity could not load. Check that you are signed in and the services are running.</p>}
    <h2>Buddy requests</h2>{requests.data?.length === 0 && <p>No requests yet. Find a runner on Discover to send one.</p>}
    {me.data && orderedRequests.map(request => <BuddyRequestRow key={request.id} request={request} myId={myId} />)}
    {/* Only when there is something to read; an empty inbox adds nothing to this page. */}
    {!!notifications.data?.items.length && <><h2>Notifications</h2>
      {notifications.data.items.map(item => <NotificationRow key={item.id} item={item} busy={busy} onRead={() => void act(() => gateway.markNotificationRead(item.id))} />)}</>}
    <h2>After your run</h2>{runs.isSuccess && orderedRuns.length === 0 && <p>No finished runs yet.</p>}
    {me.data && orderedRuns.map(run => <PastRunCard key={run.id} run={run} myId={myId} record={recordFor(run.id)} />)}
    {/* Like notifications, only once a run is logged; "0 km · 0 minutes" says nothing. */}
    {!!history.data?.records.length && <><h2>Running history</h2><p>{history.data.totalDistanceMeters / 1000} km · {Math.round(history.data.totalDurationSeconds / 60)} minutes</p>{history.data.records.map(record => <Card className="activity-record" key={record.id}><p>{record.distance_meters / 1000} km in {Math.round(record.duration_seconds / 60)} minutes · {new Date(record.occurred_at).toLocaleDateString()}</p></Card>)}</>}
  </div>
}
