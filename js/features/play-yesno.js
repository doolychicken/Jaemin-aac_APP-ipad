(function () {
  'use strict';

  window.createOxChoices = function (labels, choose) {
    const pair = document.createElement('div');
    pair.className = 'ox-choices';
    for (const [index, symbol] of ['○', '×'].entries()) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'ox-answer';
      button.dataset.oxAnswer = index === 0 ? 'yes' : 'no';
      const mark = document.createElement('span');
      mark.className = 'ox-mark';
      mark.setAttribute('aria-hidden', 'true');
      mark.textContent = symbol;
      const text = document.createElement('strong');
      text.textContent = labels[index];
      button.append(mark, text);
      button.addEventListener('click', () => choose(index === 0, button));
      pair.append(button);
    }
    return pair;
  };

  const questions = [
    { prompt: '이건 우유예요?', image: './images/meal_milk_large_v2.png', yes: true, feedback: '맞아요. 우유예요.' },
    { prompt: '이건 우유예요?', book: 'living', piece: 'remote', yes: false, feedback: '아니에요. 리모컨이에요.' },
    { prompt: '이건 자동차예요?', image: './images/traffic_game/car_blue.png', yes: true, feedback: '맞아요. 자동차예요.' },
    { prompt: '이건 주스예요?', image: './images/meal_eggtart.png', yes: false, feedback: '아니에요. 에그타르트예요.' },
    { prompt: '이건 칫솔이에요?', book: 'bathroom', piece: 'brush', yes: true, feedback: '맞아요. 칫솔이에요.' }
  ];

  function practice(ctx) {
    const { state, board, element, button, road, still } = ctx;
    const stopped = state.oxStopped;
    const stoppedText = '자동차를 멈췄어요';
    const prompt = () => state.oxPlayed ? '자동차 한 번 더 볼래요?' : '자동차 볼래요?';
    const heading = element('h2', 'ox-heading', stopped ? stoppedText : prompt());
    const track = element('div', 'ox-track');
    const controls = element('div', 'ox-controls');
    board.append(heading, track, controls);
    if (stopped) {
      const message = element('div', 'ox-stopped', '여기서 멈춰요');
      message.setAttribute('role', 'status');
      track.append(message);
      controls.append(button('다시 골라요', () => {
        state.oxStopped = false;
        state.oxPlayed = false;
        state.lastPrompt = '';
        ctx.draw();
      }));
      return;
    }
    track.append(road(false));
    const pair = window.createOxChoices(['할래요', '안 할래요'], (answer, control) => {
      if (!board.isConnected) return;
      if (!answer) {
        state.oxStopped = true;
        ctx.say(stoppedText);
        ctx.draw();
        return;
      }
      state.oxPlayed = true;
      const scene = road(!still);
      track.replaceChildren(scene);
      ctx.say('자동차 출발');
      if (still) { heading.textContent = prompt(); return; }
      control.disabled = true;
      heading.textContent = '자동차가 지나가요';
      scene.querySelector('.ps-road-car').addEventListener('animationend', () => {
        if (!scene.isConnected) return;
        heading.textContent = prompt();
        control.disabled = false;
        ctx.say(heading.textContent);
      }, { once: true });
    });
    controls.append(pair, button('다시 듣기', () => ctx.say(heading.textContent)));
    ctx.promptOnce(heading.textContent);
  }

  function quiz(ctx) {
    const { state, board, element, button, photo } = ctx;
    const question = questions[state.round];
    const done = state.phase === 'reward';
    const heading = element('h2', 'ox-heading', done ? question.feedback : question.prompt);
    board.append(heading, photo(question, 'ox-picture'));
    if (done) return;
    const status = element('p', 'ox-status');
    status.setAttribute('role', 'status');
    const choices = window.createOxChoices(['맞아요', '아니에요'], answer => {
      if (!choices.isConnected) return;
      if (answer === question.yes) ctx.win(question.feedback);
      else {
        status.textContent = '사진을 보고 다시 골라요';
        ctx.say(status.textContent);
      }
    });
    const controls = element('div', 'ox-controls');
    controls.append(choices, status, button('다시 듣기', () => ctx.say(question.prompt)));
    board.append(controls);
    ctx.promptOnce(question.prompt);
  }

  window.renderPlayYesNo = function (ctx) {
    const { element, button, board, state } = ctx;
    board.classList.add('ox-game');
    const mode = state.oxMode || 'practice';
    const modes = element('div', 'ox-modes');
    modes.setAttribute('aria-label', '오엑스 놀이 종류');
    for (const [value, label] of [['practice', '할래요·안 할래요'], ['quiz', '사진 오엑스 퀴즈']]) {
      const control = button(label, () => {
        if (value === mode) return;
        ctx.say('');
        state.oxMode = value;
        state.phase = 'question';
        state.lastPrompt = '';
        ctx.draw();
      });
      control.setAttribute('aria-pressed', String(value === mode));
      modes.append(control);
    }
    board.append(modes);
    if (mode === 'practice') practice(ctx);
    else quiz(ctx);
  };
})();
