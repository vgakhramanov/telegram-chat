const USERNAME_PATTERN = /^@[a-zA-Z0-9_]{5,32}$/
const PHONE_MIN_LENGTH = 10
const PHONE_MAX_LENGTH = 15

export type AccountLookupPayload =
  | { username: string }
  | { phoneNumber: number }

export function normalizePhone(value: string): string {
  return value.replace(/\D/g, '')
}

export function isTelegramUsername(value: string): boolean {
  return USERNAME_PATTERN.test(value.trim())
}

export function isValidPhone(value: string): boolean {
  const phone = normalizePhone(value)
  return phone.length >= PHONE_MIN_LENGTH && phone.length <= PHONE_MAX_LENGTH
}

export function isValidRecipient(value: string): boolean {
  return isTelegramUsername(value) || isValidPhone(value)
}

export function toLookupPayload(value: string): AccountLookupPayload {
  const recipient = value.trim()
  if (isTelegramUsername(recipient)) return { username: recipient }
  return { phoneNumber: Number(normalizePhone(recipient)) }
}

export function formatPhone(value: string | number): string {
  const phone = normalizePhone(String(value))

  if (phone.length === 11 && phone.startsWith('7')) {
    return `+7 ${phone.slice(1, 4)} ${phone.slice(4, 7)}-${phone.slice(7, 9)}-${phone.slice(9)}`
  }

  return phone ? `+${phone}` : '';
}

export function avatarLabel(displayName: string): string {
  const normalized = displayName.replace(/^@/, '').trim();
  return normalized.slice(0, 2).toUpperCase() || 'TG';
}
