(function () {
  'use strict';

  const meals = [
    { id: 'gimbap', label: '김밥', price: '3,500원', confirm: '김밥을 주문할까요?', image: './images/play_kiosk/gimbap.webp' },
    { id: 'udon', label: '우동', price: '5,000원', confirm: '우동을 주문할까요?', image: './images/play_kiosk/udon.webp' },
    { id: 'omurice', label: '오므라이스', price: '6,500원', confirm: '오므라이스를 주문할까요?', image: './images/play_kiosk/omurice.webp' }
  ];
  const steps = ['음식 고르기', '주문 확인', '카드 결제', '음식 받기'];
  const prompts = ['먹고 싶은 음식을 골라요', '', '카드를 단말기에 대요', '주문한 음식을 받아요'];

  window.renderPlayKiosk = function (ctx) {
    const { board, state, settings, element, button, photo } = ctx;
    const finished = state.phase === 'reward';
    const step = state.step;
    const chosen = meals.find(meal => meal.id === state.kioskMeal);
    const kiosk = element('section', 'pk-kiosk');
    kiosk.dataset.kioskStep = finished ? 'served' : String(step);
    board.appendChild(kiosk);

    function active() {
      return board.isConnected && !state.paused && state.phase === 'question' && state.step === step;
    }
    function go(next) {
      if (!active()) return;
      state.step = next;
      ctx.draw();
    }
    function mealSummary(meal) {
      const summary = element('div', 'pk-summary');
      summary.append(photo(meal, 'pk-thumb'), element('strong', '', meal.label), element('span', '', meal.price));
      return summary;
    }

    const progress = element('ol', 'pk-progress');
    progress.setAttribute('aria-label', '주문 순서');
    steps.forEach((label, i) => {
      const marker = element('li', i < step || finished ? 'pk-past' : '', label);
      if (!finished && i === step) marker.setAttribute('aria-current', 'step');
      progress.appendChild(marker);
    });
    kiosk.appendChild(progress);

    const prompt = finished ? '맛있게 먹어요!' : step === 1 ? chosen.confirm : prompts[step];
    const title = element('h2', 'pk-prompt', prompt);
    kiosk.appendChild(title);
    if (!finished) {
      ctx.promptOnce(prompt);
      kiosk.appendChild(button('다시 듣기', () => ctx.say(prompt), 'pk-replay'));
    }
    if (finished || step === 3) {
      const pickup = finished ? element('div', 'pk-pickup') : button('', () => {
        if (active()) ctx.win('음식을 받았어요');
      }, 'pk-pickup pk-collect');
      pickup.dataset.kioskMeal = chosen.id;
      pickup.append(photo(chosen, 'pk-served-photo'), element('strong', '', chosen.label));
      if (!finished) pickup.appendChild(element('span', 'pk-primary', '음식 받기'));
      kiosk.appendChild(pickup);
      return;
    }
    if (step === 0) {
      const menu = element('div', 'pk-menu');
      const offered = settings.choices === 3 ? meals : [meals[state.round % meals.length], meals[(state.round + 1) % meals.length]];
      menu.style.setProperty('--pk-count', String(offered.length));
      offered.forEach(meal => {
        const card = button('', () => {
          if (!active()) return;
          state.kioskMeal = meal.id;
          go(1);
        }, 'pk-meal');
        card.dataset.kioskMeal = meal.id;
        card.append(photo(meal, 'pk-food'), element('strong', '', meal.label), element('span', '', meal.price));
        menu.appendChild(card);
      });
      kiosk.appendChild(menu);
      return;
    }
    if (step === 1) {
      const review = element('div', 'pk-review');
      review.append(photo(chosen, 'pk-review-photo'), element('strong', '', chosen.label), element('span', '', chosen.price));
      const actions = element('div', 'pk-actions');
      const back = button('다시 고르기', () => go(0), 'pk-secondary');
      const confirm = button('카드로 결제하기', () => {
        state.kioskCardSelected = false;
        go(2);
      }, 'pk-primary');
      actions.append(back, confirm);
      kiosk.append(review, actions);
      return;
    }

    kiosk.appendChild(mealSummary(chosen));
    const payment = element('div', 'pk-payment');
    const card = button('', () => {
      if (!active()) return;
      state.kioskCardSelected = true;
      card.setAttribute('aria-pressed', 'true');
      reader.classList.add('pk-ready');
      ctx.say('이제 카드 단말기를 눌러요');
    }, 'pk-card');
    card.dataset.kioskCard = '';
    card.setAttribute('aria-pressed', String(state.kioskCardSelected));
    const chip = element('span', 'pk-chip');
    chip.setAttribute('aria-hidden', 'true');
    card.append(chip, element('strong', '', '놀이 카드'));
    const reader = button('', () => {
      if (state.kioskCardSelected) go(3);
      else ctx.say('먼저 놀이 카드를 골라요');
    }, 'pk-reader ps-drop-target');
    reader.dataset.kioskReader = '';
    reader.classList.toggle('pk-ready', !!state.kioskCardSelected);
    reader.append(photo({ image: './images/play_kiosk/reader.webp' }, 'pk-reader-photo'), element('strong', '', '카드 단말기'));
    const arrow = element('span', 'pk-arrow', '→');
    arrow.setAttribute('aria-hidden', 'true');
    payment.append(card, arrow, reader);
    kiosk.appendChild(payment);
    ctx.bindDrag(card, reader, () => go(3));
  };
})();
