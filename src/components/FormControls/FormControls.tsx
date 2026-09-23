import { RefreshCw } from 'lucide-react'
import type {
  ButtonHTMLAttributes,
  PropsWithChildren,
  ReactNode,
} from 'react'
import styles from './FormControls.module.css'

interface FormFieldProps extends PropsWithChildren {
  label: string
  action?: ReactNode
}

export function FormField({ label, action, children }: FormFieldProps) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      {action ? (
        <span className={styles.control}>
          {children}
          {action}
        </span>
      ) : children}
    </label>
  )
}

export function FieldAction(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={styles.fieldAction} type="button" {...props} />
}

export function FormError({ children }: PropsWithChildren) {
  return <div className={styles.formError} role="alert">{children}</div>
}

export function PrimaryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={styles.primaryButton} {...props} />
}

export function LoadingIcon() {
  return <RefreshCw className={styles.spinner} size={19} />
}
