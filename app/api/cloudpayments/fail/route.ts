import { NextResponse } from 'next/server';
import { escapeHtml, notifyOwner } from '@/lib/telegram';

export const runtime = 'edge';

/**
 * Fail-уведомление CloudPayments: платёж отклонён. Логируем владельцу в Telegram,
 * чтобы можно было связаться с клиентом. Всегда отвечаем { code: 0 }.
 */
export async function POST(req: Request) {
  let params = new URLSearchParams();
  try {
    params = new URLSearchParams(await req.text());
  } catch {
    /* ignore */
  }

  const amount = Number(params.get('Amount') || '0');
  const currency = params.get('Currency') || 'RUB';
  const description = params.get('Description') || 'Франшиза HonkVPN';
  const email = (params.get('Email') || '').trim();
  const reason = params.get('Reason') || params.get('ReasonCode') || '—';

  let telegram = '';
  let phone = '';
  const rawData = params.get('Data');
  if (rawData) {
    try {
      const parsed = JSON.parse(rawData) as { telegram?: unknown; phone?: unknown };
      if (typeof parsed.telegram === 'string') telegram = parsed.telegram.slice(0, 200);
      if (typeof parsed.phone === 'string') phone = parsed.phone.slice(0, 50);
    } catch {
      /* ignore */
    }
  }

  await notifyOwner(
    `⚠️ <b>Платёж отклонён</b>\n\n` +
      `💎 Тариф: <b>${escapeHtml(description)}</b>\n` +
      `💵 Сумма: <b>${new Intl.NumberFormat('ru-RU').format(amount)} ${currency}</b>\n` +
      `📧 Email: <b>${escapeHtml(email || '—')}</b>\n` +
      `✈️ Telegram: <b>${escapeHtml(telegram || '—')}</b>\n` +
      `📞 Телефон: <b>${escapeHtml(phone || '—')}</b>\n` +
      `❌ Причина: <b>${escapeHtml(String(reason))}</b>`,
  );

  return NextResponse.json({ code: 0 });
}
