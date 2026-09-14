import type { ButtonHTMLAttributes, PropsWithChildren, ReactNode } from 'react'
import { BadgeCheck, CloudRain, Droplets, MapPin, Wind } from 'lucide-react'
import type { Runner, Weather } from '../types'

export function Button({ className = '', variant = 'primary', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  return <button className={`button button--${variant} ${className}`} {...props} />
}

export function Card({ children, className = '' }: PropsWithChildren<{ className?: string }>) { return <section className={`card ${className}`}>{children}</section> }

export function Status({ children, tone = 'neutral' }: PropsWithChildren<{ tone?: 'success' | 'warning' | 'danger' | 'neutral' }>) { return <span className={`status status--${tone}`}>{children}</span> }

export function Avatar({ runner, large = false }: { runner: Pick<Runner, 'initials' | 'color' | 'name'>; large?: boolean }) {
  return <div className={`avatar ${large ? 'avatar--large' : ''}`} style={{ background: runner.color }} aria-label={`${runner.name} avatar`}>{runner.initials}</div>
}

export function WeatherStrip({ weather }: { weather: Weather }) {
  const tone = weather.level === 'great' ? 'success' : weather.level === 'fair' ? 'warning' : 'danger'
  return <div className="weather-strip">
    <Status tone={tone}>{weather.label}</Status>
    <span><span className="weather-icon">{weather.temperature}°</span> Bangkok</span>
    <span><CloudRain size={15} /> {weather.rainChance}%</span>
    <span><Droplets size={15} /> {weather.humidity}%</span>
    <span><Wind size={15} /> PM2.5 {weather.pm25}</span>
    {weather.stale && <span className="stale">Cached · {weather.updatedAt}</span>}
  </div>
}

export function RunnerCard({ runner, action }: { runner: Runner; action?: ReactNode }) {
  return <Card className="runner-card">
    <div className="runner-card__top"><Avatar runner={runner} /><div><div className="runner-name">{runner.name} {runner.verified && <BadgeCheck size={17} aria-label="Verified" />}</div><div className="muted"><MapPin size={14} /> {runner.area} · {runner.distanceKm} km</div></div><div className="match">{runner.match}%<small>match</small></div></div>
    <div className="pill-row"><span>{runner.pace} min/km</span><span>{runner.experience}</span><span>{runner.availability}</span></div>
    {action}
  </Card>
}

export function LoadingCards() { return <div className="card-grid" aria-label="Loading"><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /></div> }

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return <Card className="empty"><div className="empty__icon">{icon}</div><h3>{title}</h3><p>{text}</p>{action}</Card>
}
