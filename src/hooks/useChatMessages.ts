import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { GreenApiClient } from '../api/greenApi'
import type { IncomingTextMessage } from '../lib/notifications'
import { loadMessages, updateMessages } from '../lib/storage'
import type { ChatMessage } from '../types/chat'

function conversationKey(idInstance: string, chatId: string): string {
  return `${idInstance}:${chatId}`
}

export function useChatMessages(
  client: GreenApiClient,
  idInstance: string,
  activeChatId: string | null,
) {
  const mountedRef = useRef(true)
  const pendingRequestsRef = useRef(new Set<AbortController>())
  const [messageCache, setMessageCache] = useState<Record<string, ChatMessage[]>>(
    {},
  )
  const activeKey = activeChatId
    ? conversationKey(idInstance, activeChatId)
    : null
  const storedMessages = useMemo(
    () => activeChatId ? loadMessages(idInstance, activeChatId) : [],
    [activeChatId, idInstance],
  )
  const messages = activeKey
    ? messageCache[activeKey] ?? storedMessages
    : []

  useEffect(() => {
    const pendingRequests = pendingRequestsRef.current
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      pendingRequests.forEach((controller) => controller.abort())
      pendingRequests.clear()
    }
  }, [])

  const commitMessages = useCallback(
    (
      chatId: string,
      update: (current: ChatMessage[]) => ChatMessage[],
    ): ChatMessage[] => {
      const nextMessages = updateMessages(idInstance, chatId, update)

      if (mountedRef.current) {
        const key = conversationKey(idInstance, chatId)
        setMessageCache((current) => ({ ...current, [key]: nextMessages }))
      }

      return nextMessages
    },
    [idInstance],
  )

  const receiveMessage = useCallback(
    ({ chatId, message }: IncomingTextMessage) => {
      commitMessages(chatId, (current) =>
        current.some((item) => item.id === message.id)
          ? current
          : [...current, message],
      )
    },
    [commitMessages],
  )

  const sendMessage = useCallback(
    async (text: string): Promise<void> => {
      if (!activeChatId) throw new Error('Сначала выберите чат')

      const chatId = activeChatId
      const localId = `local-${crypto.randomUUID()}`
      const optimisticMessage: ChatMessage = {
        id: localId,
        text,
        direction: 'outgoing',
        timestamp: Date.now(),
        status: 'sending',
      }

      commitMessages(chatId, (current) => [...current, optimisticMessage])

      const controller = new AbortController()
      pendingRequestsRef.current.add(controller)

      try {
        const idMessage = await client.sendMessage(chatId, text, controller.signal)
        commitMessages(chatId, (current) =>
          current.map((message) =>
            message.id === localId
              ? { ...message, id: idMessage || localId, status: 'sent' }
              : message,
          ),
        )
      } catch (error) {
        commitMessages(chatId, (current) =>
          current.map((message) =>
            message.id === localId ? { ...message, status: 'failed' } : message,
          ),
        )
        throw error
      } finally {
        pendingRequestsRef.current.delete(controller)
      }
    },
    [activeChatId, client, commitMessages],
  )

  return { messages, receiveMessage, sendMessage }
}
