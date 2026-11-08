export type Experience = 'Beginner' | 'Intermediate' | 'Advanced'
export type WeatherLevel = 'great' | 'fair' | 'poor'

/** A runner's public card from Profile (running-buddy-contracts profile.openapi.json, PublicCard). A hidden or unset field is null. */
export interface Runner {
  id: string
  name: string
  area: string
  areaCell: { latitude: number; longitude: number }
  photoUrl: string | null
  bio: string | null
  paceMin: number | null
  paceMax: number | null
  experience: Experience | null
  availability: string | null
  usualDistance: string | null
  gear: string[] | null
  /** Search results only: kilometres between area cells, never exact points. */
  distanceKm?: number
  rating?: number
}

/** The owner's view of their own profile (profile.openapi.json, Profile). */
export interface MyProfile extends Runner {
  paceMin: number
  paceMax: number
  experience: Experience
  availability: string
  latitude: number
  longitude: number
  photoRef: string | null
  hiddenFields: string[]
}

export interface Weather {
  temperature: number
  humidity: number
  rainChance: number
  pm25: number
  level: WeatherLevel
  label: string
  updatedAt: string
  stale?: boolean
}

export interface Run {
  id: string
  title: string
  organizer: string
  area: string
  meetingPoint: string
  latitude: number
  longitude: number
  date: string
  time: string
  distanceKm: number
  pace: string
  participants: number
  participantLimit: number
  visibility: 'Public' | 'Invite only'
  weather: Weather
  joined?: boolean
  status?: string
  participantIds?: string[]
  confirmedIds?: string[]
}

export interface Dashboard {
  greetingName: string
  weeklyDistanceKm: number
  nextRun: Run | null
  suggestedRunners: Runner[]
}

export interface RunnerFilters {
  radiusKm: number
  pace: string
  experience: 'All' | Experience
}

export interface CreateRunInput {
  title: string
  meetingPoint: string
  date: string
  time: string
  distanceKm: number
  pace: string
  participantLimit: number
  visibility: Run['visibility']
  latitude: number
  longitude: number
}

export interface ApiErrorBody {
  code: string
  message: string
  fieldErrors?: Record<string, string>
  correlationId: string
}
