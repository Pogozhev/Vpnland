/**
 * Cloudflare Worker для приёма заявок с лендинга HonkVPN и пересылки их в Telegram.
 *
 * Установка (один раз):
 *  1. Cloudflare → Workers & Pages → Create → Worker → дать имя (например, honkvpn-leads)
 *  2. Edit code → вставить содержимое этого файла → Save and deploy
 *  3. Settings → Variables → Add variable (Encrypt):
 *       BOT_TOKEN  = токен бота из @BotFather
 *       CHAT_ID    = твой chat id (можно узнать через @userinfobot)
 *  4. Settings → Triggers → скопировать URL воркера (вида honkvpn-leads.<твой-id>.workers.dev)
 *  5. Прислать этот URL в чат — подставлю в форму на сайте.
 *
 * Безопасность:
 *  - BOT_TOKEN и CHAT_ID хранятся как secrets Cloudflare и недоступны через код.
 *  - CORS открыт только для нашего домена.
 *  - Honeypot-поле _gotcha отсекает простых ботов.
 *  - Лимит длины полей — защита от мусорных POST.
 */

const ALLOWED_ORIGINS = [
  'https://pogozhev.github.io',
  'http://localhost:8000',
];

const FIELD_MAX = 500;

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function escapeHtml(s) {
  return String(s ?? '')
    .slice(0, FIELD_MAX)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('origin') || '';
    const headers = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers });
    }

    let data = {};
    try {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await request.json();
      } else {
        const formData = await request.formData();
        data = Object.fromEntries(formData);
      }
    } catch {
      return new Response('Bad request', { status: 400, headers });
    }

    if (data._gotcha) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const text =
      `🔔 <b>Новая заявка HonkVPN</b>\n\n` +
      `👤 Имя: <b>${escapeHtml(data.name)}</b>\n` +
      `📞 Контакт: <b>${escapeHtml(data.contact)}</b>\n` +
      `💎 Тариф: <b>${escapeHtml(data.tariff)}</b>\n` +
      `✅ Согласие на обработку ПД: ${data.consent ? 'да' : 'нет'}`;

    const tgRes = await fetch(
      `https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.CHAT_ID,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      },
    );

    if (!tgRes.ok) {
      return new Response(JSON.stringify({ ok: false }), {
        status: 502,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  },
};
