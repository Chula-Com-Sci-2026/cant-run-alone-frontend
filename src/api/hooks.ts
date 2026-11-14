import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { gateway } from './gateway'
import type { CreateRunInput, Run, RunnerFilters } from '../types'

export const useDashboard = () => useQuery({ queryKey: ['dashboard'], queryFn: gateway.getDashboard })
export const useRunners = (filters: RunnerFilters) => useQuery({ queryKey: ['runners', filters], queryFn: () => gateway.getRunners(filters) })
export const useRunner = (id: string) => useQuery({ queryKey: ['runner', id], queryFn: () => gateway.getRunner(id), enabled: Boolean(id) })
// The API also returns past runs the caller took part in; Activity needs those, browsing does not.
export const hasStarted = (run: Run) => !!run.startsAt && new Date(run.startsAt) <= new Date()
// Older runs may not carry endsAt; Scheduling's default length is one hour.
export const endsAt = (run: Run) => run.endsAt ? new Date(run.endsAt) : new Date(new Date(`${run.date}T${run.time}:00+07:00`).getTime() + 3600000)
export const hasEnded = (run: Run) => endsAt(run) <= new Date()
export const useUpcomingRuns = () => useQuery({ queryKey: ['runs'], queryFn: gateway.getRuns, select: (runs: Run[]) => runs.filter((run) => !hasStarted(run)) })
export const useRun = (id: string) => useQuery({ queryKey: ['run', id], queryFn: () => gateway.getRun(id) })
export const useMe = () => useQuery({ queryKey: ['me'], queryFn: gateway.getMyProfile })
// Same keys as Activity and the tab badge, so sending, cancelling or answering refreshes all of them.
export const useBuddyRequests = () => useQuery({ queryKey: ['requests'], queryFn: gateway.getBuddyRequests })
export const useRatingSummary = (runnerId: string) => useQuery({ queryKey: ['rating-summary', runnerId], queryFn: () => gateway.getRatingSummary(runnerId), retry: false })
export const useRunningSummary = (runnerId: string) => useQuery({ queryKey: ['running-summary', runnerId], queryFn: () => gateway.getRunningSummary(runnerId), retry: false })
export const useBuddies = () => useQuery({ queryKey: ['buddies'], queryFn: gateway.getBuddies })
// Profiles for a list of runner ids, sharing the ['runner', id] cache with every other screen. A hidden
// or deleted profile fails on its own without breaking the list.
export const useRunnersById = (ids: string[]) => useQueries({ queries: ids.map((id) => ({ queryKey: ['runner', id], queryFn: () => gateway.getRunner(id), staleTime: 300_000, retry: false })) })
function useRefreshBuddies() {
  const client = useQueryClient()
  return () => Promise.all(['requests', 'buddies', 'dashboard', 'notifications'].map((key) => client.invalidateQueries({ queryKey: [key] })))
}
export const useBuddyRequest = () => {
  const refresh = useRefreshBuddies()
  return useMutation({ mutationFn: ({ runnerId, note }: { runnerId: string; note: string }) => gateway.sendBuddyRequest(runnerId, note), onSettled: refresh })
}
export const useCancelBuddyRequest = () => {
  const refresh = useRefreshBuddies()
  return useMutation({ mutationFn: (id: string) => gateway.cancelBuddyRequest(id), onSettled: refresh })
}
export const useAnswerBuddyRequest = () => {
  const refresh = useRefreshBuddies()
  return useMutation({ mutationFn: ({ id, decision }: { id: string; decision: 'accepted' | 'rejected' }) => gateway.respondToBuddyRequest(id, decision), onSettled: refresh })
}
export const useCreateRun = () => {
  const client = useQueryClient()
  return useMutation({ mutationFn: (input: CreateRunInput) => gateway.createRun(input), onSuccess: () => client.invalidateQueries({ queryKey: ['runs'] }) })
}
export const useToggleRun = () => {
  const client = useQueryClient()
  return useMutation({ mutationFn: ({ id, join }: { id: string; join: boolean }) => gateway.toggleRun(id, join), onSuccess: (_, variables) => { client.invalidateQueries({ queryKey: ['runs'] }); client.invalidateQueries({ queryKey: ['run', variables.id] }) } })
}
// Finishing opens attendance, ratings and logging on Activity, so runs refresh everywhere.
export const useFinishRun = () => {
  const client = useQueryClient()
  return useMutation({ mutationFn: (id: string) => gateway.finishRun(id), onSuccess: (_, id) => { client.invalidateQueries({ queryKey: ['runs'] }); client.invalidateQueries({ queryKey: ['run', id] }) } })
}

// What the Activity tab badge counts: incoming requests still waiting for my answer, plus unread
// notifications about anything else. A request and its "sent you a request" notification count once.
// The query keys are Activity's own, so its actions refresh the badge too.
export function useActivityCount() {
  const me = useQuery({ queryKey: ['me'], queryFn: gateway.getMyProfile })
  const requests = useQuery({ queryKey: ['requests'], queryFn: gateway.getBuddyRequests, refetchInterval: 10000 })
  const notifications = useQuery({ queryKey: ['notifications'], queryFn: gateway.getNotifications, refetchInterval: 10000 })
  const waiting = new Set((requests.data ?? []).filter((request) => request.status === 'pending' && request.recipientId === me.data?.id).map((request) => request.id))
  const unread = (notifications.data?.items ?? []).filter((item) => !item.readAt && !waiting.has(item.data.requestId))
  return waiting.size + unread.length
}
