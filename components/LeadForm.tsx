'use client';

import { useState } from 'react';

const tariffs = [
  'Базовый — 29 900 ₽',
  'Средний — 79 900 ₽',
  'VIP — 300 000 ₽',
  'Консультация техдиректора — 1 500 $',
];

type Status = { kind: 'idle' | 'loading' | 'ok' | 'error'; message: string };

export default function LeadForm() {
  const [status, setStatus] = useState<Status>({
    kind: 'idle',
    message: 'Обычно отвечаем в течение 30 минут.',
  });
  const [tariff, setTariff] = useState(tariffs[1]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status.kind === 'loading') return;

    const form = e.currentTarget;
    const data = new FormData(form);

    setStatus({ kind: 'loading', message: 'Отправляем...' });
    try {
      const res = await fetch('/api/lead', { method: 'POST', body: data });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus({
        kind: 'ok',
        message: 'Спасибо! Мы свяжемся с вами в течение 30 минут.',
      });
      form.reset();
      setTariff(tariffs[1]);
    } catch {
      setStatus({
        kind: 'error',
        message: 'Не удалось отправить. Попробуйте ещё раз или напишите нам в Telegram.',
      });
    }
  }

  const submitting = status.kind === 'loading';
  const sent = status.kind === 'ok';

  return (
    <form className="cta__form" onSubmit={onSubmit} noValidate>
      <input
        type="text"
        name="_gotcha"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
      />
      <label className="field">
        <span>Имя</span>
        <input type="text" name="name" autoComplete="name" required placeholder="Как к вам обращаться" />
      </label>
      <label className="field">
        <span>Telegram или телефон</span>
        <input type="text" name="contact" autoComplete="tel" required placeholder="@username или +7 ..." />
      </label>
      <label className="field">
        <span>Тариф</span>
        <select name="tariff" value={tariff} onChange={(e) => setTariff(e.target.value)}>
          {tariffs.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <label className="field field--check">
        <input type="checkbox" name="consent" value="yes" required />
        <span>
          Я согласен с{' '}
          <a href="/privacy" target="_blank" rel="noopener">
            политикой обработки персональных данных
          </a>{' '}
          и{' '}
          <a href="/offer" target="_blank" rel="noopener">
            офертой
          </a>
          .
        </span>
      </label>
      <button className="btn btn--primary btn--block" type="submit" disabled={submitting || sent}>
        {sent ? 'Заявка отправлена ✓' : submitting ? 'Отправляем...' : 'Отправить заявку'}
      </button>
      <p className="cta__note">{status.message}</p>
    </form>
  );
}
