/* One-at-a-time photo stickers, with touch/pointer input and saved chapter progress. */
(function () {
  'use strict';

  // The playing area shows the useful part of each photo. Covers use the original frame.
  const playCrops = {
    bathroom: [0, .015, 1, 1],
    living: [0, .16, 1, 1],
    bedroom: [.025, .05, 1, .99],
    fridge: [.012, 0, .99, .99],
    wardrobe: [.012, .012, .99, .99],
    linen: [.10, .025, .93, .955],
    dress: [.31, 0, .68, .985],
    tray: [.015, .05, .99, .94]
  };

  window.createStickerBookFeature = function (deps) {
    const catalog = deps.catalog || window.STICKER_BOOK;
    const KEY = catalog.storageKey || 'jaemin-bathroom-stickers-v1';
    const chapterById = id => catalog.chapters.find(chapter => chapter.id === id);
    const roomName = catalog.label || '화장실';
    const navKey = catalog.nav || 'stickerBathroom';
    const isKitchen = catalog.id === 'kitchen';
    const controls = document.getElementById('stickerControls');
    const roomFrame = catalog.sceneCrop || [0, 0, catalog.width, catalog.height];
    const fridge = isKitchen && catalog.chapters[0].pieces.find(piece => piece.id === 'fridge');
    const top = fridge ? Math.max(roomFrame[1], Math.floor(Math.min(fridge.target[1],
      ...catalog.chapters.flatMap(chapter => chapter.pieces.map(piece => piece.target[1]))) * catalog.height) - 6) : roomFrame[1];
    const crop = playCrops[catalog.id];
    const frame = crop ? [
      crop[0] * catalog.width, crop[1] * catalog.height,
      (crop[2] - crop[0]) * catalog.width, (crop[3] - crop[1]) * catalog.height
    ] : [roomFrame[0], top, roomFrame[2], roomFrame[1] + roomFrame[3] - top];
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
      if (piece.rotate === 90 || piece.rotate === 270) {
        const [x, y, w, h] = piece.crop;
        svg.setAttribute('viewBox', `0 0 ${h} ${w}`);
        const group = document.createElementNS(svg.namespaceURI, 'g');
        const turn = piece.rotate === 90 ? `translate(${h} 0) rotate(90)` : `translate(0 ${w}) rotate(-90)`;
        group.setAttribute('transform', `${turn} translate(${-x} ${-y})`);
        group.appendChild(image); svg.appendChild(group);
      } else if (piece.displayAspect) {
        // Use the same perspective on the card, under the pointer and on the floor.
        const [x, y, w, h] = piece.crop;
        const width = h * piece.displayAspect;
        svg.setAttribute('viewBox', `0 0 ${width} ${h}`);
        const group = document.createElementNS(svg.namespaceURI, 'g');
        group.setAttribute('transform', `scale(${width / w} 1) translate(${-x} ${-y})`);
        group.appendChild(image); svg.appendChild(group);
      } else svg.appendChild(image);
      return svg;
    }
    function displayBounds(piece) {
      if (catalog.sharedStorage) return piece.target;
      const [x, y, w, h] = piece.target;
      if (catalog.id === 'living' && piece.id === 'purifier') {
        const scale = 1.45;
        return [x - w * (scale - 1) / 2, y - h * (scale - 1), w * scale, h * scale];
      }
      if (catalog.id === 'living' && piece.id === 'watering-can') {
        const scale = 1.4;
        // Leave the sprayer and the plant clear while staying on the same patch of floor.
        return [x + .006, y + .052, w * scale, h * scale];
      }
      const [left, top, frameWidth, frameHeight] = frame;
      const artWidth = w * catalog.width;
      const artHeight = h * catalog.height;
      const frameSize = Math.max(frameWidth, frameHeight);
      // Keep the cutlery close to its place settings without covering the bowls.
      let scaleLimit = 1.65;
      if (catalog.id === 'kitchen' && /^(spoon|fork|chopsticks)(-right)?$/.test(piece.id)) scaleLimit = 1.18;
      const scale = Math.min(scaleLimit, 0.054 * frameSize / Math.min(artWidth, artHeight),
        0.275 * frameSize / Math.max(artWidth, artHeight));
      if (scale <= 1) return piece.target;
      const minX = left / catalog.width, minY = top / catalog.height;
      const maxX = (left + frameWidth) / catalog.width, maxY = (top + frameHeight) / catalog.height;
      if (x < minX || y < minY || x + w > maxX || y + h > maxY) return piece.target;
      const width = w * scale, height = h * scale;
      return [
        Math.max(minX, Math.min(maxX - width, x + (w - width) / 2)),
        Math.max(minY, Math.min(maxY - height, y + (h - height) / 2)),
        width, height
      ];
    }
    function position(node, [x, y, w, h]) {
      Object.assign(node.style, { left: x * 100 + '%', top: y * 100 + '%', width: w * 100 + '%', height: h * 100 + '%' });
    }
    // Expand the landing area around the original cutout, including at room edges.
    function sizeDropTarget(target, bounds, width, height, verticalScale) {
      const [x, y, w, h] = bounds;
      const artWidth = w * width, artHeight = h * height;
      const zoneWidth = Math.min(width, Math.max(84, artWidth + 16));
      const zoneHeight = Math.min(height, Math.max(84, artHeight + 16));
      const left = Math.max(0, Math.min(width - zoneWidth, x * width + (artWidth - zoneWidth) / 2));
      const top = Math.max(0, Math.min(height - zoneHeight, y * height + (artHeight - zoneHeight) / 2));
      Object.assign(target.style, { left: left + 'px', top: top + 'px', width: zoneWidth + 'px', height: zoneHeight + 'px' });
      Object.assign(target.querySelector('.sb-guide').style, { left: (x * width - left) + 'px', top: (y * height - top) + 'px',
        width: artWidth + 'px', height: artHeight / verticalScale + 'px',
        transform: `scaleY(${verticalScale})`, transformOrigin: 'top left' });
    }
    function placedSprite(piece, layer, bounds = displayBounds(piece)) {
      const wrap = el('div', 'sb-placed');
      wrap.dataset.placed = piece.id;
      position(wrap, bounds);
      wrap.appendChild(sprite(piece));
      layer.appendChild(wrap);
    }
    function clearView() {
      epoch++;
      dragCancel?.();
      controls?.replaceChildren();
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
    // Keep photos and placed stickers in their original room coordinates. Only the
    // outside frame clips the room, so the same crop works at every screen size.
    function sceneLayer(frame, book, crop = book.sceneCrop) {
      if (!crop) return frame;
      const [x, y, width, height] = crop;
      const scene = el('div', 'sb-scene');
      Object.assign(scene.style, {
        left: -100 * x / width + '%', top: -100 * y / height + '%',
        width: 100 * book.width / width + '%', height: 100 * book.height / height + '%'
      });
      frame.append(scene);
      return scene;
    }
    function coverPhoto(book) {
      const frame = el('div', 'sb-cover-photo');
      const [, , width, height] = book.sceneCrop || [0, 0, book.width, book.height];
      frame.style.aspectRatio = width + ' / ' + height;
      const scene = sceneLayer(frame, book);
      const photo = el('img', 'sb-room'); photo.src = book.room; photo.alt = (book.label || '화장실') + ' 배경';
      scene.append(photo);
      if (book.compose) book.chapters[0].pieces.forEach(piece => placedSprite(piece, scene, piece.target));
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
      if (catalog.sharedStorage) {
        const key = piece => piece.image + ':' + piece.crop.join(',');
        const visible = new Set();
        if (active && !state.placed.includes(active.id)) visible.add(key(active));
        for (const chapter of catalog.chapters) {
          const placed = saved.progress[chapter.id]?.placed || [];
          for (const piece of chapter.pieces) {
            const photo = key(piece);
            if (placed.includes(piece.id) && !visible.has(photo)) {
              placedSprite(piece, layer);
              visible.add(photo);
            }
          }
        }
        for (const zone of catalog.sharedStorage) {
          const area = el('div', 'sb-storage-area');
          area.dataset.zone = zone.id;
          area.setAttribute('aria-hidden', 'true');
          position(area, zone.bounds);
          stage.append(area);
          const label = el('span', 'sb-storage-label', zone.label);
          label.dataset.zone = zone.id;
          label.style.left = zone.target[0] * 100 + '%';
          label.style.top = zone.target[1] * 100 + '%';
          stage.append(label);
        }
      } else if (isFixture) {
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
        const guide = target.querySelector('.sb-guide');
        const compartment = piece.storageZone && stage.querySelector(`.sb-storage-area[data-zone="${piece.storageZone}"]`);
        let moved = false, ghost = null;
        const hit = (x, y) => {
          const rect = (compartment || target).getBoundingClientRect();
          const room = stage.getBoundingClientRect();
          const pad = compartment ? 0 : 18;
          return x >= Math.max(room.left, rect.left - pad) && x <= Math.min(room.right, rect.right + pad)
            && y >= Math.max(room.top, rect.top - pad) && y <= Math.min(room.bottom, rect.bottom + pad);
        };
        function cleanup() {
          document.removeEventListener('pointermove', move, true);
          document.removeEventListener('pointerup', end, true);
          document.removeEventListener('pointercancel', cancel, true);
          card.removeEventListener('lostpointercapture', cancel);
          compartment?.classList.remove('sb-storage-over');
          ghost?.remove(); target.classList.remove('sb-over'); card.classList.remove('sb-dragging');
          dragCancel = null;
          if (card.hasPointerCapture?.(id)) card.releasePointerCapture(id);
        }
        function cancel(e) { if (e.pointerId === id) cleanup(); }
        function move(e) {
          if (e.pointerId !== id) return;
          e.preventDefault();
          if (!moved && Math.hypot(e.clientX - x0, e.clientY - y0) < 6) return;
          if (!moved) {
            moved = true;
            ghost = el('div', 'sb-drag-ghost');
            ghost.append(sprite(piece));
            document.body.appendChild(ghost); card.classList.add('sb-dragging');
          }
          const rect = guide.getBoundingClientRect();
          const over = hit(e.clientX, e.clientY);
          Object.assign(ghost.firstElementChild.style, {
            height: guide.style.height, transform: guide.style.transform, transformOrigin: guide.style.transformOrigin
          });
          Object.assign(ghost.style, {
            width: rect.width + 'px', height: rect.height + 'px',
            left: (over ? rect.left + rect.width / 2 : e.clientX) + 'px',
            top: (over ? rect.top + rect.height / 2 : e.clientY - (e.pointerType === 'touch' ? 24 : 0)) + 'px'
          });
          target.classList.toggle('sb-over', over);
          compartment?.classList.toggle('sb-storage-over', over);
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
      root.dataset.book = catalog.id;
      const toolbar = el('div', 'sb-toolbar');
      toolbar.append(button('목록', menu), el('strong', 'sb-chapter-title', chapter.title));
      const progress = el('div', 'sb-progress');
      const progressText = el('span', '', `${state.placed.length} / ${chapter.pieces.length}`);
      progress.append(progressText);
      const meter = el('progress', ''); meter.max = chapter.pieces.length; meter.value = state.placed.length;
      meter.setAttribute('aria-label', '붙인 스티커'); progress.append(meter); toolbar.append(progress);
      if (controls) controls.append(toolbar);
      else root.append(toolbar);
      const workspace = el('div', 'sb-workspace');
      const canvasWrap = el('div', 'sb-canvas-wrap');
      const stage = el('div', 'sb-stage'); stage.setAttribute('aria-label', roomName + ' 배경');
      canvasWrap.append(stage); workspace.append(canvasWrap);
      const scene = sceneLayer(stage, catalog, frame);
      renderScene(scene, state);
      if (chapter.id === 'items' || done) {
        (catalog.activities || []).filter(activity => activity.target).forEach(activity => {
          const open = button(activity.label, () => go(activity.nav, activity.label), 'sb-room-link');
          open.style.left = activity.target[0] * 100 + '%';
          open.style.top = activity.target[1] * 100 + '%';
          scene.append(open);
        });
      }
      const tray = el('aside', 'sb-tray');
      tray.setAttribute('aria-label', '지금 붙일 스티커');
      workspace.append(tray); root.append(workspace);
      const status = el('p', 'sb-status', done ? (catalog.completeMessage || roomName + ' 꾸미기를 완성했어요!') : matched ? '잘 붙였어요! 다음 스티커도 만나볼까요?' : '스티커를 꾹 잡고 표시된 자리로 옮겨요.');
      status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
      if (!controls) root.append(status);
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
      if (controls) toolbar.append(footer);
      else root.append(footer);
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
        tray.append(el('span', 'sb-kicker', piece.positionCue || '이번 스티커'), el('h2', 'sb-piece-label', piece.label));
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
        target.setAttribute('aria-label', [piece.label, piece.positionCue, '붙일 자리'].filter(Boolean).join(' '));
        target.append(sprite(piece, 'sb-guide'), el('span', 'sb-target-tag', piece.positionCue || '여기에'));
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
      if (controls) tray.prepend(status);
      const resize = () => {
        const rect = canvasWrap.getBoundingClientRect();
        const [left, top, frameWidth, frameHeight] = frame;
        const width = Math.max(1, Math.min(rect.width, rect.height * frameWidth / frameHeight));
        const naturalHeight = width * frameHeight / frameWidth;
        // Use spare vertical space while keeping every placement in view.
        const fillHeight = window.matchMedia('(min-width: 601px) and (orientation: landscape)').matches;
        const height = fillHeight ? Math.max(1, Math.min(rect.height, isKitchen ? Infinity : naturalHeight * 1.32)) : naturalHeight;
        const verticalScale = height / naturalHeight;
        stage.style.width = width + 'px'; stage.style.height = height + 'px';
        scene.style.height = 100 * catalog.height / frameHeight / verticalScale + '%';
        scene.style.transformOrigin = 'top left';
        scene.style.transform = `scaleY(${verticalScale})`;
        const target = stage.querySelector('.sb-target');
        if (target) {
          const [x, y, w, h] = displayBounds(piece);
          sizeDropTarget(target, [(x * catalog.width - left) / frameWidth, (y * catalog.height - top) / frameHeight,
            w * catalog.width / frameWidth, h * catalog.height / frameHeight], width, height, verticalScale);
        }
      };
      observer = new ResizeObserver(resize); observer.observe(canvasWrap); resize();
      const localEpoch = epoch;
      const urls = new Set([catalog.room, catalog.empty, ...chapter.pieces.map(p => p.image)]);
      if (catalog.sharedStorage) {
        catalog.chapters.forEach(group => group.pieces.forEach(piece => urls.add(piece.image)));
      } else if (chapter.id === 'routines' || catalog.compose) {
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
