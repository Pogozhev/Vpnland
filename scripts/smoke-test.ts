/**
 * Smoke-тест, запускается после `next build` (в т.ч. при деплое на Vercel).
 *
 * Что делает:
 *  1. Отправляет тестовое письмо об успешной оплате тарифа VIP на адрес TEST_EMAIL.
 *  2. Шлёт в Telegram-бот пример сообщения о покупке.
 *
 * Тест НЕ роняет сборку: любые ошибки (SMTP недоступен, переменные не заданы и т.п.)
 * логируются, но процесс всегда завершается с кодом 0.
 *
 * Отключить можно переменной окружения SKIP_SMOKE_TEST=1.
 */

import { sendEmail, purchaseEmail } from '../lib/email';

const TEST_EMAIL = 'human0001313@gmail.com';

const VIP = {
  description: 'Франшиза «VIP» — HonkVPN',
  amount: 300000,
  currency: 'RUB',
  channelUrl: 'https://t.me/+rzIJxBB24fYxNDU0',
};

async function sendTestEmail() {
  try {
    await sendEmail({
      to: TEST_EMAIL,
      ...purchaseEmail(VIP),
    });
    console.log(`[smoke] ✓ письмо о VIP-оплате отправлено на ${TEST_EMAIL}`);
  } catch (err) {
    console.error('[smoke] ✗ не удалось отправить письмо:', err instanceof Error ? err.message : err);
  }
}

async function sendTestTelegram() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.log('[smoke] — Telegram пропущен: не заданы TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID');
    return;
  }

  const text =
    `🧪 <b>Smoke-тест деплоя</b>\n\n` +
    `💰 <b>Новая оплата HonkVPN</b>\n` +
    `💎 Тариф: <b>${VIP.description}</b>\n` +
    `💵 Сумма: <b>${new Intl.NumberFormat('ru-RU').format(VIP.amount)} ${VIP.currency}</b>\n` +
    `📧 Email: <b>${TEST_EMAIL}</b>\n` +
    `✈️ Telegram: <b>@example</b>\n` +
    `📞 Телефон: <b>+7 999 123-45-67</b>\n\n` +
    `<i>Это автоматическое сообщение из smoke-теста при деплое. Если получили его — связка Telegram работает.</i>`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    if (res.ok) {
      console.log('[smoke] ✓ пример сообщения о покупке отправлен в Telegram-бот');
    } else {
      console.error(`[smoke] ✗ Telegram вернул статус ${res.status}: ${await res.text()}`);
    }
  } catch (err) {
    console.error('[smoke] ✗ не удалось обратиться к Telegram API:', err instanceof Error ? err.message : err);
  }
}

async function main() {
  if (process.env.SKIP_SMOKE_TEST === '1') {
    console.log('[smoke] пропущено (SKIP_SMOKE_TEST=1)');
    return;
  }
  console.log('[smoke] запуск smoke-теста после сборки...');
  await sendTestEmail();
  await sendTestTelegram();
  console.log('[smoke] готово');
}

main()
  .catch((err) => {
    console.error('[smoke] неожиданная ошибка:', err);
  })
  .finally(() => {
    process.exit(0);
  });
