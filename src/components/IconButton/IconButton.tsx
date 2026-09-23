import type { ButtonHTMLAttributes } from 'react'
import styles from './IconButton.module.css'

export function IconButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const classes = className
    ? `${styles.iconButton} ${className}`
    : styles.iconButton

  return <button className={classes} type="button" {...props} />
}
