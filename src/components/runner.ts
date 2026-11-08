// Profile sends only the name; the initials are worked out here.
export function initials(name: string) { return name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase() }

// Pace is decimal minutes per km (6.5 = 6:30); null when the runner hides it.
export function paceLabel(paceMin: number | null, paceMax: number | null) {
  if (paceMin === null || paceMax === null) return null
  const clock = (minutes: number) => { const seconds = Math.round(minutes * 60); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` }
  return `${clock(paceMin)}–${clock(paceMax)}`
}

