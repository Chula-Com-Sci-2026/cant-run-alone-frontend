import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, gateway } from '../api/gateway'
import RegisterPage from '../pages/RegisterPage'
import ProfilePage from '../pages/ProfilePage'
import ActivityPage from '../pages/ActivityPage'
import CreateRunPage from '../pages/CreateRunPage'

vi.mock('../components/MeetingPointMap', () => ({ default: () => <div>Meeting point map</div> }))

function view(element: React.ReactNode) {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}><MemoryRouter><Routes><Route path="/" element={element} /><Route path="/profile" element={<p>Profile setup</p>} /><Route path="/runs/:id" element={<p>Created run</p>} /></Routes></MemoryRouter></QueryClientProvider>)
}

afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('delivery 4 user flows', () => {
  it('registers and verifies the entered OTP before profile setup', async () => {
    const register = vi.spyOn(gateway, 'register').mockResolvedValue({ registrationId: 'registration', maskedPhone: '+66••••1111', deliveryAdapter: 'local-console' })
    const verify = vi.spyOn(gateway, 'verifyOtp').mockResolvedValue({ accessToken: 'token', userId: 'me' })
    view(<RegisterPage />)
    await userEvent.type(screen.getByLabelText('Email'), 'new@example.com')
    await userEvent.type(screen.getByLabelText('Thai mobile number'), '+66811111111')
    await userEvent.type(screen.getByLabelText('Password'), 'runner123')
    await userEvent.click(screen.getByRole('checkbox'))
    await userEvent.click(screen.getByRole('button', { name: 'Send verification code' }))
    await userEvent.type(await screen.findByLabelText('Verification code'), '654321')
    await userEvent.click(screen.getByRole('button', { name: 'Verify phone' }))
    expect(await screen.findByText('Profile setup')).toBeInTheDocument()
    expect(register).toHaveBeenCalledWith(expect.objectContaining({ email: 'new@example.com', pdpaConsent: true }))
    expect(verify).toHaveBeenCalledWith('registration', '654321')
  })

  it('saves the entered runner profile through the gateway', async () => {
    vi.spyOn(gateway, 'getMyProfile').mockRejectedValue(new ApiError('Create profile', 404))
    const save = vi.spyOn(gateway, 'saveProfile').mockResolvedValue({ id: 'me' } as never)
    view(<ProfilePage />)
    await userEvent.type(await screen.findByLabelText('Display name'), 'New Runner')
    await userEvent.click(screen.getByRole('button', { name: 'Save profile' }))
    expect(await screen.findByText('Profile saved.')).toBeInTheDocument()
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Runner', latitude: 13.73, paceMin: 6 }))
  })

  it('keeps the empty editor hidden while the profile is loading', async () => {
    let finish!: (profile: never) => void
    vi.spyOn(gateway, 'getMyProfile').mockReturnValue(new Promise(resolve => { finish = resolve }))
    view(<ProfilePage />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading your profile')
    expect(screen.queryByLabelText('Display name')).not.toBeInTheDocument()
    finish({ id: 'mali', name: 'Mali S.', bio: 'Morning runner' } as never)
    expect(await screen.findByLabelText('Display name')).toHaveValue('Mali S.')
  })

  it('offers retry instead of an empty editor after a profile request fails', async () => {
    vi.spyOn(gateway, 'getMyProfile')
      .mockRejectedValueOnce(new ApiError('Profile service unavailable', 503))
      .mockResolvedValue({ id: 'ray', name: 'Ray Attajak' } as never)
    view(<ProfilePage />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Profile service unavailable')
    expect(screen.queryByLabelText('Display name')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByLabelText('Display name')).toHaveValue('Ray Attajak')
  })

  it('accepts incoming buddy requests and reports a failed attendance confirmation', async () => {
    vi.spyOn(gateway, 'getMyProfile').mockResolvedValue({ id: 'me' } as never)
    vi.spyOn(gateway, 'getBuddyRequests').mockResolvedValue([{ id: 'request', senderId: 'buddy', recipientId: 'me', status: 'pending' }])
    vi.spyOn(gateway, 'getNotifications').mockResolvedValue({ items: [], unreadCount: 0, nextCursor: null })
    vi.spyOn(gateway, 'getHistory').mockResolvedValue({ records: [], totalDistanceMeters: 0, totalDurationSeconds: 0 })
    vi.spyOn(gateway, 'getRuns').mockResolvedValue([{ id: 'run', title: 'Past run', joined: true, date: '2020-01-01', time: '18:00', status: 'attendance_open' }] as never)
    const accept = vi.spyOn(gateway, 'respondToBuddyRequest').mockResolvedValue({})
    vi.spyOn(gateway, 'confirmAttendance').mockRejectedValue({ message: 'Only participants can confirm attendance' })
    view(<ActivityPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Accept request' }))
    expect(accept).toHaveBeenCalledWith('request', 'accepted')
    await userEvent.click(screen.getByRole('button', { name: 'Confirm attendance' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Only participants can confirm attendance')
  })
  it('shows the buddy name when rating a confirmed runner', async () => {
    vi.spyOn(gateway, 'getMyProfile').mockResolvedValue({ id: 'me' } as never)
    vi.spyOn(gateway, 'getBuddyRequests').mockResolvedValue([])
    vi.spyOn(gateway, 'getNotifications').mockResolvedValue({ items: [], unreadCount: 0, nextCursor: null })
    vi.spyOn(gateway, 'getHistory').mockResolvedValue({ records: [], totalDistanceMeters: 0, totalDurationSeconds: 0 })
    vi.spyOn(gateway, 'getRuns').mockResolvedValue([{ id: 'run', title: 'Past run', joined: true, date: '2020-01-01', time: '18:00', status: 'completed', confirmedIds: ['me', '22222222-buddy'], distanceKm: 5 }] as never)
    vi.spyOn(gateway, 'getRunner').mockResolvedValue({ name: 'Mali S.' } as never)
    const rate = vi.spyOn(gateway, 'rateParticipant').mockResolvedValue({})
    view(<ActivityPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Rate Mali S.' }))
    expect(rate).toHaveBeenCalledWith('run', '22222222-buddy', 5)
    expect(screen.queryByText(/22222222/)).not.toBeInTheDocument()
    // The button is replaced by the result, and the feedback sits in the run card.
    expect(await screen.findByText('Rated Mali S. 5 out of 5.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Rate Mali S.' })).not.toBeInTheDocument()
  })
  it('checks real gateway conditions before allowing run publication', async () => {
    const conditions = vi.spyOn(gateway, 'getConditions').mockResolvedValue({ temperature: 29, humidity: 60, rainChance: 10, pm25: 15, level: 'great', label: 'Great to run', updatedAt: 'Now' })
    const create = vi.spyOn(gateway, 'createRun').mockResolvedValue({ id: 'created' } as never)
    view(<CreateRunPage />)
    await userEvent.click(screen.getByRole('button', { name: 'Check weather & continue' }))
    expect(await screen.findByText('Great to run')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Publish run' }))
    expect(await screen.findByText('Created run')).toBeInTheDocument()
    expect(conditions).toHaveBeenCalledWith(expect.objectContaining({ latitude: 13.7317, visibility: 'Public' }))
    expect(create).toHaveBeenCalledOnce()
  })

})

describe('past run steps', () => {
  function stubActivity(run: object, records: object[] = []) {
    vi.spyOn(gateway, 'getMyProfile').mockResolvedValue({ id: 'me' } as never)
    vi.spyOn(gateway, 'getBuddyRequests').mockResolvedValue([])
    vi.spyOn(gateway, 'getNotifications').mockResolvedValue({ items: [], unreadCount: 0, nextCursor: null })
    vi.spyOn(gateway, 'getHistory').mockResolvedValue({ records, totalDistanceMeters: 0, totalDurationSeconds: 0 } as never)
    vi.spyOn(gateway, 'getRuns').mockResolvedValue([{ id: 'run', title: 'Past run', joined: true, date: '2020-01-01', time: '18:00', distanceKm: 5, ...run }] as never)
    vi.spyOn(gateway, 'getRunner').mockResolvedValue({ name: 'Mali S.' } as never)
  }

  it('shows finished steps as results instead of buttons', async () => {
    stubActivity({ status: 'completed', confirmedIds: ['me', 'buddy'] }, [{ id: 'record', run_id: 'run', distance_meters: 5000, duration_seconds: 1800, occurred_at: '2020-01-01T12:00:00Z' }])
    view(<ActivityPage />)
    expect(await screen.findByText('Logged 5 km in 30 minutes.')).toBeInTheDocument()
    expect(screen.getByText('You and your buddy both confirmed. The run is complete.')).toBeInTheDocument()
    expect(screen.getByText('All done')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Confirm attendance' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Save running record' })).not.toBeInTheDocument()
  })

  it('keeps rating and logging locked while the buddy has not confirmed', async () => {
    stubActivity({ status: 'attendance_open', confirmedIds: ['me'] })
    view(<ActivityPage />)
    expect(await screen.findByText('You confirmed. Waiting for your buddy to confirm too.')).toBeInTheDocument()
    expect(screen.getAllByText('Opens once everyone has confirmed attendance.')).toHaveLength(2)
    expect(screen.queryByRole('button', { name: 'Save running record' })).not.toBeInTheDocument()
  })

  it('treats a duplicate rating as already rated', async () => {
    stubActivity({ status: 'completed', confirmedIds: ['me', 'buddy'] })
    vi.spyOn(gateway, 'rateParticipant').mockRejectedValue(new ApiError('Run has already been taken', 422))
    view(<ActivityPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Rate Mali S.' }))
    expect(await screen.findByText('You already rated Mali S. for this run.')).toBeInTheDocument()
    expect(screen.getByText('Rated Mali S.')).toBeInTheDocument()
  })

  it('keeps past runs in a stable order whatever order the API returns', async () => {
    stubActivity({})
    const older = { id: 'older', title: 'Older run', joined: true, date: '2020-01-01', time: '18:00', distanceKm: 5, status: 'attendance_open', confirmedIds: [] }
    const newer = { id: 'newer', title: 'Newer run', joined: true, date: '2020-02-01', time: '18:00', distanceKm: 5, status: 'attendance_open', confirmedIds: [] }
    vi.spyOn(gateway, 'getRuns').mockResolvedValue([older, newer] as never)
    view(<ActivityPage />)
    const titles = (await screen.findAllByRole('heading', { level: 3 })).map((heading) => heading.textContent)
    expect(titles).toEqual(['Newer run', 'Older run'])
  })
})

describe('buddy requests and notifications', () => {
  it('names the other runner and asks only for the answers that are needed', async () => {
    vi.spyOn(gateway, 'getMyProfile').mockResolvedValue({ id: 'me' } as never)
    vi.spyOn(gateway, 'getBuddyRequests').mockResolvedValue([
      { id: 'answered', senderId: 'me', recipientId: 'mali', status: 'accepted' },
      { id: 'answered-again', senderId: 'mali', recipientId: 'me', status: 'accepted' },
      { id: 'incoming', senderId: 'mali', recipientId: 'me', status: 'pending' },
    ])
    vi.spyOn(gateway, 'getNotifications').mockResolvedValue({ items: [{ id: 'note', type: 'BuddyRequestSent', category: 'buddy_requests', data: { requestId: 'incoming', senderId: 'mali', recipientId: 'me', status: 'pending' }, occurredAt: '2026-11-08T05:00:00Z', readAt: null }], unreadCount: 1, nextCursor: null })
    vi.spyOn(gateway, 'getHistory').mockResolvedValue({ records: [], totalDistanceMeters: 0, totalDurationSeconds: 0 })
    vi.spyOn(gateway, 'getRuns').mockResolvedValue([])
    vi.spyOn(gateway, 'getRunner').mockResolvedValue({ id: 'mali', name: 'Mali S.', photoUrl: null } as never)
    view(<ActivityPage />)
    // Names arrive from Profile after the rows render.
    await waitFor(() => expect(screen.getByText(/wants to run with you/)).toHaveTextContent('Mali S. wants to run with you'))
    // Two accepted requests between the same runners show as one buddy.
    expect(screen.getByText(/are running buddies/)).toHaveTextContent('You and Mali S. are running buddies')
    expect(screen.getByText(/sent you a buddy request/)).toHaveTextContent('Mali S. sent you a buddy request')
    // Only the incoming pending request gets answer buttons.
    expect(screen.getAllByRole('button', { name: 'Accept request' })).toHaveLength(1)
  })
})

