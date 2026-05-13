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

// ---------- logger ----------
// Все логи помечены `[cp.pay]` + reqId. На Vercel ищутся в Functions Logs
// фильтром "cp.pay". Скинь этот срез логов — этого достаточно для диагностики.

function rid() {
  return Math.random().toString(36).slice(2, 10);
}

function L(reqId: string, step: string, msg: string, extra?: Record<string, unknown>) {
  const head = `[cp.pay][${reqId}][${step}] ${msg}`;
  if (extra && Object.keys(extra).length) console.log(head, JSON.stringify(extra));
  else console.log(head);
}

function LErr(reqId: string, step: string, e: unknown) {
  const any = e as Record<string, unknown> & { message?: string; stack?: string };
  const dump: Record<string, unknown> = { message: any?.message ?? String(e) };
  for (const k of ['name', 'code', 'command', 'response', 'responseCode', 'errno', 'syscall', 'address', 'port']) {
    if (any && k in any) dump[k] = any[k];
  }
  console.error(`[cp.pay][${reqId}][${step}] ✗ ERROR`, JSON.stringify(dump));
  if (any?.stack) console.error(`[cp.pay][${reqId}][${step}] stack:`, any.stack);
}

function maskTail(v: string | null | undefined, keep = 6) {
  if (!v) return '(empty)';
  if (v.length <= keep) return `len=${v.length} ***`;
  return `len=${v.length} tail=…${v.slice(-keep)}`;
}

// ---------- handler ----------

export async function POST(req: Request) {
  const reqId = rid();
  const t0 = Date.now();
  L(reqId, 'start', 'incoming POST', {
    url: req.url,
    method: req.method,
    contentType: req.headers.get('content-type'),
    contentLength: req.headers.get('content-length'),
    userAgent: req.headers.get('user-agent'),
    contentHmac: maskTail(req.headers.get('content-hmac')),
    xContentHmac: maskTail(req.headers.get('x-content-hmac')),
  });
  L(reqId, 'env', 'env presence', {
    CLOUDPAYMENTS_API_PASSWORD: !!process.env.CLOUDPAYMENTS_API_PASSWORD,
    SMTP_HOST: !!process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT || '(unset, default 587)',
    SMTP_USERNAME: !!process.env.SMTP_USERNAME,
    SMTP_PASSWORD: !!process.env.SMTP_PASSWORD,
    EMAIL_FROM: process.env.EMAIL_FROM || '(unset)',
    TELEGRAM_BOT_TOKEN: !!process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID: !!process.env.TELEGRAM_CHAT_ID,
  });

  const apiPassword = process.env.CLOUDPAYMENTS_API_PASSWORD;
  if (!apiPassword) {
    L(reqId, 'env', '✗ CLOUDPAYMENTS_API_PASSWORD is missing — replying fail("not_configured")');
    return fail('not_configured');
  }

  // Читаем сырое тело как байты (исключает UTF-8 round-trip как источник расхождений в HMAC).
  let rawBuf: Buffer;
  try {
    rawBuf = Buffer.from(await req.arrayBuffer());
  } catch (e) {
    LErr(reqId, 'body', e);
    return fail('body_read_failed');
  }
  const body = rawBuf.toString('utf8');
  L(reqId, 'body', 'raw body received', {
    bytes: rawBuf.length,
    bodyPreview: body.length > 2000 ? body.slice(0, 2000) + '…(truncated)' : body,
  });

  const signature =
    req.headers.get('content-hmac') || req.headers.get('x-content-hmac') || '';
  const expected = crypto.createHmac('sha256', apiPassword).update(rawBuf).digest('base64');
  const sigOk = !!signature && signature === expected;
  L(reqId, 'sig', `signature ${sigOk ? '✓ match' : '✗ MISMATCH'}`, {
    got: maskTail(signature),
    expected: maskTail(expected),
    gotLen: signature.length,
    expectedLen: expected.length,
  });
  if (!sigOk) {
    return fail('invalid_signature', 401);
  }

  const params = new URLSearchParams(body);
  const allParams: Record<string, string> = {};
  for (const [k, v] of params.entries()) allParams[k] = v.length > 500 ? v.slice(0, 500) + '…' : v;
  L(reqId, 'parse', 'parsed form params', allParams);

  const status = params.get('Status') || '';
  const emailFromField = (params.get('Email') || '').trim();
  const emailFromAccount = (params.get('AccountId') || '').trim();
  const amount = Number(params.get('Amount') || '0');
  const currency = params.get('Currency') || 'RUB';
  const description = params.get('Description') || 'Франшиза HonkVPN';

  let telegram = '';
  let phone = '';
  let emailFromData = '';
  const rawData = params.get('Data');
  if (rawData) {
    try {
      const parsed = JSON.parse(rawData) as { telegram?: unknown; phone?: unknown; email?: unknown };
      if (typeof parsed.telegram === 'string') telegram = parsed.telegram.slice(0, 200);
      if (typeof parsed.phone === 'string') phone = parsed.phone.slice(0, 50);
      if (typeof parsed.email === 'string') emailFromData = parsed.email.trim().slice(0, 200);
      L(reqId, 'data', 'parsed Data JSON', { telegram, phone, emailFromData });
    } catch (e) {
      LErr(reqId, 'data', e);
    }
  } else {
    L(reqId, 'data', 'no Data field');
  }

  const email = emailFromField || emailFromAccount || emailFromData;
  L(reqId, 'fields', 'extracted fields', {
    status,
    amount,
    currency,
    description,
    emailChosen: email || '(empty)',
    emailFromField,
    emailFromAccount,
    emailFromData,
  });

  // Раньше тут было `if (status !== 'Completed') return ok()` — оно молча резало
  // двухстадийные платежи и любые уведомления без поля Status.
  // Сейчас не фильтруем по Status: Pay-эндпоинт у CloudPayments сам по себе семантически означает успех.
  if (status && status !== 'Completed') {
    L(reqId, 'status', `Status="${status}" (не Completed) — продолжаем обработку всё равно`);
  }

  try {
    L(reqId, 'tg', 'notifying owner via Telegram');
    await notifyOwner(
      `💰 <b>Новая оплата HonkVPN</b>\n\n` +
        `💎 Тариф: <b>${escapeHtml(description)}</b>\n` +
        `💵 Сумма: <b>${new Intl.NumberFormat('ru-RU').format(amount)} ${currency}</b>\n` +
        `📧 Email: <b>${escapeHtml(email)}</b>\n` +
        `✈️ Telegram: <b>${escapeHtml(telegram || '—')}</b>\n` +
        `📞 Телефон: <b>${escapeHtml(phone || '—')}</b>`,
    );
    L(reqId, 'tg', '✓ owner notified');
  } catch (e) {
    LErr(reqId, 'tg', e);
  }

  if (!email) {
    L(reqId, 'mail', '✗ skipping email send: no email in Email/AccountId/Data');
    L(reqId, 'end', `done (no email) in ${Date.now() - t0}ms`);
    return ok();
  }

  L(reqId, 'mail', 'preparing email payload');
  const payload = purchaseEmail({
    description,
    amount,
    currency,
    channelUrl: channelLinkFor(description),
  });
  L(reqId, 'mail', 'payload built', {
    to: email,
    subject: payload.subject,
    htmlBytes: payload.html.length,
    textBytes: payload.text.length,
    channelUrl: channelLinkFor(description),
  });

  const sendStarted = Date.now();
  try {
    await sendEmail({ to: email, ...payload });
    L(reqId, 'mail', `✓ sendEmail returned in ${Date.now() - sendStarted}ms`);
  } catch (err) {
    LErr(reqId, 'mail', err);
    // Дублируем в Telegram, чтобы инцидент не остался в Vercel-логах.
    try {
      const e = err as { message?: string; code?: string; response?: string };
      await notifyOwner(
        `⚠️ <b>EMAIL FAIL</b>\nreqId: <code>${reqId}</code>\n` +
          `to: <code>${escapeHtml(email)}</code>\n` +
          `code: <code>${escapeHtml(String(e?.code ?? '—'))}</code>\n` +
          `msg: <code>${escapeHtml(String(e?.message ?? err))}</code>\n` +
          `resp: <code>${escapeHtml(String(e?.response ?? '—'))}</code>`,
      );
    } catch (tgErr) {
      LErr(reqId, 'tg.fail', tgErr);
    }
  }

  L(reqId, 'end', `done in ${Date.now() - t0}ms`);
  return ok();
}
