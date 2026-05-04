import type { ReactNode } from 'react';

const legalStyles = `
.legal { padding: 80px 0; }
.legal .container { max-width: 820px; }
.legal h1 { font-size: 32px; margin: 0 0 24px; letter-spacing: -0.5px; }
.legal h2 { font-size: 20px; margin: 32px 0 12px; }
.legal p, .legal li { color: #cfd5e3; font-size: 15px; }
.legal ul, .legal ol { padding-left: 22px; }
.legal a { color: var(--primary-2); text-decoration: underline; }
.legal__back { display: inline-block; margin-bottom: 24px; color: var(--muted); }
`;

export default function LegalLayout({ children }: { children: ReactNode }) {
  const year = new Date().getFullYear();
  return (
    <>
      <style>{legalStyles}</style>
      <header className="nav">
        <div className="container nav__inner">
          <a href="/" className="brand">
            <span className="brand__logo">⛨</span>
            <span className="brand__name">Honk<span>VPN</span></span>
          </a>
          <a href="/" className="btn btn--ghost btn--sm">На главную</a>
        </div>
      </header>

      <main className="legal">
        <div className="container">
          <a href="/" className="legal__back">← Вернуться</a>
          {children}
        </div>
      </main>

      <footer className="footer">
        <div className="container footer__inner">
          <div className="brand">
            <span className="brand__logo">⛨</span>
            <span className="brand__name">Honk<span>VPN</span></span>
          </div>
          <p className="footer__copy">© {year} HonkVPN.</p>
          <div className="footer__links">
            <a href="/#tariffs">Тарифы</a>
            <a href="/privacy">Политика конфиденциальности</a>
            <a href="/offer">Оферта</a>
            <a href="/#contact">Контакты</a>
          </div>
        </div>
      </footer>
    </>
  );
}
