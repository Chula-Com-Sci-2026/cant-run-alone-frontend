import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, gateway } from '../api/gateway'
import type { BuddyRequest } from '../api/gateway'
import RunnerPage from '../pages/RunnerPage'
import RunPage from '../pages/RunPage'
import ActivityPage from '../pages/ActivityPage'
import { buddyStatus } from '../components/runner'

const names: Record<string, string> = { me: 'Ray A.', mali: 'Mali S.', narin: 'Narin K.' }

function view(path: string) {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
    <MemoryRouter initialEntries={[path]}><Routes><Route path="/discover/:id" element={<RunnerPage />} /><Route path="/runs/:id" element={<RunPage />} /><Route path="/activity" element={<ActivityPage />} /></Routes></MemoryRouter>
  </QueryClientProvider>)
}

function stub({ requests = [], buddies = [], runs = [] }: { requests?: BuddyRequest[]; buddies?: string[]; runs?: object[] } = {}) {
  vi.spyOn(gateway, 'getMyProfile').mockResolvedValue({ id: 'me' } as never)
  vi.spyOn(gateway, 'getBuddyRequests').mockResolvedValue(requests)
  vi.spyOn(gateway, 'getBuddies').mockResolvedValue(buddies)
  vi.spyOn(gateway, 'getRuns').mockResolvedValue(runs as never)
  vi.spyOn(gateway, 'getRatingSummary').mockResolvedValue({ runnerId: 'mali', count: 1, rating: null, hidden: true })
  vi.spyOn(gateway, 'getRunner').mockImplementation(async (id) => {
    if (!names[id]) throw new ApiError('Profile not found', 404)
    return { id, name: names[id], area: 'Lumphini area', photoUrl: null, bio: null, paceMin: 6, paceMax: 6.5, experience: 'Intermediate', availability: null, usualDistance: null, gear: null, areaCell: { latitude: 0, longitude: 0 } }
  })
}

afterEach(() => { cleanup(); vi.restoreAllMocks(); window.localStorage.clear() })

describe('buddy status', () => {
  const request = (changes: Partial<BuddyRequest>): BuddyRequest => ({ id: 'r', senderId: 'me', recipientId: 'mali', status: 'pending', ...changes })
  it('works in both directions and prefers buddies over old requests', () => {
    expect(buddyStatus('mali', 'me', [], []).kind).toBe('none')
    expect(buddyStatus('mali', 'me', [request({})], []).kind).toBe('sent')
    expect(buddyStatus('mali', 'me', [request({ senderId: 'mali', recipientId: 'me' })], []).kind).toBe('received')
    expect(buddyStatus('mali', 'me', [request({ status: 'accepted' }), request({ id: 'again' })], []).kind).toBe('buddies')
    expect(buddyStatus('mali', 'me', [], ['mali']).kind).toBe('buddies')
    expect(buddyStatus('mali', 'me', [request({ status: 'rejected' })], []).kind).toBe('none')
    expect(buddyStatus('mali', 'me', [request({ recipientId: 'narin' })], []).kind).toBe('none')
  })
})

describe('runner profile', () => {
  it('sends one request and then shows it as sent, with a way to cancel', async () => {
    stub()
    const send = vi.spyOn(gateway, 'sendBuddyRequest').mockImplementation(async () => {
      vi.spyOn(gateway, 'getBuddyRequests').mockResolvedValue([{ id: 'new', senderId: 'me', recipientId: 'mali', status: 'pending', note: 'Hi!' }])
      return { id: 'new', status: 'pending', note: 'Hi!' } as never
    })
    view('/discover/mali')
    await userEvent.click(await screen.findByRole('button', { name: 'Send buddy request' }))
    expect(await screen.findByText('Request sent')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Send buddy request' })).not.toBeInTheDocument()
    expect(send).toHaveBeenCalledTimes(1)
    const cancel = vi.spyOn(gateway, 'cancelBuddyRequest').mockResolvedValue(undefined as never)
    await userEvent.click(screen.getByRole('button', { name: 'Cancel request' }))
    await waitFor(() => expect(cancel).toHaveBeenCalledWith('new'))
  })

  it('remembers a sent request after reopening the page', async () => {
    stub({ requests: [{ id: 'old', senderId: 'me', recipientId: 'mali', status: 'pending' }] })
    view('/discover/mali')
    expect(await screen.findByText('Request sent')).toBeInTheDocument()
  })

  it('lets the runner answer a request from this profile', async () => {
    stub({ requests: [{ id: 'in', senderId: 'mali', recipientId: 'me', status: 'pending' }] })
    const answer = vi.spyOn(gateway, 'respondToBuddyRequest').mockResolvedValue(undefined as never)
    view('/discover/mali')
    await userEvent.click(await screen.findByRole('button', { name: 'Accept request' }))
    await waitFor(() => expect(answer).toHaveBeenCalledWith('in', 'accepted'))
  })

  it('shows a buddy their runs instead of another request', async () => {
    stub({ buddies: ['mali'], runs: [{ id: 'sunrise', title: 'Sunrise 5K', organizerId: 'mali', date: '2099-01-01', time: '06:00', startsAt: '2099-01-01T00:00:00Z', distanceKm: 5, meetingPoint: 'Gate 1' }] })
    view('/discover/mali')
    expect(await screen.findByText('You and Mali S. are running buddies')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Sunrise 5K/ })).toHaveAttribute('href', '/runs/sunrise')
    expect(screen.queryByRole('button', { name: 'Send buddy request' })).not.toBeInTheDocument()
  })

  it('counts reviews until the rating can be shown', async () => {
    stub()
    view('/discover/mali')
    expect(await screen.findByText('1 of 3 reviews so far')).toBeInTheDocument()
  })

  it("shows a runner's running totals once they have logged a run", async () => {
    stub()
    const summary = vi.spyOn(gateway, 'getRunningSummary').mockResolvedValue({ runnerId: 'mali', runs: 3, totalDistanceMeters: 21000, totalDurationSeconds: 7560 })
    view('/discover/mali')
    expect(await screen.findByRole('heading', { name: "Mali S.'s running" })).toBeInTheDocument()
    expect(screen.getByText('2 h 6 min')).toBeInTheDocument()
    expect(screen.getByText('6:00')).toBeInTheDocument()
    cleanup()
    summary.mockResolvedValue({ runnerId: 'mali', runs: 0, totalDistanceMeters: 0, totalDurationSeconds: 0 })
    view('/discover/mali')
    expect(await screen.findByText('1 of 3 reviews so far')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: "Mali S.'s running" })).not.toBeInTheDocument()
  })
})

describe('run participants and invitations', () => {
  const run = { id: 'run', title: 'Evening 5K', organizer: 'Runner', organizerId: 'narin', area: 'Lumphini', meetingPoint: 'Gate 1', date: '2099-01-01', time: '18:00', distanceKm: 5, pace: '6', participants: 3, participantLimit: 5, visibility: 'Public', startsAt: '2099-01-01T11:00:00Z', weather: { temperature: 29, humidity: 65, rainChance: 20, pm25: 15, level: 'great', label: 'Good' } }

  it('lists who has joined, linking to their profiles', async () => {
    stub({ buddies: ['mali'] })
    vi.spyOn(gateway, 'getRun').mockResolvedValue({ ...run, joined: true, participantIds: ['narin', 'me', 'mali', 'ghost'] } as never)
    view('/runs/run')
    // Mali appears twice: once as a participant and once in the invite list, both linking to the profile.
    expect((await screen.findAllByRole('link', { name: /Mali S\./ }))[0]).toHaveAttribute('href', '/discover/mali')
    expect(screen.getByRole('link', { name: /Narin K\./ })).toHaveAttribute('href', '/discover/narin')
    expect(screen.getByText('You')).toBeInTheDocument()
    expect(await screen.findByText('Private runner')).toBeInTheDocument()
  })

  it('shows only the organizer and a count to runners who have not joined', async () => {
    stub()
    vi.spyOn(gateway, 'getRun').mockResolvedValue({ ...run, joined: false } as never)
    view('/runs/run')
    expect(await screen.findByText("3 runners have joined. Join this run to see who's coming.")).toBeInTheDocument()
    expect(await screen.findByText('Narin K.')).toBeInTheDocument()
    expect(screen.queryByText('Invite your buddies')).not.toBeInTheDocument()
  })

  it('invites a buddy with a link right after creating a run', async () => {
    stub({ buddies: ['mali', 'narin'] })
    vi.spyOn(gateway, 'getRun').mockResolvedValue({ ...run, organizer: 'You', organizerId: 'me', joined: true, participantIds: ['me', 'narin'] } as never)
    const user = userEvent.setup()
    // user-event installs its own clipboard on setup; replace it so the copied text can be checked.
    const copy = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(window.navigator, 'clipboard', { configurable: true, value: { writeText: copy } })
    view('/runs/run?created=1')
    expect(await screen.findByText('Run created! Invite your buddies')).toBeInTheDocument()
    await user.click(await screen.findByRole('button', { name: 'Invite' }))
    await waitFor(() => expect(copy).toHaveBeenCalledWith(expect.stringContaining('/runs/run?invitedBy=me')))
    expect(await screen.findByRole('button', { name: /Invited/ })).toBeInTheDocument()
    expect(screen.getAllByText('Joined').length).toBeGreaterThan(0)
  })

  it('tells an invited runner who invited them', async () => {
    stub()
    vi.spyOn(gateway, 'getRun').mockResolvedValue({ ...run, joined: false } as never)
    view('/runs/run?invitedBy=mali')
    expect(await screen.findByText(/invited you to this run/)).toHaveTextContent('Mali S. invited you to this run.')
  })
})

describe('buddy activity', () => {
  it("shows buddies' upcoming runs and runs we shared", async () => {
    stub({
      buddies: ['mali'],
      requests: [{ id: 'r', senderId: 'me', recipientId: 'mali', status: 'accepted', updatedAt: '2026-11-01T10:00:00Z' }],
      runs: [
        { id: 'sunrise', title: 'Sunrise 5K', organizerId: 'mali', date: '2099-01-01', time: '06:00', startsAt: '2099-01-01T00:00:00Z', joined: false },
        { id: 'lumpini', title: 'Lumpini loop', organizerId: 'me', date: '2020-01-01', time: '18:00', startsAt: '2020-01-01T11:00:00Z', joined: true, participantIds: ['me', 'mali'], confirmedIds: ['me', 'mali'], status: 'completed', distanceKm: 5 },
      ],
    })
    vi.spyOn(gateway, 'getNotifications').mockResolvedValue({ items: [], unreadCount: 0, nextCursor: null })
    vi.spyOn(gateway, 'getHistory').mockResolvedValue({ records: [], totalDistanceMeters: 0, totalDurationSeconds: 0 })
    view('/activity')
    expect(await screen.findByText(/is organising/)).toHaveTextContent('Mali S. is organising Sunrise 5K')
    expect(screen.getByText(/You ran/)).toHaveTextContent('You ran Lumpini loop with Mali S.')
    expect(screen.getByText(/became running buddies/)).toBeInTheDocument()
  })

  it('lets the sender cancel a request that is still pending', async () => {
    stub({ requests: [{ id: 'waiting', senderId: 'me', recipientId: 'narin', status: 'pending' }] })
    vi.spyOn(gateway, 'getNotifications').mockResolvedValue({ items: [], unreadCount: 0, nextCursor: null })
    vi.spyOn(gateway, 'getHistory').mockResolvedValue({ records: [], totalDistanceMeters: 0, totalDurationSeconds: 0 })
    const cancel = vi.spyOn(gateway, 'cancelBuddyRequest').mockResolvedValue(undefined as never)
    view('/activity')
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel request' }))
    await waitFor(() => expect(cancel).toHaveBeenCalledWith('waiting'))
  })

  it('remembers a rating after the page is opened again', async () => {
    stub({ runs: [{ id: 'run', title: 'Past run', joined: true, date: '2020-01-01', time: '18:00', distanceKm: 5, status: 'completed', confirmedIds: ['me', 'mali'], participantIds: ['me', 'mali'] }] })
    vi.spyOn(gateway, 'getNotifications').mockResolvedValue({ items: [], unreadCount: 0, nextCursor: null })
    vi.spyOn(gateway, 'getHistory').mockResolvedValue({ records: [], totalDistanceMeters: 0, totalDurationSeconds: 0 })
    vi.spyOn(gateway, 'rateParticipant').mockResolvedValue(undefined as never)
    view('/activity')
    await userEvent.click(await screen.findByRole('button', { name: 'Rate Mali S.' }))
    expect(await screen.findByText('Rated Mali S.')).toBeInTheDocument()
    cleanup()
    view('/activity')
    expect(await screen.findByText('Rated Mali S.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Rate Mali S.' })).not.toBeInTheDocument()
  })
})
