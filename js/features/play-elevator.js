(function () {
  'use strict';

  const trips = [[1, 10], [10, 1], [3, 7], [7, 4], [2, 6]];
  const floors = [9, 10, 7, 8, 5, 6, 3, 4, 1, 2];
  const floorSpeech = ['', '1층', '2층', '3층', '4층', '5층', '6층', '7층', '8층', '9층', '10층'];
  const prompts = {
    call: '갈 방향의 버튼을 눌러요',
    board: '문이 열렸어요. 엘리베이터에 타요',
    select: '안에서 갈 층을 눌러요',
    close: '닫힘 버튼을 눌러요',
    moving: '엘리베이터가 이동하고 있어요',
    arrive: '도착했어요. 문이 열리면 내려요'
  };

  window.renderPlayElevator = function (ctx) {
    const { board, state, element, button } = ctx;
    const [start, initialGoal] = trips[state.round];
    if (state.elevator?.round !== state.round) {
      state.elevator = { round: state.round, floor: start, goal: initialGoal, phase: 'call', open: false, selected: false };
    }
    const ride = state.elevator;
    const direction = ride.goal > start ? 'up' : 'down';
    const directionMark = direction === 'up' ? '▲' : '▼';
    const finished = state.phase === 'reward';
    const phase = ride.phase;
    const message = finished ? '엘리베이터에서 내렸어요'
      : phase === 'cabin' ? (ride.selected && ride.open ? prompts.close : prompts.select) : prompts[phase];
    board.classList.add('lift-board');
    board.dataset.liftPhase = finished ? 'complete' : phase;
    board.append(element('h2', 'lift-title', message));

    function keyFace(symbol) {
      const face = element('span', 'lift-key-face', symbol);
      face.setAttribute('aria-hidden', 'true');
      return face;
    }
    const scene = element('div', 'lift-scene');
    const display = element('div', 'lift-display');
    display.setAttribute('aria-label', '현재 ' + floorSpeech[ride.floor]);
    if (phase === 'moving' || phase === 'board') display.append(element('span', 'lift-arrow', directionMark));
    const floor = element('strong', '', floorSpeech[ride.floor]);
    floor.dataset.liftFloor = String(ride.floor);
    display.append(floor);
    const doorClass = ['lift-doorway'];
    if (ride.open) {
      doorClass.push('lift-open');
      if (phase === 'board' || phase === 'arrive' || ride.notice === '문을 열었어요') doorClass.push('lift-opening');
    } else if ((phase === 'moving' && ride.floor === start) || ride.notice === '문을 닫았어요') {
      doorClass.push('lift-closing');
    }
    const photoFrame = element('div', 'lift-photo-frame');
    const entrance = element('img', 'lift-entrance');
    entrance.src = './images/play_elevator/entrance.webp';
    entrance.alt = '';
    entrance.draggable = false;
    const doorway = element('div', doorClass.join(' '));
    doorway.setAttribute('aria-hidden', 'true');
    doorway.append(element('div', 'lift-door lift-door-left'), element('div', 'lift-door lift-door-right'));
    photoFrame.append(entrance, doorway);
    scene.append(display, photoFrame);

    const controls = element('div', 'lift-controls');
    const layout = element('div', 'lift-layout');
    layout.append(scene, controls);
    board.append(layout);
    if (finished) {
      controls.append(element('p', 'lift-goal', floorSpeech[ride.goal] + '에 도착했어요'));
      return;
    }

    const goal = element('div', 'lift-goal');
    goal.append(element('span', '', '갈 층'), element('strong', '', floorSpeech[ride.goal]));
    controls.append(goal);
    const status = element('p', 'lift-status');
    status.setAttribute('role', 'status');
    status.textContent = ride.notice || '';
    function cue(text) {
      status.textContent = text;
      ctx.say(text);
    }
    function move() {
      ride.notice = '';
      ride.open = false;
      ride.phase = 'moving';
      ctx.draw();
    }

    if (phase === 'call') {
      const calls = element('div', 'lift-call-buttons');
      for (const [value, symbol, label] of [['up', '▲', '위'], ['down', '▼', '아래']]) {
        const call = button('', () => {
          if (value !== direction) {
            cue(direction === 'up' ? '위로 갈 때는 위 버튼을 눌러요' : '아래로 갈 때는 아래 버튼을 눌러요');
            return;
          }
          ride.open = true;
          ride.phase = 'board';
          ctx.draw();
        }, 'lift-key lift-call');
        call.dataset.liftCall = value;
        call.append(keyFace(symbol), element('strong', '', label));
        calls.append(call);
      }
      controls.append(calls);
      const change = element('details', 'lift-destination');
      const select = element('select');
      const label = element('label', '', '갈 층 바꾸기');
      for (let number = 1; number <= 10; number++) {
        if (number === start) continue;
        const option = element('option', '', floorSpeech[number]);
        option.value = number;
        option.selected = number === ride.goal;
        select.append(option);
      }
      select.addEventListener('change', () => { ride.goal = Number(select.value); ctx.draw(); });
      label.append(select);
      change.append(element('summary', '', '다른 층으로 가기'), label);
      controls.append(change);
    } else if (phase === 'board') {
      const enter = button('엘리베이터 타기', () => { ride.phase = 'cabin'; ctx.draw(); }, 'ps-primary');
      enter.dataset.liftEnter = '';
      controls.append(enter);
    } else if (phase === 'cabin' || phase === 'moving') {
      const moving = phase === 'moving';
      const panel = element('div', 'lift-panel');
      panel.setAttribute('role', 'group');
      panel.setAttribute('aria-label', '층수와 문 버튼');
      for (const number of floors) {
        const key = button('', () => {
          if (number !== ride.goal) { cue('갈 층을 다시 확인해요'); return; }
          ride.selected = true;
          ride.notice = '';
          if (!ride.open) move();
          else ctx.draw();
        }, 'lift-key lift-floor-key');
        key.dataset.liftSelect = String(number);
        key.disabled = moving;
        key.setAttribute('aria-label', floorSpeech[number]);
        key.setAttribute('aria-pressed', String(ride.selected && number === ride.goal));
        key.append(keyFace(String(number)));
        panel.append(key);
      }
      const doorButtons = element('div', 'lift-door-buttons');
      for (const [open, symbol, label] of [[true, '◀│▶', '열림'], [false, '▶│◀', '닫힘']]) {
        const door = button('', () => {
          if (!open && ride.selected) { move(); return; }
          const notice = open ? '문을 열었어요' : '문을 닫았어요';
          if (ride.open === open) { cue(notice); return; }
          ride.open = open;
          ride.notice = notice;
          ctx.draw();
          ctx.say(notice);
        }, 'lift-key lift-door-key');
        door.dataset.liftDoor = open ? 'open' : 'close';
        door.disabled = moving;
        door.append(keyFace(symbol), element('strong', '', label));
        doorButtons.append(door);
      }
      panel.append(doorButtons);
      controls.append(panel);
      if (moving) {
        ctx.after(ctx.still ? 220 : 370, () => {
          ride.floor += direction === 'up' ? 1 : -1;
          if (ride.floor === ride.goal) { ride.phase = 'arrive'; ride.open = true; }
          ctx.draw();
        });
      }
    } else {
      const exit = button('엘리베이터 내리기', () => ctx.win('엘리베이터에서 내렸어요'), 'ps-primary');
      exit.dataset.liftExit = '';
      controls.append(exit);
    }
    controls.append(status);
    if (phase !== 'moving') controls.append(button('다시 듣기', () => ctx.say(message)));
    ctx.promptOnce(message);
  };
})();
