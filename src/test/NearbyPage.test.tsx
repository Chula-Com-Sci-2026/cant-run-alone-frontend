import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, gateway } from '../api/gateway'
import NearbyPage from '../pages/NearbyPage'

vi.mock('../components/NearbyEventsMap', () => ({ default: () => <div>Nearby map</div> }))

const run = { id: 'close', title: 'Sunset social 5K', organizer: 'Mali', area: 'Lumphini', meetingPoint: 'Clock Tower', date: '2099-01-01', time: '18:30', distanceKm: 5, pace: '6', participants: 1, participantLimit: 8, visibility: 'Public', latitude: 13.7317, longitude: 100.5415, startsAt: '2099-01-01T11:30:00Z', weather: { temperature: 29, humidity: 65, rainChance: 20, pm25: 15, level: 'great', label: 'Good' } }

// Every attempt fails as a laptop without a Wi-Fi fix does.
function locationUnavailable() {
  const error = { code: 2, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3, message: 'unavailable' }
  const getCurrentPosition = vi.fn((_found: unknown, failed: (e: typeof error) => void) => failed(error))
  vi.stubGlobal('navigator', { ...navigator, geolocation: { getCurrentPosition } })
  return getCurrentPosition
}

function view() {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><NearbyPage /></MemoryRouter></QueryClientProvider>)
}

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('Who\'s nearby page', () => {
  it('retries at low accuracy, then shows runs around the saved pin', async () => {
    const getCurrentPosition = locationUnavailable()
    vi.spyOn(gateway, 'getMyProfile').mockResolvedValue({ id: 'me', area: 'Lumphini Park', latitude: 13.73, longitude: 100.541 } as never)
    vi.spyOn(gateway, 'getRuns').mockResolvedValue([run] as never)
    view()
    expect(await screen.findByText('Sunset social 5K')).toBeInTheDocument()
    expect(screen.getByText(/Showing runs around your saved pin in Lumphini Park/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Use my location/ })).toBeInTheDocument()
    expect(getCurrentPosition).toHaveBeenCalledTimes(2)
  })

  it('offers the demo location when there is no saved pin either', async () => {
    locationUnavailable()
    vi.spyOn(gateway, 'getMyProfile').mockRejectedValue(new ApiError('Create profile', 404))
    vi.spyOn(gateway, 'getRuns').mockResolvedValue([run] as never)
    view()
    expect(await screen.findByRole('button', { name: 'Use demo location' })).toBeInTheDocument()
  })
})
