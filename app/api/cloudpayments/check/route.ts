import { NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * Check-уведомление CloudPayments: вызывается ДО списания, чтобы подтвердить заказ.
 * У нас нет серверной валидации заказа (сумму задаёт виджет), поэтому всегда
 * разрешаем платёж — { code: 0 }. Никогда не блокируем оплату из-за ошибок здесь.
 */
export async function POST() {
  return NextResponse.json({ code: 0 });
}
