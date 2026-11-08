import { ArrowLeft, CalendarClock, MapPin, ShieldCheck, Star } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useState } from 'react'
import { useBuddyRequest, useRunner } from '../api/hooks'
import { Avatar, Button, Card, LoadingCards } from '../components/ui'
import { paceLabel } from '../components/runner'

export default function RunnerPage() {
  const { id = '' } = useParams(); const { data: runner, isPending } = useRunner(id); const request = useBuddyRequest(); const [note, setNote] = useState('Hi! Our pace and schedule look like a good match. Want to plan a run?')
  if (isPending || !runner) return <div className="page"><LoadingCards /></div>
  return <div className="page narrow"><Link className="back" to="/discover"><ArrowLeft size={17} /> Back to discovery</Link><Card className="profile-hero"><Avatar runner={runner} large /><div><h1>{runner.name}</h1>{runner.bio && <p>{runner.bio}</p>}</div></Card>
    <div className="profile-facts"><Card><MapPin /><small>AREA</small><strong>{runner.area}</strong><span>Approximate area{runner.distanceKm !== undefined && ` · ${runner.distanceKm} km away`}</span></Card><Card><CalendarClock /><small>USUAL TIME</small><strong>{runner.availability ?? 'Not shared'}</strong><span>{paceLabel(runner.paceMin, runner.paceMax) ? `${paceLabel(runner.paceMin, runner.paceMax)} min/km` : 'Pace not shared'}</span></Card><Card><Star /><small>REPUTATION</small><strong>{runner.rating ?? 'New runner'}</strong><span>{runner.rating ? 'From verified runs' : 'Rating appears after 3 reviews'}</span></Card></div>
    <Card className="request-box"><div><ShieldCheck size={24} /><h2>Run better together</h2><p>Your exact locations stay private. Share a public meeting point only when a run is confirmed.</p></div><label>Short note<textarea value={note} maxLength={180} onChange={(e) => setNote(e.target.value)} /></label><Button disabled={request.isPending || request.isSuccess} onClick={() => request.mutate({ runnerId: runner.id, note })}>{request.isSuccess ? 'Request sent ✓' : request.isPending ? 'Sending…' : 'Send buddy request'}</Button></Card>
  </div>
}
