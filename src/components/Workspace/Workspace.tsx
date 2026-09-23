import { LogOut, MessageCircleMore, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { useChat } from '../../hooks/useChat'
import { useGreenApiClient } from '../../hooks/useGreenApiClient'
import { formatMessageTime } from '../../lib/date'
import { clearContact, loadContact, saveContact } from '../../lib/storage'
import type { Contact, Credentials } from '../../types/chat'
import { Avatar } from '../Avatar'
import { Brand } from '../Brand'
import { Conversation } from '../Conversation'
import { IconButton } from '../IconButton'
import { RecipientForm } from '../RecipientForm'
import styles from './Workspace.module.css'

interface WorkspaceProps {
  credentials: Credentials
  onLogout: () => void
}

export function Workspace({ credentials, onLogout }: WorkspaceProps) {
  const [contact, setContact] = useState<Contact | null>(() => loadContact())
  const client = useGreenApiClient(credentials)
  const chat = useChat(client, credentials.idInstance, contact)
  const lastMessage = chat.messages.at(-1)
  const lastMessagePreview = lastMessage?.text || 'Личный чат'
  const lastActivityTime = contact
    ? formatMessageTime(lastMessage?.timestamp ?? contact.createdAt)
    : ''

  function createChat(nextContact: Contact) {
    saveContact(nextContact)
    setContact(nextContact)
  }

  function startNewChat() {
    clearContact()
    setContact(null)
  }

  return (
    <main className={styles.workspace}>
      <aside className={styles.sidebar}>
        <header className={styles.sidebarHeader}>
          <Brand compact />
          <div className={styles.sidebarActions}>
            <IconButton
              onClick={startNewChat}
              aria-label="Новый чат"
              title="Новый чат"
            >
              <Plus size={21} />
            </IconButton>
            <IconButton onClick={onLogout} aria-label="Выйти" title="Выйти">
              <LogOut size={20} />
            </IconButton>
          </div>
        </header>

        <div className={styles.searchBox}>
          <Search size={18} />
          <span>Чаты</span>
        </div>

        <div className={styles.chatList}>
          {contact ? (
            <button className={styles.chatItem} type="button">
              <Avatar name={contact.displayName} tone="warm" />
              <span className={styles.chatContent}>
                <strong>{contact.displayName}</strong>
                <small title={lastMessagePreview}>{lastMessagePreview}</small>
              </span>
              <time
                className={styles.chatTime}
                dateTime={new Date(
                  lastMessage?.timestamp ?? contact.createdAt,
                ).toISOString()}
              >
                {lastActivityTime}
              </time>
            </button>
          ) : (
            <div className={styles.chatListEmpty}>
              <MessageCircleMore size={22} />
              <span>Чатов пока нет</span>
            </div>
          )}
        </div>

        <div className={styles.instanceChip}>
          <span className={styles.instanceDot} />
          <span><small>Инстанс</small>{credentials.idInstance}</span>
        </div>
      </aside>

      <div className={styles.main}>
        {!contact && (
          <header className={styles.mobileToolbar}>
            <Brand compact />
            <IconButton onClick={onLogout} aria-label="Выйти" title="Выйти">
              <LogOut size={20} />
            </IconButton>
          </header>
        )}
        {contact ? (
          <Conversation
            key={`${credentials.idInstance}:${contact.chatId}`}
            contact={contact}
            chat={chat}
            onBack={startNewChat}
          />
        ) : (
          <div className={styles.recipientArea}>
            <RecipientForm client={client} onCreate={createChat} />
          </div>
        )}
      </div>
    </main>
  )
}
