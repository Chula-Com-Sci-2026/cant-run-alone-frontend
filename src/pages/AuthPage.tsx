import { FormEvent, useState } from 'react'
import { ArrowRight, LockKeyhole, Zap } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ApiError, gateway } from '../api/gateway'
import AuthStory from '../components/AuthStory'
import { Button } from '../components/ui'

export default function AuthPage() {
  const navigate = useNavigate(); const client = useQueryClient(); const [loading, setLoading] = useState(false); const [error, setError] = useState('')
  // Identity cannot know whether a profile exists, so Profile is asked: a runner who never finished
  // setup lands on the profile editor, everyone else on Home.
  const landing = async () => {
    let returnTo = '/'
    try { returnTo = window.sessionStorage.getItem('returnTo') ?? '/'; window.sessionStorage.removeItem('returnTo') } catch { /* storage blocked */ }
    try { client.setQueryData(['me'], await gateway.getMyProfile()); return returnTo } catch (failure) { return failure instanceof ApiError && failure.status === 404 ? '/profile' : returnTo }
  }
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); setLoading(true); setError(''); try { await gateway.login(String(data.get('email')), String(data.get('password'))) } catch { setError('Could not sign in. Check your details and try again.'); setLoading(false); return } navigate(await landing()) }
  return <div className="auth-page"><AuthStory /><main className="auth-form"><div><span className="mobile-logo"><Zap fill="currentColor" /> CAN'T RUN ALONE</span><h2>Welcome back</h2><p>Ready for your next run?</p><form onSubmit={submit}><label>Email<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label><label>Password<div className="input-icon"><LockKeyhole size={17} /><input name="password" type="password" autoComplete="current-password" minLength={8} required /></div></label>{error && <p className="form-error">{error}</p>}<Button className="wide" disabled={loading}>{loading ? 'Signing in…' : <>Sign in <ArrowRight size={17} /></>}</Button></form><div className="auth-links"><a href="#reset">Forgot password?</a><span>New here? <Link to="/register">Create an account</Link></span></div><p className="demo-note">Local demo: sign in with your registered account or the seeded demo credentials.</p></div></main></div>
}
