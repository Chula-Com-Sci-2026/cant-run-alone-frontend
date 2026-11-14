import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, gateway } from '../api/gateway'
import NearbyRadar from '../components/NearbyRadar'

const run = (id: string, latitude: number, longitude: number, startsAt = '2099-01-01T11:00:00Z') => ({ id, title: id, organizer: 'Runner', area: 'Lumphini', meetingPoint: 'Gate 1', date: '2099-01-01', time: '18:00', distanceKm: 5, pace: '6', participants: 2, participantLimit: 5, visibility: 'Public', latitude, longitude, startsAt, weather: { temperature: 29, humidity: 65, rainChance: 20, pm25: 15, level: 'great', label: 'Good' } })

function view() {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><NearbyRadar /></MemoryRouter></QueryClientProvider>)
}

afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('Who\'s nearby radar', () => {
  it('counts upcoming runs within 1 km of the runner\'s area pin', async () => {
    vi.spyOn(gateway, 'getMyProfile').mockResolvedValue({ id: 'me', area: 'Lumphini Park', latitude: 13.73, longitude: 100.541 } as never)
    vi.spyOn(gateway, 'getRuns').mockResolvedValue([
      run('close', 13.7317, 100.5415),
      run('also close', 13.733, 100.545),
      run('3 km away', 13.73, 100.5677),
      run('already started', 13.7301, 100.5411, '2000-01-01T00:00:00Z'),
    ] as never)
    view()
    expect(await screen.findByText('2 runs within 1 km')).toBeInTheDocument()
    expect(screen.getByText('around Lumphini Park')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Who's nearby\? 2 runs within 1 km/ })).toHaveAttribute('href', '/nearby')
  })

  it('still opens Who\'s nearby before a profile exists', async () => {
    vi.spyOn(gateway, 'getMyProfile').mockRejectedValue(new ApiError('Create profile', 404))
    vi.spyOn(gateway, 'getRuns').mockResolvedValue([] as never)
    view()
    expect(await screen.findByRole('link', { name: /Who's nearby\? Runs around you/ })).toHaveAttribute('href', '/nearby')
  })
})
