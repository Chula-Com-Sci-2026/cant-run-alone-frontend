import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, gateway } from '../api/gateway'
import { Button, Card } from '../components/ui'

export default function ProfilePage() {
  const navigate = useNavigate()
  const client = useQueryClient()
  const { data: profile, isPending, error, refetch } = useQuery({ queryKey: ['me'], queryFn: gateway.getMyProfile, retry: false })
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  if (isPending) return <div className="page narrow"><Card className="empty"><p role="status">Loading your profile…</p></Card></div>
  if (error && !(error instanceof ApiError && error.status === 404)) return <div className="page narrow"><Card className="empty"><h2>Your profile couldn’t load.</h2><p role="alert">{error instanceof ApiError ? error.message : 'The service could not be reached. Your saved profile has not been changed.'}</p><Button onClick={() => void refetch()}>Try again</Button></Card></div>
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setBusy(true)
    try {
      await gateway.saveProfile({ name: String(data.get('name')), bio: String(data.get('bio')), paceMin: Number(data.get('paceMin')), paceMax: Number(data.get('paceMax')), experience: String(data.get('experience')), area: String(data.get('area')), availability: String(data.get('availability')), latitude: Number(data.get('latitude')), longitude: Number(data.get('longitude')) })
      await client.invalidateQueries()
      setMessage('Profile saved.')
    } catch (failure) { setMessage((failure as { message?: string }).message ?? 'Could not save your profile. Sign in first.') } finally { setBusy(false) }
  }
  return <div className="page narrow profile-editor"><header className="page-title"><div><span className="kicker">YOUR RUNNING IDENTITY</span><h1>Your runner profile</h1><p>Create or edit your profile before searching for buddies.</p></div></header><Card className="profile-editor-card"><form className="form-card" key={profile?.id ?? 'new'} onSubmit={submit}>
    <label>Display name<input name="name" defaultValue={profile?.name ?? ''} required /></label><label>Bio<input name="bio" defaultValue={profile?.bio ?? ''} maxLength={240} /></label>
    <div className="form-grid"><label>Pace from (min/km)<input name="paceMin" type="number" min="1" max="20" step="0.1" defaultValue={profile?.paceMin ?? 6} required /></label><label>Pace to (min/km)<input name="paceMax" type="number" min="1" max="20" step="0.1" defaultValue={profile?.paceMax ?? 7} required /></label></div>
    <label>Experience<select name="experience" defaultValue={profile?.experience ?? 'Intermediate'}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>
    <label>Running area<input name="area" defaultValue={profile?.area ?? 'Lumphini Park'} required /></label><label>Availability<input name="availability" defaultValue={profile?.availability ?? 'Evenings'} required /></label>
    <p>Coordinates are used for nearby search and kept out of public profiles.</p><div className="form-grid"><label>Area latitude<input name="latitude" type="number" step="any" min="-90" max="90" defaultValue={profile?.latitude ?? 13.73} required /></label><label>Area longitude<input name="longitude" type="number" step="any" min="-180" max="180" defaultValue={profile?.longitude ?? 100.541} required /></label></div>
    <Button disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</Button>{message && <p role="status">{message}</p>}
  </form></Card><p className="profile-links"><Link to="/discover">Find a buddy</Link> · <Link to="/activity">Requests and running history</Link></p><Button variant="secondary" onClick={async () => { await gateway.logout(); client.clear(); navigate('/login') }}>Sign out</Button></div>
}
