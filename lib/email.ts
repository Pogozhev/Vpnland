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
  const date = new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const supportEmail = process.env.EMAIL_FROM || 'info@honkvpn.com';

  const subject = `HonkVPN: оплата получена — ${description}`;
  const preheader = 'Спасибо за покупку! В течение 30 минут с вами свяжется менеджер.';

  const text = [
    'HonkVPN',
    '',
    'Спасибо за покупку!',
    '',
    'Мы получили вашу оплату. Детали заказа:',
    `  • Продукт: ${description}`,
    `  • Сумма: ${formattedAmount} ${currency}`,
    `  • Дата: ${date}`,
    '',
    'Что дальше:',
    '  1. В течение 30 минут с вами свяжется менеджер — уточнит детали и согласует запуск.',
    '  2. Мы развернём инфраструктуру под ваш бренд: VPN-серверы, Telegram-бот, приём платежей.',
    '  3. Передадим доступы, методичку по привлечению клиентов и подключим к чату сопровождения.',
    '  4. Срок запуска — до 7 рабочих дней с момента оплаты.',
    '',
    `Если у вас остались вопросы — просто ответьте на это письмо или напишите на ${supportEmail}.`,
    '',
    'Команда HonkVPN',
    '',
    'Это письмо отправлено автоматически после оплаты на сайте. Если вы не совершали покупку — сообщите нам.',
  ].join('\n');

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

          <!-- next steps -->
          <tr>
            <td style="padding:24px 32px 0 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
              <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#e7ecf5;">Что дальше</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:0 0 14px 0;font-size:14px;line-height:1.55;color:#cfd5e3;"><strong style="color:#7aa0ff;">1.</strong>&nbsp;&nbsp;В течение <strong>30 минут</strong> с вами свяжется менеджер — уточнит детали и согласует запуск.</td>
                </tr>
                <tr>
                  <td style="padding:0 0 14px 0;font-size:14px;line-height:1.55;color:#cfd5e3;"><strong style="color:#7aa0ff;">2.</strong>&nbsp;&nbsp;Развернём инфраструктуру под ваш бренд: VPN-серверы, Telegram-бот, приём платежей.</td>
                </tr>
                <tr>
                  <td style="padding:0 0 14px 0;font-size:14px;line-height:1.55;color:#cfd5e3;"><strong style="color:#7aa0ff;">3.</strong>&nbsp;&nbsp;Передадим доступы, методичку по привлечению клиентов и подключим к чату сопровождения.</td>
                </tr>
                <tr>
                  <td style="padding:0;font-size:14px;line-height:1.55;color:#cfd5e3;"><strong style="color:#7aa0ff;">4.</strong>&nbsp;&nbsp;Срок запуска — до <strong>7 рабочих дней</strong> с момента оплаты.</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- support -->
          <tr>
            <td style="padding:24px 32px 0 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
              <p style="margin:0;font-size:14px;line-height:1.55;color:#8a93a6;">
                Остались вопросы? Просто ответьте на это письмо или напишите на
                <a href="mailto:${supportEmail}" style="color:#7aa0ff;text-decoration:underline;">${supportEmail}</a>.
              </p>
            </td>
          </tr>

          <!-- footer -->
          <tr>
            <td style="padding:28px 32px 28px 32px;">
              <hr style="border:none;border-top:1px solid #1f2535;margin:0 0 16px 0;" />
              <p style="margin:0 0 4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:#8a93a6;">Команда HonkVPN</p>
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:#5b6678;">
                Это письмо отправлено автоматически после оплаты на сайте. Если вы не совершали покупку — сообщите нам по адресу выше.
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
