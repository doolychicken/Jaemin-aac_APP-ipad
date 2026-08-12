/* Recycling sorting mini game for app learning. */
(function () {
  function createRecyclingGameFeature(deps) {
    const {
      appMainEl,
      spotlightViewEl,
      spotlightBtnEl,
      heroEl,
      gridEl,
      helperEl,
      playPuzzleSound,
      speak,
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
      const key = screen.key || "studyRecyclingGame";
      if (!gameState[key]) {
        gameState[key] = {
          round: 0,
          score: 0,
          locked: false,
          sequence: shuffle(screen.recycling.items || [])
        };
      }
      return gameState[key];
    }

    function reset(screen) {
      const key = screen.key || "studyRecyclingGame";
      delete gameState[key];
      render();
    }

    function clear() {
      Object.keys(gameState).forEach((key) => delete gameState[key]);
    }

    function renderGame(screen) {
      const config = screen.recycling || {};
      const bins = config.bins || [];
      const state = stateFor(screen);
      const items = state.sequence.length ? state.sequence : shuffle(config.items || []);
      state.sequence = items;
      const isComplete = state.round >= items.length;
      const currentItem = items[state.round];

      appMainEl.classList.remove("app--spotlight");
      spotlightViewEl.style.display = "none";
      spotlightBtnEl.onclick = null;
      heroEl.style.display = "none";
      helperEl.style.display = "";
      helperEl.textContent = isComplete
        ? "분리수거를 모두 완료했어요."
        : `${currentItem.label}을 맞는 분리수거통에 넣어보세요.`;
      gridEl.style.display = "";
      gridEl.innerHTML = "";
      gridEl.className = `recycling-game${isComplete ? " recycling-game--complete" : ""}`;

      if (isComplete) {
        const done = document.createElement("div");
        done.className = "recycling-complete";
        done.innerHTML = `
          <div class="recycling-complete-mark">✓</div>
          <div class="recycling-complete-title">분리수거 완료</div>
          <div class="recycling-complete-score">${state.score}개를 맞췄어요</div>
        `;
        const again = document.createElement("button");
        again.type = "button";
        again.className = "btn main recycling-again";
        again.textContent = "처음부터 다시";
        again.addEventListener("click", () => {
          speak("처음부터 다시");
          reset(screen);
        });
        done.appendChild(again);
        gridEl.appendChild(done);
        return;
      }

      const header = document.createElement("div");
      header.className = "recycling-status";
      header.textContent = `미션 ${state.round + 1}/${items.length}`;

      const objectWrap = document.createElement("div");
      objectWrap.className = "recycling-object-wrap";
      const object = document.createElement("div");
      object.className = "recycling-object";
      object.draggable = true;
      object.setAttribute("role", "button");
      object.setAttribute("tabindex", "0");
      object.setAttribute("aria-label", currentItem.label);
      object.dataset.kind = currentItem.kind;
      const objectVisual = currentItem.image
        ? `<img class="recycling-object-image" src="${currentItem.image}" alt="${currentItem.label}">`
        : `<div class="recycling-object-icon">${currentItem.icon}</div>`;
      object.innerHTML = `
        ${objectVisual}
        <div class="recycling-object-label">${currentItem.label}</div>
      `;
      let suppressNextClick = false;
      object.addEventListener("click", () => {
        if (suppressNextClick) {
          suppressNextClick = false;
          return;
        }
        speak(currentItem.speech || currentItem.label);
      });
      object.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData("text/plain", currentItem.kind);
        event.dataTransfer.effectAllowed = "move";
        object.classList.add("is-dragging");
      });
      object.addEventListener("dragend", () => object.classList.remove("is-dragging"));

      // Android/Galaxy Tab browsers do not reliably emit HTML5 drag events.
      // Use Pointer Events for touch/pen input and keep the native drag path for a mouse.
      object.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "mouse" || state.locked) return;
        const startRect = object.getBoundingClientRect();
        const ghost = object.cloneNode(true);
        let moved = false;
        ghost.classList.add("recycling-object--ghost");
        Object.assign(ghost.style, {
          position: "fixed",
          left: `${startRect.left}px`,
          top: `${startRect.top}px`,
          width: `${startRect.width}px`,
          height: `${startRect.height}px`,
          margin: "0",
          zIndex: "9999",
          pointerEvents: "none"
        });
        document.body.appendChild(ghost);
        object.classList.add("is-dragging");
        object.setPointerCapture(event.pointerId);
        event.preventDefault();

        function clearBinHover() {
          document.querySelectorAll(".recycling-bin.is-over").forEach((bin) => bin.classList.remove("is-over"));
        }

        function move(moveEvent) {
          const dx = moveEvent.clientX - event.clientX;
          const dy = moveEvent.clientY - event.clientY;
          if ((dx * dx) + (dy * dy) > 36) moved = true;
          ghost.style.left = `${startRect.left + dx}px`;
          ghost.style.top = `${startRect.top + dy}px`;
          clearBinHover();
          const target = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY)?.closest(".recycling-bin");
          if (target) target.classList.add("is-over");
        }

        function finish(finishEvent) {
          if (object.hasPointerCapture(event.pointerId)) object.releasePointerCapture(event.pointerId);
          object.removeEventListener("pointermove", move);
          object.removeEventListener("pointerup", finish);
          object.removeEventListener("pointercancel", cancel);
          object.classList.remove("is-dragging");
          ghost.remove();
          clearBinHover();
          suppressNextClick = true;
          const target = document.elementFromPoint(finishEvent.clientX, finishEvent.clientY)?.closest(".recycling-bin");
          if (moved && target) {
            const bin = bins.find((candidate) => candidate.kind === target.dataset.kind);
            if (bin) checkBin(bin);
          } else if (!moved) {
            speak(currentItem.speech || currentItem.label);
          }
        }

        function cancel() {
          object.removeEventListener("pointermove", move);
          object.removeEventListener("pointerup", finish);
          object.removeEventListener("pointercancel", cancel);
          object.classList.remove("is-dragging");
          ghost.remove();
          clearBinHover();
        }

        object.addEventListener("pointermove", move);
        object.addEventListener("pointerup", finish);
        object.addEventListener("pointercancel", cancel);
      });
      objectWrap.appendChild(object);

      const binsWrap = document.createElement("div");
      binsWrap.className = "recycling-bins";

      function checkBin(bin) {
        if (state.locked) return;
        if (bin.kind !== currentItem.kind) {
          playPuzzleSound("fail");
          speak(`${bin.label} 아니야`);
          return;
        }
        state.locked = true;
        state.score += 1;
        playPuzzleSound("success");
        speak(`정답, ${bin.label}`);
        window.setTimeout(() => {
          state.round += 1;
          state.locked = false;
          render();
        }, 650);
      }

      bins.forEach((bin) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `recycling-bin recycling-bin--${bin.kind}`;
        btn.dataset.kind = bin.kind;
        const binVisual = bin.image
          ? `<img class="recycling-bin-image" src="${bin.image}" alt="${bin.label}">`
          : `<div class="recycling-bin-icon">${bin.icon}</div>`;
        btn.innerHTML = `
          <div class="recycling-bin-lid"></div>
          ${binVisual}
          <div class="recycling-bin-label">${bin.label}</div>
        `;
        btn.addEventListener("click", () => checkBin(bin));
        btn.addEventListener("dragover", (event) => {
          event.preventDefault();
          btn.classList.add("is-over");
        });
        btn.addEventListener("dragleave", () => btn.classList.remove("is-over"));
        btn.addEventListener("drop", (event) => {
          event.preventDefault();
          btn.classList.remove("is-over");
          checkBin(bin);
        });
        binsWrap.appendChild(btn);
      });

      gridEl.appendChild(header);
      gridEl.appendChild(objectWrap);
      gridEl.appendChild(binsWrap);
    }

    return { render: renderGame, clear };
  }

  window.createRecyclingGameFeature = createRecyclingGameFeature;
})();
