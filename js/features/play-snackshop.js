(function () {
  'use strict';

  const snacks = [
    { id: 'milk', label: '우유', request: '우유 주세요', image: './images/meal_milk_large_v2.png' },
    { id: 'tart', label: '에그타르트', request: '에그타르트 주세요', image: './images/meal_eggtart.png' },
    { id: 'juice', label: '주스', request: '주스 주세요', image: './images/meal_juice.png' }
  ];
  const choosePrompt = '먹고 싶은 간식을 골라요';

  window.renderPlaySnackshop = function ({ board, state, settings, element, button, photo, say, win, bindDrag, promptOnce }) {
    const stall = element('section', 'ps-shop');
    stall.setAttribute('aria-label', '매점');
    board.appendChild(stall);
    const selected = () => snacks.find(item => item.id === state.shopChoice);

    if (state.phase === 'reward') {
      const item = selected();
      const receipt = element('div', 'ps-shop-receipt');
      receipt.dataset.shopReceipt = item.id;
      const picture = photo(item, 'ps-shop-purchase');
      receipt.append(picture, element('h2', 'ps-shop-prompt', item.label + ' 받았어요!'));
      stall.appendChild(receipt);
      return;
    }

    const heading = element('h2', 'ps-shop-prompt', choosePrompt);
    const shelf = element('div', 'ps-shop-shelf');
    const offer = settings.choices === 3 ? snacks
      : [[snacks[0], snacks[1]], [snacks[0], snacks[2]], [snacks[1], snacks[2]]][state.round % 3];
    shelf.style.setProperty('--shop-count', offer.length);
    const order = button('', () => {
      const item = selected();
      if (item) submit(item);
    }, 'ps-shop-order ps-drop-target');
    order.dataset.shopOrder = '';
    const caption = element('strong', 'ps-shop-order-caption');
    const bag = element('span', 'ps-shop-bag');
    bag.setAttribute('aria-hidden', 'true');
    order.append(bag, caption);

    function submit(item) {
      if (state.phase !== 'question' || state.paused) return;
      state.shopChoice = item.id;
      win(item.request);
    }

    function choose(item) {
      if (state.phase !== 'question' || state.paused) return;
      state.shopChoice = item.id;
      updateSelection();
      say(item.label);
    }

    for (const item of offer) {
      const card = button('', () => choose(item), 'ps-shop-item');
      card.dataset.shopItem = item.id;
      card.append(photo(item, 'ps-shop-product'), element('strong', '', item.label));
      shelf.appendChild(card);
      bindDrag(card, order, () => submit(item));
    }

    const reset = button('다시 고르기', () => {
      state.shopChoice = null;
      updateSelection();
      shelf.querySelector('button').focus({ preventScroll: true });
    }, 'ps-control ps-shop-reset');
    reset.dataset.shopReset = '';
    const counter = element('div', 'ps-shop-counter');
    counter.append(order, reset);
    stall.append(heading, shelf, counter);

    function updateSelection() {
      const item = selected();
      shelf.querySelectorAll('button').forEach(card => {
        card.setAttribute('aria-pressed', String(card.dataset.shopItem === item?.id));
      });
      bag.replaceChildren();
      if (item) bag.appendChild(photo(item, 'ps-shop-miniature'));
      caption.textContent = item ? item.request : '여기에 놓아요';
      order.setAttribute('aria-disabled', String(!item));
      reset.disabled = !item;
      heading.textContent = item ? '이 간식으로 할까요?' : choosePrompt;
      order.classList.toggle('ps-shop-selected', !!item);
    }
    updateSelection();
    if (!selected()) promptOnce(choosePrompt);
  };
})();
