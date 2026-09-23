import type { InstanceState } from '../types/chat'

export const DEFAULT_API_URL = 'https://api.green-api.com'
export const TELEGRAM_MESSAGE_LENGTH = 4096

export const INSTANCE_STATE_ERRORS: Partial<Record<InstanceState, string>> = {
  notAuthorized: 'Инстанс не авторизован. Авторизуйте его в личном кабинете.',
  blocked: 'Аккаунт Telegram заблокирован.',
  starting: 'Инстанс запускается. Повторите попытку через несколько минут.',
  pendingPassword: 'Для инстанса требуется пароль двухфакторной аутентификации.',
}
