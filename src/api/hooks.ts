import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { gateway } from './gateway'
import type { CreateRunInput, Run, RunnerFilters } from '../types'

export const useDashboard = () => useQuery({ queryKey: ['dashboard'], queryFn: gateway.getDashboard })
export const useRunners = (filters: RunnerFilters) => useQuery({ queryKey: ['runners', filters], queryFn: () => gateway.getRunners(filters) })
export const useRunner = (id: string) => useQuery({ queryKey: ['runner', id], queryFn: () => gateway.getRunner(id) })
// The API also returns past runs the caller took part in; Activity needs those, browsing does not.
export const hasStarted = (run: Run) => !!run.startsAt && new Date(run.startsAt) <= new Date()
export const useUpcomingRuns = () => useQuery({ queryKey: ['runs'], queryFn: gateway.getRuns, select: (runs: Run[]) => runs.filter((run) => !hasStarted(run)) })
export const useRun = (id: string) => useQuery({ queryKey: ['run', id], queryFn: () => gateway.getRun(id) })
export const useBuddyRequest = () => useMutation({ mutationFn: ({ runnerId, note }: { runnerId: string; note: string }) => gateway.sendBuddyRequest(runnerId, note) })
export const useCreateRun = () => {
  const client = useQueryClient()
  return useMutation({ mutationFn: (input: CreateRunInput) => gateway.createRun(input), onSuccess: () => client.invalidateQueries({ queryKey: ['runs'] }) })
}
export const useToggleRun = () => {
  const client = useQueryClient()
  return useMutation({ mutationFn: ({ id, join }: { id: string; join: boolean }) => gateway.toggleRun(id, join), onSuccess: (_, variables) => { client.invalidateQueries({ queryKey: ['runs'] }); client.invalidateQueries({ queryKey: ['run', variables.id] }) } })
}
