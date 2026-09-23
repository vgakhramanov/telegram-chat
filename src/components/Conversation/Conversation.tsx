import { ArrowLeft, MessageCircleMore, RefreshCw, Send } from 'lucide-react'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { TELEGRAM_MESSAGE_LENGTH } from '../../app/constants'
import type { ChatController } from '../../hooks/useChat'
import { formatMessageTime } from '../../lib/date'
import type { Contact } from '../../types/chat'
import { Avatar } from '../Avatar'
import { IconButton } from '../IconButton'
import { MessageStatusIcon } from '../MessageStatusIcon'
import { ReceivingBanner } from '../ReceivingBanner'
import styles from './Conversation.module.css'

interface ConversationProps {
  contact: Contact
  chat: ChatController
  onBack: () => void
}

export function Conversation({ contact, chat, onBack }: ConversationProps) {
  const {
    messages,
    pollingState,
    pollingError,
    receivingStatus,
    receivingError,
    enableReceiving,
    retryReceivingCheck,
    sendMessage,
  } = chat
  const [draft, setDraft] = useState('')
  const [sendError, setSendError] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const message = draft.trim()
    if (!message || message.length > TELEGRAM_MESSAGE_LENGTH) return

    setDraft('')
    setSendError(null)
    try {
      await sendMessage(message)
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Сообщение не отправлено')
    }
  }

  const isReconnecting = pollingState === 'reconnecting'
  const isPollingFailed = pollingState === 'failed'
  const isReceivingUnavailable = receivingStatus !== 'ready'

  return (
    <section className={styles.conversation}>
      <header className={styles.header}>
        <IconButton
          className={styles.back}
          onClick={onBack}
          aria-label="Назад к чатам"
          title="Назад"
        >
          <ArrowLeft size={21} />
        </IconButton>
        <Avatar name={contact.displayName} />
        <div className={styles.person}>
          <h2>{contact.displayName}</h2>
          <span
            className={
              isReconnecting || isPollingFailed || isReceivingUnavailable
                ? `${styles.status} ${styles.statusWarning}`
                : styles.status
            }
          >
            {isReceivingUnavailable
              ? 'Настройка получения'
              : isPollingFailed
                ? 'Получение остановлено'
              : isReconnecting
                ? 'Переподключение…'
                : 'Ожидаем сообщения'}
          </span>
        </div>
      </header>

      <div className={styles.messages} aria-live="polite">
        <ReceivingBanner
          status={receivingStatus}
          error={receivingError}
          onEnable={() => void enableReceiving()}
          onRetry={retryReceivingCheck}
        />
        {pollingError && (
          <div className={styles.pollingBanner}>
            <RefreshCw
              size={15}
              className={isReconnecting ? styles.spinner : undefined}
            />
            {pollingError}
          </div>
        )}
        {messages.length === 0 ? (
          <div className={styles.emptyChat}>
            <div className={styles.emptyIcon}><MessageCircleMore size={29} /></div>
            <strong>Чат создан</strong>
            <span>Отправьте первое сообщение пользователю {contact.displayName}</span>
          </div>
        ) : (
          <div className={styles.messageList}>
            <div className={styles.dateDivider}><span>Сегодня</span></div>
            {messages.map((message) => {
              const rowClassName = message.direction === 'outgoing'
                ? `${styles.messageRow} ${styles.outgoing}`
                : styles.messageRow
              const bubbleClassName = message.status === 'failed'
                ? `${styles.messageBubble} ${styles.failed}`
                : styles.messageBubble

              return (
                <div className={rowClassName} key={message.id}>
                  <div className={bubbleClassName}>
                    <p>{message.text}</p>
                    <span className={styles.messageMeta}>
                      {formatMessageTime(message.timestamp)}
                      <MessageStatusIcon message={message} />
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <footer className={styles.composerWrap}>
        {sendError && <div className={styles.composerError} role="alert">{sendError}</div>}
        <form className={styles.composer} onSubmit={handleSubmit}>
          <textarea
            aria-label="Сообщение"
            placeholder="Сообщение"
            rows={1}
            maxLength={TELEGRAM_MESSAGE_LENGTH}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                event.currentTarget.form?.requestSubmit()
              }
            }}
          />
          <button
            className={styles.sendButton}
            type="submit"
            disabled={!draft.trim()}
            aria-label="Отправить сообщение"
            title="Отправить"
          >
            <Send size={20} />
          </button>
        </form>
      </footer>
    </section>
  )
}
