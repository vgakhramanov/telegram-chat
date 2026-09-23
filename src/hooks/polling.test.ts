import { afterEach, describe, expect, it, vi } from 'vitest'
import { GreenApiError } from '../api/greenApi'
import {
  abortableDelay,
  calculateRetryDelay,
  isRetryablePollingError,
} from './polling'

afterEach(() => {
  vi.useRealTimers()
})

describe('polling retry policy', () => {
  it('uses capped exponential backoff', () => {
    const noJitter = () => 0.5

    expect(calculateRetryDelay(0, noJitter)).toBe(2_000)
    expect(calculateRetryDelay(1, noJitter)).toBe(4_000)
    expect(calculateRetryDelay(2, noJitter)).toBe(8_000)
    expect(calculateRetryDelay(10, noJitter)).toBe(30_000)
  })

  it('retries transient errors and stops on permanent client errors', () => {
    expect(isRetryablePollingError(new TypeError('Network error'))).toBe(true)
    expect(isRetryablePollingError(new GreenApiError('Rate limit', 429))).toBe(true)
    expect(isRetryablePollingError(new GreenApiError('Server error', 503))).toBe(true)
    expect(isRetryablePollingError(new GreenApiError('Unauthorized', 401))).toBe(false)
    expect(isRetryablePollingError(new GreenApiError('Bad request', 400))).toBe(false)
  })

  it('finishes a pending delay immediately when aborted', async () => {
    vi.useFakeTimers()
    const controller = new AbortController()
    const delay = abortableDelay(30_000, controller.signal)

    controller.abort()

    await expect(delay).resolves.toBeUndefined()
  })
})
