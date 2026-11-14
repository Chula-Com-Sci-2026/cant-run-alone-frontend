import type { ChangeEvent, FormEvent } from 'react'
import { lazy, Suspense, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, gateway } from '../api/gateway'
import { Avatar, Button, Card } from '../components/ui'
import { usePlaceLookup } from '../hooks/usePlaceLookup'
import type { MyProfile } from '../types'
const MeetingPointMap = lazy(() => import('../components/MeetingPointMap'))

const MAX_PHOTO_BYTES = 5 * 1024 * 1024

type AreaPin = { latitude: number; longitude: number }

// The area pin is chosen on the map, never typed. Profile shows other runners only the area name and
// a distance between ~1 km grid cells (NFR-4.1), so the pin itself stays private.
function ProfileForm({ profile, busy, message, onSubmit }: { profile?: MyProfile; busy: boolean; message: string; onSubmit: (event: FormEvent<HTMLFormElement>, pin: AreaPin) => void }) {
  const [pin, setPin] = useState<AreaPin>({ latitude: profile?.latitude ?? 13.73, longitude: profile?.longitude ?? 100.541 })
  const [area, setArea] = useState(profile?.area ?? 'Lumphini Park')
  const { note, lookup, stop } = usePlaceLookup(setArea,
    { found: 'Filled in from the pin. Edit it to name your park or neighbourhood.', missing: 'No name found for this spot. Please type one.', failed: 'Couldn’t look up this spot. Please type a name.' })
  const movePin = (latitude: number, longitude: number) => { setPin({ latitude, longitude }); lookup(latitude, longitude) }
  return <form className="form-card" onSubmit={(event) => onSubmit(event, pin)}>
    <label>Display name<input name="name" defaultValue={profile?.name ?? ''} required /></label><label>Bio<input name="bio" defaultValue={profile?.bio ?? ''} maxLength={240} /></label>
    <div className="form-grid"><label>Pace from (min/km)<input name="paceMin" type="number" min="1" max="20" step="0.1" defaultValue={profile?.paceMin ?? 6} required /></label><label>Pace to (min/km)<input name="paceMax" type="number" min="1" max="20" step="0.1" defaultValue={profile?.paceMax ?? 7} required /></label></div>
    <label>Experience<select name="experience" defaultValue={profile?.experience ?? 'Intermediate'}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>
    <label>Running area<input name="area" value={area} onChange={(event) => { stop(); setArea(event.target.value) }} required /><small aria-live="polite">{note || 'Drop the pin where you usually run and we’ll fill this in.'}</small></label>
    <Suspense fallback={<div className="map-placeholder">Opening map…</div>}><MeetingPointMap latitude={pin.latitude} longitude={pin.longitude} onChange={movePin} hint="Click the map to set your running area. Use +/− or pinch to zoom." /></Suspense>
    <p>Your pin stays private. Other runners see only the area name and a distance rounded to about 1 km.</p>
    <label>Availability<input name="availability" defaultValue={profile?.availability ?? 'Evenings'} required /></label>
    <Button disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</Button>{message && <p role="status">{message}</p>}
  </form>
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const client = useQueryClient()
  const { data: profile, isPending, error, refetch } = useQuery({ queryKey: ['me'], queryFn: gateway.getMyProfile, retry: false })
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [photoMessage, setPhotoMessage] = useState('')
  const [photoBusy, setPhotoBusy] = useState(false)
  if (isPending) return <div className="page narrow"><Card className="empty"><p role="status">Loading your profile…</p></Card></div>
  if (error && !(error instanceof ApiError && error.status === 404)) return <div className="page narrow"><Card className="empty"><h2>Your profile couldn’t load.</h2><p role="alert">{error instanceof ApiError ? error.message : 'The service could not be reached. Your saved profile has not been changed.'}</p><Button onClick={() => void refetch()}>Try again</Button></Card></div>
  const submit = async (event: FormEvent<HTMLFormElement>, pin: AreaPin) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setBusy(true)
    try {
      await gateway.saveProfile({ name: String(data.get('name')), bio: String(data.get('bio')), paceMin: Number(data.get('paceMin')), paceMax: Number(data.get('paceMax')), experience: String(data.get('experience')), area: String(data.get('area')), availability: String(data.get('availability')), ...pin })
      await client.invalidateQueries()
      setMessage('Profile saved.')
    } catch (failure) { setMessage((failure as { message?: string }).message ?? 'Could not save your profile. Sign in first.') } finally { setBusy(false) }
  }
  const changePhoto = async (action: () => Promise<unknown>, done: string) => {
    setPhotoBusy(true)
    setPhotoMessage('')
    try {
      await action()
      await client.invalidateQueries()
      setPhotoMessage(done)
    } catch (failure) {
      setPhotoMessage(failure instanceof ApiError ? failure.message : 'Photo storage could not be reached. Please try again.')
    } finally { setPhotoBusy(false) }
  }
  const pickPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) return setPhotoMessage('Choose an image file (JPEG, PNG or WebP).')
    if (file.size > MAX_PHOTO_BYTES) return setPhotoMessage('Choose a photo under 5 MB.')
    void changePhoto(() => gateway.uploadPhoto(file), 'Photo updated.')
  }
  return <div className="page narrow profile-editor"><header className="page-title"><div><span className="kicker">YOUR RUNNING IDENTITY</span><h1>Your runner profile</h1><p>Create or edit your profile before searching for buddies.</p></div></header>{profile && <Card className="profile-photo"><Avatar runner={profile} large /><div><h2>Profile photo</h2><p>Shown on your runner card. JPEG, PNG or WebP, up to 5 MB.</p><div className="profile-photo-actions">
    {/* A label opens the picker natively in every browser; a script click on a display:none input does not (Safari). */}
    <label className={`button button--primary photo-picker ${photoBusy ? 'is-busy' : ''}`}>{photoBusy ? 'Saving photo…' : profile.photoUrl ? 'Change photo' : 'Upload photo'}<input className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Photo file" onChange={pickPhoto} disabled={photoBusy} /></label>
    {profile.photoUrl && <Button type="button" variant="secondary" disabled={photoBusy} onClick={() => void changePhoto(gateway.removePhoto, 'Photo removed.')}>Remove photo</Button>}
  </div>{photoMessage && <p role="status">{photoMessage}</p>}</div></Card>}
  {!profile && <p className="profile-photo-hint">Save your profile first, then you can add a photo.</p>}
  <Card className="profile-editor-card"><ProfileForm key={profile?.id ?? 'new'} profile={profile} busy={busy} message={message} onSubmit={submit} /></Card><p className="profile-links"><Link to="/discover">Find a buddy</Link> · <Link to="/activity">Requests and running history</Link></p><Button variant="secondary" onClick={async () => { await gateway.logout(); client.clear(); navigate('/login') }}>Sign out</Button></div>
}
