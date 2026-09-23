import type {
  AccountLookupResult,
  Credentials,
  IncomingNotification,
  InstanceSettings,
  InstanceState,
} from '../types/chat'
import type { AccountLookupPayload } from '../lib/recipient'

export class GreenApiError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'GreenApiError'
    this.status = status
  }
}

function normalizeApiUrl(value: string): string {
  let url: URL
  try {
    url = new URL(value.trim())
  } catch {
    throw new GreenApiError('Введите корректный API URL')
  }
  if (url.protocol !== 'https:' && url.hostname !== 'localhost') {
    throw new GreenApiError('API URL должен использовать HTTPS')
  }
  return url.toString().replace(/\/$/, '')
}

function errorMessage(status: number, payload: unknown): string {
  if (typeof payload === 'string' && payload.trim()) return payload

  if (payload && typeof payload === 'object') {
    const body = payload as Record<string, unknown>
    const message = body.message ?? body.error ?? body.reason
    if (typeof message === 'string' && message.trim()) return message
  }

  if (status === 401 || status === 403) {
    return 'Проверьте ID инстанса, токен и состояние аккаунта'
  }
  if (status === 429) return 'Слишком много запросов. Повторите позже'
  return `GREEN-API вернул ошибку ${status}`
}

async function parseResponse(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

export class GreenApiClient {
  private readonly baseUrl: string
  private readonly credentials: Credentials

  constructor(credentials: Credentials) {
    this.credentials = credentials
    this.baseUrl = normalizeApiUrl(credentials.apiUrl)
  }

  private endpoint(method: string): string {
    const { idInstance, apiTokenInstance } = this.credentials
    return `${this.baseUrl}/waInstance${encodeURIComponent(idInstance)}/${method}/${encodeURIComponent(apiTokenInstance)}`
  }

  private async request<T>(url: string, init?: RequestInit): Promise<T> {
    let response: Response

    try {
      response = await fetch(url, {
        ...init,
        headers: {
          Accept: 'application/json',
          ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
          ...init?.headers,
        },
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error
      throw new GreenApiError('Не удалось подключиться к GREEN-API')
    }

    const payload = await parseResponse(response)
    if (!response.ok) throw new GreenApiError(errorMessage(response.status, payload), response.status)

    return payload as T
  }

  async getState(signal?: AbortSignal): Promise<InstanceState> {
    const data = await this.request<{ stateInstance: InstanceState }>(
      this.endpoint('getStateInstance'),
      { signal },
    )
    return data.stateInstance
  }

  async getSettings(signal?: AbortSignal): Promise<InstanceSettings> {
    return this.request<InstanceSettings>(this.endpoint('getSettings'), { signal })
  }

  async enableIncomingNotifications(signal?: AbortSignal): Promise<void> {
    const result = await this.request<{ saveSettings: boolean }>(
      this.endpoint('setSettings'),
      {
        method: 'POST',
        body: JSON.stringify({ incomingWebhook: 'yes' }),
        signal,
      },
    )

    if (!result.saveSettings) {
      throw new GreenApiError('GREEN-API не сохранил настройку уведомлений')
    }
  }

  async sendMessage(
    chatId: string,
    message: string,
    signal?: AbortSignal,
  ): Promise<string> {
    const data = await this.request<{ idMessage: string }>(
      this.endpoint('sendMessage'),
      {
        method: 'POST',
        body: JSON.stringify({ chatId, message }),
        signal,
      },
    )
    return data.idMessage
  }

  async checkAccount(
    payload: AccountLookupPayload,
    signal?: AbortSignal,
  ): Promise<AccountLookupResult> {
    return this.request<AccountLookupResult>(this.endpoint('checkAccount'), {
      method: 'POST',
      body: JSON.stringify(payload),
      signal,
    })
  }

  async receiveNotification(signal: AbortSignal): Promise<IncomingNotification | null> {
    return this.request<IncomingNotification | null>(
      `${this.endpoint('receiveNotification')}?receiveTimeout=5`,
      { signal },
    )
  }

  async deleteNotification(receiptId: number, signal?: AbortSignal): Promise<void> {
    await this.request<{ result: boolean }>(
      `${this.endpoint('deleteNotification')}/${receiptId}`,
      { method: 'DELETE', signal },
    )
  }
}
