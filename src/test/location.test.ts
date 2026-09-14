import { describe, expect, it } from 'vitest'
import { distanceKm } from '../hooks/useCurrentLocation'

describe('nearby event distance', () => {
  it('calculates a Lumphini event inside the one-kilometre radius', () => {
    const distance = distanceKm(
      { latitude: 13.7307, longitude: 100.5418 },
      { latitude: 13.7317, longitude: 100.5415 },
    )
    expect(distance).toBeGreaterThan(0.1)
    expect(distance).toBeLessThan(1)
  })

  it('excludes a distant Bangkok event from the one-kilometre radius', () => {
    const distance = distanceKm(
      { latitude: 13.7307, longitude: 100.5418 },
      { latitude: 13.7563, longitude: 100.5018 },
    )
    expect(distance).toBeGreaterThan(1)
  })
})
