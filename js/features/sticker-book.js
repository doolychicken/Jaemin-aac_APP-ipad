/* One-at-a-time photo stickers, with touch/pointer input and saved chapter progress. */
(function () {
  'use strict';

  window.createStickerBookFeature = function (deps) {
    const catalog = deps.catalog || window.STICKER_BOOK;
    const KEY = catalog.storageKey || 'jaemin-bathroom-stickers-v1';
    const chapterById = id => catalog.chapters.find(chapter => chapter.id === id);
    const roomName = catalog.label || '화장실';
    const navKey = catalog.nav || 'stickerBathroom';
    const { gridEl, appMainEl, spotlightViewEl, spotlightBtnEl, heroEl, helperEl, speak, playPuzzleSound } = deps;
    const saved = window.appStorage.load(KEY, { version: 1, sound: true, hints: true, progress: {} }, value => {
      if (!value || value.version !== 1 || typeof value.sound !== 'boolean' || typeof value.hints !== 'boolean'
        || !value.progress || typeof value.progress !== 'object' || Array.isArray(value.progress)) return false;
      return Object.entries(value.progress).every(([id, state]) => {
        const chapter = chapterById(id);
        return chapter && state && Number.isInteger(state.cursor) && state.cursor >= 0 && state.cursor <= chapter.pieces.length
          && Array.isArray(state.placed) && new Set(state.placed).size === state.placed.length
          && state.placed.every((piece, index) => piece === chapter.pieces[index]?.id)
          && state.cursor <= state.placed.length && state.placed.length <= state.cursor + 1;
      });
    });
    let root = null;
    let chapter = null;
    let observer = null;
    let dragCancel = null;
    let epoch = 0;
    let armed = false;
    let ready = false;
    const loads = new Map();
    let spriteNumber = 0;
    function save() { window.appStorage.save(KEY, saved); }
    function stateFor(id) { return saved.progress[id] || (saved.progress[id] = { placed: [], cursor: 0 }); }
    function say(text) { if (saved.sound) speak(text); }
    function el(tag, className, text) {
      const node = document.createElement(tag);
      node.className = className || '';
      if (text !== undefined) node.textContent = text;
      return node;
    }
    function button(text, action, className = 'sb-button') {
      const node = el('button', className, text);
      node.type = 'button';
      node.addEventListener('click', action);
      return node;
    }
    function sprite(piece, className = '') {
      // SVG viewBox clips source sheets without creating resized or re-generated copies.
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', piece.crop.join(' '));
      if (piece.fit) svg.setAttribute('preserveAspectRatio', 'none');
      svg.setAttribute('class', 'sb-sprite ' + className);
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      if (piece.parts) {
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.setAttribute('preserveAspectRatio', 'none');
        piece.parts.forEach(part => {
          const [x, y, w, h] = part.box;
          const [cx, cy, cw, ch] = part.crop;
          const group = document.createElementNS(svg.namespaceURI, 'g');
          group.setAttribute('transform', `translate(${x * 100} ${y * 100}) scale(${w * 100 / cw} ${h * 100 / ch}) translate(${-cx} ${-cy})`);
          const clip = document.createElementNS(svg.namespaceURI, 'clipPath');
          const id = 'sb-clip-' + (++spriteNumber); clip.setAttribute('id', id);
          const rect = document.createElementNS(svg.namespaceURI, 'rect');
          ['x', 'y', 'width', 'height'].forEach((key, i) => rect.setAttribute(key, part.crop[i]));
          clip.append(rect);
          const image = document.createElementNS(svg.namespaceURI, 'image');
          image.setAttribute('href', piece.image); image.setAttribute('width', piece.sheet[0]); image.setAttribute('height', piece.sheet[1]);
          image.setAttribute('clip-path', `url(#${id})`);
          group.append(clip, image); svg.append(group);
        });
        return svg;
      }
      // A viewBox alone still paints neighbouring sheet pixels in letterbox space.
      const defs = document.createElementNS(svg.namespaceURI, 'defs');
      const clip = document.createElementNS(svg.namespaceURI, 'clipPath');
      const clipId = 'sb-clip-' + (++spriteNumber);
      clip.setAttribute('id', clipId);
      const rect = document.createElementNS(svg.namespaceURI, 'rect');
      ['x', 'y', 'width', 'height'].forEach((name, i) => rect.setAttribute(name, piece.crop[i]));
      clip.appendChild(rect); defs.appendChild(clip); svg.appendChild(defs);
      const image = document.createElementNS(svg.namespaceURI, 'image');
      image.setAttribute('href', piece.image);
      image.setAttribute('width', piece.sheet[0]);
      image.setAttribute('height', piece.sheet[1]);
      image.setAttribute('clip-path', `url(#${clipId})`);
      svg.appendChild(image);
      return svg;
    }
    function position(node, piece) {
      const [x, y, w, h] = piece.target;
      Object.assign(node.style, { left: x * 100 + '%', top: y * 100 + '%', width: w * 100 + '%', height: h * 100 + '%' });
    }
    function placedSprite(piece, layer) {
      const wrap = el('div', 'sb-placed');
      wrap.dataset.placed = piece.id;
      position(wrap, piece);
      wrap.appendChild(sprite(piece));
      layer.appendChild(wrap);
    }
    function clearView() {
      epoch++;
      dragCancel?.();
      observer?.disconnect();
      observer = null;
      armed = false;
      ready = false;
      document.querySelectorAll('.sb-drag-ghost').forEach(node => node.remove());
    }
    function clear() {
      clearView();
      appMainEl.classList.remove('app--sticker-book');
      root = null;
      chapter = null;
    }
    document.addEventListener('visibilitychange', () => { if (document.hidden) dragCancel?.(); });
    window.addEventListener('blur', () => dragCancel?.());
    function mount() {
      clearView();
      appMainEl.classList.remove('app--spotlight');
      appMainEl.classList.add('app--sticker-book');
      spotlightViewEl.style.display = 'none';
      spotlightBtnEl.onclick = null;
      heroEl.style.display = 'none';
      helperEl.style.display = 'none';
      gridEl.style.display = '';
      gridEl.className = 'sticker-book';
      gridEl.replaceChildren();
      root = el('div', 'sb-root');
      gridEl.appendChild(root);
    }
    function go(key, label) { deps.pushScreen(key, label); deps.render(); }
    function menu() { deps.returnToBook(); }
    function loadImage(url) {
      if (!loads.has(url)) {
        loads.set(url, new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = () => { loads.delete(url); reject(new Error(url)); };
          image.src = url;
        }));
      }
      return loads.get(url);
    }
    function notice(text) {
      const status = root?.querySelector('.sb-status');
      if (status) status.textContent = text;
    }
    function dialog(title, description, confirmLabel, action) {
      if (root.querySelector('.sb-modal')) return;
      dragCancel?.();
      const previousFocus = document.activeElement;
      const shade = el('div', 'sb-modal');
      const panel = el('section', 'sb-dialog');
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-modal', 'true');
      panel.setAttribute('aria-labelledby', 'sb-dialog-title');
      const heading = el('h2', '', title); heading.id = 'sb-dialog-title';
      panel.append(heading, el('p', '', description));
      const actions = el('div', 'sb-dialog-actions');
      function close() { shade.remove(); previousFocus?.focus(); }
      const cancel = button('계속할래요', close);
      actions.append(cancel);
      if (action) actions.append(button(confirmLabel, () => { close(); action(); }, 'sb-button sb-primary'));
      panel.append(actions); shade.append(panel); root.append(shade); cancel.focus();
      shade.addEventListener('keydown', event => {
        if (event.key === 'Escape') { event.preventDefault(); close(); }
        if (event.key === 'Tab') {
          const nodes = [...panel.querySelectorAll('button')];
          if ((event.shiftKey && document.activeElement === nodes[0]) || (!event.shiftKey && document.activeElement === nodes[nodes.length - 1])) {
            event.preventDefault(); nodes[event.shiftKey ? nodes.length - 1 : 0].focus();
          }
        }
      });
    }
    function bookHome() {
      chapter = null;
      const intro = el('div', 'sb-intro');
      intro.append(el('span', 'sb-kicker', '나만의 스티커북'), el('h2', '', catalog.heading || roomName + ' 꾸미기'),
        el('p', '', '큰 사진을 하나씩 끌어다 붙여요. 천천히, 내 속도로.'));
      root.append(intro);
      const layout = el('div', 'sb-book-layout');
      const cover = el('div', 'sb-cover');
      const photo = coverPhoto(catalog);
      cover.append(photo, el('span', 'sb-cover-caption', '우리 아이의 ' + roomName + ' 스티커북'));
      layout.append(cover);
      const choices = el('div', 'sb-chapters');
      catalog.chapters.forEach((item, index) => {
        const state = stateFor(item.id);
        const card = button('', () => go(navKey + '_' + item.id, item.title), 'sb-chapter');
        card.dataset.chapter = item.id;
        card.append(el('span', 'sb-chapter-number', String(index + 1)));
        const copy = el('span', 'sb-chapter-copy');
        copy.append(el('strong', '', item.title), el('span', '', item.subtitle));
        const count = state.placed.length;
        copy.append(el('small', '', count === item.pieces.length ? '완성했어요 · 다시 볼까요?' : count ? `${count} / ${item.pieces.length}개 · 이어서 하기` : `${item.pieces.length}개 · 시작하기`));
        card.append(copy, el('span', 'sb-chevron', '›')); choices.append(card);
      });
      (catalog.activities || []).forEach(activity => {
        const card = button('', () => go(activity.nav, activity.label), 'sb-chapter sb-extra-activity');
        const copy = el('span', 'sb-chapter-copy');
        copy.append(el('strong', '', activity.label), el('span', '', activity.description));
        card.append(copy, el('span', 'sb-chevron', '›')); choices.append(card);
      });
      layout.append(choices); root.append(layout);
      const options = el('div', 'sb-options');
      const sound = button(saved.sound ? '소리 켜짐' : '소리 꺼짐', () => { saved.sound = !saved.sound; save(); render({}); });
      sound.setAttribute('aria-pressed', String(saved.sound));
      const hint = button(saved.hints ? '붙일 자리 표시 켜짐' : '붙일 자리 표시 꺼짐', () => { saved.hints = !saved.hints; save(); render({}); });
      hint.setAttribute('aria-pressed', String(saved.hints));
      options.append(sound, hint, el('p', 'sb-note', '붙인 내용은 자동으로 저장돼요. 큰 물건부터 시작해 보세요.'));
      root.append(options);
    }
    function coverPhoto(book) {
      const frame = el('div', 'sb-cover-photo');
      frame.style.aspectRatio = book.width + ' / ' + book.height;
      const photo = el('img', ''); photo.src = book.room; photo.alt = (book.label || '화장실') + ' 배경';
      frame.append(photo);
      if (book.compose) book.chapters[0].pieces.forEach(piece => placedSprite(piece, frame));
      return frame;
    }
    function library() {
      chapter = null;
      root.append(el('span', 'sb-kicker', '그림을 붙이며 배우는 시간'), el('h2', 'sb-library-title', '내 스티커북'));
      const shelf = el('div', 'sb-library-grid');
      (window.STICKER_BOOKS || [catalog]).filter(book => !book.hidden).forEach(book => {
        const name = book.title || (book.label || '화장실') + ' 스티커북';
        const card = button('', () => go(book.nav || 'stickerBathroom', name), 'sb-library-card');
        card.append(coverPhoto(book), el('strong', '', name), el('span', '', book.description || (book.compose ? '큰 가구 · 생활용품' : '큰 물건 · 생활용품 · 생활 연습')));
        shelf.append(card);
      });
      root.append(shelf, el('p', 'sb-note', '스티커는 하나씩 나와요. 붙인 곳부터 이어서 할 수 있어요.'));
    }
    function renderScene(stage, state) {
      const isFixture = chapter.id === 'fixtures';
      const isRoutine = chapter.id === 'routines';
      const active = chapter.pieces[state.cursor];
      const last = state.cursor >= chapter.pieces.length ? chapter.pieces[chapter.pieces.length - 1] : active;
      const background = el('img', 'sb-room');
      background.src = isFixture || isRoutine ? catalog.empty : catalog.room;
      background.alt = '스티커를 붙이는 ' + roomName + ' 배경'; background.draggable = false;
      stage.appendChild(background);
      const layer = el('div', 'sb-piece-layer'); stage.appendChild(layer);
      if (isFixture) {
        chapter.pieces.filter(piece => state.placed.includes(piece.id)).forEach(piece => placedSprite(piece, layer));
      } else if (isRoutine) {
        catalog.chapters[0].pieces.filter(piece => piece.id !== last?.omit).forEach(piece => placedSprite(piece, layer));
        if (last && state.placed.includes(last.id)) placedSprite(last, layer);
      } else {
        if (catalog.compose) catalog.chapters[0].pieces.forEach(piece => placedSprite(piece, layer));
        const visible = chapter.single ? (last ? [last] : []) : chapter.pieces;
        visible.filter(piece => state.placed.includes(piece.id)).forEach(piece => placedSprite(piece, layer));
      }
      return layer;
    }
    function attachDrag(card, stage, target, piece, accept) {
      card.addEventListener('pointerdown', event => {
        if (!ready || dragCancel || event.button !== 0 || event.isPrimary === false) return;
        event.preventDefault();
        const id = event.pointerId, x0 = event.clientX, y0 = event.clientY;
        let moved = false, ghost = null;
        const hit = (x, y) => {
          const rect = target.getBoundingClientRect();
          const room = stage.getBoundingClientRect();
          const pad = 26;
          return x >= Math.max(room.left, rect.left - pad) && x <= Math.min(room.right, rect.right + pad)
            && y >= Math.max(room.top, rect.top - pad) && y <= Math.min(room.bottom, rect.bottom + pad);
        };
        function cleanup() {
          document.removeEventListener('pointermove', move, true);
          document.removeEventListener('pointerup', end, true);
          document.removeEventListener('pointercancel', cancel, true);
          card.removeEventListener('lostpointercapture', cancel);
          ghost?.remove(); target.classList.remove('sb-over'); card.classList.remove('sb-dragging');
          dragCancel = null;
          if (card.hasPointerCapture?.(id)) card.releasePointerCapture(id);
        }
        function cancel() { cleanup(); }
        function move(e) {
          if (e.pointerId !== id) return;
          e.preventDefault();
          if (!moved && Math.hypot(e.clientX - x0, e.clientY - y0) < 6) return;
          if (!moved) {
            moved = true;
            ghost = el('div', 'sb-drag-ghost'); ghost.append(sprite(piece));
            const r = target.getBoundingClientRect();
            const factor = Math.min(1.3, Math.max(1, 76 / Math.max(r.width, r.height)));
            ghost.style.width = r.width * factor + 'px'; ghost.style.height = r.height * factor + 'px';
            document.body.appendChild(ghost); card.classList.add('sb-dragging');
          }
          ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px';
          target.classList.toggle('sb-over', hit(e.clientX, e.clientY));
        }
        function end(e) {
          if (e.pointerId !== id) return;
          const success = moved && hit(e.clientX, e.clientY);
          cleanup();
          if (success) accept();
          else if (moved) { target.classList.add('sb-show-hint'); notice('괜찮아요. 표시된 자리에 다시 놓아보세요.'); }
          else say(piece.label);
        }
        dragCancel = cleanup;
        document.addEventListener('pointermove', move, { capture: true, passive: false });
        document.addEventListener('pointerup', end, true);
        document.addEventListener('pointercancel', cancel, true);
        card.addEventListener('lostpointercapture', cancel);
        try { card.setPointerCapture(id); } catch (_) { /* Document listeners also cover older WebKit. */ }
      });
    }
    function play() {
      const state = stateFor(chapter.id);
      const piece = chapter.pieces[state.cursor];
      const done = !piece;
      const matched = !!piece && state.placed.includes(piece.id);
      root.classList.add('sb-root--play');
      const toolbar = el('div', 'sb-toolbar');
      toolbar.append(button('목록', menu), el('strong', 'sb-chapter-title', chapter.title));
      const progress = el('div', 'sb-progress');
      const progressText = el('span', '', `${state.placed.length} / ${chapter.pieces.length}`);
      progress.append(progressText);
      const meter = el('progress', ''); meter.max = chapter.pieces.length; meter.value = state.placed.length;
      meter.setAttribute('aria-label', '붙인 스티커'); progress.append(meter); toolbar.append(progress);
      root.append(toolbar);
      const workspace = el('div', 'sb-workspace');
      const canvasWrap = el('div', 'sb-canvas-wrap');
      const stage = el('div', 'sb-stage'); stage.setAttribute('aria-label', roomName + ' 배경');
      canvasWrap.append(stage); workspace.append(canvasWrap);
      renderScene(stage, state);
      if (chapter.id === 'items' || done) {
        (catalog.activities || []).filter(activity => activity.target).forEach(activity => {
          const open = button(activity.label, () => go(activity.nav, activity.label), 'sb-room-link');
          open.style.left = activity.target[0] * 100 + '%';
          open.style.top = activity.target[1] * 100 + '%';
          stage.append(open);
        });
      }
      const tray = el('aside', 'sb-tray');
      tray.setAttribute('aria-label', '지금 붙일 스티커');
      workspace.append(tray); root.append(workspace);
      const status = el('p', 'sb-status', done ? (catalog.completeMessage || roomName + ' 꾸미기를 완성했어요!') : matched ? '잘 붙였어요! 다음 스티커도 만나볼까요?' : '스티커를 꾹 잡고 표시된 자리로 옮겨요.');
      status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); root.append(status);
      const footer = el('div', 'sb-footer');
      const undo = button('하나 되돌리기', () => {
        const last = state.placed.pop();
        if (last) { state.cursor = chapter.pieces.findIndex(p => p.id === last); save(); render({ chapter: chapter.id }); }
      });
      undo.disabled = !state.placed.length;
      footer.append(undo, button('쉬어요', () => dialog('잠깐 쉬어요', '붙인 스티커는 그대로 있어요. 준비되면 이어서 해요.')),
        button('처음부터', () => dialog('이 활동을 다시 할까요?', '이 활동에서 붙인 스티커만 지워져요.', '처음부터', () => {
          saved.progress[chapter.id] = { placed: [], cursor: 0 }; save(); render({ chapter: chapter.id });
        })));
      root.append(footer);
      if (done) {
        tray.classList.add('sb-tray--complete');
        tray.append(el('span', 'sb-star', '★'), el('h2', '', '다 붙였어요!'), el('p', '', '하나씩, 정말 잘했어요.'), button('다른 활동', menu, 'sb-button sb-primary'));
      } else if (matched) {
        tray.classList.add('sb-tray--matched');
        tray.append(el('span', 'sb-star', '✓'), el('h2', '', piece.label), el('p', '', '잘 붙였어요'));
        tray.append(button(state.cursor === chapter.pieces.length - 1 ? '완성 보기' : '다음 스티커', () => {
          state.cursor++; save(); render({ chapter: chapter.id });
        }, 'sb-button sb-primary sb-next'));
      } else {
        tray.append(el('span', 'sb-kicker', '이번 스티커'), el('h2', 'sb-piece-label', piece.label));
        const card = button('', event => {
          // Keyboard/switch access is explicit; ordinary taps do not place a sticker.
          if (event.detail !== 0 || !ready) return;
          armed = true; target.focus(); notice('선택했어요. 붙일 자리에서 확인을 눌러 주세요.');
        }, 'sb-card');
        card.dataset.piece = piece.id;
        card.setAttribute('aria-label', `${piece.label} 스티커, 끌어서 붙이기`);
        card.disabled = true;
        card.append(sprite(piece)); tray.append(card);
        tray.append(button('이름 듣기', () => say(piece.label), 'sb-button sb-listen'));
        const target = button('', () => { if (armed && ready) accept(); }, 'sb-target');
        target.setAttribute('aria-label', `${piece.label} 붙일 자리`);
        position(target, piece);
        target.append(sprite(piece, 'sb-guide'), el('span', 'sb-target-tag', '여기에'));
        if (saved.hints) target.classList.add('sb-show-hint');
        stage.append(target);
        tray.append(button('자리 보기', () => { target.classList.add('sb-show-hint'); notice('표시된 자리에 붙여요.'); }));
        let accepted = false;
        const localEpoch = epoch;
        function accept() {
          if (accepted || epoch !== localEpoch || !ready || root.querySelector('.sb-modal')) return;
          accepted = true; state.placed.push(piece.id); save();
          if (saved.sound) { playPuzzleSound('success'); say('잘했어요'); }
          render({ chapter: chapter.id });
          root.querySelector('.sb-next')?.focus({ preventScroll: true });
        }
        attachDrag(card, stage, target, piece, accept);
      }
      const resize = () => {
        const rect = canvasWrap.getBoundingClientRect();
        const width = Math.max(1, Math.min(rect.width, rect.height * catalog.width / catalog.height));
        stage.style.width = width + 'px'; stage.style.height = width * catalog.height / catalog.width + 'px';
      };
      observer = new ResizeObserver(resize); observer.observe(canvasWrap); resize();
      const localEpoch = epoch;
      const urls = new Set([catalog.room, catalog.empty, ...chapter.pieces.map(p => p.image)]);
      if (chapter.id === 'routines' || catalog.compose) {
        catalog.chapters[0].pieces.forEach(piece => urls.add(piece.image));
      }
      const loading = el('div', 'sb-loading', '스티커를 준비하고 있어요…');
      canvasWrap.append(loading);
      Promise.all([...urls].map(loadImage)).then(() => {
        if (epoch !== localEpoch) return;
        loading.remove(); ready = true;
        const card = root.querySelector('.sb-card'); if (card) card.disabled = false;
      }).catch(() => {
        if (epoch !== localEpoch) return;
        loading.replaceChildren(el('p', '', '사진을 불러오지 못했어요.'), button('다시 불러오기', () => render({ chapter: chapter.id })));
        notice('처음에는 인터넷에 연결해 사진 저장을 마쳐 주세요.');
      });
    }
    function render(screen) {
      mount();
      chapter = chapterById(screen.chapter);
      if (chapter) play(); else if (screen.bookShelf) library(); else bookHome();
    }
    return { render, clear };
  };
})();
