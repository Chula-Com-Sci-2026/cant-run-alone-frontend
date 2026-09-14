import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Shell from './components/Shell'
import AuthPage from './pages/AuthPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import DiscoverPage from './pages/DiscoverPage'
import RunnerPage from './pages/RunnerPage'
import RunPage from './pages/RunPage'
import CreateRunPage from './pages/CreateRunPage'
import ProfilePage from './pages/ProfilePage'
import NearbyPage from './pages/NearbyPage'
const RunsPage = lazy(() => import('./pages/RunsPage'))
const DesignSystemPage = lazy(() => import('./pages/DesignSystemPage'))

export default function App() {
  return <Suspense fallback={<div className="app-loading">Finding your route…</div>}><Routes><Route path="/login" element={<AuthPage />} /><Route path="/register" element={<RegisterPage />} /><Route element={<Shell />}><Route index element={<HomePage />} /><Route path="discover" element={<DiscoverPage />} /><Route path="discover/:id" element={<RunnerPage />} /><Route path="nearby" element={<NearbyPage />} /><Route path="runs" element={<RunsPage />} /><Route path="runs/new" element={<CreateRunPage />} /><Route path="runs/:id" element={<RunPage />} /><Route path="profile" element={<ProfilePage />} /><Route path="design-system" element={<DesignSystemPage />} /></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes></Suspense>
}
