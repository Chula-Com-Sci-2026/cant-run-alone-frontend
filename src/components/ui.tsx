import type { ButtonHTMLAttributes, PropsWithChildren, ReactNode } from 'react'
import { CloudRain, Droplets, MapPin, Wind } from 'lucide-react'
import type { Runner, Weather } from '../types'
import { initials, paceLabel } from './runner'

export function Button({ className = '', variant = 'primary', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  return <button className={`button button--${variant} ${className}`} {...props} />
}

export function Card({ children, className = '' }: PropsWithChildren<{ className?: string }>) { return <section className={`card ${className}`}>{children}</section> }

export function Status({ children, tone = 'neutral' }: PropsWithChildren<{ tone?: 'success' | 'warning' | 'danger' | 'neutral' }>) { return <span className={`status status--${tone}`}>{children}</span> }

// A stable colour per runner, picked from the id.
const avatarColors = ['#f4a261', '#5c8d89', '#8367c7', '#e76f51', '#ef6f4d']

export function Avatar({ runner, large = false }: { runner: Pick<Runner, 'id' | 'name' | 'photoUrl'>; large?: boolean }) {
  const color = avatarColors[[...runner.id].reduce((sum, character) => sum + character.charCodeAt(0), 0) % avatarColors.length]
  if (runner.photoUrl) return <img className={`avatar ${large ? 'avatar--large' : ''}`} src={runner.photoUrl} alt={`${runner.name} avatar`} />
  return <div className={`avatar ${large ? 'avatar--large' : ''}`} style={{ background: color }} aria-label={`${runner.name} avatar`}>{initials(runner.name)}</div>
}

export function WeatherStrip({ weather }: { weather: Weather }) {
  const tone = weather.level === 'great' ? 'success' : weather.level === 'fair' ? 'warning' : 'danger'
  // "14 Nov, 22:12" rather than the raw ISO string; anything unparseable is shown as it came.
  const readableTime = (value: string) => {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('en', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
  }
  return <div className="weather-strip">
    <Status tone={tone}>{weather.label}</Status>
    <span><span className="weather-icon">{weather.temperature}°</span> Bangkok</span>
    <span><CloudRain size={15} /> {weather.rainChance}%</span>
    <span><Droplets size={15} /> {weather.humidity}%</span>
    <span><Wind size={15} /> PM2.5 {weather.pm25}</span>
    {weather.stale && <span className="stale">Cached · {readableTime(weather.updatedAt)}</span>}
  </div>
}

export function RunnerCard({ runner, action }: { runner: Runner; action?: ReactNode }) {
  return <Card className="runner-card">
    <div className="runner-card__top"><Avatar runner={runner} /><div><div className="runner-name">{runner.name}</div><div className="muted"><MapPin size={14} /> {runner.area}{runner.distanceKm !== undefined && ` · ${runner.distanceKm} km`}</div></div></div>
    <div className="pill-row">{[paceLabel(runner.paceMin, runner.paceMax) && `${paceLabel(runner.paceMin, runner.paceMax)} min/km`, runner.experience, runner.availability, runner.usualDistance].filter(Boolean).map((pill) => <span key={pill}>{pill}</span>)}</div>
    {action}
  </Card>
}

export function LoadingCards() { return <div className="card-grid" aria-label="Loading"><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /></div> }

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return <Card className="empty"><div className="empty__icon">{icon}</div><h3>{title}</h3><p>{text}</p>{action}</Card>
}
