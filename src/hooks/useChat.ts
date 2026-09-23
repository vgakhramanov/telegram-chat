import { useCallback } from 'react'
import type { GreenApiClient } from '../api/greenApi'
import { parseIncomingText } from '../lib/notifications'
import type { ChatMessage, Contact } from '../types/chat'
import {
  useNotificationPolling,
  type PollingState,
} from './useNotificationPolling'
import { useChatMessages } from './useChatMessages'
import {
  useReceivingSettings,
  type ReceivingStatus,
} from './useReceivingSettings'

export interface ChatController {
  messages: ChatMessage[]
  pollingState: PollingState
  pollingError: string | null
  receivingStatus: ReceivingStatus
  receivingError: string | null
  enableReceiving: () => Promise<void>
  retryReceivingCheck: () => Promise<void>
  sendMessage: (text: string) => Promise<void>
}

export function useChat(
  client: GreenApiClient,
  idInstance: string,
  contact: Contact | null,
): ChatController {
  const {
    status: receivingStatus,
    error: receivingError,
    pollingEnabled,
    enable: enableReceiving,
    retry: retryReceivingCheck,
    markReady,
  } = useReceivingSettings(client)
  const {
    messages,
    receiveMessage,
    sendMessage,
  } = useChatMessages(
    client,
    idInstance,
    contact?.chatId ?? null,
  )

  const handleNotification = useCallback((body: unknown) => {
    const incoming = parseIncomingText(body)
    if (incoming) receiveMessage(incoming)
  }, [receiveMessage])

  const polling = useNotificationPolling({
    client,
    enabled: pollingEnabled,
    onNotification: handleNotification,
    onConnected: markReady,
  })

  return {
    messages,
    pollingState: polling.state,
    pollingError: polling.error,
    receivingStatus,
    receivingError,
    enableReceiving,
    retryReceivingCheck,
    sendMessage,
  }
}
