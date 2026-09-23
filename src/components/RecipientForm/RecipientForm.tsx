import { UserRound } from 'lucide-react'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import type { GreenApiClient } from '../../api/greenApi'
import {
  formatPhone,
  isValidRecipient,
  toLookupPayload,
} from '../../lib/recipient'
import type { Contact } from '../../types/chat'
import {
  FormError,
  FormField,
  LoadingIcon,
  PrimaryButton,
} from '../FormControls'
import styles from './RecipientForm.module.css'

interface RecipientFormProps {
  client: GreenApiClient
  onCreate: (contact: Contact) => void
}

export function RecipientForm({ client, onCreate }: RecipientFormProps) {
  const [recipient, setRecipient] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const searchControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      const controller = searchControllerRef.current
      searchControllerRef.current = null
      controller?.abort()
    }
  }, [])

  function cancelSearch() {
    searchControllerRef.current?.abort()
    searchControllerRef.current = null
    setIsSearching(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isValidRecipient(recipient)) {
      setError('Введите @username или номер из 10–15 цифр с кодом страны')
      return
    }

    searchControllerRef.current?.abort()
    const controller = new AbortController()
    searchControllerRef.current = controller
    const submittedRecipient = recipient.trim()

    setIsSearching(true)
    setError(null)
    try {
      const result = await client.checkAccount(
        toLookupPayload(submittedRecipient),
        controller.signal,
      )
      if (controller.signal.aborted) return

      if (!result.exist || !result.chatId) {
        setError('Пользователь не найден')
        return
      }

      const identifier = submittedRecipient
      const displayName =
        result.username ||
        (result.phoneNumber ? formatPhone(result.phoneNumber) : identifier)

      onCreate({
        identifier,
        chatId: result.chatId,
        displayName,
        createdAt: Date.now(),
      })
    } catch (requestError) {
      if (controller.signal.aborted) return
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Не удалось найти пользователя',
      )
    } finally {
      if (searchControllerRef.current === controller) {
        searchControllerRef.current = null
        setIsSearching(false)
      }
    }
  }

  return (
    <div className={styles.panel}>
      <div className={styles.avatar}><UserRound size={27} /></div>
      <h2>Новый чат</h2>
      <p>Найдите пользователя Telegram по username или номеру телефона.</p>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <FormField label="Username или номер">
          <input
            autoFocus
            inputMode="text"
            autoComplete="off"
            placeholder="@username или +7 987 654-32-10"
            value={recipient}
            onChange={(event) => {
              cancelSearch()
              setRecipient(event.target.value)
              setError(null)
            }}
          />
        </FormField>
        {error && <FormError>{error}</FormError>}
        <PrimaryButton
          type="submit"
          disabled={isSearching || !recipient.trim()}
        >
          {isSearching ? <LoadingIcon /> : null}
          {isSearching ? 'Ищем пользователя' : 'Начать чат'}
        </PrimaryButton>
      </form>
    </div>
  )
}
