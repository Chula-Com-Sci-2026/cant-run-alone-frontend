import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { gateway } from '../api/gateway'
import { Button, Card } from '../components/ui'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [registrationId, setRegistrationId] = useState('')
  const [maskedPhone, setMaskedPhone] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    try {
      if (registrationId) {
        await gateway.verifyOtp(registrationId, String(data.get('code')))
        navigate('/profile')
      } else {
        const result = await gateway.register({ email: String(data.get('email')), password: String(data.get('password')), phoneNumber: String(data.get('phone')), pdpaConsent: data.get('consent') === 'on' })
        setRegistrationId(result.registrationId)
        setMaskedPhone(result.maskedPhone)
      }
    } catch (failure) {
      setError((failure as { message?: string }).message ?? 'Registration failed. Please try again.')
    } finally { setBusy(false) }
  }
  return <main className="page narrow"><Link to="/login">Back to sign in</Link><h1>{registrationId ? 'Verify your phone' : 'Create your account'}</h1><Card><form key={registrationId || 'register'} onSubmit={submit}>
    {registrationId ? <><p>Phone: {maskedPhone}</p><p>The local console adapter prints your code in the Identity service logs. This demo does not send an SMS.</p><label>Verification code<input name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required /></label></> : <><label>Email<input name="email" type="email" required /></label><label>Thai mobile number<input name="phone" type="tel" placeholder="+66812345678" pattern="\+66[0-9]{9}" required /></label><label>Password<input name="password" type="password" minLength={8} maxLength={128} required /></label><label className="check"><input name="consent" type="checkbox" required /> I consent to the use of my profile and location for this service.</label></>}
    {error && <p role="alert" className="form-error">{error}</p>}<Button disabled={busy}>{busy ? 'Please wait…' : registrationId ? 'Verify phone' : 'Send verification code'}</Button>
  </form></Card></main>
}
