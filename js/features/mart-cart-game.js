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
    const tasks = window.createTaskScope();
    const progressKey = "jaemin-mart-next-item-v1";
    const itemsPerTrip = 3;

    function shoppingItems(legacyItems) {
      const fridge = window.STICKER_BOOKS.find(book => book.id === "fridge");
      if (!fridge) return legacyItems;
      const sections = {
        drinks: "음료 코너", meals: "음식과 간식 코너",
        vegetables: "채소 코너", fruit: "과일 코너"
      };
      const starterSections = {
        milk: "유제품 코너", yogurt: "유제품 코너", cheese: "유제품 코너",
        eggs: "계란 코너", juice: "음료 코너"
      };
      const fridgeItems = new Map();
      for (const chapter of fridge.chapters) {
        for (const piece of chapter.pieces) {
          const photoKey = piece.image + ":" + piece.crop.join(",");
          fridgeItems.set(photoKey, {
            ...piece, id: "fridge-" + piece.id,
            section: sections[chapter.id] || starterSections[piece.id] || "냉장 식품 코너"
          });
        }
      }
      // Use the fridge photo when the same product was already on the shelf.
      const replaced = new Set([
        "yogurt", "milk", "strawberryMilk", "chocomilk", "cheese", "juice", "waterJelly", "soda",
        "apple", "strawberry", "banana", "grape", "watermelon", "carrot", "tomato", "egg"
      ]);
      return [...fridgeItems.values(), ...legacyItems.filter(item => !replaced.has(item.id))];
    }

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
        const items = shoppingItems(screen.martCart?.items || []);
        const next = window.appStorage.load(progressKey, "", value => typeof value === "string");
        const start = Math.max(0, items.findIndex(item => item.id === next));
        const sequence = items.slice(start, start + itemsPerTrip);
        gameState[key] = {
          round: 0,
          score: 0,
          locked: false,
          cartItem: null,
          promptedKey: null,
          checkoutPrompted: false,
          phase: "shop",
          items,
          sequence,
          nextItem: items[start + sequence.length]?.id || items[0]?.id
        };
      }
      return gameState[key];
    }

    function reset(screen) {
      tasks.clear();
      delete gameState[screen.key || "studyMartCartGame"];
      render();
    }

    function clear() {
      tasks.clear();
      document.querySelectorAll(".mart-cart-card--ghost, .mart-cart-item--ghost").forEach((el) => el.remove());
      Object.keys(gameState).forEach((key) => delete gameState[key]);
    }

    function makeVisual(item, classPrefix) {
      const wrap = document.createElement("div");
      wrap.className = `${classPrefix}-visual`;
      if (item.crop) {
        const ns = "http://www.w3.org/2000/svg";
        const [, , width, height] = item.crop;
        const frame = document.createElementNS(ns, "svg");
        frame.setAttribute("viewBox", `0 0 ${width} ${height}`);
        frame.setAttribute("aria-hidden", "true");
        frame.setAttribute("focusable", "false");
        const crop = document.createElementNS(ns, "svg");
        crop.setAttribute("viewBox", item.crop.join(" "));
        crop.setAttribute("width", width);
        crop.setAttribute("height", height);
        crop.setAttribute("overflow", "hidden");
        const image = document.createElementNS(ns, "image");
        image.setAttribute("href", item.image);
        image.setAttribute("width", item.sheet[0]);
        image.setAttribute("height", item.sheet[1]);
        crop.appendChild(image);
        frame.appendChild(crop);
        wrap.appendChild(frame);
      } else if (item.image) {
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

    function pointInRect(x, y, rect, pad) {
      return x >= rect.left - pad && x <= rect.right + pad && y >= rect.top - pad && y <= rect.bottom + pad;
    }

    function pointInCartArea(x, y, cart) {
      return pointInRect(x, y, cart.getBoundingClientRect(), 24);
    }

    function pointInCheckoutArea(x, y, terminal) {
      const rect = terminal?.getBoundingClientRect();
      return rect ? pointInRect(x, y, rect, 56) : false;
    }

    function makeTop(screen, state, total) {
      const top = document.createElement("div");
      top.className = "mart-cart-top";
      const progress = state.phase === "checkout" ? total + 1 : Math.min(state.round + 1, total);
      top.innerHTML = `
        <button type="button" class="mart-cart-back-chip" aria-label="뒤로">←</button>
        <span class="mart-cart-mode">미션</span>
        <span class="mart-cart-title-chip">장보기</span>
        <span class="mart-cart-round">${progress}/${total + 1}</span>
        <span class="mart-cart-stars">${"★".repeat(state.score)}${"☆".repeat(Math.max(0, total - state.score))}</span>
      `;
      top.querySelector(".mart-cart-back-chip").addEventListener("click", () => {
        speak("뒤로 가기");
        popScreen();
        render();
      });
      return top;
    }

    function renderComplete(screen, state) {
      helperEl.textContent = "마트에서 물건을 사고 계산까지 했어요.";
      gridEl.className = "mart-cart-game mart-cart-game--complete";
      const done = document.createElement("div");
      done.className = "mart-cart-complete";
      done.innerHTML = `
        <div class="mart-cart-complete-mark">✓</div>
        <div class="mart-cart-complete-title">장보기 완료</div>
        <div class="mart-cart-complete-score">${state.score}개를 사고 계산했어요</div>
      `;
      const again = document.createElement("button");
      again.type = "button";
      again.className = "btn main mart-cart-again";
      again.textContent = "계속 장보기";
      again.addEventListener("click", () => {
        speak("계속 장보기");
        reset(screen);
      });
      done.appendChild(again);
      gridEl.appendChild(done);
    }

    function renderCheckout(screen, state, total) {
      helperEl.textContent = "계산대에서 카드를 대고 계산해보세요.";
      gridEl.className = "mart-cart-game mart-cart-game--checkout";
      gridEl.appendChild(makeTop(screen, state, total));

      const scene = document.createElement("div");
      scene.className = "mart-cart-checkout-scene";

      const speech = document.createElement("button");
      speech.type = "button";
      speech.className = "mart-cart-speech mart-cart-speech--checkout";
      speech.innerHTML = `<span class="mart-cart-speaker">🔊</span><span>카드를 대주세요</span>`;
      speech.addEventListener("click", () => speak("카드를 대주세요"));

      const counter = document.createElement("div");
      counter.className = "mart-cart-counter";
      const terminal = document.createElement("button");
      terminal.type = "button";
      terminal.className = "mart-cart-terminal";
      terminal.setAttribute("aria-label", "카드 단말기");
      terminal.innerHTML = `
        <span class="mart-cart-terminal-screen">12,000</span>
        <span class="mart-cart-terminal-light"></span>
      `;

      const card = document.createElement("button");
      card.type = "button";
      card.className = "mart-cart-card";
      card.setAttribute("aria-label", "카드");
      card.innerHTML = `<span>카드</span>`;

      function pay() {
        if (state.locked) return;
        state.locked = true;
        playPuzzleSound("success");
        terminal.classList.add("is-paid");
        card.classList.add("is-paid");
        speak("계산했어요");
        tasks.setTimeout(() => {
          if (state.nextItem) window.appStorage.save(progressKey, state.nextItem);
          state.phase = "done";
          state.locked = false;
          render();
        }, 950);
      }

      card.addEventListener("click", pay);
      terminal.addEventListener("click", pay);
      card.addEventListener("pointerdown", (event) => {
        if (state.locked) return;
        const rect = card.getBoundingClientRect();
        const ghost = card.cloneNode(true);
        ghost.classList.add("mart-cart-card--ghost");
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
        card.setPointerCapture(event.pointerId);
        event.preventDefault();
        let moved = false;

        function move(ev) {
          const dx = ev.clientX - event.clientX;
          const dy = ev.clientY - event.clientY;
          if ((dx * dx) + (dy * dy) > 64) moved = true;
          ghost.style.left = `${rect.left + dx}px`;
          ghost.style.top = `${rect.top + dy}px`;
          terminal.classList.toggle("is-over", pointInCheckoutArea(ev.clientX, ev.clientY, terminal));
        }

        function up(ev) {
          card.releasePointerCapture(event.pointerId);
          card.removeEventListener("pointermove", move);
          card.removeEventListener("pointerup", up);
          card.removeEventListener("pointercancel", cancel);
          ghost.remove();
          terminal.classList.remove("is-over");
          if (moved && pointInCheckoutArea(ev.clientX, ev.clientY, terminal)) pay();
        }

        function cancel() {
          card.removeEventListener("pointermove", move);
          card.removeEventListener("pointerup", up);
          card.removeEventListener("pointercancel", cancel);
          ghost.remove();
          terminal.classList.remove("is-over");
        }

        card.addEventListener("pointermove", move);
        card.addEventListener("pointerup", up);
        card.addEventListener("pointercancel", cancel);
      });

      counter.appendChild(terminal);
      counter.appendChild(card);
      scene.appendChild(speech);
      scene.appendChild(counter);
      gridEl.appendChild(scene);

      if (!state.checkoutPrompted) {
        state.checkoutPrompted = true;
        tasks.setTimeout(() => {
          if (!state.locked && state.phase === "checkout") speak("카드를 대주세요");
        }, 450);
      }
    }

    function renderShopping(screen, state, missions, current, total) {
      const config = screen.martCart || {};
      const pool = state.items;
      const driverImage = config.driverImage || "./images/mart_cart_jaemin.png";
      helperEl.textContent = "소리를 듣고 맞는 물건을 카트에 담아보세요.";
      gridEl.className = "mart-cart-game";
      gridEl.appendChild(makeTop(screen, state, total));

      const awning = document.createElement("div");
      awning.className = "mart-cart-awning";

      const scene = document.createElement("div");
      scene.className = "mart-cart-scene";

      const aisle = document.createElement("div");
      aisle.className = "mart-cart-aisle";
      aisle.textContent = current.section || "마트";

      const speech = document.createElement("button");
      speech.type = "button";
      speech.className = "mart-cart-speech";
      const hasFinal = (current.label.charCodeAt(current.label.length - 1) - 0xac00) % 28 !== 0;
      const prompt = `${current.label}${hasFinal ? "을" : "를"} 주세요`;
      speech.innerHTML = `<span class="mart-cart-speaker">🔊</span><span>${prompt}</span>`;
      speech.addEventListener("click", () => speak(prompt));

      const shelf = document.createElement("div");
      shelf.className = "mart-cart-shelf";

      const driver = document.createElement("div");
      driver.className = "mart-cart-driver";
      const driverImg = document.createElement("img");
      driverImg.src = driverImage;
      driverImg.alt = "재민이가 카트를 밀어요";
      setupImageElement(driverImg, true);
      driver.appendChild(driverImg);

      const cart = document.createElement("button");
      cart.type = "button";
      cart.className = "mart-cart-cart";
      cart.setAttribute("aria-label", "카트");

      const cartItems = document.createElement("div");
      cartItems.className = "mart-cart-cart-items";
      if (state.cartItem) {
        const mini = document.createElement("div");
        mini.className = "mart-cart-mini";
        mini.appendChild(makeVisual(state.cartItem, "mart-cart-mini"));
        cartItems.appendChild(mini);
      }
      driver.appendChild(cartItems);

      function success(item, sourceEl) {
        if (state.locked) return;
        state.locked = true;
        state.score += 1;
        state.cartItem = item;
        cartItems.innerHTML = "";
        const mini = document.createElement("div");
        mini.className = "mart-cart-mini";
        mini.appendChild(makeVisual(item, "mart-cart-mini"));
        cartItems.appendChild(mini);
        sourceEl?.classList.add("is-picked");
        cart.classList.add("is-success");
        scene.classList.add("is-driving");
        playPuzzleSound("success");
        speak(`맞아요. ${item.label}`);
        tasks.setTimeout(() => {
          state.round += 1;
          state.locked = false;
          state.cartItem = null;
          state.promptedKey = null;
          if (state.round >= missions.length) state.phase = "checkout";
          render();
        }, 1450);
      }

      function fail(item, sourceEl) {
        if (state.locked) return;
        sourceEl?.classList.add("is-wrong");
        cart.classList.add("is-wrong");
        playPuzzleSound("fail");
        speak(`${item.label} 아니야. ${prompt}`);
        tasks.setTimeout(() => {
          sourceEl?.classList.remove("is-wrong");
          cart.classList.remove("is-wrong");
        }, 560);
      }

      function tryItem(item, sourceEl) {
        if (String(item.id) === String(current.id)) success(item, sourceEl);
        else fail(item, sourceEl);
      }

      function missCart(sourceEl) {
        if (state.locked) return;
        sourceEl?.classList.add("is-wrong");
        playPuzzleSound("fail");
        speak("카트에 넣어주세요");
        tasks.setTimeout(() => {
          sourceEl?.classList.remove("is-wrong");
        }, 560);
      }

      const sameSectionChoices = pool.filter((item) => (
        item.id !== current.id && item.section && current.section && item.section === current.section
      ));
      const otherChoices = pool.filter((item) => (
        item.id !== current.id && (!item.section || item.section !== current.section)
      ));
      const choices = shuffle([
        current,
        ...shuffle(sameSectionChoices).concat(shuffle(otherChoices)).slice(0, 2)
      ]);

      choices.forEach((item) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "mart-cart-item";
        btn.draggable = false;
        btn.dataset.id = item.id;
        btn.setAttribute("aria-label", item.label);
        btn.appendChild(makeVisual(item, "mart-cart-item"));
        const label = document.createElement("span");
        label.className = "mart-cart-item-label";
        label.textContent = item.label;
        btn.appendChild(label);

        let suppressClick = false;
        btn.addEventListener("click", () => {
          if (suppressClick) {
            suppressClick = false;
            return;
          }
          speak(item.label);
        });
        btn.addEventListener("pointerdown", (event) => {
          if (state.locked) return;
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
            cart.classList.toggle("is-over", pointInCartArea(ev.clientX, ev.clientY, cart));
          }

          function up(ev) {
            btn.releasePointerCapture(event.pointerId);
            btn.removeEventListener("pointermove", move);
            btn.removeEventListener("pointerup", up);
            btn.removeEventListener("pointercancel", cancel);
            btn.classList.remove("is-dragging");
            ghost.remove();
            cart.classList.remove("is-over");
            if (!moved) return;
            suppressClick = true;
            if (pointInCartArea(ev.clientX, ev.clientY, cart)) tryItem(item, btn);
            else missCart(btn);
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

      scene.appendChild(aisle);
      scene.appendChild(speech);
      scene.appendChild(shelf);
      scene.appendChild(driver);
      driver.appendChild(cart);
      gridEl.appendChild(awning);
      gridEl.appendChild(scene);

      const promptKey = `${state.phase}:${state.round}:${current.id}`;
      if (state.promptedKey !== promptKey) {
        state.promptedKey = promptKey;
        tasks.setTimeout(() => {
          if (!state.locked && state.phase === "shop") speak(prompt);
        }, 450);
      }
    }

    function renderGame(screen) {
      const state = stateFor(screen);
      const missions = state.sequence;
      const total = missions.length;
      const current = missions[state.round];

      appMainEl.classList.remove("app--spotlight");
      spotlightViewEl.style.display = "none";
      spotlightBtnEl.onclick = null;
      heroEl.style.display = "none";
      helperEl.style.display = "";
      gridEl.style.display = "";
      gridEl.innerHTML = "";

      if (!total || state.phase === "done") {
        renderComplete(screen, state);
        return;
      }
      if (state.phase === "checkout" || !current) {
        state.phase = "checkout";
        renderCheckout(screen, state, total);
        return;
      }
      renderShopping(screen, state, missions, current, total);
    }

    return { render: renderGame, clear };
  }

  window.createMartCartGameFeature = createMartCartGameFeature;
})();
