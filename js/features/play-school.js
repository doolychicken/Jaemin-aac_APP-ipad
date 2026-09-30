(function () {
  const GAMES = [
    { id: 'numbers', title: '숫자 짝 맞추기', subtitle: '숫자와 자동차 수를 연결해요', badge: '1 2 3', tone: 'blue', group: 'pairs' },
    { id: 'pairs', title: '그림 짝 맞추기', subtitle: '하나씩 눌러 같은 그림을 연결해요', badge: '● ●', tone: 'mint', group: 'pairs' },
    { id: 'memory', title: '기억 카드 놀이', subtitle: '카드를 뒤집어 같은 짝을 찾아요', badge: '★ ?', tone: 'lavender', group: 'pairs' },
    { id: 'drive', title: '자동차 출발', subtitle: '누르면 자동차가 지나가요', image: './images/traffic_game/car_red.png', tone: 'peach' },
    { id: 'match', title: '같은 그림 찾기', subtitle: '같은 사진을 골라요', image: './images/meal_juice.png', tone: 'mint' },
    { id: 'listen', title: '듣고 골라요', subtitle: '주스와 화장실부터 천천히', image: './images/pee.png', tone: 'blue' },
    { id: 'parking', title: '색깔 주차장', subtitle: '차와 같은 색을 찾아요', image: './images/traffic_game/car_blue.png', tone: 'lavender' },
    { id: 'delivery', title: '주스 배달', subtitle: '물건을 싣고 출발해요', image: './images/mart_items/juice.png', tone: 'yellow' },
    { id: 'count', title: '자동차 세기', subtitle: '한 대, 두 대를 살펴봐요', image: './images/traffic_game/car_silver.png', tone: 'rose' },
    { id: 'music', title: '악기 소리 놀이', subtitle: '누르면 악기 소리가 나요', image: './images/piano.png', tone: 'yellow' }
  ];
  const ITEMS = [
    { id: 'juice', label: '주스', image: './images/meal_juice.png' },
    { id: 'toilet', label: '화장실', image: './images/pee.png' },
    { id: 'water', label: '물', image: './images/water.png' },
    { id: 'car', label: '자동차', image: './images/transport_car.png' },
    { id: 'apple', label: '사과', image: './images/apple.png' },
    { id: 'milk', label: '우유', image: './images/meal_milk_large_v2.png' }
  ];
  const CARS = [
    { id: 'red', label: '빨강', image: './images/traffic_game/car_red.png', color: '#e25c56' },
    { id: 'blue', label: '파랑', image: './images/traffic_game/car_blue.png', color: '#467fd6' },
    { id: 'silver', label: '회색', image: './images/traffic_game/car_silver.png', color: '#7a8793' }
  ];
  const KEY = 'jaemin-play-school-v1';
  const DEFAULTS = { choices: 2, rounds: 3, motion: 'slow', vocabulary: 'familiar', sound: true, numberRange: 3 };
  const PAIR_GAMES = ['numbers', 'pairs', 'memory'];

  window.createPlaySchoolFeature = function (deps) {
    const { gridEl, appMainEl, spotlightViewEl, spotlightBtnEl, heroEl, helperEl, speak, render, pushScreen } = deps;
    const tasks = window.createTaskScope();
    const instruments = window.createInstrumentPlayer();
    const instrumentCards = [
      { id: 'piano', label: '피아노', icon: '🎹' },
      { id: 'drum', label: '북', icon: '🥁' },
      { id: 'guitar', label: '기타', icon: '🎸' },
      { id: 'bell', label: '종', icon: '🔔' }
    ];
    let musicVolume = 0.3;
    let musicRequest = 0;
    function stopInstruments() {
      musicRequest++;
      instruments.stop();
      gridEl.querySelectorAll('[data-instrument]').forEach(node => node.classList.remove('ps-playing'));
    }
    document.addEventListener('visibilitychange', () => { if (document.hidden) stopInstruments(); });
    const saved = window.appStorage.load(KEY, { settings: DEFAULTS, stats: {} }, value =>
      value && value.settings && [2, 3].includes(value.settings.choices)
      && [3, 5].includes(value.settings.rounds) && ['slow', 'still'].includes(value.settings.motion)
      && ['familiar', 'extended'].includes(value.settings.vocabulary) && typeof value.settings.sound === 'boolean'
      && (value.settings.numberRange === undefined || [3, 5].includes(value.settings.numberRange))
      && value.stats && typeof value.stats === 'object' && !Array.isArray(value.stats)
      && Object.entries(value.stats).every(([key, row]) => GAMES.some(game => game.id === key)
        && row && ['completed', 'first', 'help'].every(k => Number.isSafeInteger(row[k]) && row[k] >= 0)));
    let settings = { ...DEFAULTS, ...saved.settings };
    const stats = saved.stats;
    let state = null;
    let settingsOpen = false;
    let menuGroup = 'all';

    function save() { window.appStorage.save(KEY, { settings, stats }); }
    function say(text) { return settings.sound ? speak(text) : Promise.resolve(); }
    function clear() {
      tasks.clear();
      stopInstruments();
      gridEl.scrollTop = 0;
      document.querySelectorAll('.ps-drag-ghost').forEach(el => el.remove());
      state = null;
    }
    function element(tag, className, text) {
      const node = document.createElement(tag);
      node.className = className;
      if (text !== undefined) node.textContent = text;
      return node;
    }
    function button(text, action, className = 'ps-control') {
      const node = element('button', className, text);
      node.type = 'button';
      node.addEventListener('click', () => { if (performance.now() >= Number(node.dataset.suppressClickUntil || 0)) action(); });
      return node;
    }
    function photo(item, className = 'ps-photo') {
      const image = element('img', className);
      image.src = item.image;
      image.alt = '';
      image.draggable = false;
      return image;
    }
    function open(game) {
      pushScreen('playSchool_' + game.id, game.title);
      render();
    }
    function menu() {
      say('놀이 목록');
      // Return to the existing menu entry, rather than growing the history stack.
      deps.returnToMenu();
    }
    function settingsPanel() {
      const details = element('details', 'ps-settings');
      details.open = settingsOpen;
      details.addEventListener('toggle', () => { settingsOpen = details.open; });
      details.appendChild(element('summary', '', '보호자 설정 · 놀이 기록'));
      const controls = element('div', 'ps-settings-fields');
      function select(label, key, values) {
        const field = element('label', 'ps-field');
        field.appendChild(element('span', '', label));
        const input = element('select', '');
        input.setAttribute('aria-label', label);
        values.forEach(([value, text]) => {
          const option = element('option', '', text);
          option.value = String(value);
          option.selected = String(settings[key]) === String(value);
          input.appendChild(option);
        });
        input.addEventListener('change', () => {
          settings[key] = ['choices', 'rounds', 'numberRange'].includes(key) ? Number(input.value)
            : key === 'sound' ? input.value === 'true' : input.value;
          save();
        });
        field.appendChild(input);
        controls.appendChild(field);
      }
      select('고르는 그림 수', 'choices', [[2, '2개부터'], [3, '3개로 늘리기']]);
      select('한 번에 하는 수', 'rounds', [[3, '3번 짧게'], [5, '5번 하기']]);
      select('숫자 놀이 범위', 'numberRange', [[3, '1부터 3까지'], [5, '1부터 5까지']]);
      select('자동차 움직임', 'motion', [['slow', '천천히 지나가기'], ['still', '움직임 없이 보기']]);
      select('그림 범위', 'vocabulary', [['familiar', '주스 · 화장실부터'], ['extended', '물 · 자동차 · 과일도']]);
      select('놀이 안내 음성', 'sound', [[true, '소리 켜기'], [false, '조용히 하기']]);
      details.appendChild(controls);
      details.appendChild(element('p', 'ps-parent-note', '누르기만 해도 할 수 있어요. 시간 제한과 감점은 없어요. 어려우면 도움을 누르고, 쉬고 싶으면 언제든 쉬어요.'));
      const records = element('div', 'ps-records');
      GAMES.forEach(game => {
        if (game.id === 'music') return; // Free play has no scored rounds.
        const row = stats[game.id] || { completed: 0, first: 0, help: 0 };
        records.appendChild(element('p', '', game.title + ' · 완료 ' + row.completed
          + (game.id === 'drive' ? '' : ' · 첫 선택 성공 ' + row.first + ' · 도움 ' + row.help)));
      });
      details.appendChild(records);
      return details;
    }
    function renderMenu() {
      const intro = element('div', 'ps-intro');
      intro.appendChild(element('span', 'ps-eyebrow', '재민이의 플레이 클럽'));
      intro.appendChild(element('h2', '', '톡톡 맞추고, 신나게 출발!'));
      intro.appendChild(element('p', '', '숫자도, 그림도. 오늘은 어떤 짝을 찾아볼까요?'));
      intro.appendChild(photo(CARS[0], 'ps-hero-car'));
      gridEl.appendChild(intro);
      const total = Object.values(stats).reduce((sum, row) => sum + row.completed, 0);
      const collection = element('div', 'ps-collection');
      collection.appendChild(element('strong', '', '나의 자동차 스티커'));
      const stickers = element('div', 'ps-stickers');
      for (let i = 0; i < 6; i++) {
        const slot = element('span', 'ps-sticker' + (i < Math.min(total, 6) ? ' is-collected' : ''));
        slot.appendChild(i < Math.min(total, 6) ? photo(CARS[i % 3]) : element('span', '', '☆'));
        stickers.appendChild(slot);
      }
      collection.appendChild(stickers);
      collection.appendChild(element('span', 'ps-collection-note', total ? '완료한 놀이 ' + total + '번' : '놀이를 끝내면 하나씩 모아요'));
      gridEl.appendChild(collection);
      const tabs = element('div', 'ps-tabs');
      tabs.setAttribute('aria-label', '놀이 종류');
      [['all', '전체'], ['pairs', '숫자 · 짝 맞추기'], ['cars', '자동차 놀이'], ['sounds', '그림 · 소리']].forEach(([id, label]) => {
        const tab = button(label, () => { menuGroup = id; render(); }, 'ps-tab');
        tab.setAttribute('aria-pressed', String(menuGroup === id));
        tabs.appendChild(tab);
      });
      gridEl.appendChild(tabs);
      const games = element('div', 'ps-menu-grid');
      GAMES.forEach(game => {
        const group = game.group || (['drive', 'parking', 'delivery', 'count'].includes(game.id) ? 'cars' : 'sounds');
        if (menuGroup !== 'all' && menuGroup !== group) return;
        const card = button('', () => open(game), 'ps-game-card ps-tone-' + game.tone);
        card.dataset.game = game.id;
        card.appendChild(game.badge ? element('span', 'ps-game-art ps-art-' + game.id, game.badge) : photo(game));
        const copy = element('div', 'ps-game-copy');
        copy.appendChild(element('strong', '', game.title));
        copy.appendChild(element('span', '', game.subtitle));
        card.appendChild(copy);
        card.appendChild(element('span', 'ps-card-action', '놀이 시작  →'));
        games.appendChild(card);
      });
      gridEl.appendChild(games);
      gridEl.appendChild(settingsPanel());
      gridEl.appendChild(button('화장실', () => { say('화장실'); pushScreen('toilet', '화장실'); render(); }, 'ps-toilet'));
    }
    function buildRound() {
      state.phase = 'question';
      state.hint = false;
      state.mistakes = 0;
      state.helpRecorded = false;
      state.prompted = false;
      const id = state.id;
      if (PAIR_GAMES.includes(id)) {
        const pool = id === 'numbers'
          ? Array.from({ length: settings.numberRange }, (_, i) => ({ id: String(i + 1), label: String(i + 1), number: i + 1 }))
          : [ITEMS[3], ITEMS[0], ITEMS[4], ITEMS[2], ITEMS[5]];
        state.pairItems = Array.from({ length: settings.choices }, (_, i) => pool[(state.round + i) % pool.length]);
        state.left = shuffled(state.pairItems);
        state.right = shuffled(state.pairItems);
        state.matched = [];
        state.selected = null;
        state.pairMessage = '';
        state.target = { id: 'board' };
        state.deck = shuffled(state.pairItems.flatMap(item => [{ item }, { item }]));
        state.openCards = [];
        state.showCards = false;
        return;
      }
      let pool;
      if (id === 'parking') pool = CARS.slice(0, settings.choices);
      else if (id === 'count') pool = Array.from({ length: settings.choices }, (_, i) => ({ id: String(i + 1), label: String(i + 1) }));
      else if (id === 'delivery') pool = [ITEMS[0], ITEMS[2], ITEMS[4], ITEMS[5]].slice(0, settings.vocabulary === 'familiar' ? 2 : 4);
      else pool = ITEMS.slice(0, settings.vocabulary === 'familiar' ? 2 : ITEMS.length);
      state.target = pool[state.round % pool.length];
      const others = pool.filter(item => item.id !== state.target.id);
      if (others.length < settings.choices - 1 && id !== 'parking' && id !== 'count') {
        others.push(...ITEMS.filter(item => !pool.some(known => known.id === item.id)));
      }
      state.options = [state.target, ...others.slice(0, settings.choices - 1)];
      // Stable within a question, varied between questions; location is not the answer.
      for (let i = state.options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [state.options[i], state.options[j]] = [state.options[j], state.options[i]];
      }
    }
    function prompt() {
      if (state.id === 'numbers') return '숫자와 자동차 수를 맞춰요';
      if (state.id === 'pairs') return '같은 그림끼리 짝을 맞춰요';
      if (state.id === 'memory') return '카드 두 장을 눌러 같은 짝을 찾아요';
      if (state.id === 'drive') return '출발을 누르면 자동차가 지나가요';
      if (state.id === 'match') return '같은 그림을 찾아요';
      if (state.id === 'listen') return state.target.label + ' 찾아주세요';
      if (state.id === 'parking') return '자동차와 같은 색을 찾아요';
      if (state.id === 'delivery') return state.target.label + ' 주세요';
      return '자동차가 몇 대일까요';
    }
    function recordHelp() {
      if (!state.helpRecorded) {
        state.helpRecorded = true;
        stats[state.id].help++;
        save();
      }
    }
    function hint() {
      if (!state || state.phase !== 'question' || state.paused) return;
      tasks.clear();
      recordHelp();
      state.hint = true;
      if (PAIR_GAMES.includes(state.id)) {
        if (state.id === 'memory') { state.showCards = true; state.openCards = []; }
        else state.selected = { side: 'left', id: state.pairItems.find(item => !state.matched.includes(item.id)).id };
      }
      say('이 그림을 함께 찾아요');
      render();
    }
    function answer(id) {
      if (!state || state.phase !== 'question' || state.paused) return;
      tasks.clear();
      if (state.id !== 'drive' && id !== state.target.id) {
        state.mistakes++;
        hint();
        return;
      }
      if (state.id !== 'drive' && !state.mistakes && !state.hint) stats[state.id].first++;
      state.phase = 'reward';
      save();
      say(state.id === 'drive' ? '자동차 출발' : '찾았어요. 잘했어요');
      render();
    }
    function next() {
      if (!state || state.phase !== 'reward' || state.paused) return;
      tasks.clear();
      state.round++;
      if (state.round >= settings.rounds) {
        state.phase = 'complete';
        stats[state.id].completed++;
        save();
        say('다 했어요. 잘했어요');
      } else buildRound();
      render();
    }
    function shuffled(items) {
      const list = items.slice();
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
      return list;
    }
    function finishPair(id) {
      state.matched.push(id);
      state.selected = null;
      state.openCards = [];
      state.pairMessage = '짝을 찾았어요!';
      if (state.matched.length === state.pairItems.length) answer('board');
      else { say('짝을 찾았어요'); render(); }
    }
    function selectPair(side, id) {
      if (!state || state.paused || state.phase !== 'question' || state.matched.includes(id)) return;
      tasks.clear();
      const selected = state.selected;
      if (!selected || selected.side === side) {
        state.selected = { side, id };
        state.pairMessage = state.id === 'numbers' ? '짝이 되는 숫자나 자동차를 눌러요' : '반대쪽에서 같은 그림을 눌러요';
        render(); return;
      }
      if (selected.id === id) { finishPair(id); return; }
      state.mistakes++;
      state.pairMessage = '다시 살펴볼까요?';
      say('다시 살펴볼까요');
      render();
    }
    function flipCard(index) {
      if (!state || state.paused || state.phase !== 'question' || state.showCards || state.openCards.length === 2
        || state.openCards.includes(index) || state.matched.includes(state.deck[index].item.id)) return;
      tasks.clear();
      state.openCards.push(index);
      if (state.openCards.length === 2) {
        const [first, second] = state.openCards.map(i => state.deck[i].item.id);
        if (first === second) { finishPair(first); return; }
        state.mistakes++;
        state.pairMessage = '다른 그림이에요. 천천히 다시 해봐요.';
        say('다시 살펴볼까요');
      }
      render();
    }
    function pairFace(item, quantity) {
      const face = element('span', quantity ? 'ps-quantity' : 'ps-pair-face');
      if (item.number && quantity) {
        for (let i = 0; i < item.number; i++) face.appendChild(photo(CARS[0]));
      } else if (item.number) face.appendChild(element('span', 'ps-pair-number', item.label));
      else face.appendChild(photo(item));
      return face;
    }
    function renderPairs() {
      gridEl.classList.add('ps-pair-game');
      gridEl.classList.toggle('ps-three-pairs', settings.choices === 3);
      gridEl.appendChild(element('h2', 'ps-question', prompt()));
      const meter = element('div', 'ps-pair-meter', state.matched.length + ' / ' + state.pairItems.length + ' 짝');
      meter.setAttribute('aria-label', '찾은 짝 ' + state.matched.length + '개');
      gridEl.appendChild(meter);
      if (state.id === 'memory') {
        const board = element('div', 'ps-memory-board');
        board.style.setProperty('--pairs', settings.choices);
        state.deck.forEach(({ item }, index) => {
          const matched = state.matched.includes(item.id);
          const revealed = matched || state.showCards || state.openCards.includes(index);
          const card = button('', () => flipCard(index), 'ps-memory-card' + (revealed ? ' is-revealed' : '') + (matched ? ' is-matched' : ''));
          card.dataset.card = index;
          card.disabled = matched || state.showCards;
          card.setAttribute('aria-label', matched ? item.label + ' 짝 완료' : revealed ? item.label : '뒤집힌 카드 ' + (index + 1));
          card.appendChild(revealed ? pairFace(item) : element('span', 'ps-card-back', '★'));
          if (matched) card.appendChild(element('span', 'ps-pair-check', '✓'));
          board.appendChild(card);
        });
        gridEl.appendChild(board);
        if (state.showCards || state.openCards.length === 2) {
          gridEl.appendChild(button('다시 뒤집기', () => { state.openCards = []; state.showCards = false; state.pairMessage = ''; render(); }, 'ps-primary ps-flip-again'));
        }
      } else {
        const board = element('div', 'ps-pair-board');
        ['left', 'right'].forEach(side => {
          const column = element('div', 'ps-pair-column');
          state[side].forEach(item => {
            const matched = state.matched.includes(item.id);
            const selected = state.selected?.side === side && state.selected.id === item.id;
            const hinted = state.hint && state.selected?.id === item.id;
            const card = button('', () => selectPair(side, item.id), 'ps-pair-card' + (matched ? ' is-matched' : '') + (selected ? ' is-selected' : '') + (hinted ? ' ps-hint' : ''));
            card.dataset.side = side; card.dataset.pair = item.id;
            card.disabled = matched;
            card.setAttribute('aria-pressed', String(selected));
            card.setAttribute('aria-label', (side === 'left' ? '왼쪽 ' : '오른쪽 ') + (item.number && side === 'right' ? '자동차 ' + item.number + '대' : item.label) + (matched ? ' 짝 완료' : ''));
            card.appendChild(pairFace(item, side === 'right'));
            if (matched) card.appendChild(element('span', 'ps-pair-check', '✓'));
            column.appendChild(card);
          });
          board.appendChild(column);
        });
        gridEl.appendChild(board);
      }
      const status = element('p', 'ps-pair-status', state.pairMessage || (state.id === 'memory' ? '카드 두 장을 하나씩 눌러요' : '왼쪽 하나, 오른쪽 하나를 눌러요'));
      status.setAttribute('role', 'status');
      gridEl.appendChild(status);
      const assist = element('div', 'ps-assist');
      assist.appendChild(button('다시 듣기', () => say(prompt())));
      assist.appendChild(button('도와주세요', hint));
      gridEl.appendChild(assist);
      gridEl.appendChild(footer());
      if (!state.prompted) {
        state.prompted = true;
        tasks.setTimeout(() => { if (state && !state.paused && state.phase === 'question') say(prompt()); }, 200);
      }
    }
    function drag(source, onDrop) {
      source.addEventListener('pointerdown', event => {
        if (event.button !== 0 || state.phase !== 'question' || state.paused) return;
        const rect = source.getBoundingClientRect();
        let ghost = null;
        source.setPointerCapture(event.pointerId);
        const move = ev => {
          if (!ghost && Math.hypot(ev.clientX - event.clientX, ev.clientY - event.clientY) < 14) return;
          if (!ghost) {
            ghost = source.cloneNode(true);
            ghost.removeAttribute('id');
            ghost.classList.add('ps-drag-ghost');
            ghost.setAttribute('aria-hidden', 'true');
            ghost.tabIndex = -1;
            ghost.style.width = rect.width + 'px';
            ghost.style.height = rect.height + 'px';
            document.body.appendChild(ghost);
          }
          ghost.style.left = ev.clientX - rect.width / 2 + 'px';
          ghost.style.top = ev.clientY - rect.height / 2 + 'px';
        };
        const finish = ev => {
          source.removeEventListener('pointermove', move);
          source.removeEventListener('pointerup', finish);
          source.removeEventListener('pointercancel', finish);
          if (source.hasPointerCapture(event.pointerId)) source.releasePointerCapture(event.pointerId);
          if (ghost) {
            ghost.remove();
            source.dataset.suppressClickUntil = String(performance.now() + 350);
            if (ev.type === 'pointerup') onDrop(ev.clientX, ev.clientY);
          }
        };
        source.addEventListener('pointermove', move);
        source.addEventListener('pointerup', finish);
        source.addEventListener('pointercancel', finish);
      });
    }
    function contains(node, x, y) {
      const box = node.getBoundingClientRect();
      return x >= box.left - 18 && x <= box.right + 18 && y >= box.top - 18 && y <= box.bottom + 18;
    }
    function road(driving, car = CARS[0]) {
      const scene = element('div', 'ps-road');
      scene.appendChild(element('div', 'ps-sun'));
      scene.appendChild(element('div', 'ps-cloud ps-cloud-one'));
      scene.appendChild(element('div', 'ps-cloud ps-cloud-two'));
      scene.appendChild(element('div', 'ps-hill'));
      scene.appendChild(element('div', 'ps-asphalt'));
      const vehicle = photo(car, 'ps-road-car' + (driving ? ' is-driving' : ''));
      scene.appendChild(vehicle);
      scene.setAttribute('aria-label', driving ? '자동차가 지나가요' : '자동차');
      return scene;
    }
    function choice(item) {
      const node = button('', () => answer(item.id), 'ps-choice');
      node.dataset.choice = item.id;
      node.setAttribute('aria-label', item.label);
      if (state.hint && item.id === state.target.id) node.classList.add('ps-hint');
      if (state.id === 'parking') {
        const bay = element('span', 'ps-parking-bay', 'P');
        bay.style.backgroundColor = item.color;
        node.appendChild(bay);
      } else if (state.id === 'count') {
        node.appendChild(element('span', 'ps-number', item.label));
        const dots = element('span', 'ps-dots', '● '.repeat(Number(item.id)).trim());
        dots.setAttribute('aria-hidden', 'true');
        node.appendChild(dots);
      } else node.appendChild(photo(item));
      node.appendChild(element('strong', '', item.label));
      if (state.id === 'delivery') drag(node, (x, y) => {
        const target = gridEl.querySelector('.ps-delivery-zone');
        if (target && contains(target, x, y)) answer(item.id);
      });
      return node;
    }
    function footer() {
      const row = element('div', 'ps-footer');
      row.appendChild(button('놀이 목록', menu));
      row.appendChild(button('쉬어요', () => {
        tasks.clear();
        stopInstruments();
        state.paused = true;
        say('쉬어요');
        render();
      }));
      row.appendChild(button('화장실', () => { say('화장실'); pushScreen('toilet', '화장실'); render(); }, 'ps-control ps-toilet'));
      return row;
    }
    function renderMusic() {
      gridEl.appendChild(element('h2', 'ps-question', '악기를 눌러봐요'));
      gridEl.appendChild(element('p', 'ps-music-note', '좋아하는 악기를 누르면 소리가 나요. 또 눌러도 좋아요.'));
      const choices = element('div', 'ps-instruments');
      const status = element('p', 'ps-music-status', '어떤 소리가 날까요?');
      status.setAttribute('role', 'status');
      const offset = state.instrumentPage || 0;
      instrumentCards.slice(offset, offset + 2).forEach(item => {
        const card = button('', async () => {
          tasks.clear();
          stopInstruments();
          window.offlineSpeech?.cancel();
          try { window.speechSynthesis?.cancel(); } catch (_) {}
          const request = ++musicRequest;
          const ok = await instruments.play(item.id, musicVolume);
          if (request !== musicRequest || !card.isConnected) return;
          if (!ok) { status.textContent = '소리를 다시 눌러 주세요'; return; }
          card.classList.add('ps-playing');
          status.textContent = item.label;
          tasks.setTimeout(() => card.classList.remove('ps-playing'), 1800);
        }, 'ps-instrument');
        card.dataset.instrument = item.id;
        card.setAttribute('aria-label', item.label);
        const icon = element('span', 'ps-instrument-icon', item.icon);
        icon.setAttribute('aria-hidden', 'true');
        card.appendChild(icon);
        card.appendChild(element('strong', '', item.label));
        choices.appendChild(card);
      });
      gridEl.appendChild(choices);
      gridEl.appendChild(status);
      const controls = element('div', 'ps-assist');
      controls.appendChild(button('다른 악기', () => {
        tasks.clear(); stopInstruments();
        state.instrumentPage = offset === 0 ? 2 : 0;
        render();
      }));
      controls.appendChild(button('소리 멈추기', () => {
        tasks.clear(); stopInstruments(); status.textContent = '소리를 멈췄어요';
      }));
      const volume = element('label', 'ps-music-volume', '악기 소리 크기');
      const slider = element('input', '');
      slider.type = 'range'; slider.min = '0.1'; slider.max = '0.6'; slider.step = '0.1'; slider.value = String(musicVolume);
      slider.setAttribute('aria-label', '악기 소리 크기');
      slider.addEventListener('input', () => { musicVolume = Number(slider.value); stopInstruments(); });
      volume.appendChild(slider);
      controls.appendChild(volume);
      gridEl.appendChild(controls);
      gridEl.appendChild(footer());
    }
    function renderGame(game) {
      if (!state || state.id !== game.id) {
        state = { id: game.id, round: 0, paused: false };
        stats[game.id] ||= { completed: 0, first: 0, help: 0 };
        buildRound();
      }
      const still = settings.motion === 'still' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      gridEl.classList.toggle('ps-still', still);
      const header = element('div', 'ps-game-header');
      header.appendChild(element('span', 'ps-eyebrow', game.title));
      const progress = element('div', 'ps-progress');
      progress.setAttribute('aria-label', '전체 ' + settings.rounds + '번 중 ' + Math.min(state.round + 1, settings.rounds) + '번째');
      for (let i = 0; i < settings.rounds; i++) progress.appendChild(element('span', i <= state.round ? 'is-done' : ''));
      if (game.id !== 'music') header.appendChild(progress);
      gridEl.appendChild(header);
      if (state.paused) {
        const rest = element('div', 'ps-rest');
        rest.appendChild(element('span', 'ps-rest-icon', '☁'));
        rest.appendChild(element('h2', '', '잠깐 쉬어요'));
        rest.appendChild(button('이어서 할래요', () => { state.paused = false; render(); }, 'ps-primary'));
        rest.appendChild(button('놀이 목록', menu));
        gridEl.appendChild(rest);
        gridEl.appendChild(button('화장실', () => { pushScreen('toilet', '화장실'); render(); }, 'ps-control ps-toilet'));
        return;
      }
      if (game.id === 'music') { renderMusic(); return; }
      if (state.phase === 'complete') {
        const complete = element('div', 'ps-complete');
        complete.appendChild(element('div', 'ps-stars', '★ ★ ★'));
        complete.appendChild(element('h2', '', '다 했어요!'));
        complete.appendChild(photo(CARS[(Object.values(stats).reduce((sum, row) => sum + row.completed, 0) - 1) % CARS.length], 'ps-earned-car'));
        complete.appendChild(element('p', '', '자동차 스티커를 모았어요!'));
        complete.appendChild(button('한 번 더', () => { clear(); render(); }, 'ps-primary'));
        complete.appendChild(button('다른 놀이', menu));
        gridEl.appendChild(complete);
        gridEl.appendChild(footer());
        return;
      }
      if (state.phase === 'reward') {
        if (PAIR_GAMES.includes(state.id)) gridEl.appendChild(element('div', 'ps-success-banner', '✓  모든 짝을 찾았어요!'));
        gridEl.appendChild(element('h2', 'ps-question', state.id === 'drive' ? '자동차가 지나가요' : '찾았어요!'));
        gridEl.appendChild(road(true, state.id === 'parking' ? state.target : CARS[state.round % CARS.length]));
        const actions = element('div', 'ps-reward-actions');
        actions.appendChild(button('자동차 한 번 더', () => {
          const old = gridEl.querySelector('.ps-road');
          old.replaceWith(road(true, CARS[state.round % CARS.length]));
          say('자동차 출발');
        }));
        actions.appendChild(button(state.round + 1 === settings.rounds ? '다 했어요' : '다음', next, 'ps-primary'));
        gridEl.appendChild(actions);
        gridEl.appendChild(footer());
        return;
      }
      if (PAIR_GAMES.includes(state.id)) { renderPairs(); return; }
      const question = prompt();
      gridEl.appendChild(element('h2', 'ps-question', question));
      if (state.id === 'drive') {
        gridEl.appendChild(road(false, CARS[state.round % CARS.length]));
        gridEl.appendChild(button('출발', () => answer('go'), 'ps-primary ps-go'));
      } else {
        const stage = element('div', 'ps-target');
        if (state.id === 'match' || (state.id === 'listen' && (state.hint || !settings.sound))) stage.appendChild(photo(state.target));
        else if (state.id === 'listen') {
          const replay = button('다시 듣기', () => say(question), 'ps-listen');
          replay.prepend(element('span', '', '♪'));
          stage.appendChild(replay);
        } else if (state.id === 'parking') {
          const car = button('', () => say(state.target.label), 'ps-park-car');
          car.setAttribute('aria-label', state.target.label + ' 자동차');
          car.appendChild(photo(state.target));
          drag(car, (x, y) => {
            const bay = [...gridEl.querySelectorAll('.ps-choice')].find(node => contains(node, x, y));
            if (bay) answer(bay.dataset.choice);
          });
          stage.appendChild(car);
        } else if (state.id === 'delivery') {
          stage.classList.add('ps-delivery-zone');
          stage.appendChild(photo(CARS[0], 'ps-delivery-car'));
          const request = element('div', 'ps-request');
          request.appendChild(photo(state.target));
          request.appendChild(element('span', '', state.target.label + ' 주세요'));
          stage.appendChild(request);
        } else if (state.id === 'count') {
          stage.classList.add('ps-count-road');
          for (let i = 0; i < Number(state.target.id); i++) stage.appendChild(photo(CARS[i % CARS.length]));
          stage.setAttribute('aria-label', '자동차 ' + state.target.id + '대');
        }
        gridEl.appendChild(stage);
        const options = element('div', 'ps-choices');
        options.style.setProperty('--choice-count', state.options.length);
        state.options.forEach(item => options.appendChild(choice(item)));
        gridEl.appendChild(options);
        const assist = element('div', 'ps-assist');
        assist.appendChild(button('다시 듣기', () => say(question)));
        assist.appendChild(button('도와주세요', hint));
        if (state.hint) assist.appendChild(element('span', 'ps-hint-copy', '테두리가 있는 그림을 눌러요'));
        gridEl.appendChild(assist);
      }
      gridEl.appendChild(footer());
      if (!state.prompted) {
        state.prompted = true;
        tasks.setTimeout(() => { if (state && !state.paused && state.phase === 'question') say(question); }, 200);
      }
    }
    function renderFeature(screen) {
      appMainEl.classList.remove('app--spotlight');
      spotlightViewEl.style.display = 'none';
      spotlightBtnEl.onclick = null;
      heroEl.style.display = 'none';
      helperEl.style.display = 'none';
      gridEl.style.display = '';
      gridEl.className = 'play-school';
      gridEl.innerHTML = '';
      const game = GAMES.find(item => item.id === screen.game);
      if (game) renderGame(game);
      else renderMenu();
    }
    return { render: renderFeature, clear };
  };
})();
