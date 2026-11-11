import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, LockKeyhole, Zap } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { gateway } from '../api/gateway'
import AuthStory from '../components/AuthStory'
import { Button } from '../components/ui'

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
  return <div className="auth-page"><AuthStory /><main className="auth-form"><div><span className="mobile-logo"><Zap fill="currentColor" /> CAN'T RUN ALONE</span>
    <h2>{registrationId ? 'Verify your phone' : 'Create your account'}</h2><p>{registrationId ? <>We sent a 6-digit code to <strong>{maskedPhone}</strong>.</> : 'Find runners who match your pace.'}</p>
    <form key={registrationId || 'register'} onSubmit={submit}>
      {registrationId ? <label>Verification code<input name="code" className="otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required /></label> : <><label>Email<input name="email" type="email" autoComplete="email" required /></label><label>Thai mobile number<input name="phone" type="tel" autoComplete="tel" placeholder="+66812345678" pattern="\+66[0-9]{9}" required /></label><label>Password<div className="input-icon"><LockKeyhole size={17} /><input name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required /></div></label><label className="check consent"><input name="consent" type="checkbox" required /> I consent to the use of my profile and location for this service.</label></>}
      {error && <p role="alert" className="form-error">{error}</p>}<Button className="wide" disabled={busy}>{busy ? 'Please wait…' : registrationId ? 'Verify phone' : <>Send verification code <ArrowRight size={17} /></>}</Button>
    </form>
    <div className="auth-links"><span>Already have an account? <Link to="/login">Sign in</Link></span></div>
    {registrationId && <p className="demo-note">Local demo: no SMS is sent. The code is printed in the Identity service log.</p>}
  </div></main></div>
}
