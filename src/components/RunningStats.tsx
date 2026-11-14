import { Card } from './ui'
import { km, minutes, pace } from './running'

// Totals only, so the same panel serves my own Activity and another runner's profile, where
// Reputation shares the totals but never the individual runs.
export default function RunningStats({ runs, distanceMeters, durationSeconds }: { runs: number; distanceMeters: number; durationSeconds: number }) {
  return <Card className="history-summary">
    <div><small>Distance</small><strong>{km(distanceMeters)}<span> km</span></strong></div>
    <div><small>Time</small><strong>{minutes(durationSeconds)}</strong></div>
    <div><small>Runs</small><strong>{runs}</strong></div>
    <div><small>Avg pace</small><strong>{pace(distanceMeters, durationSeconds)}<span> /km</span></strong></div>
  </Card>
}
