import { Send } from 'lucide-react'
import styles from './Brand.module.css'

interface BrandProps {
  compact?: boolean
}

export function Brand({ compact = false }: BrandProps) {
  const className = compact
    ? `${styles.brand} ${styles.compact}`
    : styles.brand

  return (
    <div className={className}>
      <span className={styles.mark} aria-hidden="true">
        <Send size={compact ? 19 : 24} strokeWidth={2.3} />
      </span>
      <span className={styles.copy}>
        <strong>Telegram Chat</strong>
        {!compact && <small>by GREEN-API</small>}
      </span>
    </div>
  )
}
