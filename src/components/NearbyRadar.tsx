import { Link } from 'react-router-dom'
import { useMe, useUpcomingRuns } from '../api/hooks'
import type { Coordinates } from '../hooks/useCurrentLocation'
import { distanceKm } from '../hooks/useCurrentLocation'

const RADIUS_KM = 1

// Where a run sits on the scope: kilometres east and north of the centre as a share of the 1 km outer
// ring, so each blip points the same way as the run does on the map.
function blipPosition(from: Coordinates, to: Coordinates) {
  const east = (to.longitude - from.longitude) * 111.32 * Math.cos(from.latitude * Math.PI / 180)
  const north = (to.latitude - from.latitude) * 110.57
  return { left: `${50 + (east / RADIUS_KM) * 46}%`, top: `${50 - (north / RADIUS_KM) * 46}%` }
}

// Home's way into Who's nearby. It counts upcoming runs within 1 km of the runner's own area pin,
// which needs no location permission; the Nearby page itself then uses the live position.
export default function NearbyRadar() {
  const { data: me } = useMe()
  const { data: runs = [] } = useUpcomingRuns()
  const nearby = me ? runs.filter((run) => distanceKm(me, run) <= RADIUS_KM) : []
  const label = !me ? 'Runs around you' : nearby.length === 0 ? 'No runs within 1 km yet' : `${nearby.length} ${nearby.length === 1 ? 'run' : 'runs'} within 1 km`
  return <Link className="nearby-radar" to="/nearby" aria-label={`Who's nearby? ${label}`}>
    <div className="nearby-radar__scope" aria-hidden>
      <span className="nearby-radar__sweep" />
      {me && nearby.map((run) => <i key={run.id} className="nearby-radar__blip" style={blipPosition(me, run)} />)}
      <span className="nearby-radar__you" />
    </div>
    <div className="nearby-radar__label"><span><i className="live-dot" /> LIVE</span><strong>{label}</strong>{me && <small>around {me.area}</small>}</div>
  </Link>
}
