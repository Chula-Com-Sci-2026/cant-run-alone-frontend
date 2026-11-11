import { dashboard, runners, runs } from '../data/mockData'
import type { CreateRunInput, Dashboard, MyProfile, Run, Runner, RunnerFilters, Weather } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true'
let accessToken: string | null = null
let refreshRequest: Promise<boolean> | null = null
const mockRuns = [...runs]
const delay = (ms = 280) => new Promise((resolve) => window.setTimeout(resolve, ms))

export class ApiError extends Error {
  constructor(message: string, readonly status: number) { super(message) }
}

async function request<T>(path: string, init?: RequestInit, retry = true): Promise<T> {
  const sentToken = accessToken
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    signal: init?.signal ?? AbortSignal.timeout(20_000),
    headers: { ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), ...init?.headers },
  })
  if (response.status === 401 && retry) {
    // A slower response may arrive after another request already renewed the token.
    if (accessToken && accessToken !== sentToken) return request<T>(path, init, false)
    refreshRequest ??= (async () => {
      const refreshed = await fetch(`${API_BASE_URL}/auth/refresh`, { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' }, credentials: 'include', signal: AbortSignal.timeout(20_000) })
      if (refreshed.status === 401 || refreshed.status === 403) return false
      if (!refreshed.ok) throw new ApiError('Sign-in service is temporarily unavailable. Please try again.', refreshed.status)
      accessToken = ((await refreshed.json()) as { accessToken: string }).accessToken
      return true
    })().finally(() => { refreshRequest = null })
    if (await refreshRequest) {
      return request<T>(path, init, false)
    }
    accessToken = null
    window.dispatchEvent(new Event('auth:expired'))
  }
  if (!response.ok) {
    const failure = await response.json().catch(() => ({})) as { message?: string }
    throw new ApiError(failure.message ?? `Request failed (${response.status}). Please try again.`, response.status)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

/** buddy_discovery.proto BuddyRequest. The note is absent when the sender wrote none. */
export interface BuddyRequest { id: string; senderId: string; recipientId: string; status: string; note?: string }
/** running-buddy-contracts notification.openapi.json: NotificationPublic and NotificationsPublic. */
export interface Notification { id: string; type: string; category: string; data: { requestId: string; senderId: string; recipientId: string; status: string }; occurredAt: string; readAt: string | null }
export interface NotificationPage { items: Notification[]; unreadCount: number; nextCursor: string | null }
export interface RunningRecord { id: string; run_id: string; distance_meters: number; duration_seconds: number; occurred_at: string }
export interface History { records: RunningRecord[]; totalDistanceMeters: number; totalDurationSeconds: number }

export const gateway = {
  // The place name at a map pin, from OpenStreetMap's public Nominatim service (like the map tiles, an
  // external system the browser calls directly). Null when the pin has no usable name. Its usage policy
  // allows one request a second, so callers must debounce.
  async findPlaceName(latitude: number, longitude: number, language: string, signal: AbortSignal) {
    if (USE_MOCK_API) return null
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&accept-language=${language}`, { signal })
    if (!response.ok) return null
    const place = await response.json() as { name?: string; address?: Record<string, string> }
    const { road, pedestrian, footway, neighbourhood, quarter, suburb, city } = place.address ?? {}
    const parts = [place.name, road ?? pedestrian ?? footway, neighbourhood ?? quarter, suburb, city].filter(Boolean)
    return [...new Set(parts)].slice(0, 2).join(', ') || null
  },
  getConditions: (input: CreateRunInput) => request<Weather>(`/conditions?latitude=${input.latitude}&longitude=${input.longitude}&at=${encodeURIComponent(`${input.date}T${input.time}:00+07:00`)}`),
  async register(input: { email: string; password: string; phoneNumber: string; pdpaConsent: boolean }) {
    return request<{ registrationId: string; maskedPhone: string; deliveryAdapter: string }>('/auth/register', { method: 'POST', body: JSON.stringify(input) }, false)
  },
  async verifyOtp(registrationId: string, code: string) {
    const result = await request<{ accessToken: string; userId: string }>('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ registrationId, code }) }, false)
    accessToken = result.accessToken
    return result
  },
  async logout() { await request('/auth/logout', { method: 'POST' }); accessToken = null },
  getMyProfile: () => request<MyProfile>('/me/profile'),
  saveProfile: (input: { name: string; bio: string; paceMin: number; paceMax: number; experience: string; area: string; availability: string; latitude: number; longitude: number }) => request<MyProfile>('/me/profile', { method: 'PUT', body: JSON.stringify(input) }),
  // Profile's photo handshake (profile.openapi.json): ask for a signed upload URL, PUT the image
  // straight to photo storage with no token, then attach the key. The gateway never sees the bytes.
  async uploadPhoto(file: File) {
    const upload = await request<{ uploadUrl: string; photoRef: string }>('/me/profile/photo-uploads', { method: 'POST' })
    const stored = await fetch(upload.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type }, signal: AbortSignal.timeout(60_000) })
    if (!stored.ok) throw new ApiError('The photo could not be uploaded. Please try again.', stored.status)
    return request<MyProfile>('/me/profile/photo', { method: 'PUT', body: JSON.stringify({ photoRef: upload.photoRef }) })
  },
  removePhoto: () => request<MyProfile>('/me/profile/photo', { method: 'DELETE' }),
  getBuddyRequests: () => request<BuddyRequest[]>('/buddy-requests'),
  respondToBuddyRequest: (id: string, decision: string) => request(`/buddy-requests/${id}`, { method: 'PATCH', body: JSON.stringify({ decision }) }),
  getNotifications: () => request<NotificationPage>('/notifications'),
  markNotificationRead: (id: string) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  getHistory: () => request<History>('/me/history'),
  confirmAttendance: (id: string) => request(`/runs/${id}/attendance`, { method: 'POST' }),
  rateParticipant: (id: string, rateeId: string, score: number) => request(`/runs/${id}/ratings`, { method: 'POST', body: JSON.stringify({ rateeId, punctuality: score, paceAccuracy: score, friendliness: score }) }),
  logRecord: (runId: string, distanceMeters: number, durationSeconds: number) => request('/running_records', { method: 'POST', body: JSON.stringify({ running_record: { run_id: runId, distance_meters: distanceMeters, duration_seconds: durationSeconds, occurred_at: new Date().toISOString() } }) }),
  async login(email: string, password: string) {
    if (USE_MOCK_API) { await delay(); accessToken = 'mock-access-token'; return { userId: 'me', profileComplete: true } }
    const result = await request<{ accessToken: string; userId: string; profileComplete: boolean }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }, false)
    accessToken = result.accessToken
    return result
  },
  async getDashboard(): Promise<Dashboard> { if (USE_MOCK_API) { await delay(); return dashboard } return request('/dashboard') },
  async getRunners(filters: RunnerFilters): Promise<Runner[]> {
    if (!USE_MOCK_API) return request(`/runners?radiusKm=${filters.radiusKm}&pace=${encodeURIComponent(filters.pace)}&experience=${filters.experience}`)
    await delay()
    return runners.filter((runner) => (filters.experience === 'All' || runner.experience === filters.experience) && (runner.distanceKm ?? 0) <= filters.radiusKm)
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
