import type { ReactNode } from 'react'
import { CalendarDays, Footprints, UserCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { gateway } from '../api/gateway'
import type { BuddyRequest } from '../api/gateway'
import { hasStarted, useBuddies, useBuddyRequests, useMe, useRunnersById } from '../api/hooks'
import type { Run } from '../types'
import { Avatar, Status } from './ui'

type Item = { key: string; buddyId: string; at: Date; upcoming: boolean; text: ReactNode; link?: string; tag?: ReactNode }

const runStart = (run: Run) => new Date(run.startsAt ?? `${run.date}T${run.time}:00+07:00`)
const runLabel = (run: Run) => `${runStart(run).toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' })} · ${run.time}`

// What can be said about buddies from data the services already share: runs they organise (every run
// names its organizer), runs I share with them (participant ids of runs I joined), and when we became
// buddies. Their own running records are private to Reputation, so they never appear here.
function buddyActivity(myId: string, buddies: string[], runs: Run[], requests: BuddyRequest[], names: Record<string, string>): Item[] {
  const name = (id: string) => names[id] ?? 'Your buddy'
  const items: Item[] = []
  for (const run of runs) {
    const upcoming = !hasStarted(run)
    const going = buddies.filter((id) => run.participantIds?.includes(id) && id !== run.organizerId)
    if (run.organizerId && buddies.includes(run.organizerId) && upcoming) {
      items.push({ key: `organises-${run.id}`, buddyId: run.organizerId, at: runStart(run), upcoming, link: `/runs/${run.id}`,
        text: <><strong>{name(run.organizerId)}</strong> is organising <strong>{run.title}</strong> · {runLabel(run)}</>,
        tag: run.joined ? <Status tone="success">You're going</Status> : <Status tone="warning">Join?</Status> })
    }
    for (const id of run.joined ? going : []) {
      items.push({ key: `with-${run.id}-${id}`, buddyId: id, at: runStart(run), upcoming, link: `/runs/${run.id}`,
        text: upcoming ? <><strong>{name(id)}</strong> is also going to <strong>{run.title}</strong> · {runLabel(run)}</>
          : <>You ran <strong>{run.title}</strong> with <strong>{name(id)}</strong> · {runLabel(run)}</>,
        tag: !upcoming && run.confirmedIds?.includes(id) ? <Status tone="success">Attended</Status> : undefined })
    }
  }
  // One "you became buddies" line per buddy, from the newest accepted request between us.
  const seen = new Set<string>()
  for (const request of [...requests].filter((r) => r.status === 'accepted').sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))) {
    const other = request.senderId === myId ? request.recipientId : request.senderId
    if (seen.has(other) || !request.updatedAt) continue
    seen.add(other)
    items.push({ key: `buddies-${other}`, buddyId: other, at: new Date(request.updatedAt), upcoming: false, link: `/discover/${other}`,
      text: <>You and <strong>{name(other)}</strong> became running buddies</> })
  }
  // Coming up first (soonest first), then what already happened (newest first).
  return items.sort((a, b) => Number(b.upcoming) - Number(a.upcoming) || (a.upcoming ? a.at.getTime() - b.at.getTime() : b.at.getTime() - a.at.getTime()))
}

export default function BuddyActivity({ limit }: { limit?: number }) {
  const me = useMe(); const buddies = useBuddies(); const requests = useBuddyRequests()
  const runs = useQuery({ queryKey: ['runs'], queryFn: gateway.getRuns })
  const ids = buddies.data ?? []
  const profiles = useRunnersById(ids)
  if (!me.data || !buddies.data || !runs.data) return null
  const names = Object.fromEntries(ids.map((id, index) => [id, profiles[index].data?.name ?? 'Your buddy']))
  const items = buddyActivity(me.data.id, ids, runs.data, requests.data ?? [], names)
  if (ids.length === 0) return <p className="section-empty">No buddies yet. <Link to="/discover">Find a runner</Link> at your pace and send a buddy request; their runs will show up here.</p>
  const shown = limit ? items.slice(0, limit) : items
  return <div className="buddy-activity">
    {shown.length === 0 && <p className="section-empty">Your buddies have nothing planned right now. <Link to="/runs/new">Create a run</Link> and invite them.</p>}
    {shown.map((item) => {
      const index = ids.indexOf(item.buddyId)
      const runner = { id: item.buddyId, name: profiles[index]?.data?.name ?? '?', photoUrl: profiles[index]?.data?.photoUrl ?? null }
      const icon = item.key.startsWith('buddies') ? <UserCheck size={15} /> : item.upcoming ? <CalendarDays size={15} /> : <Footprints size={15} />
      const body = <><Avatar runner={runner} /><span className="buddy-activity__text"><span>{icon}</span><p>{item.text}</p></span>{item.tag}</>
      return item.link ? <Link key={item.key} className="buddy-activity__item" to={item.link}>{body}</Link> : <div key={item.key} className="buddy-activity__item">{body}</div>
    })}
    {!limit && <p className="buddy-activity__note">Your buddies' personal running logs stay private. You see the runs they organise, the runs you share, and when you connected.</p>}
  </div>
}
