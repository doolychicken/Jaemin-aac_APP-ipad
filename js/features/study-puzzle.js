/**
 * study-puzzle.js — 숫자/한글/이름 퍼즐 렌더링과 드래그 동작
 */
(function () {
  function createStudyPuzzleFeature(deps) {
    const {
      currentKey,
      appMainEl,
      spotlightViewEl,
      spotlightBtnEl,
      heroEl,
      gridEl,
      helperEl,
      playPuzzleSound,
      speak,
      setupImageElement,
      render
    } = deps;
    const studyPuzzleProgress = {};

    function removeFloatingPuzzlePieces() {
      document
        .querySelectorAll(".study-puzzle-card--ghost, .study-puzzle-card--number-ghost, .study-puzzle-number-floater, .study-puzzle-card--magnet")
        .forEach((el) => el.remove());
    }

    function clearStudyPuzzleProgress() {
      removeFloatingPuzzlePieces();
      Object.keys(studyPuzzleProgress).forEach((key) => delete studyPuzzleProgress[key]);
    }
    
    function renderStudyPuzzle(screen) {
      const puzzle = screen.puzzle || {};
      const slots = puzzle.slots || [];
      const pieces = puzzle.pieces || slots;
      const key = currentKey();
      if (!studyPuzzleProgress[key]) studyPuzzleProgress[key] = { matches: {}, matchColors: {} };
      const state = studyPuzzleProgress[key];
      if (!state.matchColors) state.matchColors = {};
      if (typeof state.generation !== "number") state.generation = 0;
      let activePuzzleCard = null;
      removeFloatingPuzzlePieces();
    
      appMainEl.classList.remove("app--spotlight");
      spotlightViewEl.style.display = "none";
      spotlightBtnEl.onclick = null;
      heroEl.style.display = "none";
      heroEl.className = "hero";
      gridEl.style.display = "";
      gridEl.innerHTML = "";
      const useNumberPresentation = puzzle.presentation === "number" || slots.length > 6;
      gridEl.className = `study-puzzle${useNumberPresentation ? " study-puzzle--number" : " study-puzzle--name"}`;
      helperEl.textContent = screen.helper || "카드를 끌어서 같은 빈칸에 맞춰요.";
      helperEl.style.display = "";
    
      const matchedValues = new Set(Object.values(state.matches));
    
      function pieceByValue(value) {
        return pieces.find((piece) => String(piece.value) === String(value))
          || slots.find((slot) => String(slot.value) === String(value))
          || { label: String(value), value };
      }
    
      function isComplete() {
        return slots.every((_, index) => state.matches[index]);
      }
    
      function showMiss() {
        playPuzzleSound("miss");
        speak("여기가 아니에요");
      }

      gridEl.ondragover = (e) => {
        if (!activePuzzleCard) return;
        e.preventDefault();
        highlightDropSlot(activePuzzleCard.dataset.value, e.clientX, e.clientY);
      };

      gridEl.ondrop = (e) => {
        if (!activePuzzleCard) return;
        e.preventDefault();
        document.querySelectorAll(".study-puzzle-slot.is-ready").forEach((el) => el.classList.remove("is-ready"));
        const value = e.dataTransfer.getData("text/value") || activePuzzleCard.dataset.value;
        const slotEl = findDropSlot(value, e.clientX, e.clientY);
        setMatched(value, slotEl, activePuzzleCard);
        activePuzzleCard = null;
      };
    
      function isDragGhost(el) {
        return !!el && (
          el.classList.contains("study-puzzle-card--ghost")
          || el.classList.contains("study-puzzle-card--number-ghost")
        );
      }
    
      function removeDragGhost(el) {
        if (isDragGhost(el)) el.remove();
      }

      function isNumberPuzzle() {
        return gridEl.classList.contains("study-puzzle--number");
      }

      function getPuzzleTextRect(el) {
        const textEl = el?.querySelector?.("span");
        const rect = textEl?.getBoundingClientRect?.();
        if (rect?.width && rect?.height) return rect;
        return el?.getBoundingClientRect?.();
      }

      function getMovingRect(el) {
        if (!el) return null;
        return isNumberPuzzle() ? getPuzzleTextRect(el) : el.getBoundingClientRect();
      }

      function getPuzzlePieceColor(sourceEl) {
        if (!sourceEl) return "";
        const style = window.getComputedStyle(sourceEl);
        const customColor = style.getPropertyValue("--piece-color").trim();
        if (customColor) return customColor;
        const textEl = sourceEl.querySelector?.("span");
        return textEl ? window.getComputedStyle(textEl).color : style.color;
      }

      function buildNumberFloater(sourceEl, rect, extraClass = "") {
        const floater = document.createElement("div");
        floater.className = `study-puzzle-number-floater study-puzzle-card--number-ghost ${extraClass}`.trim();
        const text = document.createElement("span");
        text.textContent = sourceEl?.querySelector?.("span")?.textContent || sourceEl?.textContent?.trim() || "";
        floater.appendChild(text);

        const pieceColor = getPuzzlePieceColor(sourceEl);
        if (pieceColor) floater.style.setProperty("--piece-color", pieceColor);
        const sourceText = sourceEl?.querySelector?.("span");
        if (sourceText) {
          const sourceTextStyle = window.getComputedStyle(sourceText);
          text.style.fontFamily = sourceTextStyle.fontFamily;
          text.style.fontSize = sourceTextStyle.fontSize;
          text.style.fontWeight = sourceTextStyle.fontWeight;
          text.style.lineHeight = sourceTextStyle.lineHeight;
        }
        Object.assign(floater.style, {
          position: "fixed",
          left: `${rect.left}px`,
          top: `${rect.top}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          zIndex: "2147483647",
          pointerEvents: "none",
          margin: "0",
          opacity: "1",
          visibility: "visible",
          transform: "translate3d(0, 0, 0) scale(1)"
        });
        return floater;
      }

      function animatePuzzleReturn(movingEl, sourceEl) {
        return new Promise((resolve) => {
          if (!movingEl || !sourceEl || !isDragGhost(movingEl)) {
            removeDragGhost(movingEl);
            return resolve();
          }
          const numberPuzzle = isNumberPuzzle();
          const start = numberPuzzle ? getPuzzleTextRect(movingEl) : movingEl.getBoundingClientRect();
          const end = numberPuzzle ? getPuzzleTextRect(sourceEl) : sourceEl.getBoundingClientRect();
          if (!start.width || !start.height || !end.width || !end.height) {
            movingEl.remove();
            return resolve();
          }

          const dx = end.left - start.left;
          const dy = end.top - start.top;
          movingEl.classList.add("study-puzzle-card--returning");
          sourceEl.classList.add("is-return-target");

          if (movingEl.animate) {
            const lift = numberPuzzle ? 42 : 28;
            const duration = numberPuzzle ? 650 : 480;
            const animation = movingEl.animate([
              { transform: "translate3d(0, 0, 0) scale(1.04) rotate(0deg)", filter: "brightness(1)" },
              { transform: `translate3d(${dx * 0.35}px, ${dy * 0.35 - lift}px, 0) scale(1.1) rotate(5deg)`, filter: "brightness(1.08)", offset: 0.36 },
              { transform: `translate3d(${dx * 0.78}px, ${dy * 0.78}px, 0) scale(1.02) rotate(-3deg)`, filter: "brightness(1.02)", offset: 0.78 },
              { transform: `translate3d(${dx}px, ${dy}px, 0) scale(1) rotate(0deg)`, filter: "brightness(1)" }
            ], {
              duration,
              easing: "cubic-bezier(0.16, 0.74, 0.22, 1)",
              fill: "forwards"
            });
            animation.onfinish = () => {
              sourceEl.classList.remove("is-return-target");
              movingEl.remove();
              resolve();
            };
            animation.oncancel = () => {
              sourceEl.classList.remove("is-return-target");
              movingEl.remove();
              resolve();
            };
            return;
          }

          movingEl.style.transition = "transform 0.9s cubic-bezier(0.16, 0.74, 0.22, 1)";
          movingEl.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
          window.setTimeout(() => {
            sourceEl.classList.remove("is-return-target");
            movingEl.remove();
            resolve();
          }, 480);
        });
      }

      function returnMiss(movingEl, sourceEl) {
        animatePuzzleReturn(movingEl, sourceEl).finally(showMiss);
      }

      function slotAcceptsValue(slotEl, value) {
        if (!slotEl) return false;
        const index = Number(slotEl.dataset.index);
        const slot = slots[index];
        return !!slot && !state.matches[index] && String(slot.value) === String(value);
      }

      function rectsOverlap(a, b, padding = 0) {
        if (!a || !b) return false;
        const left = Math.max(a.left - padding, b.left);
        const right = Math.min(a.right + padding, b.right);
        const top = Math.max(a.top - padding, b.top);
        const bottom = Math.min(a.bottom + padding, b.bottom);
        const width = right - left;
        const height = bottom - top;
        if (width <= 0 || height <= 0) return false;
        const smallerArea = Math.max(1, Math.min(a.width * a.height, b.width * b.height));
        return width >= 8 && height >= 8 && ((width * height) / smallerArea) >= 0.06;
      }

      function findOverlappingSlot(value, movingEl) {
        const movingRect = getMovingRect(movingEl);
        if (!movingRect) return null;
        let best = null;
        let bestOverlap = 0;
        const padding = isNumberPuzzle() ? 8 : 10;
        document.querySelectorAll(".study-puzzle-slot").forEach((slotEl) => {
          if (!slotAcceptsValue(slotEl, value)) return;
          const rect = slotEl.getBoundingClientRect();
          if (!rectsOverlap(rect, movingRect, padding)) return;
          const overlapWidth = Math.min(rect.right + padding, movingRect.right) - Math.max(rect.left - padding, movingRect.left);
          const overlapHeight = Math.min(rect.bottom + padding, movingRect.bottom) - Math.max(rect.top - padding, movingRect.top);
          const overlapArea = overlapWidth * overlapHeight;
          if (overlapArea > bestOverlap) {
            best = slotEl;
            bestOverlap = overlapArea;
          }
        });
        return best;
      }

      function findDropSlot(value, x, y, movingEl = null) {
        if (movingEl) return findOverlappingSlot(value, movingEl);
        const direct = document.elementFromPoint(x, y)?.closest(".study-puzzle-slot");
        return slotAcceptsValue(direct, value) ? direct : null;
      }

      function highlightDropSlot(value, x, y, movingEl = null) {
        document.querySelectorAll(".study-puzzle-slot.is-ready").forEach((el) => el.classList.remove("is-ready"));
        const slotEl = findDropSlot(value, x, y, movingEl);
        if (slotEl) slotEl.classList.add("is-ready");
      }

      function buildMagnetPiece(sourceEl, startRect, isNumberPuzzle) {
        if (isNumberPuzzle) {
          return buildNumberFloater(sourceEl, startRect, "study-puzzle-card--number-magnet");
        }
        const movingEl = sourceEl.cloneNode(true);
        movingEl.classList.remove("is-snapping", "is-dragging", "is-used", "study-puzzle-card--ghost");
        movingEl.removeAttribute("disabled");
        movingEl.classList.add("study-puzzle-card--magnet");
        Object.assign(movingEl.style, {
          position: "fixed",
          left: `${startRect.left}px`,
          top: `${startRect.top}px`,
          width: `${startRect.width}px`,
          height: `${startRect.height}px`,
          zIndex: "2147483647",
          pointerEvents: "none",
          margin: "0",
          opacity: "1",
          visibility: "visible",
          transform: "translate3d(0, 0, 0) scale(1)"
        });
        return movingEl;
      }
    
      function animatePuzzleMagnet(sourceEl, movingSourceEl, slotEl) {
        return new Promise((resolve) => {
          if (!sourceEl || !slotEl) return resolve();
          const visualSourceEl = movingSourceEl || sourceEl;
          const numberPuzzle = isNumberPuzzle();
          const start = numberPuzzle ? getPuzzleTextRect(visualSourceEl) : visualSourceEl.getBoundingClientRect();
          const end = numberPuzzle ? getPuzzleTextRect(slotEl) : slotEl.getBoundingClientRect();
          if (!start.width || !start.height || !end.width || !end.height) return resolve();

          const movingEl = buildMagnetPiece(sourceEl, start, numberPuzzle);
          const pieceColor = getPuzzlePieceColor(sourceEl);
          if (pieceColor) movingEl.style.setProperty("--piece-color", pieceColor);
          document.body.appendChild(movingEl);
          if (isDragGhost(movingSourceEl)) movingSourceEl.remove();
    
          const targetLeft = end.left + ((end.width - start.width) / 2);
          const targetTop = end.top + ((end.height - start.height) / 2);
          const dx = targetLeft - start.left;
          const dy = targetTop - start.top;
          const scale = Math.min(1.06, Math.max(0.82, Math.min(end.width / start.width, end.height / start.height)));
          let finished = false;

          if (movingEl.animate) {
            slotEl.classList.add("is-magnet-target");
            const arcX = dx * 0.48;
            const lift = numberPuzzle ? 34 : 22;
            const arcY = dy * 0.48 - lift;
            const settleScale = numberPuzzle ? 1 : Math.max(0.96, Math.min(1.04, scale));
            const popScale = numberPuzzle ? 1.12 : 1.08;
            const duration = numberPuzzle ? 950 : 850;
            const animation = movingEl.animate([
              { transform: "translate3d(0, 0, 0) scale(1)", opacity: 1, filter: "none" },
              { transform: `translate3d(0, -${lift}px, 0) scale(${popScale})`, opacity: 1, filter: "none", offset: 0.24 },
              { transform: `translate3d(${arcX}px, ${arcY}px, 0) scale(${popScale})`, opacity: 1, filter: "none", offset: 0.58 },
              { transform: `translate3d(${dx * 0.86}px, ${dy * 0.86}px, 0) scale(1.06)`, opacity: 1, filter: "none", offset: 0.84 },
              { transform: `translate3d(${dx}px, ${dy}px, 0) scale(${settleScale})`, opacity: 1, filter: "none" }
            ], {
              duration,
              easing: "cubic-bezier(0.18, 0.68, 0.20, 1)",
              fill: "forwards"
            });

            animation.onfinish = () => {
              slotEl.classList.remove("is-magnet-target");
              slotEl.classList.add("is-docking");
              window.setTimeout(() => {
                slotEl.classList.remove("is-docking");
                movingEl.remove();
                resolve();
              }, numberPuzzle ? 180 : 140);
            };
            animation.oncancel = () => {
              slotEl.classList.remove("is-magnet-target", "is-docking");
              movingEl.remove();
              resolve();
            };
            return;
          }
    
          function finish() {
            if (finished) return;
            finished = true;
            movingEl.removeEventListener("transitionend", finish);
            slotEl.classList.add("is-docking");
            movingEl.classList.add("is-docked");
            movingEl.style.transition = "transform 0.14s ease-out, filter 0.14s ease-out";
            movingEl.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${scale * 0.9})`;
            movingEl.style.filter = "brightness(1.08)";
            window.setTimeout(() => {
              slotEl.classList.remove("is-docking");
              movingEl.remove();
              resolve();
            }, 150);
          }
    
          movingEl.addEventListener("transitionend", (event) => {
            if (event.propertyName === "transform") finish();
          });
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              movingEl.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${scale})`;
            });
          });
          window.setTimeout(finish, 320);
        });
      }
    
      function setMatched(value, slotEl, sourceEl, movingEl = sourceEl) {
        if (!slotEl) {
          return returnMiss(movingEl, sourceEl);
        }
        const index = Number(slotEl.dataset.index);
        const slot = slots[index];
        const piece = pieceByValue(value);
        if (!slot || String(slot.value) !== String(value)) {
          return returnMiss(movingEl, sourceEl);
        }
    
        const pieceColor = getPuzzlePieceColor(sourceEl);
        const matchGeneration = state.generation;
        const magnetAnimation = animatePuzzleMagnet(sourceEl, movingEl, slotEl);
        sourceEl?.classList.add("is-snapping");
        magnetAnimation.finally(() => {
          if (state.generation !== matchGeneration) return;
          state.matches[index] = String(value);
          playPuzzleSound("success");
          slotEl.classList.remove("is-empty");
          slotEl.classList.add("is-filled", "is-snap");
          if (pieceColor) slotEl.style.setProperty("--piece-color", pieceColor);
          if (pieceColor) state.matchColors[index] = pieceColor;
          const main = slotEl.querySelector(".study-puzzle-slot-main");
          if (main) main.textContent = slot.label;
          sourceEl?.classList.remove("is-snapping");
          sourceEl?.classList.add("is-used");
          sourceEl?.setAttribute("disabled", "true");
    
          const completed = isComplete();
          speak(piece.speech || piece.label);
          window.setTimeout(() => {
            render();
            if (completed) {
              window.setTimeout(() => speak(puzzle.completeSpeech || "?? ??! ?? ????!"), 140);
            }
          }, 70);
        });
      }
    
      function addHeader() {
        if (!puzzle.image) return;
        const header = document.createElement("section");
        header.className = "study-puzzle-header";
        const imgBtn = document.createElement("button");
        imgBtn.type = "button";
        imgBtn.className = "study-puzzle-photo";
        const img = document.createElement("img");
        img.src = puzzle.image;
        img.alt = puzzle.imageLabel || puzzle.title || screen.title;
        setupImageElement(img, true);
        imgBtn.appendChild(img);
        imgBtn.addEventListener("click", () => speak(puzzle.completeSpeech || puzzle.imageLabel || screen.title));
        header.appendChild(imgBtn);
        const name = document.createElement("div");
        name.className = "study-puzzle-header-name";
        name.textContent = puzzle.imageLabel || puzzle.title || screen.title;
        header.appendChild(name);
        gridEl.appendChild(header);
      }
    
      function makeSlot(slot, index) {
        const matchedValue = state.matches[index];
        const filled = !!matchedValue;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `study-puzzle-slot${filled ? " is-filled" : " is-empty"}`;
        if (filled && state.matchColors[index]) btn.style.setProperty("--piece-color", state.matchColors[index]);
        btn.dataset.index = String(index);
        btn.dataset.value = String(slot.value);
        btn.addEventListener("click", () => speak(filled ? (slot.speech || slot.label) : `${slot.label} 자리`));
        btn.addEventListener("dragover", (e) => {
          e.preventDefault();
          btn.classList.add("is-ready");
        });
        btn.addEventListener("dragleave", () => btn.classList.remove("is-ready"));
        btn.addEventListener("drop", (e) => {
          e.preventDefault();
          e.stopPropagation();
          btn.classList.remove("is-ready");
          const value = e.dataTransfer.getData("text/value");
          if (!value) return showMiss();
          setMatched(value, findDropSlot(value, e.clientX, e.clientY) || btn, activePuzzleCard);
          activePuzzleCard = null;
        });
    
        const main = document.createElement("span");
        main.className = "study-puzzle-slot-main";
        main.textContent = slot.label;
        btn.appendChild(main);
        return btn;
      }
    
      function makeCard(piece, isMatched = false) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `study-puzzle-card${isMatched ? " is-used" : ""}`;
        btn.dataset.value = String(piece.value);
        btn.draggable = false;
        if (isMatched) {
          btn.disabled = true;
          btn.setAttribute("aria-hidden", "true");
        }
        let suppressNextClick = false;
    
        function speakPiece() {
          speak(piece.speech || piece.label);
        }
    
        btn.addEventListener("dragstart", (e) => {
          if (isMatched) return;
          activePuzzleCard = btn;
          e.dataTransfer.setData("text/value", String(piece.value));
          e.dataTransfer.effectAllowed = "move";
        });
        btn.addEventListener("dragend", () => {
          activePuzzleCard = null;
        });
        btn.addEventListener("pointerdown", (e) => {
          if (isMatched) return;
          activePuzzleCard = btn;
          const numberPuzzle = isNumberPuzzle();
          const rect = numberPuzzle ? getPuzzleTextRect(btn) : btn.getBoundingClientRect();
          let didMove = false;
          const ghost = numberPuzzle ? buildNumberFloater(btn, rect) : btn.cloneNode(true);
          if (!numberPuzzle) {
            ghost.classList.add("study-puzzle-card--ghost");
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
          }
          document.body.appendChild(ghost);
          btn.setPointerCapture(e.pointerId);
          btn.classList.add("is-dragging");
          e.preventDefault();
    
          function move(ev) {
            const dx = ev.clientX - e.clientX;
            const dy = ev.clientY - e.clientY;
            if ((dx * dx) + (dy * dy) > 196) didMove = true;
            ghost.style.left = `${rect.left + dx}px`;
            ghost.style.top = `${rect.top + dy}px`;
            if (didMove) highlightDropSlot(piece.value, ev.clientX, ev.clientY, ghost);
          }
    
          function up(ev) {
            btn.releasePointerCapture(e.pointerId);
            btn.removeEventListener("pointermove", move);
            btn.removeEventListener("pointerup", up);
            btn.removeEventListener("pointercancel", cancel);
            btn.classList.remove("is-dragging");
            const target = findDropSlot(piece.value, ev.clientX, ev.clientY, ghost);
            document.querySelectorAll(".study-puzzle-slot.is-ready").forEach((el) => el.classList.remove("is-ready"));
            suppressNextClick = true;
            if (!didMove) {
              ghost.remove();
              speakPiece();
            } else if (target) {
              setMatched(piece.value, target, btn, ghost);
            } else {
              returnMiss(ghost, btn);
            }
            activePuzzleCard = null;
          }
    
          function cancel() {
            btn.removeEventListener("pointermove", move);
            btn.removeEventListener("pointerup", up);
            btn.removeEventListener("pointercancel", cancel);
            btn.classList.remove("is-dragging");
            animatePuzzleReturn(ghost, btn);
            document.querySelectorAll(".study-puzzle-slot.is-ready").forEach((el) => el.classList.remove("is-ready"));
            activePuzzleCard = null;
          }
    
          btn.addEventListener("pointermove", move);
          btn.addEventListener("pointerup", up);
          btn.addEventListener("pointercancel", cancel);
        });
        btn.addEventListener("click", () => {
          if (suppressNextClick) {
            suppressNextClick = false;
            return;
          }
          speakPiece();
        });
    
        const text = document.createElement("span");
        text.textContent = piece.label;
        btn.appendChild(text);
        return btn;
      }
    
      addHeader();
    
      const board = document.createElement("section");
      board.className = "study-puzzle-board";
      slots.forEach((slot, index) => board.appendChild(makeSlot(slot, index)));
      gridEl.appendChild(board);
    
      const tray = document.createElement("section");
      tray.className = "study-puzzle-tray";
      const trayTitle = document.createElement("div");
      trayTitle.className = "study-puzzle-tray-title";
      trayTitle.textContent = isComplete() ? "다 맞췄어요!" : "퍼즐 조각";
      tray.appendChild(trayTitle);
      const cardGrid = document.createElement("div");
      cardGrid.className = "study-puzzle-card-grid";
      pieces
        .forEach((piece) => cardGrid.appendChild(makeCard(piece, matchedValues.has(String(piece.value)))));
      tray.appendChild(cardGrid);
      gridEl.appendChild(tray);
    
      const actions = document.createElement("div");
      actions.className = "study-puzzle-actions";
      const resetBtn = document.createElement("button");
      resetBtn.type = "button";
      resetBtn.className = "btn";
      resetBtn.textContent = "처음부터 다시";
      resetBtn.addEventListener("click", () => {
        removeFloatingPuzzlePieces();
        state.generation += 1;
        studyPuzzleProgress[key] = { matches: {}, matchColors: {}, generation: state.generation };
        speak("처음부터 다시");
        render();
      });
      actions.appendChild(resetBtn);
      const speakBtn = document.createElement("button");
      speakBtn.type = "button";
      speakBtn.className = "btn main";
      speakBtn.textContent = "읽기";
      speakBtn.addEventListener("click", () => speak(puzzle.completeSpeech || puzzle.title || screen.title));
      actions.appendChild(speakBtn);
      gridEl.appendChild(actions);
    }
    

    return {
      clear: clearStudyPuzzleProgress,
      render: renderStudyPuzzle
    };
  }

  window.createStudyPuzzleFeature = createStudyPuzzleFeature;
})();
