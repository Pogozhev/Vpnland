import nodemailer from 'nodemailer';

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

let cachedTransporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USERNAME;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    throw new Error('SMTP is not configured');
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: { user, pass },
  });

  return cachedTransporter;
}

export async function sendEmail({ to, subject, html, text }: EmailPayload) {
  const from = process.env.EMAIL_FROM;
  if (!from) throw new Error('EMAIL_FROM is not configured');

  const transporter = getTransporter();
  await transporter.sendMail({ from, to, subject, html, text });
}

export function purchaseEmail(params: {
  description: string;
  amount: number;
  currency: string;
  channelUrl: string | null;
}) {
  const { description, amount, currency, channelUrl } = params;
  const formattedAmount = new Intl.NumberFormat('ru-RU').format(amount);
  const date = new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const subject = `HonkVPN: оплата получена — ${description}`;
  const preheader = channelUrl
    ? 'Спасибо за покупку! Вступайте в закрытый канал — там доступы и инструкции.'
    : 'Спасибо за покупку! В течение 30 минут с вами свяжется менеджер.';

  const textLines = [
    'HonkVPN',
    '',
    'Спасибо за покупку!',
    '',
    'Мы получили вашу оплату. Детали заказа:',
    `  • Продукт: ${description}`,
    `  • Сумма: ${formattedAmount} ${currency}`,
    `  • Дата: ${date}`,
    '',
  ];
  if (channelUrl) {
    textLines.push(
      'Дальнейшие шаги — в закрытом Telegram-канале вашего тарифа.',
      `Вступить: ${channelUrl}`,
      '',
      'Там вы получите доступы, методичку по привлечению клиентов и поддержку команды.',
      'В течение 30 минут с вами также свяжется менеджер.',
    );
  } else {
    textLines.push(
      'В течение 30 минут с вами свяжется менеджер — уточнит детали и согласует запуск.',
      'Срок запуска инфраструктуры — до 7 рабочих дней с момента оплаты.',
    );
  }
  textLines.push('', 'Команда HonkVPN', '', 'Это письмо отправлено автоматически после оплаты на сайте.');
  const text = textLines.join('\n');

  const channelBlock = channelUrl
    ? `
          <!-- CTA -->
          <tr>
            <td style="padding:24px 32px 0 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
              <p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:#cfd5e3;">Дальнейшие шаги — в закрытом Telegram-канале вашего тарифа. Там доступы, методичка по привлечению клиентов и поддержка команды.</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 8px;">
                <tr>
                  <td style="background:#5b8cff;border-radius:12px;">
                    <a href="${channelUrl}" target="_blank" rel="noopener" style="display:inline-block;padding:13px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Вступить в Telegram-канал</a>
                  </td>
                </tr>
              </table>
              <p style="margin:8px 0 0;font-size:13px;color:#8a93a6;word-break:break-all;">Если кнопка не работает: <a href="${channelUrl}" target="_blank" rel="noopener" style="color:#7aa0ff;">${channelUrl}</a></p>
            </td>
          </tr>

          <!-- secondary note -->
          <tr>
            <td style="padding:20px 32px 0 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
              <p style="margin:0;font-size:14px;line-height:1.55;color:#8a93a6;">В течение <strong style="color:#cfd5e3;">30 минут</strong> с вами также свяжется менеджер — уточнит детали и поможет с запуском.</p>
            </td>
          </tr>`
    : `
          <!-- next steps -->
          <tr>
            <td style="padding:24px 32px 0 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
              <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#e7ecf5;">Что дальше</p>
              <p style="margin:0 0 12px;font-size:14px;line-height:1.55;color:#cfd5e3;">В течение <strong>30 минут</strong> с вами свяжется менеджер — уточнит детали и согласует запуск.</p>
              <p style="margin:0;font-size:14px;line-height:1.55;color:#cfd5e3;">Срок запуска инфраструктуры — до <strong>7 рабочих дней</strong> с момента оплаты.</p>
            </td>
          </tr>`;

  const html = `<!doctype html>
<html lang="ru" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark light" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#0c1018;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:#0c1018;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0c1018;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#11151f;border:1px solid #1f2535;border-radius:18px;overflow:hidden;">

          <!-- header -->
          <tr>
            <td style="padding:28px 32px 0 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <span style="display:inline-block;width:32px;height:32px;border-radius:8px;background:#5b8cff;text-align:center;line-height:32px;font-size:18px;color:#ffffff;">&#9960;</span>
                  </td>
                  <td style="vertical-align:middle;padding-left:10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:18px;font-weight:800;color:#e7ecf5;">
                    Honk<span style="color:#7aa0ff;">VPN</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- title -->
          <tr>
            <td style="padding:24px 32px 0 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
              <p style="margin:0 0 6px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#21d4a3;">Оплата получена</p>
              <h1 style="margin:0;font-size:24px;line-height:1.25;color:#e7ecf5;">Спасибо за покупку!</h1>
            </td>
          </tr>

          <!-- order details -->
          <tr>
            <td style="padding:20px 32px 0 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0c1018;border:1px solid #1f2535;border-radius:12px;">
                <tr>
                  <td style="padding:16px 18px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding:6px 0;font-size:14px;color:#8a93a6;">Продукт</td>
                        <td align="right" style="padding:6px 0;font-size:14px;color:#e7ecf5;font-weight:600;">${description}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:14px;color:#8a93a6;border-top:1px solid #1f2535;">Сумма</td>
                        <td align="right" style="padding:6px 0;font-size:14px;color:#21d4a3;font-weight:700;border-top:1px solid #1f2535;">${formattedAmount}&nbsp;${currency}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:14px;color:#8a93a6;border-top:1px solid #1f2535;">Дата</td>
                        <td align="right" style="padding:6px 0;font-size:14px;color:#e7ecf5;border-top:1px solid #1f2535;">${date}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
${channelBlock}

          <!-- footer -->
          <tr>
            <td style="padding:28px 32px 28px 32px;">
              <hr style="border:none;border-top:1px solid #1f2535;margin:24px 0 16px 0;" />
              <p style="margin:0 0 4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:#8a93a6;">Команда HonkVPN</p>
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:#5b6678;">
                Это письмо отправлено автоматически после оплаты на сайте.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}
