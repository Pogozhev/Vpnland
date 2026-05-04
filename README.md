# HonkVPN — лендинг франшизы

Next.js 15 (App Router) + Vercel. Заявки с формы уходят в Telegram через серверный
роут `/api/lead`. Платежи — виджет CloudPayments на клиенте.

## Локальный запуск

```bash
npm install
cp .env.example .env.local   # заполни TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID
npm run dev                  # http://localhost:3000
```

## Переменные окружения

| Имя | Где задать | Что это |
| --- | --- | --- |
| `TELEGRAM_BOT_TOKEN` | Vercel → Project → Settings → Environment Variables (Encrypted) | Токен бота из @BotFather. **Никогда не коммить в репозиторий.** |
| `TELEGRAM_CHAT_ID` | там же | Числовой chat id, куда бот шлёт заявки. Получить через @userinfobot. |
| `NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID` | там же | Public ID CloudPayments. Безопасно держать публичным. |

## Деплой на Vercel

1. Заходишь на vercel.com через GitHub.
2. Import Git Repository → выбираешь `pogozhev/vpnland`.
3. Framework — Next.js определится сам.
4. На экране импорта раскрой **Environment Variables** и добавь три переменные выше.
5. Deploy. Через минуту получишь URL вида `honkvpn.vercel.app`.

Дальше каждый push в `main` → автодеплой.

## Структура

```
app/
  layout.tsx            корневой layout
  page.tsx              главная (server component)
  globals.css           все стили
  privacy/page.tsx      152-ФЗ политика
  offer/page.tsx        публичная оферта
  api/lead/route.ts     POST /api/lead → Telegram
components/
  LeadForm.tsx          форма заявки (client)
  CookieBanner.tsx      cookie-консент (client)
  PayButton.tsx         кнопка CloudPayments (client)
  LegalLayout.tsx       обёртка для legal-страниц
```
