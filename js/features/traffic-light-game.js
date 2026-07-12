(function () {
  function createTrafficLightGameFeature(deps) {
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
    const ROUND_COUNT = 8;
    const signals = [
      { id: "green", label: "초록불", command: "건너요", action: "walk", prompt: "초록불이에요. 건너요" },
      { id: "red", label: "빨간불", command: "멈춰요", action: "stop", prompt: "빨간불이에요. 멈춰요" }
    ];

    function stateFor(screen) {
      const key = screen.key || "studyTrafficLightGame";
      if (!gameState[key]) {
        gameState[key] = {
          round: 0,
          score: 0,
          locked: false,
          promptedRound: null,
          current: nextSignal(null),
          result: ""
        };
      }
      return gameState[key];
    }

    function nextSignal(previous) {
      const pick = signals[Math.floor(Math.random() * signals.length)];
      if (previous && pick.id === previous.id && Math.random() < 0.45) {
        return signals.find((signal) => signal.id !== previous.id);
      }
      return pick;
    }

    function reset(screen) {
      delete gameState[screen.key || "studyTrafficLightGame"];
      render();
    }

    function clear() {
      Object.keys(gameState).forEach((key) => delete gameState[key]);
    }

    function makeImage(src, alt, className) {
      const img = document.createElement("img");
      img.src = src;
      img.alt = alt;
      img.className = className;
      setupImageElement(img, true);
      return img;
    }

    function finishRound(screen, state, correct, action) {
      if (state.locked) return;
      state.locked = true;
      state.result = correct ? "good" : "bad";
      if (correct) {
        state.score += 1;
        playPuzzleSound("success");
        speak(action === "walk" ? "맞아요. 건너요" : "맞아요. 멈춰요");
      } else {
        playPuzzleSound("fail");
        speak(state.current.id === "green" ? "초록불에는 건너요" : "빨간불에는 멈춰요");
      }
      window.setTimeout(() => {
        state.round += 1;
        state.locked = false;
        state.promptedRound = null;
        state.result = "";
        state.current = nextSignal(state.current);
        render();
      }, correct ? 1300 : 1200);
    }

    function renderComplete(screen, state) {
      helperEl.textContent = "신호등 게임을 완료했어요.";
      gridEl.className = "traffic-game traffic-game--complete";
      const done = document.createElement("div");
      done.className = "traffic-complete";
      done.innerHTML = `
        <div class="traffic-complete-mark">✓</div>
        <div class="traffic-complete-title">잘했어요</div>
        <div class="traffic-complete-score">${ROUND_COUNT}번 중 ${state.score}번 성공했어요</div>
      `;
      const again = document.createElement("button");
      again.type = "button";
      again.className = "btn main traffic-again";
      again.textContent = "처음부터 다시";
      again.addEventListener("click", () => {
        speak("처음부터 다시");
        reset(screen);
      });
      done.appendChild(again);
      gridEl.appendChild(done);
    }

    function renderGame(screen) {
      const state = stateFor(screen);
      const config = screen.trafficLight || {};
      const current = state.current;

      appMainEl.classList.remove("app--spotlight");
      spotlightViewEl.style.display = "none";
      spotlightBtnEl.onclick = null;
      heroEl.style.display = "none";
      helperEl.style.display = "";
      gridEl.style.display = "";
      gridEl.innerHTML = "";

      if (state.round >= ROUND_COUNT) {
        renderComplete(screen, state);
        return;
      }

      helperEl.textContent = "신호등 색을 보고 알맞은 행동을 선택하세요.";
      gridEl.className = `traffic-game is-${current.id}${state.result ? ` is-${state.result}` : ""}`;

      const scene = document.createElement("div");
      scene.className = "traffic-scene";
      if (config.crosswalkImage) {
        scene.appendChild(makeImage(config.crosswalkImage, "횡단보도", "traffic-crosswalk-photo"));
      }

      const top = document.createElement("div");
      top.className = "traffic-top";
      top.innerHTML = `
        <button type="button" class="traffic-back" aria-label="뒤로">←</button>
        <span class="traffic-chip">신호등</span>
        <span class="traffic-progress">${state.round + 1}/${ROUND_COUNT}</span>
        <span class="traffic-score">${"★".repeat(state.score)}${"☆".repeat(Math.max(0, ROUND_COUNT - state.score))}</span>
      `;
      top.querySelector(".traffic-back").addEventListener("click", () => {
        speak("뒤로 가기");
        popScreen();
        render();
      });

      const signal = document.createElement("div");
      signal.className = "traffic-light";
      signal.setAttribute("aria-label", current.label);
      if (config.trafficLightImage) {
        signal.appendChild(makeImage(config.trafficLightImage, "신호등", "traffic-light-photo"));
      }
      ["red", "yellow", "green"].forEach((color) => {
        const lamp = document.createElement("span");
        lamp.className = `traffic-lamp traffic-lamp--${color}`;
        signal.appendChild(lamp);
      });

      const speech = document.createElement("button");
      speech.type = "button";
      speech.className = "traffic-speech";
      speech.innerHTML = `<span>🔊</span><strong>${current.prompt}</strong>`;
      speech.addEventListener("click", () => speak(current.prompt));

      const road = document.createElement("div");
      road.className = "traffic-road";

      const car = document.createElement("div");
      car.className = "traffic-car";
      if (config.carImage) car.appendChild(makeImage(config.carImage, "자동차", "traffic-car-photo"));

      const jaemin = document.createElement("div");
      jaemin.className = "traffic-jaemin";
      if (config.walkerImage) jaemin.appendChild(makeImage(config.walkerImage, "재민이", "traffic-jaemin-photo"));

      const controls = document.createElement("div");
      controls.className = "traffic-controls";
      [
        { label: "멈춰요", action: "stop" },
        { label: "건너요", action: "walk" }
      ].forEach((choice) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `traffic-action traffic-action--${choice.action}`;
        btn.textContent = choice.label;
        btn.addEventListener("click", () => finishRound(screen, state, choice.action === current.action, choice.action));
        controls.appendChild(btn);
      });

      scene.appendChild(top);
      scene.appendChild(signal);
      scene.appendChild(speech);
      road.appendChild(car);
      road.appendChild(jaemin);
      scene.appendChild(road);
      scene.appendChild(controls);
      gridEl.appendChild(scene);

      if (state.promptedRound !== state.round) {
        state.promptedRound = state.round;
        window.setTimeout(() => {
          if (!state.locked) speak(current.prompt);
        }, 450);
      }
    }

    return { render: renderGame, clear };
  }

  window.createTrafficLightGameFeature = createTrafficLightGameFeature;
})();
