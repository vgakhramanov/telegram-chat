import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { GreenApiClient } from '../api/greenApi'
import { loadMessages, saveMessages } from '../lib/storage'
import type { ChatMessage } from '../types/chat'
import { useChatMessages } from './useChatMessages'

const client = {
  sendMessage: vi.fn(),
} as unknown as GreenApiClient

function message(id: string, text: string): ChatMessage {
  return {
    id,
    text,
    direction: 'incoming',
    timestamp: 1,
    status: 'sent',
  }
}

beforeEach(() => {
  localStorage.clear()
})

describe('useChatMessages', () => {
  it('switches histories without writing the previous chat into the new one', () => {
    saveMessages('instance-1', 'chat-a', [message('a', 'Сообщение A')])
    saveMessages('instance-1', 'chat-b', [message('b', 'Сообщение B')])

    const { result, rerender } = renderHook(
      ({ chatId }) => useChatMessages(client, 'instance-1', chatId),
      { initialProps: { chatId: 'chat-a' } },
    )

    expect(result.current.messages).toEqual([message('a', 'Сообщение A')])
    rerender({ chatId: 'chat-b' })
    expect(result.current.messages).toEqual([message('b', 'Сообщение B')])
    expect(loadMessages('instance-1', 'chat-a')).toEqual([
      message('a', 'Сообщение A'),
    ])
  })

  it('routes an incoming message to its own chat history', () => {
    const { result } = renderHook(() =>
      useChatMessages(client, 'instance-1', 'active-chat'),
    )
    const incoming = message('incoming-1', 'Другой чат')

    act(() => {
      result.current.receiveMessage({ chatId: 'other-chat', message: incoming })
    })

    expect(result.current.messages).toEqual([])
    expect(loadMessages('instance-1', 'other-chat')).toEqual([incoming])
  })

  it('deduplicates repeated incoming notifications', () => {
    const { result } = renderHook(() =>
      useChatMessages(client, 'instance-1', 'active-chat'),
    )
    const incoming = message('incoming-1', 'Один раз')

    act(() => {
      result.current.receiveMessage({ chatId: 'active-chat', message: incoming })
      result.current.receiveMessage({ chatId: 'active-chat', message: incoming })
    })

    expect(loadMessages('instance-1', 'active-chat')).toEqual([incoming])
  })
})
