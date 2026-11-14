import { useCallback, useEffect, useState } from 'react'

export interface Coordinates { latitude: number; longitude: number }
type LocationState = { coordinates: Coordinates | null; status: 'loading' | 'ready' | 'denied' | 'unavailable'; message?: string }

const demoLocation: Coordinates = { latitude: 13.7307, longitude: 100.5418 }

export function useCurrentLocation() {
  const [state, setState] = useState<LocationState>({ coordinates: null, status: 'loading' })
  const locate = useCallback(() => {
    if (!navigator.geolocation) { setState({ coordinates: null, status: 'unavailable', message: 'Location is not supported by this browser.' }); return }
    setState({ coordinates: null, status: 'loading' })
    const found = ({ coords }: GeolocationPosition) => setState({ coordinates: { latitude: coords.latitude, longitude: coords.longitude }, status: 'ready' })
    const failed = (error: GeolocationPositionError) => setState({ coordinates: null, status: error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable', message: error.code === error.PERMISSION_DENIED ? 'Location permission is off.' : 'We could not get your current location.' })
    // Laptops have no GPS, so a high-accuracy fix often times out; a Wi-Fi fix is close enough for 1 km.
    navigator.geolocation.getCurrentPosition(found, (error) => {
      if (error.code === error.PERMISSION_DENIED) { failed(error); return }
      navigator.geolocation.getCurrentPosition(found, failed, { enableHighAccuracy: false, timeout: 20_000, maximumAge: 600_000 })
    }, { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 })
  }, [])
  useEffect(() => {
    const timer = window.setTimeout(locate, 0)
    return () => window.clearTimeout(timer)
  }, [locate])
  const useDemoLocation = () => setState({ coordinates: demoLocation, status: 'ready', message: 'Showing a demo location near Lumphini Park.' })
  return { ...state, locate, useDemoLocation }
}

export function distanceKm(from: Coordinates, to: Coordinates) {
  const earthRadiusKm = 6371
  const radians = (degrees: number) => degrees * Math.PI / 180
  const latitudeDelta = radians(to.latitude - from.latitude)
  const longitudeDelta = radians(to.longitude - from.longitude)
  const a = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(longitudeDelta / 2) ** 2
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
