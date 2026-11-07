import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../App'

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

  it('filters discovery results to verified runners', async () => {
    renderApp('/discover')
    expect(await screen.findByText('Pim C.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('checkbox', { name: /verified only/i }))
    await waitFor(() => expect(screen.queryByText('Pim C.')).not.toBeInTheDocument())
    expect(await screen.findByText('Mali S.')).toBeInTheDocument()
  })

  it('changes the visible navigation language', async () => {
    renderApp('/discover')
    await userEvent.click(screen.getByRole('button', { name: 'ไทย' }))
    expect((await screen.findAllByText('หน้าหลัก')).length).toBeGreaterThan(0)
  })
})
