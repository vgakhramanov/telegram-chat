export function formatMessageTime(timestamp: number): string {
  return new Intl.DateTimeFormat('ru', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp)
}
