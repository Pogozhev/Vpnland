/**
 * Диагностика SMTP-отправки.
 *
 * Запуск:
 *   bun run email:diagnose                       — отправить на EMAIL_FROM (себе)
 *   bun run email:diagnose -- to@example.com     — отправить на указанный адрес
 *   MAIL_PORT=465 bun run email:diagnose         — проверить TLS вместо STARTTLS
 *
 * Скрипт пошагово логирует: env → DNS → сырой TCP → nodemailer.verify() → sendMail.
 * Полный SMTP-диалог печатается в stderr (debug:true, logger:true).
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve4, resolve6, resolveMx } from 'node:dns/promises';
import { createConnection } from 'node:net';
import { join } from 'node:path';
import nodemailer from 'nodemailer';

// ---------- utils ----------

function log(step: string, msg: string) {
  console.log(`[${new Date().toISOString()}] [${step}] ${msg}`);
}

function err(step: string, e: unknown) {
  const any = e as Record<string, unknown> & { message?: string; stack?: string };
  console.error(`[${new Date().toISOString()}] [${step}] ✗ ERROR`);
  console.error('  message:', any?.message ?? e);
  for (const k of ['code', 'command', 'response', 'responseCode', 'errno', 'syscall', 'address', 'port']) {
    if (any && k in any) console.error(`  ${k}:`, any[k]);
  }
  if (any?.stack) console.error('  stack:', any.stack);
}

function mask(v: string | undefined) {
  if (!v) return '(unset)';
  if (v.length <= 4) return `len=${v.length} value=***`;
  return `len=${v.length} head=${v.slice(0, 2)}*** tail=***${v.slice(-2)}`;
}

// ---------- .env.local loader ----------

function loadDotenvLocal() {
  const candidates = [
    join(process.cwd(), '.env.local'),
    join(process.cwd(), '.env'),
    join(__dirname, '..', '.env.local'),
    join(__dirname, '..', '.env'),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    log('env', `loading ${path}`);
    const raw = readFileSync(path, 'utf8');
    let loaded = 0;
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) {
        process.env[key] = value;
        loaded++;
      }
    }
    log('env', `loaded ${loaded} new vars from ${path}`);
    return;
  }
  log('env', 'no .env.local / .env found in cwd or script parent — using process env only');
}

// ---------- steps ----------

async function stepEnv() {
  log('env', '--- checking env vars ---');
  const vars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USERNAME', 'SMTP_PASSWORD', 'EMAIL_FROM', 'MAIL_TO', 'MAIL_PORT'];
  for (const v of vars) log('env', `${v}: ${mask(process.env[v])}`);
  const required = ['SMTP_HOST', 'SMTP_USERNAME', 'SMTP_PASSWORD', 'EMAIL_FROM'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) throw new Error(`missing required env: ${missing.join(', ')}`);
}

async function stepDns(host: string, toAddr: string) {
  log('dns', `--- resolving ${host} ---`);
  try { log('dns', `A: ${(await resolve4(host)).join(', ')}`); } catch (e) { err('dns.A', e); }
  try { log('dns', `AAAA: ${(await resolve6(host)).join(', ')}`); } catch (e) { log('dns', `AAAA: none (${(e as Error).message})`); }

  const recipientDomain = toAddr.split('@')[1];
  if (recipientDomain) {
    log('dns', `--- MX for recipient domain ${recipientDomain} ---`);
    try {
      const mx = await resolveMx(recipientDomain);
      mx.sort((a, b) => a.priority - b.priority);
      for (const r of mx) log('dns', `MX prio=${r.priority} ${r.exchange}`);
    } catch (e) { err('dns.MX', e); }
  }
}

function stepTcp(host: string, port: number): Promise<void> {
  log('tcp', `--- opening raw TCP ${host}:${port} ---`);
  return new Promise((resolveP) => {
    const started = Date.now();
    const socket = createConnection({ host, port, timeout: 10_000 });
    let buffer = '';
    let done = false;
    const finish = (label: string) => {
      if (done) return;
      done = true;
      log('tcp', `${label} after ${Date.now() - started}ms`);
      socket.destroy();
      resolveP();
    };
    socket.on('connect', () => log('tcp', `connected in ${Date.now() - started}ms, waiting for greeting...`));
    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      log('tcp', `recv: ${chunk.toString('utf8').trim()}`);
      if (buffer.includes('\n')) {
        try { socket.write('QUIT\r\n'); } catch { /* ignore */ }
        setTimeout(() => finish('closed (got greeting)'), 200);
      }
    });
    socket.on('timeout', () => { err('tcp', new Error('socket timeout')); finish('timed out'); });
    socket.on('error', (e) => { err('tcp', e); finish('errored'); });
    socket.on('close', () => finish('closed'));
  });
}

function makeTransport(host: string, port: number, user: string, pass: string) {
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: { user, pass },
    logger: true,
    debug: true,
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
  });
}

async function stepVerify(transport: nodemailer.Transporter) {
  log('verify', '--- transporter.verify() ---');
  const started = Date.now();
  const ok = await transport.verify();
  log('verify', `result=${ok} in ${Date.now() - started}ms`);
}

async function stepSend(transport: nodemailer.Transporter, from: string, to: string) {
  log('send', `--- sendMail from=${from} to=${to} ---`);
  const started = Date.now();
  const info = await transport.sendMail({
    from,
    to,
    subject: `[diag] SMTP test ${new Date().toISOString()}`,
    text: 'Это диагностическое письмо. Если получили — SMTP-связка работает.',
    html: '<p>Это диагностическое письмо. Если получили — SMTP-связка работает.</p>',
  });
  log('send', `done in ${Date.now() - started}ms`);
  log('send', `messageId: ${info.messageId}`);
  log('send', `response: ${info.response}`);
  log('send', `accepted: ${JSON.stringify(info.accepted)}`);
  log('send', `rejected: ${JSON.stringify(info.rejected)}`);
  log('send', `envelope: ${JSON.stringify(info.envelope)}`);
}

// ---------- main ----------

async function main() {
  console.log('===== EMAIL DIAGNOSE =====');
  console.log('cwd:', process.cwd());
  console.log('node:', process.version);

  loadDotenvLocal();
  await stepEnv();

  const host = process.env.SMTP_HOST!;
  const port = Number(process.env.MAIL_PORT || process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USERNAME!;
  const pass = process.env.SMTP_PASSWORD!;
  const from = process.env.EMAIL_FROM!;
  const to = process.argv[2] || process.env.MAIL_TO || from;

  log('cfg', `host=${host} port=${port} user=${user} from=${from} to=${to} secure=${port === 465} requireTLS=${port === 587}`);

  await stepDns(host, to);
  await stepTcp(host, port);

  const transport = makeTransport(host, port, user, pass);

  try {
    await stepVerify(transport);
  } catch (e) {
    err('verify', e);
    console.log('\n>>> verify failed — sendMail тоже почти наверняка упадёт, но всё равно пробуем для полноты логов\n');
  }

  try {
    await stepSend(transport, from, to);
    console.log('\n===== ✓ SUCCESS =====');
  } catch (e) {
    err('send', e);
    console.log('\n===== ✗ FAILED =====');
    process.exitCode = 1;
  }
}

main().catch((e) => {
  err('main', e);
  process.exit(1);
});
