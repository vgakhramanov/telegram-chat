export interface Credentials {
  apiUrl: string
  idInstance: string
  apiTokenInstance: string
}

export type InstanceState =
  | 'authorized'
  | 'notAuthorized'
  | 'blocked'
  | 'starting'
  | 'suspended'
  | 'pendingPassword'

export interface Contact {
  identifier: string
  chatId: string
  displayName: string
  createdAt: number
}

export interface AccountLookupResult {
  exist: boolean
  chatId: string
  username?: string
  phoneNumber?: number
}

export interface InstanceSettings {
  typeInstance: string
  webhookUrl: string
  incomingWebhook: 'yes' | 'no'
}

export type MessageStatus = 'sending' | 'sent' | 'failed'

export interface ChatMessage {
  id: string
  text: string
  direction: 'incoming' | 'outgoing'
  timestamp: number
  status: MessageStatus
}

export interface IncomingNotification {
  receiptId: number
  body: unknown
}
