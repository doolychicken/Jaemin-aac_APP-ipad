(function () {
  function createMartCartGameFeature(deps) {
    const {
      appMainEl,
      spotlightViewEl,
      spotlightBtnEl,
      heroEl,
      gridEl,
      helperEl,
      playPuzzleSound,
      speak,
      setupImageElement,
      popScreen,
      render
    } = deps;

    const gameState = {};

    function shuffle(items) {
      const copy = items.slice();
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }

    function stateFor(screen) {
      const key = screen.key || "studyMartCartGame";
      if (!gameState[key]) {
        gameState[key] = {
          round: 0,
          score: 0,
          locked: false,
          picked: [],
          sequence: shuffle(screen.martCart?.missions || [])
        };
      }
      return gameState[key];
    }

    function reset(screen) {
      delete gameState[screen.key || "studyMartCartGame"];
      render();
    }

    function clear() {
      Object.keys(gameState).forEach((key) => delete gameState[key]);
    }

    function makeVisual(item, classPrefix) {
      const wrap = document.createElement("div");
      wrap.className = `${classPrefix}-visual`;
      if (item.image) {
        const img = document.createElement("img");
        img.src = item.image;
        img.alt = item.label;
        setupImageElement(img, true);
        wrap.appendChild(img);
      } else {
        wrap.textContent = item.icon || "□";
      }
      return wrap;
    }

    function pointInElement(x, y, element) {
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    }

    function renderGame(screen) {
      const config = screen.martCart || {};
      const pool = config.items || [];
      const state = stateFor(screen);
      const missions = state.sequence.length ? state.sequence : shuffle(config.missions || []);
      state.sequence = missions;
      const isComplete = state.round >= missions.length;
      const current = missions[state.round];

      appMainEl.classList.remove("app--spotlight");
      spotlightViewEl.style.display = "none";
      spotlightBtnEl.onclick = null;
      heroEl.style.display = "none";
      helperEl.style.display = "";
      helperEl.textContent = isComplete ? "마트카트에 물건을 모두 담았어요." : "말풍선에 맞는 물건을 카트에 담아보세요.";
      gridEl.style.display = "";
      gridEl.innerHTML = "";
      gridEl.className = `mart-cart-game${isComplete ? " mart-cart-game--complete" : ""}`;

      if (isComplete) {
        const done = document.createElement("div");
        done.className = "mart-cart-complete";
        done.innerHTML = `
          <div class="mart-cart-complete-mark">✓</div>
          <div class="mart-cart-complete-title">장보기 완료</div>
          <div class="mart-cart-complete-score">${state.score}개를 카트에 담았어요</div>
        `;
        const again = document.createElement("button");
        again.type = "button";
        again.className = "btn main mart-cart-again";
        again.textContent = "처음부터 다시";
        again.addEventListener("click", () => {
          speak("처음부터 다시");
          reset(screen);
        });
        done.appendChild(again);
        gridEl.appendChild(done);
        return;
      }

      const choices = shuffle([
        current,
        ...shuffle(pool.filter((item) => item.id !== current.id)).slice(0, 2)
      ]);

      const top = document.createElement("div");
      top.className = "mart-cart-top";
      top.innerHTML = `
        <button type="button" class="mart-cart-back-chip" aria-label="뒤로">‹</button>
        <span class="mart-cart-mode">자유 모드</span>
        <span class="mart-cart-title-chip">동물 마트</span>
        <span class="mart-cart-round">${state.round + 1}</span>
        <span class="mart-cart-stars">${"●".repeat(state.score)}${"○".repeat(Math.max(0, missions.length - state.score))}</span>
      `;
      top.querySelector(".mart-cart-back-chip").addEventListener("click", () => {
        speak("뒤로 가기");
        popScreen();
        render();
      });

      const awning = document.createElement("div");
      awning.className = "mart-cart-awning";

      const scene = document.createElement("div");
      scene.className = "mart-cart-scene";

      const speech = document.createElement("button");
      speech.type = "button";
      speech.className = "mart-cart-speech";
      speech.innerHTML = `<span class="mart-cart-speaker">🔊</span><span>${current.label}을 주세요.</span>`;
      speech.addEventListener("click", () => speak(`${current.label}을 주세요`));

      const shelf = document.createElement("div");
      shelf.className = "mart-cart-shelf";

      const cart = document.createElement("button");
      cart.type = "button";
      cart.className = "mart-cart-cart";
      cart.setAttribute("aria-label", "카트");
      cart.innerHTML = `
        <div class="mart-cart-cart-basket">
          <div class="mart-cart-cart-items"></div>
        </div>
        <div class="mart-cart-cart-handle"></div>
        <div class="mart-cart-cart-wheel mart-cart-cart-wheel--left"></div>
        <div class="mart-cart-cart-wheel mart-cart-cart-wheel--right"></div>
      `;

      const cartItems = cart.querySelector(".mart-cart-cart-items");
      state.picked.slice(-4).forEach((picked) => {
        const mini = document.createElement("div");
        mini.className = "mart-cart-mini";
        mini.appendChild(makeVisual(picked, "mart-cart-mini"));
        cartItems.appendChild(mini);
      });

      function success(item, sourceEl) {
        if (state.locked) return;
        state.locked = true;
        state.score += 1;
        state.picked.push(item);
        sourceEl?.classList.add("is-picked");
        cart.classList.add("is-success");
        playPuzzleSound("success");
        speak(`맞아요, ${item.label}`);
        window.setTimeout(() => {
          state.round += 1;
          state.locked = false;
          render();
        }, 780);
      }

      function fail(item, sourceEl) {
        if (state.locked) return;
        sourceEl?.classList.add("is-wrong");
        cart.classList.add("is-wrong");
        playPuzzleSound("fail");
        speak(`${item.label} 아니야`);
        window.setTimeout(() => {
          sourceEl?.classList.remove("is-wrong");
          cart.classList.remove("is-wrong");
        }, 520);
      }

      function tryItem(item, sourceEl) {
        if (item.id === current.id) success(item, sourceEl);
        else fail(item, sourceEl);
      }

      choices.forEach((item) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "mart-cart-item";
        btn.dataset.id = item.id;
        btn.setAttribute("aria-label", item.label);
        btn.appendChild(makeVisual(item, "mart-cart-item"));
        const label = document.createElement("span");
        label.className = "mart-cart-item-label";
        label.textContent = item.label;
        btn.appendChild(label);

        btn.addEventListener("click", () => tryItem(item, btn));
        btn.addEventListener("pointerdown", (event) => {
          if (state.locked || event.pointerType === "mouse") return;
          const rect = btn.getBoundingClientRect();
          const ghost = btn.cloneNode(true);
          ghost.classList.add("mart-cart-item--ghost");
          Object.assign(ghost.style, {
            position: "fixed",
            left: `${rect.left}px`,
            top: `${rect.top}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            zIndex: "9999",
            pointerEvents: "none",
            margin: "0"
          });
          document.body.appendChild(ghost);
          btn.setPointerCapture(event.pointerId);
          btn.classList.add("is-dragging");
          event.preventDefault();
          let moved = false;

          function move(ev) {
            const dx = ev.clientX - event.clientX;
            const dy = ev.clientY - event.clientY;
            if ((dx * dx) + (dy * dy) > 64) moved = true;
            ghost.style.left = `${rect.left + dx}px`;
            ghost.style.top = `${rect.top + dy}px`;
            cart.classList.toggle("is-over", pointInElement(ev.clientX, ev.clientY, cart));
          }

          function up(ev) {
            btn.releasePointerCapture(event.pointerId);
            btn.removeEventListener("pointermove", move);
            btn.removeEventListener("pointerup", up);
            btn.removeEventListener("pointercancel", cancel);
            btn.classList.remove("is-dragging");
            ghost.remove();
            cart.classList.remove("is-over");
            if (!moved) {
              speak(item.label);
              return;
            }
            if (pointInElement(ev.clientX, ev.clientY, cart)) tryItem(item, btn);
            else fail(item, btn);
          }

          function cancel() {
            btn.removeEventListener("pointermove", move);
            btn.removeEventListener("pointerup", up);
            btn.removeEventListener("pointercancel", cancel);
            btn.classList.remove("is-dragging");
            ghost.remove();
            cart.classList.remove("is-over");
          }

          btn.addEventListener("pointermove", move);
          btn.addEventListener("pointerup", up);
          btn.addEventListener("pointercancel", cancel);
        });
        shelf.appendChild(btn);
      });

      const mascot = document.createElement("div");
      mascot.className = "mart-cart-mascot";
      mascot.innerHTML = `
        <div class="mart-cart-mascot-eye mart-cart-mascot-eye--left"></div>
        <div class="mart-cart-mascot-eye mart-cart-mascot-eye--right"></div>
        <div class="mart-cart-mascot-face"></div>
        <div class="mart-cart-mascot-mouth"></div>
        <div class="mart-cart-mascot-body"></div>
        <div class="mart-cart-mascot-belly"></div>
      `;

      scene.appendChild(speech);
      scene.appendChild(shelf);
      scene.appendChild(mascot);
      scene.appendChild(cart);
      gridEl.appendChild(top);
      gridEl.appendChild(awning);
      gridEl.appendChild(scene);
    }

    return { render: renderGame, clear };
  }

  window.createMartCartGameFeature = createMartCartGameFeature;
})();
