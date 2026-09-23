import type { ChatMessage } from '../types/chat'

interface NotificationBody {
  typeWebhook?: unknown
  timestamp?: unknown
  idMessage?: unknown
  senderData?: {
    chatId?: unknown
  }
  messageData?: {
    typeMessage?: unknown
    textMessageData?: {
      textMessage?: unknown
    }
  }
}

export interface IncomingTextMessage {
  chatId: string
  message: ChatMessage
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function parseIncomingText(
  value: unknown,
): IncomingTextMessage | null {
  if (!isRecord(value)) return null

  const body = value as NotificationBody
  const senderData = body.senderData
  const messageData = body.messageData

  if (
    body.typeWebhook !== 'incomingMessageReceived' ||
    messageData?.typeMessage !== 'textMessage' ||
    typeof messageData.textMessageData?.textMessage !== 'string'
  ) {
    return null
  }

  const senderChatId = String(senderData?.chatId ?? '')
  if (!senderChatId) return null

  const timestamp =
    typeof body.timestamp === 'number' ? body.timestamp * 1000 : Date.now()
  const id =
    typeof body.idMessage === 'string'
      ? body.idMessage
      : `incoming-${timestamp}-${senderChatId}`

  return {
    chatId: senderChatId,
    message: {
      id,
      text: messageData.textMessageData.textMessage,
      direction: 'incoming',
      timestamp,
      status: 'sent',
    },
  }
}
