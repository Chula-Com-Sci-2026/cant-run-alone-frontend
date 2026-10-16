import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { gateway } from '../api/gateway'
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
    vi.spyOn(gateway, 'getMyProfile').mockRejectedValue({ message: 'Create profile' })
    const save = vi.spyOn(gateway, 'saveProfile').mockResolvedValue({ id: 'me' } as never)
    view(<ProfilePage />)
    await userEvent.type(screen.getByLabelText('Display name'), 'New Runner')
    await userEvent.click(screen.getByRole('button', { name: 'Save profile' }))
    expect(await screen.findByText('Profile saved.')).toBeInTheDocument()
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Runner', latitude: 13.73, paceMin: 6 }))
  })

  it('accepts incoming buddy requests and reports a failed attendance confirmation', async () => {
    vi.spyOn(gateway, 'getMyProfile').mockResolvedValue({ id: 'me' } as never)
    vi.spyOn(gateway, 'getBuddyRequests').mockResolvedValue([{ id: 'request', senderId: 'buddy', recipientId: 'me', status: 'pending' }])
    vi.spyOn(gateway, 'getNotifications').mockResolvedValue([])
    vi.spyOn(gateway, 'getHistory').mockResolvedValue({ records: [], totalDistanceMeters: 0, totalDurationSeconds: 0 })
    vi.spyOn(gateway, 'getRuns').mockResolvedValue([{ id: 'run', title: 'Past run', joined: true, date: '2020-01-01', time: '18:00', status: 'attendance_open' }] as never)
    const accept = vi.spyOn(gateway, 'respondToBuddyRequest').mockResolvedValue({})
    vi.spyOn(gateway, 'confirmAttendance').mockRejectedValue({ message: 'Only participants can confirm attendance' })
    view(<ActivityPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Accept request' }))
    expect(accept).toHaveBeenCalledWith('request', 'accepted')
    await userEvent.click(screen.getByRole('button', { name: 'Confirm attendance' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Only participants can confirm attendance')
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
