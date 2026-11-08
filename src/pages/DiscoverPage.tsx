import { Search, SlidersHorizontal, UserRoundSearch } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useRunners } from '../api/hooks'
import { Button, EmptyState, LoadingCards, RunnerCard } from '../components/ui'
import type { RunnerFilters } from '../types'

export default function DiscoverPage() {
  const [filters, setFilters] = useState<RunnerFilters>({ radiusKm: 5, pace: 'Any', experience: 'All' })
  const { data = [], isPending } = useRunners(filters)
  return <div className="page"><header className="page-title"><div><span className="kicker">PACE · PLACE · TIME</span><h1>Find your running people</h1><p>Locations stay approximate until you join the same run.</p></div><div className="privacy-chip">Privacy-safe areas</div></header>
    <section className="filters" aria-label="Runner filters"><SlidersHorizontal size={19} /><label>Within<select value={filters.radiusKm} onChange={(e) => setFilters({ ...filters, radiusKm: Number(e.target.value) })}><option value="2">2 km</option><option value="5">5 km</option><option value="10">10 km</option></select></label><label>Experience<select value={filters.experience} onChange={(e) => setFilters({ ...filters, experience: e.target.value as RunnerFilters['experience'] })}><option>All</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label><Button variant="secondary"><Search size={17} /> Search</Button></section>
    <div className="result-count"><strong>{data.length} runners</strong><span>nearest first</span></div>
    {isPending ? <LoadingCards /> : data.length ? <div className="card-grid">{data.map((runner) => <RunnerCard key={runner.id} runner={runner} action={<Link to={`/discover/${runner.id}`}><Button className="wide" variant="secondary">View profile</Button></Link>} />)}</div> : <EmptyState icon={<UserRoundSearch />} title="No pace partners yet" text="Try widening the distance or showing all experience levels." action={<Button onClick={() => setFilters({ radiusKm: 10, pace: 'Any', experience: 'All' })}>Reset filters</Button>} />}
  </div>
}
