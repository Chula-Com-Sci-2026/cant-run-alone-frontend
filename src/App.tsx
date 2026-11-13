import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import Shell from './components/Shell'
import AuthPage from './pages/AuthPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import DiscoverPage from './pages/DiscoverPage'
import RunnerPage from './pages/RunnerPage'
import RunPage from './pages/RunPage'
import CreateRunPage from './pages/CreateRunPage'
import ActivityPage from './pages/ActivityPage'
import ProfilePage from './pages/ProfilePage'
import NearbyPage from './pages/NearbyPage'
const RunsPage = lazy(() => import('./pages/RunsPage'))
const DesignSystemPage = lazy(() => import('./pages/DesignSystemPage'))

export default function App() {
  const navigate = useNavigate()
  const client = useQueryClient()
  useEffect(() => {
    // Remember where the runner was going (an invitation link, say) so signing in leads back there.
    const expired = () => {
      const target = window.location.pathname + window.location.search
      if (!['/login', '/register'].includes(window.location.pathname)) { try { window.sessionStorage.setItem('returnTo', target) } catch { /* storage blocked: land on Home */ } }
      client.clear(); navigate('/login', { replace: true })
    }
    window.addEventListener('auth:expired', expired)
    return () => window.removeEventListener('auth:expired', expired)
  }, [client, navigate])
  return <Suspense fallback={<div className="app-loading">Finding your route…</div>}><Routes><Route path="/login" element={<AuthPage />} /><Route path="/register" element={<RegisterPage />} /><Route element={<Shell />}><Route index element={<HomePage />} /><Route path="discover" element={<DiscoverPage />} /><Route path="discover/:id" element={<RunnerPage />} /><Route path="nearby" element={<NearbyPage />} /><Route path="runs" element={<RunsPage />} /><Route path="runs/new" element={<CreateRunPage />} /><Route path="runs/:id" element={<RunPage />} /><Route path="activity" element={<ActivityPage />} /><Route path="profile" element={<ProfilePage />} /><Route path="design-system" element={<DesignSystemPage />} /></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes></Suspense>
}
