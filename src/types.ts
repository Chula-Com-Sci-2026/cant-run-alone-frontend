export type Experience = 'Beginner' | 'Intermediate' | 'Advanced'
export type WeatherLevel = 'great' | 'fair' | 'poor'

export interface Runner {
  id: string
  name: string
  initials: string
  area: string
  distanceKm: number
  pace: string
  experience: Experience
  availability: string
  bio: string
  verified: boolean
  match: number
  rating?: number
  color: string
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
  verifiedOnly: boolean
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
