import { lazy, Suspense, useState } from 'react'
import { ArrowLeft, Check, MapPin } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useCreateRun } from '../api/hooks'
import { Button, Card, WeatherStrip } from '../components/ui'
import { useQuery } from '@tanstack/react-query'
import { gateway } from '../api/gateway'
import { usePlaceLookup } from '../hooks/usePlaceLookup'
import type { CreateRunInput } from '../types'
const MeetingPointMap = lazy(() => import('../components/MeetingPointMap'))

export default function CreateRunPage() {
  const navigate = useNavigate(); const create = useCreateRun(); const [step, setStep] = useState(1); const [form, setForm] = useState<CreateRunInput>(() => ({ title: 'Easy evening 5K', meetingPoint: 'Lumphini Park Gate 4', date: new Date(Date.now() + 86400000).toLocaleDateString('en-CA'), time: '18:30', distanceKm: 5, pace: '6:00–6:30', participantLimit: 8, visibility: 'Public', latitude: 13.7317, longitude: 100.5415 }))
  // Dropping the pin names the meeting point.
  const { note: placeNote, lookup, stop: stopLookup } = usePlaceLookup((name) => setForm((current) => ({ ...current, meetingPoint: name })),
    { found: 'Filled in from the pin. Edit it to name a gate or landmark.', missing: 'No name found for this spot. Please type one.', failed: 'Couldn’t look up this spot. Please type a name.' })
  const movePin = (latitude: number, longitude: number) => {
    setForm((current) => ({ ...current, latitude, longitude }))
    lookup(latitude, longitude)
  }
  const typeMeetingPoint = (value: string) => { stopLookup(); field('meetingPoint', value) }
  const forecast = useQuery({ queryKey: ['conditions', form], queryFn: () => gateway.getConditions(form), enabled: step === 2, retry: false })
  const field = (key: keyof CreateRunInput, value: string | number) => setForm({ ...form, [key]: value })
  const submit = () => create.mutate(form, { onSuccess: (run) => navigate(`/runs/${run.id}?created=1`) })
  return <div className="page narrow"><Link className="back" to="/runs"><ArrowLeft size={17} /> Cancel</Link><header className="page-title"><div><span className="kicker">STEP {step} OF 2</span><h1>{step === 1 ? 'Plan your run' : 'Check the conditions'}</h1><p>{step === 1 ? 'Choose a public meeting point and a pace people can count on.' : 'We check weather and air quality before publishing.'}</p></div></header>
    {step === 1 ? <Card className="form-card"><label>Run name<input value={form.title} onChange={(e) => field('title', e.target.value)} /></label><label>Public meeting point<div className="input-icon"><MapPin size={17} /><input value={form.meetingPoint} onChange={(e) => typeMeetingPoint(e.target.value)} /></div><small aria-live="polite">{placeNote || 'Drop the pin on the map and we’ll fill this in. Use a staffed gate, landmark, or other public place.'}</small></label><Suspense fallback={<div className="map-placeholder">Opening map…</div>}><MeetingPointMap latitude={form.latitude} longitude={form.longitude} onChange={movePin} /></Suspense><div className="form-grid"><label>Date<input type="date" value={form.date} onChange={(e) => field('date', e.target.value)} /></label><label>Time (ICT)<input type="time" value={form.time} onChange={(e) => field('time', e.target.value)} /></label><label>Distance (km)<input type="number" min="1" max="50" value={form.distanceKm} onChange={(e) => field('distanceKm', Number(e.target.value))} /></label><label>Target pace<select value={form.pace} onChange={(e) => field('pace', e.target.value)}><option>5:30–6:00</option><option>6:00–6:30</option><option>6:30–7:00</option></select></label><label>Runner limit<input type="number" min="2" max="30" value={form.participantLimit} onChange={(e) => field('participantLimit', Number(e.target.value))} /></label><label>Visibility<select value={form.visibility} onChange={(e) => field('visibility', e.target.value)}><option>Public</option></select></label></div><Button className="wide" onClick={() => setStep(2)}>Check weather & continue</Button></Card> : <div className="confirm-stack"><Card className="confirm-run"><div className="meeting-map"><MapPin size={28} /></div><div><span className="kicker">RUN SUMMARY</span><h2>{form.title}</h2><p>{form.meetingPoint}</p><div className="pill-row"><span>{form.date} · {form.time} ICT</span><span>{form.distanceKm} km</span><span>{form.pace} min/km</span></div></div></Card><Card className="form-card"><h3>Forecast at run time</h3>{forecast.isPending ? <p>Checking the forecast and air quality…</p> : forecast.isError ? <p role="alert">Forecast unavailable. Choose a date within the next few days or try again.</p> : forecast.data && <><WeatherStrip weather={forecast.data} /><p className="forecast-note"><Check size={18} /> {forecast.data.stale ? 'Cached forecast: readings may be stale.' : 'Forecast checked for this location and time.'} Forecasts can change.</p></>}</Card><div className="button-row"><Button variant="secondary" onClick={() => setStep(1)}>Back</Button><Button disabled={create.isPending || !forecast.data || forecast.isError} onClick={submit}>{create.isPending ? 'Publishing…' : 'Publish run'}</Button></div>{create.isError && <p role="alert">Could not publish the run. Check the date, conditions, and your connection.</p>}</div>}
  </div>
}
