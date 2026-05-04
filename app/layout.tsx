import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HonkVPN — франшиза VPN-бизнеса под ключ',
  description:
    'HonkVPN — франшиза VPN-бизнеса под ключ: VPN, Telegram-бот, лендинг, админка и сопровождение от команды.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#07090f',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
