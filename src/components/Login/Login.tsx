import { Eye, EyeOff, Settings2 } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { GreenApiClient } from '../../api/greenApi'
import { DEFAULT_API_URL, INSTANCE_STATE_ERRORS } from '../../app/constants'
import { saveCredentials } from '../../lib/storage'
import type { Credentials } from '../../types/chat'
import { Brand } from '../Brand'
import {
  FieldAction,
  FormError,
  FormField,
  LoadingIcon,
  PrimaryButton,
} from '../FormControls'
import styles from './Login.module.css'

interface LoginProps {
  onConnect: (credentials: Credentials) => void
}

export function Login({ onConnect }: LoginProps) {
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL)
  const [idInstance, setIdInstance] = useState('')
  const [apiTokenInstance, setApiTokenInstance] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!/^\d+$/.test(idInstance.trim())) {
      setError('ID инстанса должен содержать только цифры')
      return
    }

    const credentials = {
      apiUrl: apiUrl.trim(),
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
    }

    setIsConnecting(true)
    try {
      const state = await new GreenApiClient(credentials).getState()
      const stateError = INSTANCE_STATE_ERRORS[state]
      if (stateError) {
        setError(stateError)
        return
      }
      if (state !== 'authorized' && state !== 'suspended') {
        setError(`Инстанс недоступен: ${state}`)
        return
      }

      saveCredentials(credentials)
      onConnect(credentials)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Не удалось проверить инстанс',
      )
    } finally {
      setIsConnecting(false)
    }
  }

  const tokenAction = (
    <FieldAction
      onClick={() => setShowToken((value) => !value)}
      aria-label={showToken ? 'Скрыть токен' : 'Показать токен'}
      title={showToken ? 'Скрыть токен' : 'Показать токен'}
    >
      {showToken ? <EyeOff size={19} /> : <Eye size={19} />}
    </FieldAction>
  )

  return (
    <main className={styles.page}>
      <header className={styles.brand}>
        <Brand />
      </header>

      <section className={styles.panel}>
        <div className={styles.formWrap}>
          <div className={styles.heading}>
            <h2>Войдите в инстанс</h2>
            <p>Данные находятся в личном кабинете GREEN-API.</p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <FormField label="ID инстанса">
              <input
                inputMode="numeric"
                autoComplete="username"
                placeholder="Например, 4100000000"
                value={idInstance}
                onChange={(event) => setIdInstance(event.target.value)}
                required
              />
            </FormField>

            <FormField label="API-токен" action={tokenAction}>
              <input
                type={showToken ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Введите apiTokenInstance"
                value={apiTokenInstance}
                onChange={(event) => setApiTokenInstance(event.target.value)}
                required
              />
            </FormField>

            <details className={styles.advancedSettings}>
              <summary><Settings2 size={16} /> Настройки подключения</summary>
              <FormField label="API URL">
                <input
                  type="url"
                  inputMode="url"
                  value={apiUrl}
                  onChange={(event) => setApiUrl(event.target.value)}
                  required
                />
              </FormField>
            </details>

            {error && <FormError>{error}</FormError>}

            <PrimaryButton
              type="submit"
              disabled={isConnecting || !idInstance || !apiTokenInstance}
            >
              {isConnecting ? <LoadingIcon /> : null}
              {isConnecting ? 'Проверяем инстанс' : 'Подключиться'}
            </PrimaryButton>
          </form>
        </div>
      </section>
    </main>
  )
}
