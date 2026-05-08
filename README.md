# HonkVPN — лендинг франшизы

Next.js 15 (App Router) + Vercel.

- Заявки с формы → Telegram через серверный роут `/api/lead`.
- Оплата → виджет CloudPayments на клиенте.
- После успешной оплаты CloudPayments вызывает webhook `/api/cloudpayments/pay`,
  который проверяет HMAC-подпись и шлёт клиенту письмо через SMTP Яндекса.

## Локальный запуск

```bash
npm install
cp .env.example .env.local   # заполнить секреты
npm run dev                  # http://localhost:3000
```

## Переменные окружения

В Vercel задаются: **Project → Settings → Environment Variables**, тип **Encrypted**.

| Имя | Видимость | Что это |
| --- | --- | --- |
| `TELEGRAM_BOT_TOKEN` | server only | Токен бота из @BotFather |
| `TELEGRAM_CHAT_ID` | server only | Куда слать заявки (число) |
| `NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID` | public | Public ID виджета CloudPayments |
| `CLOUDPAYMENTS_API_PASSWORD` | server only | Для проверки HMAC-подписи webhook |
| `EMAIL_FROM` | server only | Адрес отправителя писем |
| `SMTP_HOST` | server only | smtp.yandex.ru |
| `SMTP_PORT` | server only | 587 (STARTTLS) или 465 (SSL) |
| `SMTP_USERNAME` | server only | Логин SMTP (обычно совпадает с EMAIL_FROM) |
| `SMTP_PASSWORD` | server only | Пароль приложения Яндекс.Почты |

Любая `NEXT_PUBLIC_*` переменная попадает в клиентский бандл — не клади туда секреты.
Все остальные переменные доступны **только** в Server Components и API routes.

## Настройка CloudPayments webhook

1. CloudPayments → личный кабинет → **Сайты → Уведомления**.
2. **Pay** → URL: `https://<твой-домен>/api/cloudpayments/pay`.
3. **HMAC-подпись запросов** — включить.
4. **API-пароль для подписи** — сгенерировать и скопировать в `CLOUDPAYMENTS_API_PASSWORD`
   на Vercel.

После этого каждая успешная оплата → webhook → клиенту улетает письмо.

## Структура

```
app/
  layout.tsx                       корневой layout
  page.tsx                         главная (server)
  globals.css                      все стили
  privacy/page.tsx                 152-ФЗ политика
  offer/page.tsx                   публичная оферта
  api/
    lead/route.ts                  POST /api/lead → Telegram (Edge)
    cloudpayments/pay/route.ts     POST webhook от CloudPayments → SMTP (Node)
components/
  LeadForm.tsx                     форма заявки (client)
  CookieBanner.tsx                 cookie-консент (client)
  PayButton.tsx                    диалог email + виджет CloudPayments (client)
  LegalLayout.tsx                  обёртка legal-страниц
lib/
  email.ts                         SMTP-транспорт + шаблон письма
```

## Безопасность

- Секреты живут только в Vercel env vars и в `.env.local` (вне git).
- HMAC-проверка отсекает поддельные webhook-запросы.
- Honeypot и серверная валидация на лид-форме.
- HTTPS обеспечивает Vercel из коробки.
