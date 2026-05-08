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

export default function PayButton({ amount, description, variant = 'primary' }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadWidget().catch(() => {});
  }, []);

  useEffect(() => {
    if (open) {
      setError('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const publicId = process.env.NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID;

  function startPayment() {
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Укажите корректный email');
      return;
    }
    if (!publicId) {
      setError('Платёжная система ещё не настроена.');
      return;
    }
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
            email: trimmed,
            skin: 'mini',
          },
          {
            onSuccess() {
              alert(`Оплата прошла. Письмо отправили на ${trimmed}, мы свяжемся с вами для запуска.`);
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

  return (
    <>
      <button type="button" className={cls} onClick={() => setOpen(true)}>
        Оплатить
      </button>

      {open && (
        <div className="pay-dialog" role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
          <div className="pay-dialog__inner" onClick={(e) => e.stopPropagation()}>
            <h3 className="pay-dialog__title">Email для чека и доступов</h3>
            <p className="pay-dialog__sub">Сюда придёт чек об оплате и письмо с дальнейшими шагами.</p>
            <input
              ref={inputRef}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && startPayment()}
              className="pay-dialog__input"
            />
            {error && <p className="pay-dialog__error">{error}</p>}
            <div className="pay-dialog__actions">
              <button type="button" className="btn btn--ghost" onClick={() => setOpen(false)}>
                Отмена
              </button>
              <button type="button" className={variant === 'gold' ? 'btn btn--gold' : 'btn btn--primary'} onClick={startPayment}>
                Перейти к оплате
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
