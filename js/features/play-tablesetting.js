(function () {
  'use strict';
  const setting = [
    { piece: 'bowl', label: '밥', prompt: '왼쪽에 밥을 놓아요', slot: 'rice' },
    { piece: 'soup', label: '국', prompt: '밥 옆에 국을 놓아요', slot: 'soup' },
    { piece: 'side-dishes', label: '반찬', prompt: '가운데에 반찬을 놓아요', slot: 'side' },
    { piece: 'spoon', label: '숟가락', prompt: '국 옆에 숟가락을 놓아요', slot: 'spoon' },
    { piece: 'chopsticks', label: '젓가락', prompt: '숟가락 옆에 젓가락을 놓아요', slot: 'sticks' },
    { piece: 'glass', label: '물컵', prompt: '물컵을 놓아요', slot: 'cup' }
  ];

  window.renderPlayTableSetting = function (ctx) {
    const { state, board, photo, element, button } = ctx;
    const done = state.phase === 'reward';
    const index = state.step;
    const current = setting[index];
    board.classList.add('hh-table-game');
    const heading = element('div', 'hh-table-heading');
    heading.append(element('h2', 'hh-prompt', done ? '밥상이 완성됐어요' : current.prompt));
    if (!done) heading.append(element('span', 'hh-step-count', (index + 1) + ' / ' + setting.length));
    const area = element('div', 'hh-table-area');
    const mat = element('div', 'hh-mat');
    mat.setAttribute('aria-label', '밥을 차리는 식탁');
    area.append(mat);
    board.append(heading, area);
    const art = item => photo({ book: 'kitchen', piece: item.piece }, 'hh-table-photo');
    for (const item of setting.slice(0, done ? setting.length : index)) {
      const placed = element('div', 'hh-place hh-placed');
      placed.dataset.slot = item.slot;
      placed.setAttribute('role', 'img');
      placed.setAttribute('aria-label', item.label);
      placed.append(art(item));
      mat.append(placed);
    }
    if (done) return;
    const target = button('', () => {
      if (state.tablePicked === index) place();
      else ctx.say(current.prompt);
    }, 'hh-place hh-place-hint ps-drop-target');
    target.dataset.slot = current.slot;
    target.setAttribute('aria-label', current.label + ' 놓을 자리');
    target.append(art(current), element('span', 'hh-here', '여기에'));
    mat.append(target);
    const tray = element('div', 'hh-table-tray');
    const card = button('', () => {
      state.tablePicked = index;
      card.setAttribute('aria-pressed', 'true');
      target.classList.add('hh-ready');
      ctx.say(current.prompt);
    }, 'hh-table-card');
    card.dataset.tablePiece = current.piece;
    card.setAttribute('aria-pressed', String(state.tablePicked === index));
    target.classList.toggle('hh-ready', state.tablePicked === index);
    card.append(art(current), element('strong', '', current.label));
    tray.append(card, button('다시 듣기', () => ctx.say(current.prompt)));
    area.append(tray);
    function place() {
      if (!mat.isConnected || state.paused || state.phase !== 'question' || state.step !== index) return;
      state.tablePicked = null;
      if (index === setting.length - 1) ctx.win('밥상이 완성됐어요');
      else { state.step++; ctx.draw(); }
    }
    ctx.bindDrag(card, target, place);
    ctx.promptOnce(current.prompt);
  };
})();
