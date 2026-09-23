import type { ChatMessage, Contact, Credentials } from '../types/chat'

const STORAGE_PREFIX = 'green-api-chat'

const KEYS = {
  CREDENTIALS: `${STORAGE_PREFIX}:credentials`,
  CONTACT: `${STORAGE_PREFIX}:contact`,
  MESSAGES: (idInstance: string, chatId: string) =>
    `${STORAGE_PREFIX}:messages:${idInstance}:${chatId}`,
} as const

const MAX_MESSAGES_HISTORY = 200

function getItem<T>(storage: Storage, key: string): T | null {
  try {
    const value = storage.getItem(key)
    return value ? (JSON.parse(value) as T) : null
  } catch (error) {
    console.error(`Error parsing storage key "${key}":`, error);
    return null
  }
}

function setItem<T>(storage: Storage, key: string, value: T): void {
  try {
    storage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Error writing storage key "${key}":`, error);
  }
}

function removeItem(storage: Storage, key: string): void {
  try {
    storage.removeItem(key)
  } catch (error) {
    console.error(`Error removing storage key "${key}":`, error);
  }
}

export const loadCredentials = (): Credentials | null =>
  getItem<Credentials>(sessionStorage, KEYS.CREDENTIALS)

export const saveCredentials = (credentials: Credentials): void =>
  setItem(sessionStorage, KEYS.CREDENTIALS, credentials)

export function clearSession(): void {
  removeItem(sessionStorage, KEYS.CREDENTIALS)
  removeItem(sessionStorage, KEYS.CONTACT)
}

export function loadContact(): Contact | null {
  const contact = getItem<Contact>(sessionStorage, KEYS.CONTACT)
  return contact
    ? { ...contact, createdAt: contact.createdAt ?? Date.now() }
    : null
}

export const saveContact = (contact: Contact): void =>
  setItem(sessionStorage, KEYS.CONTACT, contact)

export function clearContact(): void {
  removeItem(sessionStorage, KEYS.CONTACT)
}

export const loadMessages = (idInstance: string, chatId: string): ChatMessage[] =>
  getItem<ChatMessage[]>(localStorage, KEYS.MESSAGES(idInstance, chatId)) ?? []

export function saveMessages(
  idInstance: string,
  chatId: string,
  messages: ChatMessage[],
): void {
  const slicedMessages = messages.slice(-MAX_MESSAGES_HISTORY)
  setItem(localStorage, KEYS.MESSAGES(idInstance, chatId), slicedMessages)
}

export function updateMessages(
  idInstance: string,
  chatId: string,
  update: (messages: ChatMessage[]) => ChatMessage[],
): ChatMessage[] {
  const messages = update(loadMessages(idInstance, chatId)).slice(
    -MAX_MESSAGES_HISTORY,
  )
  setItem(localStorage, KEYS.MESSAGES(idInstance, chatId), messages)
  return messages
}
