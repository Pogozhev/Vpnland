'use client';

import { useEffect, useState } from 'react';

const COOKIE_KEY = 'honkvpn_cookie_consent';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(COOKIE_KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="cookie">
      <div className="container cookie__inner">
        <p>
          Мы используем cookie для корректной работы сайта и аналитики посещаемости. Продолжая
          пользоваться сайтом, вы соглашаетесь с{' '}
          <a href="/privacy">политикой обработки персональных данных</a>.
        </p>
        <button
          type="button"
          className="btn btn--primary btn--sm"
          onClick={() => {
            try {
              localStorage.setItem(COOKIE_KEY, '1');
            } catch {}
            setVisible(false);
          }}
        >
          Принять
        </button>
      </div>
    </div>
  );
}
