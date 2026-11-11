import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { gateway } from '../api/gateway'

vi.stubEnv('VITE_USE_MOCK_API', 'true')

function renderApp(route = '/') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[route]}><App /></MemoryRouter></QueryClientProvider>)
}

afterEach(cleanup)

describe('core frontend flows', () => {
  it('shows dashboard data through the gateway layer', async () => {
    renderApp()
    expect(await screen.findByText('Sunset social 5K')).toBeInTheDocument()
    expect(screen.getByText(/Great to run/)).toBeInTheDocument()
    expect(screen.getByText(/12.4/)).toBeInTheDocument()
  })

  it('filters discovery results by experience', async () => {
    renderApp('/discover')
    expect(await screen.findByText('Pim C.')).toBeInTheDocument()
    await userEvent.selectOptions(screen.getByLabelText('Experience'), 'Advanced')
    await waitFor(() => expect(screen.queryByText('Pim C.')).not.toBeInTheDocument())
    expect(await screen.findByText('Narin K.')).toBeInTheDocument()
  })

  it('narrows discovery results by name', async () => {
    renderApp('/discover')
    expect(await screen.findByText('Pim C.')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Search runners by name'), 'nar')
    expect(screen.getByText('Narin K.')).toBeInTheDocument()
    expect(screen.queryByText('Pim C.')).not.toBeInTheDocument()
    await userEvent.clear(screen.getByLabelText('Search runners by name'))
    await userEvent.type(screen.getByLabelText('Search runners by name'), 'zz')
    expect(screen.getByText('No runner named “zz”')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(screen.getByText('Pim C.')).toBeInTheDocument()
  })

  it('shows a runner card from the public profile fields', async () => {
    renderApp('/discover')
    expect(await screen.findByText('Mali S.')).toBeInTheDocument()
    expect(screen.getAllByText('6:00–6:30 min/km').length).toBeGreaterThan(0)
    expect(screen.getAllByLabelText('Mali S. avatar')[0]).toHaveTextContent('MS')
  })

  it('badges Activity with what needs an answer, counting a request and its notification once', async () => {
    const unread = (id: string, requestId: string) => ({ id, type: 'BuddyRequestCreated', category: 'buddy', data: { requestId, senderId: 'top', recipientId: 'me', status: 'pending' }, occurredAt: '2026-11-11T13:15:00Z', readAt: null })
    vi.spyOn(gateway, 'getMyProfile').mockResolvedValue({ id: 'me' } as never)
    vi.spyOn(gateway, 'getBuddyRequests').mockResolvedValue([{ id: 'from-top', senderId: 'top', recipientId: 'me', status: 'pending' }, { id: 'to-mali', senderId: 'me', recipientId: 'mali', status: 'pending' }])
    vi.spyOn(gateway, 'getNotifications').mockResolvedValue({ items: [unread('n1', 'from-top'), unread('n2', 'accepted-earlier'), { ...unread('n3', 'old'), readAt: '2026-11-10T00:00:00Z' }], unreadCount: 2, nextCursor: null })
    renderApp('/discover')
    expect((await screen.findAllByText('need your attention', { exact: false }))[0].parentElement).toHaveTextContent('2')
    vi.restoreAllMocks()
  })

  it('changes the visible navigation language', async () => {
    renderApp('/discover')
    await userEvent.click(screen.getByRole('button', { name: 'ไทย' }))
    expect((await screen.findAllByText('หน้าหลัก')).length).toBeGreaterThan(0)
  })
})
