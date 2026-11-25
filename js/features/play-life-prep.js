(function () {
  'use strict';
  const { objects, topics } = window.LIFE_PREP;
  const library = PHOTO_AAC_SECTIONS.map(section => ({
    id: section.key,
    label: section.title,
    cards: DATA.screens[section.key].items
  }));
  const catalog = [...topics, ...library];
  const key = 'jaemin-life-prep-v1';
  const cursor = window.appStorage.load(key, {}, value =>
    value && typeof value === 'object' && !Array.isArray(value) &&
    Object.entries(value).every(([id, n]) => {
      const group = catalog.find(entry => entry.id === id);
      return group && Number.isInteger(n) && n >= 0 && n < (group.tasks || group.cards).length;
    }));

  function saveAnswer(group, index) {
    cursor[group.id] = (index + 1) % (group.tasks || group.cards).length;
    window.appStorage.save(key, cursor);
  }

  function menu(ctx) {
    const { board, button, element, photo, state } = ctx;
    const mode = state.prepMode || 'tools';
    const switcher = element('div', 'lp-tabs');
    for (const [value, label] of [['tools', '물건 준비하기'], ['photos', '사진 AAC 퀴즈']]) {
      const tab = button(label, () => { state.prepMode = value; ctx.draw(); });
      tab.setAttribute('aria-pressed', String(mode === value));
      switcher.append(tab);
    }
    const groups = element('div', 'lp-topics');
    for (const group of mode === 'tools' ? topics : library) {
      const topic = button('', () => {
        state.prepGroup = group.id;
        state.prepRound = null;
        state.lastPrompt = '';
        ctx.draw();
      }, 'lp-topic');
      topic.dataset.prepTopic = group.id;
      topic.append(photo(group.tasks?.[0].cue || group.cards[0], 'lp-topic-art'), element('strong', '', group.label));
      groups.append(topic);
    }
    board.append(switcher, groups);
  }

  function displayChoices(ctx, entries, onChoose) {
    const choices = ctx.element('div', 'lp-choices');
    choices.style.setProperty('--lp-columns', entries.length);
    for (const [id, item] of entries) {
      const option = ctx.button('', () => onChoose(id, item), 'lp-choice');
      option.dataset.prepChoice = id;
      option.append(ctx.photo(item, 'lp-choice-art'), ctx.element('strong', '', item.label));
      choices.append(option);
    }
    return choices;
  }

  function questionFor(ctx, group) {
    const { state, settings, shuffled } = ctx;
    if (state.prepRound?.round === state.round) return state.prepRound;
    const index = cursor[group.id] ?? 0;
    const question = { round: state.round, index, picked: [], hint: false };
    if (group.tasks) {
      question.task = group.tasks[index];
      question.remaining = question.task.answers.map(answer => [].concat(answer));
    } else {
      const answer = group.cards[index];
      const alternatives = shuffled(group.cards.filter(card => card.label !== answer.label && card.image !== answer.image));
      const unique = new Map();
      for (const card of alternatives) if (!unique.has(card.label)) unique.set(card.label, card);
      question.target = answer;
      question.options = shuffled([answer, ...[...unique.values()].slice(0, settings.choices - 1)]);
    }
    state.prepRound = question;
    return question;
  }

  function toolsQuestion(ctx, group, q) {
    const { element, board, state, button, photo, shuffled } = ctx;
    const task = q.task;
    const done = state.phase === 'reward';
    const total = task.answers.length;
    board.classList.add('lp-tools');
    board.dataset.prepTask = task.id;
    board.append(element('h2', 'lp-heading', done ? total + '개 모두 준비했어요' : task.prompt));
    const scene = done ? element('div', 'lp-scene') : button('', () => {
      if (q.selected) place(q.selected);
    }, 'lp-scene');
    if (done) scene.setAttribute('role', 'group');
    const sceneLabel = task.cue.label + ' · 준비한 물건 ' + q.picked.length + ' / ' + total;
    const pickedLabels = q.picked.map(id => objects[id].label).join(', ');
    scene.setAttribute('aria-label', pickedLabels ? sceneLabel + ' · ' + pickedLabels : sceneLabel);
    const art = photo(task.cue, 'lp-cue');
    const tray = element('span', 'lp-tray');
    const count = element('span', 'lp-count', '준비한 물건 ' + q.picked.length + ' / ' + total);
    const slots = element('span', 'lp-slots');
    slots.style.setProperty('--lp-columns', total);
    for (let index = 0; index < total; index++) {
      const item = objects[q.picked[index]];
      const slot = element('span', 'lp-slot' + (item ? ' lp-picked' : ''));
      if (item) {
        slot.append(photo(item, 'lp-picked-art'), element('strong', '', item.label));
      } else {
        slot.append(element('span', 'lp-empty-mark', '+'));
        slot.setAttribute('aria-hidden', 'true');
      }
      slots.append(slot);
    }
    tray.append(count, slots);
    scene.append(art, tray);
    board.append(scene);
    if (done) return;
    if (!q.choiceIds) {
      const possible = shuffled(q.remaining.flat()).slice(0, ctx.settings.choices - 1);
      const wrong = shuffled(task.distractors).slice(0, ctx.settings.choices - possible.length);
      q.choiceIds = shuffled([...possible, ...wrong]);
    }
    const status = element('p', 'lp-status');
    status.setAttribute('role', 'status');
    const placeInstruction = '물건을 사진 위에 끌어다 놓아요';
    status.textContent = q.selected ? '사진 위 빈칸에 놓아요' : placeInstruction;
    function place(id) {
      if (!scene.isConnected) return;
      const index = q.remaining.findIndex(set => set.includes(id));
      q.selected = null;
      if (index === -1) {
        choices.querySelector('[aria-pressed="true"]')?.setAttribute('aria-pressed', 'false');
        scene.classList.remove('lp-ready');
        status.textContent = '무엇에 쓰는 물건인지 다시 봐요';
        ctx.say(status.textContent);
        return;
      }
      q.remaining.splice(index, 1);
      q.picked.push(id);
      if (!q.remaining.length) {
        saveAnswer(group, q.index);
        ctx.win('필요한 물건을 모두 찾았어요');
      } else {
        q.choiceIds = null;
        q.hint = false;
        ctx.say(objects[id].label);
        ctx.draw();
      }
    }
    const choices = displayChoices(ctx, q.choiceIds.map(id => [id, objects[id]]), (id, item) => {
      if (!choices.isConnected) return;
      q.selected = q.selected === id ? null : id;
      for (const option of choices.children) {
        option.setAttribute('aria-pressed', String(option.dataset.prepChoice === q.selected));
      }
      scene.classList.toggle('lp-ready', !!q.selected);
      status.textContent = q.selected ? '사진 위 빈칸에 놓아요' : placeInstruction;
      if (q.selected) ctx.say(item.label);
    });
    scene.classList.toggle('lp-ready', !!q.selected);
    for (const option of choices.children) {
      const id = option.dataset.prepChoice;
      option.setAttribute('aria-pressed', String(id === q.selected));
      ctx.bindDrag(option, scene, () => place(id));
      if (q.hint && q.remaining.some(set => set.includes(id))) option.classList.add('lp-hint');
    }
    board.append(status, choices);
    addActions(ctx, task.prompt, () => { q.hint = true; ctx.draw(); });
  }

  function photosQuestion(ctx, group, q) {
    const { state, board, element, photo } = ctx;
    const done = state.phase === 'reward';
    board.dataset.prepPhoto = String(q.index);
    const phrase = q.target.speech || q.target.label;
    board.append(element('h2', 'lp-heading', done ? q.target.label : q.target.label + ' 사진을 찾아요'));
    if (done || q.hint) board.append(photo(q.target, 'lp-photo-hint'));
    if (done) return;
    const status = element('p', 'lp-status');
    status.setAttribute('role', 'status');
    let choices;
    choices = displayChoices(ctx, q.options.map((item, number) => [String(number), item]), (_, item) => {
      if (!choices.isConnected) return;
      if (item === q.target) {
        saveAnswer(group, q.index);
        ctx.win('찾았어요');
      } else {
        status.textContent = '괜찮아요. 다시 골라요.';
        ctx.say(phrase);
      }
    });
    board.append(choices, status);
    addActions(ctx, phrase, () => { q.hint = true; ctx.draw(); });
  }

  function addActions(ctx, phrase, showHint) {
    const actions = ctx.element('div', 'lp-actions');
    actions.append(ctx.button('다시 듣기', () => ctx.say(phrase)),
      ctx.button('사진 힌트', showHint),
      ctx.button('종류 바꾸기', () => { ctx.say(''); ctx.state.prepGroup = null; ctx.draw(); }));
    ctx.board.append(actions);
    ctx.promptOnce(phrase);
  }

  window.renderPlayLifePrep = function (ctx) {
    ctx.board.classList.add('lp-board');
    const group = catalog.find(item => item.id === ctx.state.prepGroup);
    if (!group) { menu(ctx); return; }
    const question = questionFor(ctx, group);
    if (group.tasks) toolsQuestion(ctx, group, question);
    else photosQuestion(ctx, group, question);
  };
})();
