import { RefreshCw } from 'lucide-react'
import type { ReceivingStatus } from '../../hooks/useReceivingSettings'
import styles from './ReceivingBanner.module.css'

interface ReceivingBannerProps {
  status: ReceivingStatus
  error: string | null
  onEnable: () => void
  onRetry: () => void
}

export function ReceivingBanner({
  status,
  error,
  onEnable,
  onRetry,
}: ReceivingBannerProps) {
  if (status === 'ready') return null

  if (status === 'disabled') {
    return (
      <div className={`${styles.banner} ${styles.action}`} role="status">
        <span>Получение входящих сообщений выключено для этого инстанса.</span>
        <button type="button" onClick={onEnable}>Включить</button>
      </div>
    )
  }

  if (status === 'webhook-conflict') {
    return (
      <div className={`${styles.banner} ${styles.wide}`} role="alert">
        В настройках инстанса заполнен webhookUrl. Очистите его в личном кабинете,
        сохраните настройки и повторите проверку.
        <button type="button" onClick={onRetry}>Проверить снова</button>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className={`${styles.banner} ${styles.action}`} role="alert">
        <span>{error || 'Не удалось проверить получение сообщений'}</span>
        <button type="button" onClick={onRetry}>Повторить</button>
      </div>
    )
  }

  return (
    <div className={styles.banner} role="status">
      <RefreshCw size={15} className={styles.spinner} />
      {status === 'activating'
        ? 'Включаем уведомления. Инстанс может перезапускаться до пяти минут.'
        : 'Проверяем настройки получения сообщений…'}
    </div>
  )
}
