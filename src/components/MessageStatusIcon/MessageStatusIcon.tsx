import { Check, CheckCheck } from 'lucide-react'
import type { ChatMessage } from '../../types/chat'
import styles from './MessageStatusIcon.module.css'

interface MessageStatusIconProps {
  message: ChatMessage
}

export function MessageStatusIcon({ message }: MessageStatusIconProps) {
  if (message.direction !== 'outgoing') return null
  if (message.status === 'sending') {
    return <Check size={14} aria-label="Отправляется" />
  }
  if (message.status === 'failed') {
    return <span className={styles.error}>Ошибка</span>
  }
  return <CheckCheck size={15} aria-label="Отправлено" />
}
