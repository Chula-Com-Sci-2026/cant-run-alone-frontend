import type { BuddyRequest } from '../api/gateway'

// Profile sends only the name; the initials are worked out here.
export function initials(name: string) { return name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase() }

// Pace is decimal minutes per km (6.5 = 6:30); null when the runner hides it.
export function paceLabel(paceMin: number | null, paceMax: number | null) {
  if (paceMin === null || paceMax === null) return null
  const clock = (minutes: number) => { const seconds = Math.round(minutes * 60); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` }
  return `${clock(paceMin)}–${clock(paceMax)}`
}


export type BuddyStatus = { kind: 'buddies' } | { kind: 'sent' | 'received'; request: BuddyRequest } | { kind: 'none' }

// Where I stand with another runner, in either direction. Discovery only refuses a duplicate while the
// first request is pending, so the screens decide from this instead of offering "Send" again.
export function buddyStatus(runnerId: string, myId: string, requests: BuddyRequest[], buddies: string[]): BuddyStatus {
  const between = requests.filter((request) => (request.senderId === myId && request.recipientId === runnerId) || (request.senderId === runnerId && request.recipientId === myId))
  if (buddies.includes(runnerId) || between.some((request) => request.status === 'accepted')) return { kind: 'buddies' }
  const pending = between.find((request) => request.status === 'pending')
  if (pending) return { kind: pending.senderId === myId ? 'sent' : 'received', request: pending }
  return { kind: 'none' }
}
