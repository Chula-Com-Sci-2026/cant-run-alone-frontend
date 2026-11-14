import { useState } from 'react'
import { Check, Link2, Send, UserPlus, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useBuddies, useMe, useRunner, useRunnersById } from '../api/hooks'
import type { Run } from '../types'
import { PersonRow } from './people'
import { Button, Card, Status } from './ui'

// Who organises and who has joined. Run Scheduling shares participant ids only with runners who joined,
// so everyone else sees the organizer and a head count.
export function RunParticipants({ run }: { run: Run }) {
  const me = useMe(); const buddies = useBuddies()
  const myId = me.data?.id
  const organizerId = run.organizerId ?? ''
  const organizer = useRunner(organizerId)
  const others = (run.participantIds ?? []).filter((id) => id !== organizerId)
  const profiles = useRunnersById(others)
  const isBuddy = (id: string) => buddies.data?.includes(id) ?? false
  const confirmed = (id: string) => run.status === 'completed' || run.confirmedIds?.includes(id) ? <Status tone="success"><Check size={12} /> Attended</Status> : null
  const showAttendance = (run.confirmedIds?.length ?? 0) > 0
  return <Card className="run-people">
    <h2><Users size={20} /> Who's running</h2>
    {organizerId && <PersonRow id={organizerId} profile={organizer} me={organizerId === myId || run.organizer === 'You'} buddy={isBuddy(organizerId)} extra={<Status tone="neutral">Organizer</Status>} />}
    {run.participantIds
      ? others.map((id, index) => <PersonRow key={id} id={id} profile={profiles[index]} me={id === myId} buddy={isBuddy(id)} extra={showAttendance ? confirmed(id) : null} />)
      : <p className="section-empty">{run.participants} {run.participants === 1 ? 'runner has' : 'runners have'} joined. Join this run to see who's coming.</p>}
  </Card>
}

function readInvited(runId: string): string[] {
  try { return JSON.parse(window.localStorage.getItem(`invited:${runId}`) ?? '[]') as string[] } catch { return [] }
}
function rememberInvited(runId: string, ids: string[]) {
  try { window.localStorage.setItem(`invited:${runId}`, JSON.stringify(ids)) } catch { /* private mode: the tick just won't survive a reload */ }
}

// There is no invitation endpoint yet (Notification only handles buddy-request events), so an invite is
// a link to this run, shared through the phone's share sheet or copied for any chat app.
function invitationLink(run: Run, myId?: string) {
  return `${window.location.origin}/runs/${run.id}${myId ? `?invitedBy=${myId}` : ''}`
}
async function shareInvitation(run: Run, myId?: string) {
  const url = invitationLink(run, myId)
  const text = `Join me for ${run.title} on ${new Date(`${run.date}T00:00:00`).toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' })} at ${run.time}, ${run.meetingPoint}.`
  if (navigator.share) {
    try { await navigator.share({ title: run.title, text, url }); return 'shared' } catch (failure) { if ((failure as Error).name === 'AbortError') return 'cancelled' }
  }
  await navigator.clipboard.writeText(`${text} ${url}`)
  return 'copied'
}

export function InviteBuddies({ run, justCreated }: { run: Run; justCreated: boolean }) {
  const me = useMe(); const buddies = useBuddies()
  const ids = buddies.data ?? []
  const profiles = useRunnersById(ids)
  const [invited, setInvited] = useState(() => readInvited(run.id))
  const [message, setMessage] = useState('')
  const invite = async (id?: string) => {
    setMessage('')
    try {
      const result = await shareInvitation(run, me.data?.id)
      if (result === 'cancelled') return
      if (id) { const next = [...new Set([...invited, id])]; setInvited(next); rememberInvited(run.id, next) }
      setMessage(result === 'copied' ? 'Invitation link copied. Paste it into your chat with them.' : 'Invitation shared.')
    } catch { setMessage(`Copy this link instead: ${invitationLink(run, me.data?.id)}`) }
  }
  return <Card className="run-people invite-buddies">
    <h2><UserPlus size={20} /> {justCreated ? 'Run created! Invite your buddies' : 'Invite your buddies'}</h2>
    <p>Each invitation is a link to this run. Your buddy opens it, signs in and taps Join.</p>
    {buddies.isSuccess && ids.length === 0 && <p className="section-empty">No buddies yet. <Link to="/discover">Find a runner</Link> and send a buddy request, or copy the link below.</p>}
    {ids.map((id, index) => {
      const joined = run.participantIds?.includes(id)
      const action = joined ? <Status tone="success"><Check size={12} /> Joined</Status>
        : <Button variant="secondary" onClick={() => void invite(id)}>{invited.includes(id) ? <><Check size={14} /> Invited · send again</> : <><Send size={14} /> Invite</>}</Button>
      return <PersonRow key={id} id={id} profile={profiles[index]} buddy extra={action} />
    })}
    <div className="button-row invite-buddies__copy"><Button variant="ghost" onClick={() => void invite()}><Link2 size={15} /> Copy invite link</Button></div>
    {message && <p role="status" className="run-feedback run-feedback--success">{message}</p>}
  </Card>
}

// Shown to someone who opened an invitation link.
export function InvitedBanner({ inviterId }: { inviterId: string }) {
  const inviter = useRunner(inviterId)
  if (!inviter.data) return null
  return <Card className="invited-banner"><UserPlus size={20} /><p><strong>{inviter.data.name}</strong> invited you to this run.</p></Card>
}
