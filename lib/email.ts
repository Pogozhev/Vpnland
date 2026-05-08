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

export function purchaseEmail(params: { description: string; amount: number; currency: string }) {
  const { description, amount, currency } = params;
  const formattedAmount = new Intl.NumberFormat('ru-RU').format(amount);

  const text = [
    'Спасибо за покупку!',
    '',
    `Вы оформили: ${description}.`,
    `Сумма: ${formattedAmount} ${currency}.`,
    '',
    'В течение 30 минут с вами свяжется менеджер для запуска инфраструктуры.',
    'Если у вас остались вопросы — ответьте на это письмо.',
    '',
    'Команда HonkVPN',
  ].join('\n');

  const html = `<!doctype html>
<html lang="ru">
  <body style="margin:0;padding:0;background:#0c1018;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif;color:#e7ecf5">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
      <tr><td align="center">
        <table role="presentation" width="100%" style="max-width:540px;background:#11151f;border:1px solid #1f2535;border-radius:16px;padding:32px">
          <tr><td>
            <p style="margin:0 0 8px;font-size:13px;color:#7aa0ff;letter-spacing:0.5px;text-transform:uppercase">HonkVPN</p>
            <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25">Спасибо за покупку!</h1>
            <p style="margin:0 0 16px;font-size:15px;color:#cfd5e3;line-height:1.55">Вы оформили: <strong>${description}</strong>.</p>
            <p style="margin:0 0 24px;font-size:15px;color:#cfd5e3;line-height:1.55">Сумма: <strong>${formattedAmount}&nbsp;${currency}</strong>.</p>
            <div style="background:#0c1018;border:1px solid #1f2535;border-radius:12px;padding:18px;margin-bottom:24px">
              <p style="margin:0;font-size:14px;color:#cfd5e3;line-height:1.55">⏱ В течение <strong>30 минут</strong> с вами свяжется менеджер для запуска инфраструктуры.</p>
            </div>
            <p style="margin:0 0 8px;font-size:14px;color:#8a93a6">Если у вас остались вопросы — просто ответьте на это письмо.</p>
            <p style="margin:24px 0 0;font-size:14px;color:#8a93a6">Команда HonkVPN</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  return {
    subject: 'Спасибо за покупку HonkVPN',
    text,
    html,
  };
}
