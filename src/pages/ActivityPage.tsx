import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { gateway } from '../api/gateway'
import { Button, Card } from '../components/ui'

function RateBuddyButton({ id, busy, onRate }: { id: string; busy: boolean; onRate: () => void }) {
  const { data: buddy } = useQuery({ queryKey: ['runner', id], queryFn: () => gateway.getRunner(id), staleTime: 300_000, retry: false })
  return <Button disabled={busy} onClick={onRate}>Rate {buddy?.name ?? 'buddy'}</Button>
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
  const [scores, setScores] = useState<Record<string, number>>({})
  const [records, setRecords] = useState<Record<string, { distance: string; duration: string }>>({})
  const act = async (operation: () => Promise<unknown>) => {
    setBusy(true)
    setMessage('')
    try { await operation(); await client.invalidateQueries(); setMessage('Saved successfully.') } catch (failure) { setMessage((failure as { message?: string }).message ?? 'Could not complete this action.') } finally { setBusy(false) }
  }
  return <div className="page narrow activity-page"><header className="page-title"><div><span className="kicker">KEEP YOUR MOMENTUM</span><h1>Your activity</h1><p>Catch up with your buddies and celebrate every run.</p></div></header>{message && <p role="status">{message}</p>}
    {[requests, notifications, history, runs, me].some(query => query.isError) && <p role="alert">Some activity could not load. Check that you are signed in and the services are running.</p>}
    <h2>Buddy requests</h2>{requests.data?.length === 0 && <p>No requests yet.</p>}{requests.data?.map(request => <Card className="activity-request" key={request.id}><p>{request.senderId === me.data?.id ? 'Sent request' : 'Incoming request'} · {request.status}</p>{request.status === 'pending' && request.recipientId === me.data?.id && <><Button disabled={busy} onClick={() => void act(() => gateway.respondToBuddyRequest(request.id, 'accepted'))}>Accept request</Button><Button variant="secondary" disabled={busy} onClick={() => void act(() => gateway.respondToBuddyRequest(request.id, 'rejected'))}>Decline</Button></>}</Card>)}
    <h2>Notifications</h2>{notifications.data?.items.length === 0 && <p>No notifications yet.</p>}{notifications.data?.items.map(item => <Card className="activity-notification" key={item.id}><p>{item.type === 'BuddyRequestSent' ? 'You received a buddy request.' : `Your buddy request was ${item.data.status}.`}</p>{!item.readAt && <Button variant="secondary" disabled={busy} onClick={() => void act(() => gateway.markNotificationRead(item.id))}>Mark read</Button>}</Card>)}
    <h2>After your run</h2>{runs.data?.filter(run => run.joined && new Date(`${run.date}T${run.time}:00+07:00`).getTime() + 3600000 <= now).map(run => <Card className="activity-run" key={run.id}><h3>{run.title}</h3><p>Run status: {run.status}</p><Button disabled={busy} onClick={() => void act(() => gateway.confirmAttendance(run.id))}>Confirm attendance</Button>
      {run.status === 'completed' && run.confirmedIds?.includes(me.data?.id ?? '') && <><h4>Rate a confirmed buddy</h4><label>Rating (1–5)<select value={scores[run.id] ?? 5} onChange={event => setScores({ ...scores, [run.id]: Number(event.target.value) })}>{[1, 2, 3, 4, 5].map(score => <option key={score}>{score}</option>)}</select></label>{run.confirmedIds.filter(id => id !== me.data?.id).map(id => <RateBuddyButton key={id} id={id} busy={busy} onRate={() => void act(() => gateway.rateParticipant(run.id, id, scores[run.id] ?? 5))} />)}
      <h4>Log your running record</h4><label>Distance (metres)<input type="number" min="1" value={records[run.id]?.distance ?? String(run.distanceKm * 1000)} onChange={event => setRecords({ ...records, [run.id]: { distance: event.target.value, duration: records[run.id]?.duration ?? '1800' } })} /></label><label>Duration (seconds)<input type="number" min="1" value={records[run.id]?.duration ?? '1800'} onChange={event => setRecords({ ...records, [run.id]: { distance: records[run.id]?.distance ?? String(run.distanceKm * 1000), duration: event.target.value } })} /></label><Button disabled={busy} onClick={() => void act(() => gateway.logRecord(run.id, Number(records[run.id]?.distance ?? run.distanceKm * 1000), Number(records[run.id]?.duration ?? 1800)))}>Save running record</Button></>}
    </Card>)}
    <h2>Running history</h2><p>{(history.data?.totalDistanceMeters ?? 0) / 1000} km · {Math.round((history.data?.totalDurationSeconds ?? 0) / 60)} minutes</p>{history.data?.records.map(record => <Card className="activity-record" key={record.id}><p>{record.distance_meters / 1000} km in {Math.round(record.duration_seconds / 60)} minutes · {new Date(record.occurred_at).toLocaleDateString()}</p></Card>)}
  </div>
}
