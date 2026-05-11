import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { sendEmail, purchaseEmail } from '@/lib/email';

export const runtime = 'nodejs';

const TELEGRAM_CHANNELS: { match: string; url: string }[] = [
  { match: 'VIP', url: 'https://t.me/+rzIJxBB24fYxNDU0' },
  { match: 'Средний', url: 'https://t.me/+dYrdNmtDB4RjMTI8' },
  { match: 'Базовый', url: 'https://t.me/+fKXhePD18pM0Y2Q8' },
];

function channelLinkFor(description: string): string | null {
  const found = TELEGRAM_CHANNELS.find((c) => description.includes(c.match));
  return found ? found.url : null;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const ok = () => NextResponse.json({ code: 0 });
const fail = (message: string, status = 200) =>
  NextResponse.json({ code: 13, message }, { status });

async function notifyOwner(parts: {
  description: string;
  amount: number;
  currency: string;
  email: string;
  telegram: string;
  phone: string;
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const text =
    `💰 <b>Новая оплата HonkVPN</b>\n\n` +
    `💎 Тариф: <b>${escapeHtml(parts.description)}</b>\n` +
    `💵 Сумма: <b>${new Intl.NumberFormat('ru-RU').format(parts.amount)} ${parts.currency}</b>\n` +
    `📧 Email: <b>${escapeHtml(parts.email)}</b>\n` +
    `✈️ Telegram: <b>${escapeHtml(parts.telegram || '—')}</b>\n` +
    `📞 Телефон: <b>${escapeHtml(parts.phone || '—')}</b>`;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
  } catch (err) {
    console.error('owner_notify_failed', err);
  }
}

export async function POST(req: Request) {
  const apiPassword = process.env.CLOUDPAYMENTS_API_PASSWORD;
  if (!apiPassword) return fail('not_configured');

  const body = await req.text();

  const signature =
    req.headers.get('content-hmac') || req.headers.get('x-content-hmac') || '';
  const expected = crypto.createHmac('sha256', apiPassword).update(body, 'utf8').digest('base64');
  if (!signature || signature !== expected) return fail('invalid_signature', 401);

  const params = new URLSearchParams(body);
  const status = params.get('Status') || '';
  const email = (params.get('Email') || '').trim();
  const amount = Number(params.get('Amount') || '0');
  const currency = params.get('Currency') || 'RUB';
  const description = params.get('Description') || 'Франшиза HonkVPN';

  let telegram = '';
  let phone = '';
  const rawData = params.get('Data');
  if (rawData) {
    try {
      const parsed = JSON.parse(rawData) as { telegram?: unknown; phone?: unknown };
      if (typeof parsed.telegram === 'string') telegram = parsed.telegram.slice(0, 200);
      if (typeof parsed.phone === 'string') phone = parsed.phone.slice(0, 50);
    } catch {
      /* ignore malformed Data */
    }
  }

  if (status !== 'Completed') return ok();

  await notifyOwner({ description, amount, currency, email, telegram, phone });

  if (email) {
    try {
      await sendEmail({
        to: email,
        ...purchaseEmail({ description, amount, currency, channelUrl: channelLinkFor(description) }),
      });
    } catch (err) {
      console.error('email_send_failed', err);
    }
  }

  return ok();
}
