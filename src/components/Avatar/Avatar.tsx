import { avatarLabel } from '../../lib/recipient'
import styles from './Avatar.module.css'

interface AvatarProps {
  name: string
  tone?: 'default' | 'warm'
}

export function Avatar({ name, tone = 'default' }: AvatarProps) {
  const className = tone === 'warm'
    ? `${styles.avatar} ${styles.warm}`
    : styles.avatar

  return <div className={className} aria-hidden="true">{avatarLabel(name)}</div>
}
