import { GreenApiError } from '../api/greenApi'

const BASE_RETRY_DELAY = 2_000
const MAX_RETRY_DELAY = 30_000
const JITTER_FACTOR = 0.2

export function calculateRetryDelay(
  attempt: number,
  random: () => number = Math.random,
): number {
  const exponentialDelay = Math.min(
    MAX_RETRY_DELAY,
    BASE_RETRY_DELAY * 2 ** Math.max(0, attempt),
  )
  const jitter = 1 - JITTER_FACTOR + random() * JITTER_FACTOR * 2

  return Math.min(MAX_RETRY_DELAY, Math.round(exponentialDelay * jitter))
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

export function isRetryablePollingError(error: unknown): boolean {
  if (!(error instanceof GreenApiError) || error.status === undefined) return true
  if (error.status === 408 || error.status === 425 || error.status === 429) return true

  return error.status >= 500
}

export function abortableDelay(
  milliseconds: number,
  signal: AbortSignal,
): Promise<void> {
  if (signal.aborted) return Promise.resolve()

  return new Promise((resolve) => {
    const finish = () => {
      window.clearTimeout(timeoutId)
      signal.removeEventListener('abort', finish)
      resolve()
    }
    const timeoutId = window.setTimeout(finish, milliseconds)
    signal.addEventListener('abort', finish, { once: true })
  })
}
