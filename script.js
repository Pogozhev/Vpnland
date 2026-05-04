const CLOUDPAYMENTS_PUBLIC_ID = 'pk_f01283d698872ca60146adca52352';

document.getElementById('year').textContent = new Date().getFullYear();

const form = document.getElementById('leadForm');
const formStatus = document.getElementById('formStatus');
const select = form?.querySelector('select[name="tariff"]');

document.querySelectorAll('.tariff a[href="#contact"]').forEach((link) => {
  link.addEventListener('click', () => {
    const card = link.closest('.tariff');
    const name = card?.querySelector('.tariff__name')?.textContent?.trim();
    if (!name || !select) return;
    const match = Array.from(select.options).find((o) => o.text.toLowerCase().startsWith(name.toLowerCase()));
    if (match) select.value = match.value;
  });
});

document.querySelectorAll('[data-pay]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const amount = Number(btn.dataset.amount);
    const description = btn.dataset.description || 'Франшиза HonkVPN';
    if (!amount || !window.cp || !window.cp.CloudPayments) return;

    const widget = new window.cp.CloudPayments();
    widget.pay(
      'charge',
      {
        publicId: CLOUDPAYMENTS_PUBLIC_ID,
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
        onFail(reason) {
          if (reason && reason !== 'User has cancelled') {
            alert('Не удалось оплатить: ' + reason);
          }
        },
      }
    );
  });
});

form?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = new FormData(form);
  const name = String(data.get('name') || '').trim();
  const contact = String(data.get('contact') || '').trim();
  const consent = data.get('consent');

  form.querySelectorAll('input').forEach((el) => (el.style.borderColor = ''));

  if (!name || !contact || !consent) {
    form.querySelectorAll('input[required]').forEach((el) => {
      if (!el.value || (el.type === 'checkbox' && !el.checked)) {
        el.style.borderColor = 'var(--danger)';
      }
    });
    if (formStatus) formStatus.textContent = 'Заполните обязательные поля и согласие.';
    return;
  }

  const btn = form.querySelector('button[type="submit"]');
  const action = form.getAttribute('action') || '';
  btn.disabled = true;
  btn.textContent = 'Отправляем...';

  try {
    if (action && !action.includes('YOUR_FORM_ID')) {
      const res = await fetch(action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: data,
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
    } else {
      await new Promise((r) => setTimeout(r, 600));
    }

    btn.textContent = 'Заявка отправлена ✓';
    if (formStatus) formStatus.textContent = 'Спасибо! Мы свяжемся с вами в течение 30 минут.';
    form.reset();
  } catch {
    btn.disabled = false;
    btn.textContent = 'Отправить заявку';
    if (formStatus) formStatus.textContent = 'Не удалось отправить. Попробуйте ещё раз или напишите нам в Telegram.';
  }
});

const cookieBanner = document.getElementById('cookieBanner');
const cookieAccept = document.getElementById('cookieAccept');
const COOKIE_KEY = 'honkvpn_cookie_consent';

if (cookieBanner) {
  try {
    if (!localStorage.getItem(COOKIE_KEY)) {
      cookieBanner.hidden = false;
    }
  } catch {
    cookieBanner.hidden = false;
  }
  cookieAccept?.addEventListener('click', () => {
    try {
      localStorage.setItem(COOKIE_KEY, '1');
    } catch {}
    cookieBanner.hidden = true;
  });
}
