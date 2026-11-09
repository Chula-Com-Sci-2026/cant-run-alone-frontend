import { FormEvent, useState } from 'react'
import { ArrowRight, BadgeCheck, CloudSun, Footprints, LockKeyhole, Zap } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ApiError, gateway } from '../api/gateway'
import { Button } from '../components/ui'

export default function AuthPage() {
  const navigate = useNavigate(); const client = useQueryClient(); const [loading, setLoading] = useState(false); const [error, setError] = useState('')
  // Identity cannot know whether a profile exists, so Profile is asked: a runner who never finished
  // setup lands on the profile editor, everyone else on Home.
  const landing = async () => {
    try { client.setQueryData(['me'], await gateway.getMyProfile()); return '/' } catch (failure) { return failure instanceof ApiError && failure.status === 404 ? '/profile' : '/' }
  }
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); setLoading(true); setError(''); try { await gateway.login(String(data.get('email')), String(data.get('password'))) } catch { setError('Could not sign in. Check your details and try again.'); setLoading(false); return } navigate(await landing()) }
  return <div className="auth-page"><section className="auth-story"><Link to="/login" className="brand brand--light"><span className="brand__mark"><Zap fill="currentColor" /></span><span>CAN'T RUN<br /><strong>ALONE</strong></span></Link><div><span className="kicker kicker--lime">RUN BANGKOK, TOGETHER</span><h1>Your best runs start with the right people.</h1><p>Match by pace and schedule. Meet in public. Know the weather before you go.</p><div className="auth-benefits"><span><Footprints /> Pace-matched buddies</span><span><CloudSun /> Weather-aware plans</span><span><BadgeCheck /> Phone-verified people</span></div></div><small>Bangkok · ICT (UTC+7)</small></section><main className="auth-form"><div><span className="mobile-logo"><Zap fill="currentColor" /> CAN'T RUN ALONE</span><h2>Welcome back</h2><p>Ready for your next run?</p><form onSubmit={submit}><label>Email<input name="email" type="email" defaultValue="ray@example.com" required /></label><label>Password<div className="input-icon"><LockKeyhole size={17} /><input name="password" type="password" defaultValue="runner123" minLength={8} required /></div></label>{error && <p className="form-error">{error}</p>}<Button className="wide" disabled={loading}>{loading ? 'Signing in…' : <>Sign in <ArrowRight size={17} /></>}</Button></form><div className="auth-links"><a href="#reset">Forgot password?</a><span>New here? <Link to="/register">Create an account</Link></span></div><p className="demo-note">Local demo: sign in with your registered account or the seeded demo credentials.</p></div></main></div>
}
