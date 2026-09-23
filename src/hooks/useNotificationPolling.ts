import { useEffect, useState } from 'react'
import type { GreenApiClient } from '../api/greenApi'
import {
  abortableDelay,
  calculateRetryDelay,
  isAbortError,
  isRetryablePollingError,
} from './polling'

export type PollingState = 'listening' | 'reconnecting' | 'failed'

interface UseNotificationPollingOptions {
  client: GreenApiClient
  enabled: boolean
  onNotification: (body: unknown) => void | Promise<void>
  onConnected?: () => void
}

export function useNotificationPolling({
  client,
  enabled,
  onNotification,
  onConnected,
}: UseNotificationPollingOptions) {
  const [state, setState] = useState<PollingState>('listening')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) return

    const controller = new AbortController()
    const { signal } = controller

    async function poll(): Promise<void> {
      let retryAttempt = 0
      setState('listening')
      setError(null)

      while (!signal.aborted) {
        try {
          const notification = await client.receiveNotification(signal)
          if (signal.aborted) return

          retryAttempt = 0
          setState('listening')
          setError(null)
          onConnected?.()

          if (!notification) continue

          await onNotification(notification.body)
          if (signal.aborted) return
          await client.deleteNotification(notification.receiptId, signal)
        } catch (pollingError) {
          if (signal.aborted || isAbortError(pollingError)) return

          setError(
            pollingError instanceof Error
              ? pollingError.message
              : 'Не удалось получить сообщения',
          )

          if (!isRetryablePollingError(pollingError)) {
            setState('failed')
            return
          }

          setState('reconnecting')
          const delay = calculateRetryDelay(retryAttempt)
          retryAttempt += 1
          await abortableDelay(delay, signal)
        }
      }
    }

    void poll()
    return () => controller.abort()
  }, [client, enabled, onConnected, onNotification])

  return { state, error }
}
