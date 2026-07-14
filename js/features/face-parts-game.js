(function () {
  function createFacePartsGameFeature(deps) {
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

    function stateFor(screen) {
      const key = screen.key || "studyFacePartsGame";
      if (!gameState[key]) {
        gameState[key] = {
          placed: {},
          locked: false,
          prompted: false
        };
      }
      return gameState[key];
    }

    function clear() {
      Object.keys(gameState).forEach((key) => delete gameState[key]);
    }

    function reset(screen) {
      delete gameState[screen.key || "studyFacePartsGame"];
      render();
    }

    function pointInRect(x, y, rect, pad = 18) {
      return x >= rect.left - pad && x <= rect.right + pad && y >= rect.top - pad && y <= rect.bottom + pad;
    }

    function makePartArt(part) {
      const art = document.createElement("span");
      art.className = `face-game-art face-game-art--${part.id}`;
      art.setAttribute("aria-hidden", "true");
      if (part.id === "eyes") {
        art.innerHTML = "<i></i><i></i>";
      } else if (part.id === "eyebrows") {
        art.innerHTML = "<i></i><i></i>";
      } else if (part.id === "ears") {
        art.innerHTML = "<i></i><i></i>";
      } else if (part.id === "nose") {
        art.innerHTML = "<i></i>";
      } else {
        art.innerHTML = "<i></i>";
      }
      return art;
    }

    function renderPlacedPart(part) {
      const placed = document.createElement("div");
      placed.className = `face-game-placed face-game-placed--${part.id}`;
      placed.appendChild(makePartArt(part));
      return placed;
    }

    function renderGame(screen) {
      const state = stateFor(screen);
      const parts = screen.faceParts?.parts || [];
      const total = parts.length;
      const count = Object.keys(state.placed).length;

      appMainEl.classList.remove("app--spotlight");
      spotlightViewEl.style.display = "none";
      spotlightBtnEl.onclick = null;
      heroEl.style.display = "none";
      helperEl.style.display = "";
      helperEl.textContent = "얼굴 부위를 끌어서 얼굴에 붙여보세요.";
      gridEl.style.display = "";
      gridEl.innerHTML = "";
      gridEl.className = "face-game";

      const board = document.createElement("div");
      board.className = "face-game-board";

      const face = document.createElement("div");
      face.className = "face-game-face";
      face.setAttribute("aria-label", "얼굴");
      face.innerHTML = `
        <div class="face-game-hair"></div>
        <div class="face-game-head"></div>
      `;

      const slotsLayer = document.createElement("div");
      slotsLayer.className = "face-game-slots";

      parts.forEach((part) => {
        const slot = document.createElement("div");
        slot.className = `face-game-slot face-game-slot--${part.id}`;
        slot.dataset.id = part.id;
        slot.setAttribute("aria-label", `${part.label} 자리`);
        if (state.placed[part.id]) {
          slot.classList.add("is-filled");
          slot.appendChild(renderPlacedPart(part));
        }
        slotsLayer.appendChild(slot);
      });

      face.appendChild(slotsLayer);
      board.appendChild(face);

      const tray = document.createElement("div");
      tray.className = "face-game-tray";

      parts.forEach((part) => {
        const placed = !!state.placed[part.id];
        const tile = document.createElement("button");
        tile.type = "button";
        tile.className = "face-game-tile";
        tile.dataset.id = part.id;
        tile.disabled = placed;
        tile.setAttribute("aria-label", part.label);
        tile.appendChild(makePartArt(part));
        const label = document.createElement("span");
        label.textContent = part.label;
        tile.appendChild(label);

        tile.addEventListener("click", () => speak(part.speech || part.label));
        tile.addEventListener("pointerdown", (event) => {
          if (state.locked || placed) return;
          const rect = tile.getBoundingClientRect();
          const ghost = tile.cloneNode(true);
          ghost.classList.add("face-game-tile--ghost");
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
          tile.setPointerCapture(event.pointerId);
          tile.classList.add("is-dragging");
          event.preventDefault();

          let moved = false;
          function move(ev) {
            const dx = ev.clientX - event.clientX;
            const dy = ev.clientY - event.clientY;
            if ((dx * dx) + (dy * dy) > 64) moved = true;
            ghost.style.left = `${rect.left + dx}px`;
            ghost.style.top = `${rect.top + dy}px`;
            parts.forEach((candidate) => {
              const slot = slotsLayer.querySelector(`[data-id="${candidate.id}"]`);
              slot?.classList.toggle("is-over", pointInRect(ev.clientX, ev.clientY, slot.getBoundingClientRect(), 28));
            });
          }

          function finish(ev) {
            tile.releasePointerCapture(event.pointerId);
            tile.removeEventListener("pointermove", move);
            tile.removeEventListener("pointerup", finish);
            tile.removeEventListener("pointercancel", cancel);
            tile.classList.remove("is-dragging");
            ghost.remove();
            slotsLayer.querySelectorAll(".is-over").forEach((el) => el.classList.remove("is-over"));
            if (!moved) return;

            const slot = slotsLayer.querySelector(`[data-id="${part.id}"]`);
            if (slot && pointInRect(ev.clientX, ev.clientY, slot.getBoundingClientRect(), 34)) {
              state.placed[part.id] = true;
              playPuzzleSound("success");
              speak(`${part.label} 붙였어요`);
              if (Object.keys(state.placed).length >= total) {
                state.locked = true;
                window.setTimeout(() => {
                  playPuzzleSound("success");
                  speak("얼굴 완성");
                  render();
                }, 520);
              } else {
                render();
              }
              return;
            }

            playPuzzleSound("fail");
            speak(`${part.label} 자리에 붙여주세요`);
            tile.classList.add("is-wrong");
            window.setTimeout(() => tile.classList.remove("is-wrong"), 520);
          }

          function cancel() {
            tile.removeEventListener("pointermove", move);
            tile.removeEventListener("pointerup", finish);
            tile.removeEventListener("pointercancel", cancel);
            tile.classList.remove("is-dragging");
            ghost.remove();
            slotsLayer.querySelectorAll(".is-over").forEach((el) => el.classList.remove("is-over"));
          }

          tile.addEventListener("pointermove", move);
          tile.addEventListener("pointerup", finish);
          tile.addEventListener("pointercancel", cancel);
        });

        tray.appendChild(tile);
      });

      const complete = document.createElement("div");
      complete.className = "face-game-complete";
      complete.textContent = count >= total ? "얼굴 완성!" : `${count}/${total}`;

      const again = document.createElement("button");
      again.type = "button";
      again.className = "btn main face-game-reset";
      again.textContent = "처음부터 다시";
      again.addEventListener("click", () => {
        speak("처음부터 다시");
        reset(screen);
      });

      board.appendChild(tray);
      gridEl.appendChild(board);
      gridEl.appendChild(complete);
      gridEl.appendChild(again);

      if (!state.prompted) {
        state.prompted = true;
        window.setTimeout(() => speak("얼굴을 완성해보세요"), 450);
      }
    }

    return { render: renderGame, clear };
  }

  window.createFacePartsGameFeature = createFacePartsGameFeature;
})();
