import { useMemo } from 'react'
import { GreenApiClient } from '../api/greenApi'
import type { Credentials } from '../types/chat'

export function useGreenApiClient(credentials: Credentials): GreenApiClient {
  const { apiTokenInstance, apiUrl, idInstance } = credentials

  return useMemo(
    () => new GreenApiClient({ apiTokenInstance, apiUrl, idInstance }),
    [apiTokenInstance, apiUrl, idInstance],
  )
}
