(function () {
  'use strict';

  const stages = [
    { label: '세제 묻히기', prompt: '수세미에 주방세제를 묻혀요' },
    { label: '닦기', prompt: '접시를 슥슥 문질러요' },
    { label: '헹구기', prompt: '수도꼭지를 눌러 헹궈요' },
    { label: '건조대', prompt: '접시를 건조대에 놓아요' }
  ];
  const closeTap = '거품을 헹구고 물을 잠가요';
  const finishMessage = '설거지를 마쳤어요';
  const artwork = {
    soap: { book: 'kitchen', piece: 'dish-soap', label: '주방세제' },
    sponge: { book: 'kitchen', piece: 'sponge', label: '수세미' },
    plate: { book: 'kitchen', piece: 'plate', label: '접시' },
    sink: { book: 'kitchen', piece: 'sink', label: '싱크대' },
    rack: { image: './images/play_dishwash/drying-rack.webp', label: '건조대' }
  };

  function markedPlate(ctx, marks) {
    const plate = ctx.element('span', 'dw-plate');
    plate.setAttribute('aria-hidden', 'true');
    plate.appendChild(ctx.photo(artwork.plate, 'dw-photo'));
    for (let i = 0; i < 3; i++) plate.appendChild(ctx.element('i', 'dw-mark dw-' + marks));
    return plate;
  }

  function rackArt(ctx, filled) {
    const frame = ctx.element('span', 'dw-rack' + (filled ? ' dw-rack-full' : ''));
    frame.appendChild(ctx.photo(artwork.rack, 'dw-photo'));
    if (filled) {
      frame.append(ctx.photo(artwork.plate, 'dw-stored-plate'), ctx.photo(artwork.rack, 'dw-rack-front'));
    }
    return frame;
  }

  function transfer(ctx, progress, source, target, targetArt, next) {
    const tool = ctx.button('', () => {
      progress.selected = true;
      tool.setAttribute('aria-pressed', 'true');
      bay.classList.add('dw-selected');
      ctx.say(target.label);
    }, 'dw-tool');
    tool.dataset.dishTool = source.piece;
    tool.setAttribute('aria-pressed', String(progress.selected));
    tool.append(ctx.photo(source, 'dw-tool-photo'), ctx.element('strong', '', source.label));
    const bay = ctx.button('', () => {
      if (progress.selected) next();
      else ctx.say(stages[ctx.state.step].prompt);
    }, 'dw-bay ps-drop-target');
    bay.dataset.dishTarget = target.piece || 'rack';
    bay.classList.toggle('dw-selected', progress.selected);
    bay.append(targetArt, ctx.element('strong', 'dw-label', target.label));
    const arrow = ctx.element('span', 'dw-arrow', '→');
    arrow.setAttribute('aria-hidden', 'true');
    const work = ctx.element('div', 'dw-transfer');
    work.append(tool, arrow, bay);
    ctx.board.appendChild(work);
    ctx.bindDrag(tool, bay, next);
  }

  function scrub(ctx, progress, active, next) {
    const pad = ctx.element('div', 'dw-bay dw-pad');
    const plate = markedPlate(ctx, 'stain');
    const sponge = ctx.element('span', 'dw-scrubber');
    sponge.setAttribute('aria-hidden', 'true');
    sponge.append(ctx.photo(artwork.sponge, 'dw-photo'), ctx.element('i', 'dw-suds'));
    pad.append(plate, sponge);
    const controls = ctx.element('div', 'dw-scrub-controls');
    const meter = ctx.element('progress', 'dw-meter');
    meter.max = 3;
    meter.setAttribute('aria-label', '접시 닦기');
    const again = ctx.button('눌러서 닦기', () => {
      if (!active()) return;
      progress.strokes = Math.min(3, progress.strokes + 1);
      paint();
      if (progress.strokes === 3) next();
    }, 'ps-control');
    again.dataset.dishScrub = '';
    controls.append(meter, again);
    ctx.board.append(pad, controls);

    function paint() {
      meter.value = progress.strokes;
      plate.querySelectorAll('.dw-mark').forEach((mark, index) => {
        mark.classList.toggle('dw-clean', index < progress.strokes);
      });
    }
    paint();

    // Each pass must travel a visible distance on the dish. A long straight
    // swipe removes one stain; a reversal or a fresh stroke removes the next.
    let pointer = null;
    pad.addEventListener('pointerdown', event => {
      if (!active() || pointer || event.button !== 0 || event.isPrimary === false) return;
      const rect = plate.getBoundingClientRect();
      const inside = (x, y) => x >= rect.left - 12 && x <= rect.right + 12 && y >= rect.top - 12 && y <= rect.bottom + 12;
      if (!inside(event.clientX, event.clientY)) return;
      const bounds = pad.getBoundingClientRect();
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, dx: 0, dy: 0,
        distance: Math.max(20, Math.min(44, rect.width * .13)), inside, bounds };
      pad.setPointerCapture(event.pointerId);
      event.preventDefault();
      moveSponge(event);
    });
    function moveSponge(event) {
      const { bounds } = pointer;
      sponge.style.left = event.clientX - bounds.left + 'px';
      sponge.style.top = event.clientY - bounds.top + 'px';
    }
    pad.addEventListener('pointermove', event => {
      if (!pointer || event.pointerId !== pointer.id || !active() || progress.strokes === 3) return;
      if (!pointer.inside(event.clientX, event.clientY)) {
        pointer.x = null;
        return;
      }
      moveSponge(event);
      if (pointer.x === null) {
        pointer.x = event.clientX; pointer.y = event.clientY;
        pointer.dx = 0; pointer.dy = 0;
        return;
      }
      const x = event.clientX - pointer.x, y = event.clientY - pointer.y;
      const length = Math.hypot(x, y);
      const forward = x * pointer.dx + y * pointer.dy;
      if (forward > 0) {
        pointer.x = event.clientX; pointer.y = event.clientY;
        return;
      }
      if (length < pointer.distance) return;
      pointer.x = event.clientX; pointer.y = event.clientY;
      pointer.dx = x / length; pointer.dy = y / length;
      progress.strokes++;
      paint();
    });
    function release(event) {
      if (!pointer || event.pointerId !== pointer.id) return;
      pointer = null;
      if (pad.hasPointerCapture(event.pointerId)) pad.releasePointerCapture(event.pointerId);
      if (progress.strokes === 3) {
        if (event.type === 'pointerup' && active()) next();
        else { progress.strokes = 2; paint(); }
      }
    }
    pad.addEventListener('pointerup', release);
    pad.addEventListener('pointercancel', release);
    pad.addEventListener('lostpointercapture', release);
  }

  function rinse(ctx, progress, heading, active, next) {
    const basin = ctx.button('', () => {
      if (!active()) return;
      if (progress.running) { next(); return; }
      progress.running = true;
      showWater();
      ctx.say(closeTap);
    }, 'dw-bay dw-rinse');
    basin.dataset.dishFaucet = '';
    const scene = ctx.element('span', 'dw-rinse-scene');
    const stream = ctx.element('i', 'dw-stream');
    stream.setAttribute('aria-hidden', 'true');
    scene.append(ctx.photo(artwork.sink, 'dw-photo'), stream, markedPlate(ctx, 'foam'));
    const caption = ctx.element('strong', 'dw-label');
    basin.append(scene, caption);
    ctx.board.appendChild(basin);
    function showWater() {
      basin.classList.toggle('dw-running', progress.running);
      basin.setAttribute('aria-pressed', String(progress.running));
      caption.textContent = progress.running ? '물 잠그기' : '물 틀기';
      heading.textContent = progress.running ? closeTap : stages[2].prompt;
    }
    showWater();
  }

  window.renderPlayDishwash = function (ctx) {
    const { board, state, settings, element } = ctx;
    const index = state.step;
    if (!state.dishes || state.dishes.round !== state.round) {
      state.dishes = { round: state.round, selected: false, strokes: 0, running: false };
    }
    const progress = state.dishes;
    const finished = state.phase === 'reward';
    const active = () => board.isConnected && !state.paused && state.phase === 'question' && index === state.step;
    board.classList.add('dw-board');
    board.classList.toggle('dw-still', settings.motion === 'still');
    const heading = element('h2', 'ps-question', finished ? finishMessage : stages[index].prompt);
    board.appendChild(heading);
    const steps = element('ol', 'dw-steps');
    steps.setAttribute('aria-label', '설거지 순서');
    stages.forEach((stage, i) => {
      const done = finished || i < index;
      const item = element('li', done ? 'dw-done' : '', (done ? '✓ ' : '') + stage.label);
      if (!finished && i === index) item.setAttribute('aria-current', 'step');
      steps.appendChild(item);
    });
    board.appendChild(steps);
    if (finished) {
      const bay = element('div', 'dw-bay dw-finished');
      bay.appendChild(rackArt(ctx, true));
      board.appendChild(bay);
      return;
    }
    function next() {
      if (!active()) return;
      progress.selected = false;
      if (index === stages.length - 1) ctx.win(finishMessage);
      else { state.step++; ctx.draw(); }
    }
    if (index === 0) {
      transfer(ctx, progress, artwork.soap, artwork.sponge, ctx.photo(artwork.sponge, 'dw-sponge-target'), next);
    } else if (index === 1) {
      scrub(ctx, progress, active, next);
    } else if (index === 2) {
      rinse(ctx, progress, heading, active, next);
    } else {
      transfer(ctx, progress, artwork.plate, artwork.rack, rackArt(ctx, false), next);
    }
    const actions = board.querySelector('.dw-scrub-controls') || board;
    actions.appendChild(ctx.button('다시 듣기', () => ctx.say(heading.textContent), 'ps-control dw-replay'));
    ctx.promptOnce(heading.textContent);
  };
})();
