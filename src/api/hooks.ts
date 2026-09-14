import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { gateway } from './gateway'
import type { CreateRunInput, RunnerFilters } from '../types'

export const useDashboard = () => useQuery({ queryKey: ['dashboard'], queryFn: gateway.getDashboard })
export const useRunners = (filters: RunnerFilters) => useQuery({ queryKey: ['runners', filters], queryFn: () => gateway.getRunners(filters) })
export const useRunner = (id: string) => useQuery({ queryKey: ['runner', id], queryFn: () => gateway.getRunner(id) })
export const useRuns = () => useQuery({ queryKey: ['runs'], queryFn: gateway.getRuns })
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
