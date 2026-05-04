import LeadForm from '@/components/LeadForm';
import CookieBanner from '@/components/CookieBanner';
import PayButton from '@/components/PayButton';

export default function HomePage() {
  const year = new Date().getFullYear();

  return (
    <>
      <header className="nav">
        <div className="container nav__inner">
          <a href="#" className="brand">
            <span className="brand__logo">⛨</span>
            <span className="brand__name">
              Honk<span>VPN</span>
            </span>
          </a>
          <nav className="nav__links">
            <a href="#why">Почему VPN</a>
            <a href="#what">Что входит</a>
            <a href="#tariffs">Тарифы</a>
            <a href="#how">Как стартовать</a>
            <a href="#faq">FAQ</a>
          </nav>
          <a href="#tariffs" className="btn btn--primary btn--sm">
            Купить франшизу
          </a>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero__bg" aria-hidden="true" />
          <div className="container hero__inner">
            <div className="hero__content">
              <span className="badge">Франшиза №1 по запуску VPN в СНГ</span>
              <h1 className="hero__title">
                Запусти свой <span className="grad">VPN-бизнес</span>
                <br />
                за 7 дней
              </h1>
              <p className="hero__subtitle">
                Готовая инфраструктура: серверы, Telegram-бот, приём платежей, лендинг и админка.
                Подключаем ключ — вы зарабатываете. Никакой разработки, никакого DevOps.
              </p>
              <div className="hero__cta">
                <a href="#tariffs" className="btn btn--primary">
                  Выбрать тариф
                </a>
                <a href="#how" className="btn btn--ghost">
                  Как это работает
                </a>
              </div>
              <ul className="hero__stats">
                <li>
                  <span className="stat__num">7&nbsp;дней</span>
                  <span className="stat__label">до первой продажи</span>
                </li>
                <li>
                  <span className="stat__num">×3–5</span>
                  <span className="stat__label">средняя маржинальность</span>
                </li>
                <li>
                  <span className="stat__num">24/7</span>
                  <span className="stat__label">поддержка инфраструктуры</span>
                </li>
              </ul>
            </div>

            <div className="hero__card" aria-hidden="true">
              <div className="card-glow" />
              <div className="mock">
                <div className="mock__top">
                  <span /><span /><span />
                </div>
                <div className="mock__row">
                  <div className="mock__chip">🟢 VPN online</div>
                  <div className="mock__chip">🤖 Bot active</div>
                </div>
                <div className="mock__bar">
                  <div className="mock__bar-fill" style={{ width: '78%' }} />
                </div>
                <div className="mock__list">
                  <div><span>Подписка · 1 мес</span><b>+ 290 ₽</b></div>
                  <div><span>Подписка · 6 мес</span><b>+ 1 490 ₽</b></div>
                  <div><span>Подписка · 12 мес</span><b>+ 2 690 ₽</b></div>
                  <div className="mock__row mock__row--total"><span>За сегодня</span><b>+ 18 420 ₽</b></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="why" className="why section">
          <div className="container">
            <h2 className="section__title">Почему VPN — это деньги</h2>
            <p className="section__lead">
              Спрос на VPN в России и СНГ растёт ежегодно. При этом большинство сервисов
              перегружены, а блокировки множатся. Это идеальный момент, чтобы зайти в нишу с
              готовым продуктом.
            </p>
            <div className="grid grid--3">
              <div className="card">
                <div className="card__ico">📈</div>
                <h3>Растущий рынок</h3>
                <p>Аудитория VPN-сервисов в РФ выросла в 4 раза за последние 3 года и продолжает расти.</p>
              </div>
              <div className="card">
                <div className="card__ico">💸</div>
                <h3>Подписочная модель</h3>
                <p>Клиенты платят каждый месяц. LTV — высокий, отток — низкий, доход — предсказуемый.</p>
              </div>
              <div className="card">
                <div className="card__ico">⚙️</div>
                <h3>Минимум операционки</h3>
                <p>Бот выдаёт ключи, серверы автоматизированы, платежи идут на ваш расчётный счёт.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="what" className="what section">
          <div className="container">
            <h2 className="section__title">Что вы получаете</h2>
            <p className="section__lead">Это не «курс по запуску». Это работающий продукт, который мы передаём вам в эксплуатацию.</p>
            <div className="grid grid--4">
              <div className="feat"><div className="feat__ico">🛡️</div><h4>VPN-инфраструктура</h4><p>Серверы по всему миру, протоколы VLESS/Shadowsocks, обход блокировок.</p></div>
              <div className="feat"><div className="feat__ico">💬</div><h4>Telegram-бот</h4><p>Продажа подписок, выдача ключей, чек-листы и автонапоминания.</p></div>
              <div className="feat"><div className="feat__ico">🌐</div><h4>Лендинг</h4><p>Готовый продающий сайт под ваш бренд с интеграцией платежей.</p></div>
              <div className="feat"><div className="feat__ico">🧰</div><h4>Админ-панель</h4><p>Подписки, выручка, серверы, клиенты — всё под рукой.</p></div>
              <div className="feat"><div className="feat__ico">💳</div><h4>Приём платежей</h4><p>Подключение эквайринга, СБП и крипты. Деньги идут напрямую вам.</p></div>
              <div className="feat"><div className="feat__ico">📚</div><h4>Методичка по трафику</h4><p>Готовые связки и креативы: Telegram Ads, посевы, Авито, SEO.</p></div>
              <div className="feat"><div className="feat__ico">🧠</div><h4>Сопровождение</h4><p>Чат с командой, ответы на вопросы и помощь со сложными кейсами.</p></div>
              <div className="feat"><div className="feat__ico">🔐</div><h4>Ваш бренд</h4><p>Никакого white-label с нашими лого. Бизнес — ваш на 100%.</p></div>
            </div>
          </div>
        </section>

        <section id="tariffs" className="tariffs section">
          <div className="container">
            <h2 className="section__title">Тарифы франшизы</h2>
            <p className="section__lead">
              Три формата — под бюджет, скорость и амбиции. Все включают передачу инфраструктуры в собственность.
            </p>

            <div className="tariffs__grid">
              <article className="tariff">
                <header className="tariff__head">
                  <h3 className="tariff__name">Базовый</h3>
                  <p className="tariff__sub">Старт без переплат</p>
                </header>
                <div className="tariff__price"><span className="tariff__amount">29 900 ₽</span></div>
                <ul className="tariff__list">
                  <li>VPN-инфраструктура</li>
                  <li>Telegram-бот</li>
                  <li>Базовое подключение платежей <span className="muted">(комиссия выше)</span></li>
                  <li>Документация по запуску</li>
                </ul>
                <div className="tariff__actions">
                  <PayButton amount={29900} description="Франшиза «Базовый» — HonkVPN" />
                  <a href="#contact" className="btn btn--ghost btn--block">Сначала консультация</a>
                </div>
              </article>

              <article className="tariff tariff--featured">
                <span className="tariff__ribbon">Хит продаж</span>
                <header className="tariff__head">
                  <h3 className="tariff__name">Средний</h3>
                  <p className="tariff__sub">Полный комплект для роста</p>
                </header>
                <div className="tariff__price"><span className="tariff__amount">79 900 ₽</span></div>
                <ul className="tariff__list">
                  <li>VPN-инфраструктура</li>
                  <li>Telegram-бот</li>
                  <li>Лендинг под ваш бренд</li>
                  <li>Админ-панель</li>
                  <li>Сниженная цена обработки платежей</li>
                  <li>Методичка по привлечению клиентов</li>
                </ul>
                <div className="tariff__actions">
                  <PayButton amount={79900} description="Франшиза «Средний» — HonkVPN" />
                  <a href="#contact" className="btn btn--ghost btn--block">Сначала консультация</a>
                </div>
              </article>

              <article className="tariff tariff--gold">
                <header className="tariff__head">
                  <h3 className="tariff__name">VIP</h3>
                  <p className="tariff__sub">Сопровождение «под ключ»</p>
                </header>
                <div className="tariff__price"><span className="tariff__amount">300 000 ₽</span></div>
                <ul className="tariff__list">
                  <li>Всё из «Среднего»</li>
                  <li>Личные консультации команды</li>
                  <li>Помощь во внедрении и запуске</li>
                  <li>Стратегия привлечения под ваш регион</li>
                  <li>Прямой контакт с техдиректором</li>
                </ul>
                <div className="tariff__actions">
                  <PayButton amount={300000} description="Франшиза «VIP» — HonkVPN" variant="gold" />
                  <a href="#contact" className="btn btn--ghost btn--block">Сначала консультация</a>
                </div>
              </article>
            </div>

            <div className="addon">
              <div className="addon__left">
                <span className="addon__tag">Дополнительно</span>
                <h3>Консультация технического директора</h3>
                <p>Если у вас уже работающий VPN, мы поможем масштабировать его, найти узкие места и удешевить инфраструктуру.</p>
              </div>
              <div className="addon__right">
                <div className="addon__price">1 500 $</div>
                <a href="#contact" className="btn btn--ghost">Записаться</a>
              </div>
            </div>

            <p className="legal-note">
              Оплата производится через сертифицированный платёжный сервис{' '}
              <a href="https://cloudpayments.ru/" target="_blank" rel="noopener noreferrer">CloudPayments</a>{' '}
              по защищённому протоколу. Реквизиты карты не передаются и не хранятся на нашем сайте.
            </p>
          </div>
        </section>

        <section id="how" className="how section">
          <div className="container">
            <h2 className="section__title">Как стартовать</h2>
            <p className="section__lead">Понятный процесс без сюрпризов. От заявки до первой выручки — около недели.</p>
            <ol className="steps">
              <li className="step"><span className="step__num">01</span><h4>Заявка</h4><p>Оставляете контакты — мы звоним и подбираем тариф под ваши задачи.</p></li>
              <li className="step"><span className="step__num">02</span><h4>Договор и оплата</h4><p>Заключаем договор франчайзинга, фиксируем условия и сроки.</p></li>
              <li className="step"><span className="step__num">03</span><h4>Развёртывание</h4><p>Поднимаем серверы, бота, лендинг и админку под ваш бренд.</p></li>
              <li className="step"><span className="step__num">04</span><h4>Запуск трафика</h4><p>Передаём методичку и подключаем к чату сопровождения.</p></li>
            </ol>
          </div>
        </section>

        <section id="faq" className="faq section">
          <div className="container">
            <h2 className="section__title">Частые вопросы</h2>
            <div className="faq__list">
              <details className="faq__item"><summary>Нужны ли технические знания?</summary><p>Нет. Всё разворачиваем мы. От вас — продажи и работа с клиентами. Хотя если хотите глубже разобраться — научим.</p></details>
              <details className="faq__item"><summary>Через сколько окупится франшиза?</summary><p>Средняя окупаемость «Базового» — 1–2 месяца, «Среднего» — 2–4 месяца. Зависит от бюджета на трафик.</p></details>
              <details className="faq__item"><summary>Кому идут деньги от подписок?</summary><p>Вам. Платежи поступают на ваш расчётный счёт или ИП. Мы не берём роялти.</p></details>
              <details className="faq__item"><summary>Можно ли выйти на зарубежный рынок?</summary><p>Да, инфраструктура поддерживает мультивалютность и серверы в разных регионах. Это обсуждается на тарифе VIP.</p></details>
              <details className="faq__item"><summary>Что, если у меня уже есть VPN-проект?</summary><p>Тогда вам подойдёт консультация технического директора за 1 500 $. Поможем масштабировать и снизить расходы на инфру.</p></details>
            </div>
          </div>
        </section>

        <section id="contact" className="cta section">
          <div className="container cta__inner">
            <div className="cta__text">
              <h2>Готовы запустить VPN-бизнес?</h2>
              <p>Оставьте заявку — свяжемся в течение 30 минут и поможем выбрать тариф.</p>
            </div>
            <LeadForm />
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer__inner">
          <div className="brand">
            <span className="brand__logo">⛨</span>
            <span className="brand__name">Honk<span>VPN</span></span>
          </div>
          <p className="footer__copy">© {year} HonkVPN. Все права защищены.</p>
          <div className="footer__links">
            <a href="#tariffs">Тарифы</a>
            <a href="#faq">FAQ</a>
            <a href="#contact">Контакты</a>
            <a href="/privacy">Политика конфиденциальности</a>
            <a href="/offer">Оферта</a>
          </div>
        </div>
      </footer>

      <CookieBanner />
    </>
  );
}
