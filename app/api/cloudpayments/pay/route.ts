import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { sendEmail, purchaseEmail } from '@/lib/email';

export const runtime = 'nodejs';

const ok = (extra: Record<string, unknown> = {}) =>
  NextResponse.json({ code: 0, ...extra });

const fail = (message: string, status = 200) =>
  NextResponse.json({ code: 13, message }, { status });

export async function POST(req: Request) {
  const apiPassword = process.env.CLOUDPAYMENTS_API_PASSWORD;
  if (!apiPassword) {
    return fail('not_configured');
  }

  const body = await req.text();

  const signature =
    req.headers.get('content-hmac') || req.headers.get('x-content-hmac') || '';
  const expected = crypto
    .createHmac('sha256', apiPassword)
    .update(body, 'utf8')
    .digest('base64');

  if (!signature || signature !== expected) {
    return fail('invalid_signature', 401);
  }

  const params = new URLSearchParams(body);
  const status = params.get('Status') || '';
  const email = (params.get('Email') || '').trim();
  const amount = Number(params.get('Amount') || '0');
  const currency = params.get('Currency') || 'RUB';
  const description = params.get('Description') || 'Франшиза HonkVPN';

  if (status !== 'Completed' || !email) {
    return ok();
  }

  try {
    await sendEmail({
      to: email,
      ...purchaseEmail({ description, amount, currency }),
    });
  } catch (err) {
    console.error('email_send_failed', err);
  }

  return ok();
}
