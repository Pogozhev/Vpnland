'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    cp?: {
      CloudPayments: new () => {
        pay: (action: string, options: object, callbacks: object) => void;
      };
    };
  }
}

const WIDGET_SRC = 'https://widget.cloudpayments.ru/bundles/cloudpayments.js';

let scriptPromise: Promise<void> | null = null;

function loadWidget(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject();
  if (window.cp?.CloudPayments) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${WIDGET_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject());
      return;
    }
    const script = document.createElement('script');
    script.src = WIDGET_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject();
    document.head.appendChild(script);
  });
  return scriptPromise;
}

type Props = {
  amount: number;
  description: string;
  variant?: 'primary' | 'gold';
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function PayButton({ amount, description, variant = 'primary' }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [telegram, setTelegram] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadWidget().catch(() => {});
  }, []);

  useEffect(() => {
    if (open) {
      setError('');
      setTimeout(() => emailRef.current?.focus(), 50);
    }
  }, [open]);

  const publicId = process.env.NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID;

  function startPayment() {
    const e = email.trim();
    const tg = telegram.trim();
    const ph = phone.trim();

    if (!EMAIL_RE.test(e)) return setError('Укажите корректный email');
    if (tg.length < 2) return setError('Укажите Telegram для связи');
    if (!publicId) return setError('Платёжная система ещё не настроена.');

    setOpen(false);
    loadWidget()
      .then(() => {
        if (!window.cp?.CloudPayments) return;
        const widget = new window.cp.CloudPayments();
        widget.pay(
          'charge',
          {
            publicId,
            description,
            amount,
            currency: 'RUB',
            invoiceId: 'honkvpn-' + Date.now(),
            accountId: e,
            email: e,
            data: { telegram: tg, phone: ph },
            skin: 'mini',
          },
          {
            onSuccess() {
              alert(`Оплата прошла. Письмо с доступом отправили на ${e}.`);
            },
            onFail(reason: string) {
              if (reason && reason !== 'User has cancelled') {
                alert('Не удалось оплатить: ' + reason);
              }
            },
          },
        );
      })
      .catch(() => alert('Не удалось загрузить платёжный виджет. Проверьте интернет.'));
  }

  const cls = variant === 'gold' ? 'btn btn--gold btn--block' : 'btn btn--primary btn--block';
  const submitCls = variant === 'gold' ? 'btn btn--gold' : 'btn btn--primary';

  return (
    <>
      <button type="button" className={cls} onClick={() => setOpen(true)}>
        Оплатить
      </button>

      {open && (
        <div className="pay-dialog" role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
          <div className="pay-dialog__inner" onClick={(ev) => ev.stopPropagation()}>
            <h3 className="pay-dialog__title">Контакты для доступа</h3>
            <p className="pay-dialog__sub">
              На email придёт чек и письмо со ссылкой в закрытый канал. По Telegram и телефону с вами свяжется менеджер.
            </p>
            <input
              ref={emailRef}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="Email — you@example.com"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              className="pay-dialog__input"
            />
            <input
              type="text"
              autoComplete="username"
              placeholder="Telegram — @username"
              value={telegram}
              onChange={(ev) => setTelegram(ev.target.value)}
              className="pay-dialog__input"
            />
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="Телефон — +7... (необязательно)"
              value={phone}
              onChange={(ev) => setPhone(ev.target.value)}
              onKeyDown={(ev) => ev.key === 'Enter' && startPayment()}
              className="pay-dialog__input"
            />
            {error && <p className="pay-dialog__error">{error}</p>}
            <div className="pay-dialog__actions">
              <button type="button" className="btn btn--ghost" onClick={() => setOpen(false)}>
                Отмена
              </button>
              <button type="button" className={submitCls} onClick={startPayment}>
                Перейти к оплате
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
