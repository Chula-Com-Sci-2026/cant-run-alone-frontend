import type { Dashboard, Run, Runner } from '../types'

export const runners: Runner[] = [
  { id: 'runner-1', name: 'Mali S.', initials: 'MS', area: 'Lumphini area', distanceKm: 1.2, pace: '6:00–6:30', experience: 'Intermediate', availability: 'Tue & Thu · 18:30', bio: 'After-work runner, coffee fan, and a very reliable pacer.', verified: true, match: 96, rating: 4.9, color: '#f4a261' },
  { id: 'runner-2', name: 'Narin K.', initials: 'NK', area: 'Benjakitti area', distanceKm: 2.4, pace: '5:30–6:00', experience: 'Advanced', availability: 'Wed · 06:00', bio: 'Easy miles on weekdays, longer runs when Bangkok is still quiet.', verified: true, match: 91, rating: 4.7, color: '#5c8d89' },
  { id: 'runner-3', name: 'Pim C.', initials: 'PC', area: 'Chula area', distanceKm: 3.1, pace: '6:30–7:00', experience: 'Beginner', availability: 'Sat & Sun · 07:00', bio: 'Building a first 10K habit. Friendly pace and plenty of water breaks.', verified: false, match: 84, color: '#8367c7' },
  { id: 'runner-4', name: 'Ton P.', initials: 'TP', area: 'Ari area', distanceKm: 4.8, pace: '6:00–6:30', experience: 'Intermediate', availability: 'Mon & Fri · 19:00', bio: 'Night runner who never skips the cooldown.', verified: true, match: 78, rating: 4.8, color: '#e76f51' },
]

export const runs: Run[] = [
  { id: 'run-1', title: 'Sunset social 5K', organizer: 'Mali S.', area: 'Lumphini Park', meetingPoint: 'Clock Tower Gate', latitude: 13.7317, longitude: 100.5415, date: '2026-09-16', time: '18:30', distanceKm: 5, pace: '6:00–6:30', participants: 4, participantLimit: 8, visibility: 'Public', joined: true, weather: { temperature: 29, humidity: 68, rainChance: 20, pm25: 18, level: 'great', label: 'Great to run', updatedAt: '10 min ago' } },
  { id: 'run-2', title: 'Benjakitti easy laps', organizer: 'Narin K.', area: 'Benjakitti Park', meetingPoint: 'Forest Park entrance', latitude: 13.7262, longitude: 100.5604, date: '2026-09-18', time: '06:00', distanceKm: 7, pace: '5:45–6:15', participants: 5, participantLimit: 6, visibility: 'Public', weather: { temperature: 27, humidity: 74, rainChance: 35, pm25: 24, level: 'fair', label: 'Fair conditions', updatedAt: '18 min ago' } },
  { id: 'run-3', title: 'Campus first 5K', organizer: 'Pim C.', area: 'Chulalongkorn University', meetingPoint: 'Centenary Park lawn', latitude: 13.7383, longitude: 100.5238, date: '2026-09-20', time: '07:00', distanceKm: 5, pace: '6:30–7:00', participants: 3, participantLimit: 10, visibility: 'Public', weather: { temperature: 30, humidity: 79, rainChance: 65, pm25: 31, level: 'poor', label: 'Plan with care', updatedAt: '25 min ago', stale: true } },
]

export const dashboard: Dashboard = {
  greetingName: 'Ray',
  weeklyDistanceKm: 12.4,
  nextRun: runs[0],
  suggestedRunners: runners.slice(0, 3),
}
