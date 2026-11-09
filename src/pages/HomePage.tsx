import { ArrowRight, CalendarDays, LocateFixed, MapPin, Route, Sparkles, Users } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { ApiError } from '../api/gateway'
import { useTranslation } from 'react-i18next'
import { useDashboard } from '../api/hooks'
import { Button, Card, EmptyState, LoadingCards, RunnerCard, WeatherStrip } from '../components/ui'

export default function HomePage() {
  const { t } = useTranslation()
  const { data, isPending, isError, error, refetch } = useDashboard()
  if (error instanceof ApiError && error.status === 401) return <Navigate to="/login" replace />
  if (isPending) return <Page><LoadingCards /></Page>
  if (isError || !data) return <Page><Card className="empty"><h3>Home couldn’t load.</h3><p>{error instanceof ApiError ? error.message : 'The request timed out or the service could not be reached. Please try again.'}</p><Button onClick={() => void refetch()}>Try again</Button></Card></Page>
  const run = data.nextRun
  return <Page>
    <header className="hero"><div><div className="eyebrow"><Sparkles size={15} /> {t('greeting')}, {data.greetingName}</div><h1>{t('findBuddy')}</h1><p>{t('subtitle')}</p><Link className="hero-nearby" to="/nearby"><LocateFixed size={17} /> Who's nearby? <span>Events within 1 km</span></Link></div><div className="weekly-stat"><small>RUN HISTORY</small><strong>{data.weeklyDistanceKm}</strong><span>km covered</span></div></header>
    <section className="section-heading"><div><span className="kicker">UP NEXT</span><h2>Your next run</h2></div><Link to="/runs">{t('seeAll')} <ArrowRight size={16} /></Link></section>
    {run ? <Card className="next-run">
      <div className="date-tile"><strong>{new Date(`${run.date}T00:00:00`).toLocaleDateString('en', { day: '2-digit' })}</strong><span>{new Date(`${run.date}T00:00:00`).toLocaleDateString('en', { month: 'short' }).toUpperCase()}</span></div>
      <div className="next-run__main"><div className="next-run__title"><div><h3>{run.title}</h3><p><MapPin size={15} /> {run.meetingPoint}, {run.area}</p></div><Link to={`/runs/${run.id}`}><Button>{t('viewRun')} <ArrowRight size={16} /></Button></Link></div>
        <div className="run-meta"><span><CalendarDays size={16} /> {run.time} ICT</span><span><Route size={16} /> {run.distanceKm} km · {run.pace} min/km</span><span>{run.participants}/{run.participantLimit} runners</span></div><WeatherStrip weather={run.weather} />
      </div>
    </Card> : <EmptyState icon={<CalendarDays />} title="No upcoming runs yet" text="Join a group run nearby or set one up and invite a buddy." action={<div className="button-row"><Link to="/runs"><Button variant="secondary">Browse runs</Button></Link><Link to="/runs/new"><Button>Create a run</Button></Link></div>} />}
    <section className="section-heading"><div><span className="kicker">SMART MATCHING</span><h2>{t('suggested')}</h2></div><Link to="/discover">{t('seeAll')} <ArrowRight size={16} /></Link></section>
    {data.suggestedRunners.length ? <div className="card-grid">{data.suggestedRunners.map((runner) => <RunnerCard key={runner.id} runner={runner} action={<Link className="text-link" to={`/discover/${runner.id}`}>View profile <ArrowRight size={15} /></Link>} />)}</div>
      : <EmptyState icon={<Users />} title="No matches to show yet" text="Search runners near you by pace and area to find a buddy." action={<Link to="/discover"><Button>Find a buddy</Button></Link>} />}
  </Page>
}

function Page({ children }: { children: React.ReactNode }) { return <div className="page">{children}</div> }
