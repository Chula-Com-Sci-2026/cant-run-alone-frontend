import { dashboard, runners, runs } from '../data/mockData'
import type { CreateRunInput, Dashboard, Run, Runner, RunnerFilters } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1'
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'
let accessToken: string | null = null
const mockRuns = [...runs]
const delay = (ms = 280) => new Promise((resolve) => window.setTimeout(resolve, ms))

async function request<T>(path: string, init?: RequestInit, retry = true): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), ...init?.headers },
  })
  if (response.status === 401 && retry) {
    const refreshed = await fetch(`${API_BASE_URL}/auth/refresh`, { method: 'POST', credentials: 'include' })
    if (refreshed.ok) {
      accessToken = ((await refreshed.json()) as { accessToken: string }).accessToken
      return request<T>(path, init, false)
    }
  }
  if (!response.ok) throw await response.json()
  return response.json() as Promise<T>
}

export const gateway = {
  async login(email: string, password: string) {
    if (USE_MOCK_API) { await delay(); accessToken = 'mock-access-token'; return { userId: 'me', profileComplete: true } }
    const result = await request<{ accessToken: string; userId: string; profileComplete: boolean }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
    accessToken = result.accessToken
    return result
  },
  async getDashboard(): Promise<Dashboard> { if (USE_MOCK_API) { await delay(); return dashboard } return request('/dashboard') },
  async getRunners(filters: RunnerFilters): Promise<Runner[]> {
    if (!USE_MOCK_API) return request(`/runners?radiusKm=${filters.radiusKm}&pace=${encodeURIComponent(filters.pace)}&experience=${filters.experience}&verifiedOnly=${filters.verifiedOnly}`)
    await delay()
    return runners.filter((runner) => (filters.experience === 'All' || runner.experience === filters.experience) && (!filters.verifiedOnly || runner.verified) && runner.distanceKm <= filters.radiusKm)
  },
  async getRunner(id: string): Promise<Runner> { if (USE_MOCK_API) { await delay(); return runners.find((runner) => runner.id === id) ?? runners[0] } return request(`/runners/${id}`) },
  async sendBuddyRequest(runnerId: string, note: string) { if (USE_MOCK_API) { await delay(); return { id: `request-${runnerId}`, status: 'pending', note } } return request('/buddy-requests', { method: 'POST', body: JSON.stringify({ runnerId, note }) }) },
  async getRuns(): Promise<Run[]> { if (USE_MOCK_API) { await delay(); return mockRuns } return request('/runs') },
  async getRun(id: string): Promise<Run> { if (USE_MOCK_API) { await delay(); return mockRuns.find((run) => run.id === id) ?? mockRuns[0] } return request(`/runs/${id}`) },
  async createRun(input: CreateRunInput): Promise<Run> {
    if (!USE_MOCK_API) return request('/runs', { method: 'POST', body: JSON.stringify(input) })
    await delay(450)
    const run: Run = { id: `run-${Date.now()}`, organizer: 'You', area: input.meetingPoint, participants: 1, joined: true, ...input, weather: { temperature: 29, humidity: 68, rainChance: 20, pm25: 18, level: 'great', label: 'Great to run', updatedAt: 'Just now' } }
    mockRuns.unshift(run)
    return run
  },
  async toggleRun(id: string, join: boolean) { if (USE_MOCK_API) { await delay(); const run = mockRuns.find((item) => item.id === id); if (run) { run.participants += join ? 1 : -1; run.joined = join }; return { id, joined: join } } return request(`/runs/${id}/participants/me`, { method: join ? 'PUT' : 'DELETE' }) },
}
