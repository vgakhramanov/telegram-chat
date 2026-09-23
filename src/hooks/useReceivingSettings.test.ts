import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { GreenApiClient } from '../api/greenApi'
import type { InstanceSettings } from '../types/chat'
import { useReceivingSettings } from './useReceivingSettings'

interface SettingsRequest {
  signal: AbortSignal
  resolve: (settings: InstanceSettings) => void
}

const readySettings: InstanceSettings = {
  typeInstance: 'telegram',
  webhookUrl: '',
  incomingWebhook: 'yes',
}

describe('useReceivingSettings', () => {
  it('cancels a stale check and applies only the latest response', async () => {
    const requests: SettingsRequest[] = []
    const client = {
      getSettings: vi.fn((signal: AbortSignal) =>
        new Promise<InstanceSettings>((resolve) => {
          requests.push({ signal, resolve })
        }),
      ),
    } as unknown as GreenApiClient

    const { result } = renderHook(() => useReceivingSettings(client))
    await waitFor(() => expect(requests).toHaveLength(1))

    act(() => {
      void result.current.retry()
    })
    await waitFor(() => expect(requests).toHaveLength(2))
    expect(requests[0].signal.aborted).toBe(true)

    act(() => {
      requests[0].resolve({
        ...readySettings,
        webhookUrl: 'https://example.com/webhook',
      })
      requests[1].resolve(readySettings)
    })

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.pollingEnabled).toBe(true)
  })

  it('aborts the active settings request on unmount', async () => {
    let requestSignal: AbortSignal | undefined
    const client = {
      getSettings: vi.fn((signal: AbortSignal) => {
        requestSignal = signal
        return new Promise<InstanceSettings>(() => undefined)
      }),
    } as unknown as GreenApiClient

    const { unmount } = renderHook(() => useReceivingSettings(client))
    await waitFor(() => expect(requestSignal).toBeDefined())

    unmount()

    expect(requestSignal?.aborted).toBe(true)
  })
})
