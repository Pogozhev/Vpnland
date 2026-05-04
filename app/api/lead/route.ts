import { NextResponse } from 'next/server';

export const runtime = 'edge';

const FIELD_MAX = 500;

function clean(v: FormDataEntryValue | null | undefined): string {
  if (typeof v !== 'string') return '';
  return v.slice(0, FIELD_MAX);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function POST(req: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
  }

  if (clean(form.get('_gotcha'))) {
    return NextResponse.json({ ok: true });
  }

  const name = clean(form.get('name'));
  const contact = clean(form.get('contact'));
  const tariff = clean(form.get('tariff'));
  const consent = !!clean(form.get('consent'));

  if (!name || !contact || !consent) {
    return NextResponse.json({ ok: false, error: 'validation' }, { status: 422 });
  }

  const text =
    `🔔 <b>Новая заявка HonkVPN</b>\n\n` +
    `👤 Имя: <b>${escapeHtml(name)}</b>\n` +
    `📞 Контакт: <b>${escapeHtml(contact)}</b>\n` +
    `💎 Тариф: <b>${escapeHtml(tariff || '—')}</b>\n` +
    `✅ Согласие на обработку ПД: да`;

  const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });

  if (!tgRes.ok) {
    return NextResponse.json({ ok: false, error: 'telegram_failed' }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
