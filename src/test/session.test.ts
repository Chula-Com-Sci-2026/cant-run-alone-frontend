import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules() })

async function api() {
  vi.resetModules()
  vi.stubEnv('VITE_USE_MOCK_API', 'false')
  return (await import('../api/gateway')).gateway
}

const response = (status: number, body: unknown) => ({ status, ok: status < 400, json: async () => body })

describe('session recovery', () => {
  it('restores the access token through the same-origin refresh cookie', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(response(401, {}))
      .mockResolvedValueOnce(response(200, { accessToken: 'renewed' }))
      .mockResolvedValueOnce(response(200, { greetingName: 'Ray' }))
    vi.stubGlobal('fetch', fetcher)
    const gateway = await api()
    expect(await gateway.getDashboard()).toEqual({ greetingName: 'Ray' })
    expect(fetcher.mock.calls[1][0]).toBe('/api/v1/auth/refresh')
    expect(fetcher.mock.calls[1][1]).toMatchObject({ credentials: 'include', body: '{}' })
    expect(fetcher.mock.calls[2][1].headers.Authorization).toBe('Bearer renewed')
  })

  it('announces an expired session when refresh is rejected', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(401, { message: 'Unauthorized' })))
    const expired = vi.fn()
    window.addEventListener('auth:expired', expired)
    try {
      const gateway = await api()
      await expect(gateway.getDashboard()).rejects.toMatchObject({ message: 'Unauthorized', status: 401 })
      expect(expired).toHaveBeenCalledOnce()
    } finally { window.removeEventListener('auth:expired', expired) }
  })
})
