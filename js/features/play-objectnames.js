(function () {
  'use strict';

  function household(book, ids) {
    const pieces = window.STICKER_BOOKS.find(row => row.id === book).chapters.flatMap(row => row.pieces);
    return ids.map(id => ({ id, book, piece: id, label: pieces.find(row => row.id === id).label }));
  }
  const groups = [
    { id: 'devices', label: '전자기기', items: [
      { id: 'phone', label: '휴대폰', image: './images/play_household/phone.webp' },
      { id: 'laptop', label: '노트북', image: './images/play_household/laptop.webp' },
      { id: 'tablet', label: '아이패드', image: './images/play_household/tablet.webp' }
    ] },
    { id: 'appliances', label: '가전제품', items: [
      ...household('kitchen', ['fridge', 'microwave', 'blender', 'cooker']),
      ...household('living', ['fan', 'vacuum', 'tv', 'aircon'])
    ] },
    { id: 'kitchen', label: '주방용품', items: household('kitchen', ['paddle', 'mug', 'sponge', 'ladle', 'pot', 'rubber-gloves']) },
    { id: 'living', label: '거실용품', items: household('living', ['remote', 'sofa', 'clock', 'sofa-cushion', 'watering-can', 'slippers']) },
    { id: 'bathroom', label: '화장실용품', items: household('bathroom', ['brush', 'paste', 'soap', 'cup', 'shampoo', 'roll']) },
    { id: 'bedroom', label: '침실용품', items: household('bedroom', ['bed', 'pillows', 'lamp', 'wardrobe', 'mirror', 'alarm']) }
  ];

  window.renderPlayObjectNames = function (ctx) {
    const { state, board, element, button, photo, settings } = ctx;
    const group = groups.find(item => item.id === state.wordGroup);
    const mode = state.wordMode || 'picture';
    const names = mode === 'name';
    board.classList.add('hh-words');
    if (!group) {
      board.append(element('h2', 'hh-prompt', '어떤 물건을 찾아볼까요?'));
      const modes = element('div', 'hh-modes');
      for (const [value, label] of [['picture', '이름 듣고 사진 찾기'], ['name', '사진 보고 이름 고르기']]) {
        const tab = button(label, () => { state.wordMode = value; ctx.draw(); });
        tab.setAttribute('aria-pressed', String(mode === value));
        modes.append(tab);
      }
      const categories = element('div', 'hh-groups');
      for (const category of groups) {
        const tile = button('', () => {
          state.wordGroup = category.id;
          state.wordDeck = [];
          state.wordQuestion = null;
          ctx.draw();
        }, 'hh-group');
        tile.dataset.wordGroup = category.id;
        tile.append(photo(category.items[0], 'hh-group-image'), element('strong', '', category.label));
        categories.append(tile);
      }
      board.append(modes, categories);
      return;
    }

    if (state.wordQuestion?.round !== state.round) {
      if (!state.wordDeck.length) {
        state.wordDeck = ctx.shuffled(group.items);
        const end = state.wordDeck.length - 1;
        if (state.wordDeck[end].id === state.wordQuestion?.target.id) {
          [state.wordDeck[0], state.wordDeck[end]] = [state.wordDeck[end], state.wordDeck[0]];
        }
      }
      const target = state.wordDeck.pop();
      const others = ctx.shuffled(group.items.filter(item => item !== target)).slice(0, settings.choices - 1);
      state.wordQuestion = { round: state.round, target, choices: ctx.shuffled([target, ...others]), help: false };
    }
    const question = state.wordQuestion;
    const target = question.target;
    board.dataset.wordTarget = target.id;
    if (state.phase === 'reward') {
      const result = element('div', 'hh-word-result');
      result.append(photo(target, 'hh-answer-art'), element('h2', 'hh-prompt', target.label));
      board.append(result);
      return;
    }
    const prompt = names ? '이 물건의 이름을 골라요' : target.label + ' 사진을 찾아요';
    const head = element('div', 'hh-word-head');
    head.append(element('h2', 'hh-prompt', prompt), button('다시 듣기', () => ctx.say(prompt)));
    board.append(head);
    if (names || question.help || !settings.sound) {
      const cue = photo(target, 'hh-word-cue');
      if (names) {
        cue.removeAttribute('aria-hidden');
        cue.setAttribute('role', 'img');
        cue.setAttribute('aria-label', '이름을 고를 물건 사진');
      }
      board.append(cue);
    }
    const choices = element('div', 'hh-word-choices');
    choices.style.setProperty('--hh-count', question.choices.length);
    const status = element('p', 'hh-word-status', '');
    status.setAttribute('role', 'status');
    function answer(item) {
      if (state.paused || !choices.isConnected || state.phase !== 'question') return;
      if (item === target) { ctx.win('찾았어요. ' + target.label); return; }
      status.textContent = '괜찮아요. 다시 골라요.';
      ctx.say(names ? '다시 골라요' : prompt);
    }
    for (const item of question.choices) {
      const choice = button('', () => answer(item), 'hh-choice');
      choice.dataset.wordChoice = item.id;
      if (!names) choice.append(photo(item, 'hh-option-art'));
      choice.append(element('strong', '', item.label));
      const col = element('div', 'hh-option');
      col.append(choice);
      if (names) {
        const listen = button('이름 듣기', () => ctx.say(item.label));
        listen.setAttribute('aria-label', item.label + ' 이름 듣기');
        col.append(listen);
      }
      choices.append(col);
    }
    board.append(choices, status);
    const actions = element('div', 'hh-word-actions');
    if (!names && !question.help && settings.sound) actions.append(button('사진 힌트', () => { question.help = true; ctx.draw(); }));
    actions.append(button('종류 바꾸기', () => { state.wordGroup = null; state.lastPrompt = ''; ctx.draw(); }));
    board.append(actions);
    ctx.promptOnce(prompt);
  };
})();
