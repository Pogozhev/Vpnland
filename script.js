document.getElementById('year').textContent = new Date().getFullYear();

const tariffLinks = document.querySelectorAll('.tariff a[href="#contact"]');
const select = document.querySelector('select[name="tariff"]');
tariffLinks.forEach((link) => {
  link.addEventListener('click', () => {
    const card = link.closest('.tariff');
    const name = card?.querySelector('.tariff__name')?.textContent?.trim();
    if (!name || !select) return;
    const match = Array.from(select.options).find((o) => o.text.toLowerCase().startsWith(name.toLowerCase()));
    if (match) select.value = match.value;
  });
});

const form = document.getElementById('leadForm');
form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(form);
  const name = (data.get('name') || '').toString().trim();
  const contact = (data.get('contact') || '').toString().trim();
  if (!name || !contact) {
    form.querySelectorAll('input').forEach((el) => {
      if (!el.value.trim()) el.style.borderColor = 'var(--danger)';
    });
    return;
  }
  const btn = form.querySelector('button[type="submit"]');
  btn.textContent = 'Заявка отправлена ✓';
  btn.disabled = true;
  setTimeout(() => {
    form.reset();
    btn.disabled = false;
    btn.textContent = 'Отправить заявку';
  }, 2500);
});
