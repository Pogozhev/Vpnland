'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    cp?: { CloudPayments: new () => { pay: (action: string, options: object, callbacks: object) => void } };
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
  useEffect(() => {
    loadWidget().catch(() => {});
  }, []);

  const publicId = process.env.NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID;

  function onClick() {
    if (!publicId) {
      alert('Платёжная система ещё не настроена.');
      return;
    }
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
            skin: 'mini',
          },
          {
            onSuccess() {
              alert('Оплата прошла успешно. Мы свяжемся с вами для запуска.');
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
    <button type="button" className={cls} onClick={onClick}>
      Оплатить
    </button>
  );
}
