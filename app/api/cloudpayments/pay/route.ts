import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { sendEmail, purchaseEmail } from '@/lib/email';
import { escapeHtml, notifyOwner } from '@/lib/telegram';

export const runtime = 'nodejs';

const TELEGRAM_CHANNELS: { match: string; url: string }[] = [
  { match: 'VIP', url: 'https://t.me/+rzIJxBB24fYxNDU0' },
  { match: 'Средний', url: 'https://t.me/+dYrdNmtDB4RjMTI8' },
  { match: 'Базовый', url: 'https://t.me/+fKXhePD18pM0Y2Q8' },
];

function channelLinkFor(description: string): string | null {
  return TELEGRAM_CHANNELS.find((c) => description.includes(c.match))?.url ?? null;
}

const ok = () => NextResponse.json({ code: 0 });
const fail = (message: string, status = 200) =>
  NextResponse.json({ code: 13, message }, { status });

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

  await notifyOwner(
    `💰 <b>Новая оплата HonkVPN</b>\n\n` +
      `💎 Тариф: <b>${escapeHtml(description)}</b>\n` +
      `💵 Сумма: <b>${new Intl.NumberFormat('ru-RU').format(amount)} ${currency}</b>\n` +
      `📧 Email: <b>${escapeHtml(email)}</b>\n` +
      `✈️ Telegram: <b>${escapeHtml(telegram || '—')}</b>\n` +
      `📞 Телефон: <b>${escapeHtml(phone || '—')}</b>`,
  );

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
