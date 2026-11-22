(function () {
  'use strict';

  const steps = [
    { name: '비누칠', tool: '스펀지', book: 'kitchen', piece: 'sponge', prompt: '스펀지로 비누칠해요' },
    { name: '헹구기', tool: '분무기', book: 'living', piece: 'plant-sprayer', prompt: '물로 거품을 헹궈요' },
    { name: '닦기', tool: '수건', book: 'bathroom', piece: 'roll', prompt: '수건으로 물기를 닦아요' }
  ];
  const cars = [
    './images/traffic_game/car_red.png',
    './images/traffic_game/car_blue.png',
    './images/traffic_game/car_silver.png'
  ];

  function toolArt(element, step) {
    // Render the same cutouts the child already uses in the household sticker books.
    const book = window.STICKER_BOOKS.find(row => row.id === step.book);
    const piece = book.chapters.find(row => row.id === 'items').pieces.find(row => row.id === step.piece);
    const [x, y, width, height] = piece.crop;
    const [sheetWidth, sheetHeight] = piece.sheet;
    const art = element('span', 'wash-tool-art');
    art.setAttribute('aria-hidden', 'true');
    art.style.aspectRatio = width + ' / ' + height;
    art.style.setProperty('--wash-ratio', String(width / height));
    art.style.backgroundImage = 'url("' + piece.image + '")';
    art.style.backgroundSize = (100 * sheetWidth / width) + '% ' + (100 * sheetHeight / height) + '%';
    art.style.backgroundPosition = (100 * x / (sheetWidth - width || 1)) + '% '
      + (100 * y / (sheetHeight - height || 1)) + '%';
    return art;
  }

  function carArt(ctx, phase) {
    const frame = ctx.element('span', 'wash-car-art');
    frame.appendChild(ctx.photo({ image: cars[ctx.state.round % cars.length] }, 'wash-car-photo'));
    const marks = ctx.element('span', 'wash-marks wash-' + phase);
    marks.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 4; i++) marks.appendChild(ctx.element('i', ''));
    frame.appendChild(marks);
    return frame;
  }

  window.renderPlayCarwash = function (ctx) {
    const { board, state, settings, element, button } = ctx;
    const finished = state.phase === 'reward';
    const index = state.step;
    const step = steps[index];
    board.classList.add('wash-board');
    if (settings.motion === 'still') board.classList.add('wash-still');
    const title = element('h2', 'ps-question', finished ? '반짝반짝 깨끗해요!' : step.prompt);
    board.appendChild(title);

    const progress = element('ol', 'wash-steps');
    progress.setAttribute('aria-label', '세차 순서');
    steps.forEach((item, number) => {
      const done = finished || number < index;
      const marker = element('li', done ? 'wash-step-done' : '', (done ? '✓ ' : '') + item.name);
      if (!finished && number === index) marker.setAttribute('aria-current', 'step');
      progress.appendChild(marker);
    });
    board.appendChild(progress);

    if (finished) {
      const bay = element('div', 'wash-bay wash-finished');
      bay.appendChild(carArt(ctx, 'shine'));
      board.appendChild(bay);
      return;
    }

    const surface = element('div', 'wash-workspace');
    const bay = button('', () => {
      if (state.washSelected) advance();
      else ctx.say(step.prompt);
    }, 'wash-bay ps-drop-target');
    bay.setAttribute('aria-label', '자동차');
    bay.appendChild(carArt(ctx, ['mud', 'foam', 'water'][index]));
    const hint = element('span', 'wash-bay-label', state.washSelected ? '자동차를 눌러요' : '여기에 놓아요');
    bay.appendChild(hint);
    const tool = button('', () => {
      state.washSelected = true;
      tool.setAttribute('aria-pressed', 'true');
      bay.classList.add('wash-ready');
      hint.textContent = '자동차를 눌러요';
      ctx.say('자동차를 눌러요');
    }, 'wash-tool');
    tool.dataset.washTool = step.piece;
    tool.setAttribute('aria-pressed', String(!!state.washSelected));
    bay.classList.toggle('wash-ready', !!state.washSelected);
    tool.append(toolArt(element, step), element('strong', '', step.tool));
    const arrow = element('span', 'wash-arrow', '→');
    arrow.setAttribute('aria-hidden', 'true');
    surface.append(tool, arrow, bay);
    board.appendChild(surface);
    const help = button('다시 듣기', () => ctx.say(step.prompt), 'ps-control wash-replay');
    board.appendChild(help);

    function advance() {
      if (state.paused || state.phase !== 'question' || state.step !== index || !surface.isConnected) return;
      state.washSelected = false;
      if (index === steps.length - 1) ctx.win('반짝반짝 깨끗해요');
      else {
        state.step++;
        ctx.draw();
      }
    }
    ctx.bindDrag(tool, bay, advance);
    ctx.promptOnce(step.prompt);
  };
})();
