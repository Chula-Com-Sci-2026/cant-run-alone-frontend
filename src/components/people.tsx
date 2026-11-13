import type { ReactNode } from 'react'
import { ArrowRight, CalendarDays } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { UseQueryResult } from '@tanstack/react-query'
import type { Run, Runner } from '../types'
import { Avatar, Status } from './ui'
import { paceLabel } from './runner'

// One runner as a compact row: avatar, name and a short fact, linking to their profile. A profile that
// is hidden or no longer exists still takes its place in a list, as "Private runner".
export function PersonRow({ id, profile, me, buddy, extra }: { id: string; profile: UseQueryResult<Runner>; me?: boolean; buddy?: boolean; extra?: ReactNode }) {
  const runner = profile.data
  const name = me ? 'You' : runner?.name ?? (profile.isError ? 'Private runner' : 'Loading…')
  const pace = runner ? paceLabel(runner.paceMin, runner.paceMax) : null
  const facts = runner ? [runner.experience, pace && `${pace} min/km`].filter(Boolean).join(' · ') : ''
  const who = <><Avatar runner={{ id, name: runner?.name ?? '?', photoUrl: runner?.photoUrl ?? null }} />
    <span className="person-row__text"><strong>{name}</strong>{facts && <small>{facts}</small>}</span></>
  // Your own row and a private profile have nowhere useful to go. Tags stay outside the link, since
  // they can hold buttons.
  return <div className="person-row">
    {me || !runner ? <span className="person-row__who">{who}</span> : <Link className="person-row__who person-row__who--link" to={`/discover/${id}`}>{who}</Link>}
    <span className="person-row__tags">{buddy && <Status tone="success">Buddy</Status>}{extra}</span>
  </div>
}

// A run as one line with its date, for lists inside other sections.
export function RunLine({ run, children }: { run: Run; children?: ReactNode }) {
  return <Link className="run-line" to={`/runs/${run.id}`}>
    <CalendarDays size={17} />
    <span><strong>{run.title}</strong><small>{new Date(`${run.date}T00:00:00`).toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' })} · {run.time} ICT · {run.distanceKm} km · {run.meetingPoint}</small></span>
    {children}<ArrowRight size={16} />
  </Link>
}
