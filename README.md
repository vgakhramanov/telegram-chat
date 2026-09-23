# Telegram Chat

React-клиент для переписки в Telegram через GREEN-API. Можно найти пользователя по username или номеру телефона, отправлять сообщения и получать ответы.

## Запуск

Понадобятся Node.js 20.19+ и авторизованный Telegram-инстанс GREEN-API.

```bash
npm install
npm run dev
```

Vite выведет адрес приложения в терминале. Обычно это `http://localhost:5173`.

Для входа используйте `apiUrl`, `idInstance` и `apiTokenInstance` из [личного кабинета GREEN-API](https://console.green-api.com/).

## Входящие сообщения

Приложение получает сообщения через HTTP API. В настройках инстанса должны быть:

- `incomingWebhook`: `yes`;
- пустой `webhookUrl`.

Если получение сообщений выключено, его можно включить прямо в чате.

## Команды

```bash
npm run dev      # локальный запуск
npm run build    # production-сборка
npm run lint     # проверка кода
npm test         # unit-тесты
```

Токен и выбранный контакт хранятся в `sessionStorage`, история сообщений — в `localStorage`.
