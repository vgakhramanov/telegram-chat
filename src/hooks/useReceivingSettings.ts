import { useCallback, useEffect, useRef, useState } from 'react'
import type { GreenApiClient } from '../api/greenApi'
import type { InstanceSettings } from '../types/chat'
import { isAbortError } from './polling'

export type ReceivingStatus =
  | 'checking'
  | 'ready'
  | 'disabled'
  | 'webhook-conflict'
  | 'activating'
  | 'error'

type CheckedReceivingStatus = Extract<
  ReceivingStatus,
  'ready' | 'disabled' | 'webhook-conflict'
>

function statusFromSettings(settings: InstanceSettings): CheckedReceivingStatus {
  if (settings.webhookUrl.trim()) return 'webhook-conflict'
  if (settings.incomingWebhook !== 'yes') return 'disabled'
  return 'ready'
}

export function useReceivingSettings(client: GreenApiClient) {
  const controllerRef = useRef<AbortController | null>(null)
  const [status, setStatus] = useState<ReceivingStatus>('checking')
  const [error, setError] = useState<string | null>(null)
  const [pollingEnabled, setPollingEnabled] = useState(false)

  const beginRequest = useCallback(() => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    return controller
  }, [])

  const readStatus = useCallback((signal: AbortSignal) => {
    return client.getSettings(signal).then(statusFromSettings)
  }, [client])

  const applyStatus = useCallback((nextStatus: CheckedReceivingStatus) => {
    setStatus(nextStatus)
    setPollingEnabled(nextStatus === 'ready')
  }, [])

  const applyCheckError = useCallback((requestError: unknown) => {
    setStatus('error')
    setError(
      requestError instanceof Error
        ? requestError.message
        : 'Не удалось проверить настройки',
    )
  }, [])

  useEffect(() => {
    const controller = beginRequest()
    void readStatus(controller.signal)
      .then((nextStatus) => {
        if (!controller.signal.aborted) applyStatus(nextStatus)
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted && !isAbortError(requestError)) {
          applyCheckError(requestError)
        }
      })
    return () => controllerRef.current?.abort()
  }, [applyCheckError, applyStatus, beginRequest, readStatus])

  const retry = useCallback(async (): Promise<void> => {
    const controller = beginRequest()
    setStatus('checking')
    setError(null)
    setPollingEnabled(false)

    try {
      const nextStatus = await readStatus(controller.signal)
      if (!controller.signal.aborted) applyStatus(nextStatus)
    } catch (requestError) {
      if (!controller.signal.aborted && !isAbortError(requestError)) {
        applyCheckError(requestError)
      }
    }
  }, [applyCheckError, applyStatus, beginRequest, readStatus])

  const enable = useCallback(async (): Promise<void> => {
    const controller = beginRequest()
    setStatus('activating')
    setError(null)
    setPollingEnabled(false)

    try {
      await client.enableIncomingNotifications(controller.signal)
      if (!controller.signal.aborted) setPollingEnabled(true)
    } catch (requestError) {
      if (controller.signal.aborted || isAbortError(requestError)) return
      setStatus('error')
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Не удалось включить уведомления',
      )
    }
  }, [beginRequest, client])

  const markReady = useCallback(() => {
    setStatus('ready')
    setError(null)
  }, [])

  return {
    status,
    error,
    pollingEnabled,
    enable,
    retry,
    markReady,
  }
}
