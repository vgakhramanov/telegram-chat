import { describe, expect, it, vi } from 'vitest'
import { parseIncomingText } from './notifications'

const notification = {
  typeWebhook: 'incomingMessageReceived',
  timestamp: 1_763_115_112,
  idMessage: 'message-1',
  senderData: {
    chatId: '10000000',
    senderPhoneNumber: 7_999_123_45_67,
  },
  messageData: {
    typeMessage: 'textMessage',
    textMessageData: { textMessage: 'Привет!' },
  },
}

describe('parseIncomingText', () => {
  it('converts an incoming text notification into a chat message', () => {
    expect(parseIncomingText(notification)).toEqual({
      chatId: '10000000',
      message: {
        id: 'message-1',
        text: 'Привет!',
        direction: 'incoming',
        timestamp: 1_763_115_112_000,
        status: 'sent',
      },
    })
  })

  it('ignores notifications without a sender and non-text events', () => {
    expect(
      parseIncomingText({ ...notification, senderData: undefined }),
    ).toBeNull()
    expect(
      parseIncomingText(
        { ...notification, typeWebhook: 'outgoingMessageStatus' },
      ),
    ).toBeNull()
  })

  it('uses the current time when timestamp is absent', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1234)
    expect(
      parseIncomingText(
        { ...notification, timestamp: undefined },
      )?.message.timestamp,
    ).toBe(1234)
  })
})
