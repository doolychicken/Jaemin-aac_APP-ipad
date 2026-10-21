/* Simple morning board, separate from the existing editable weekly schedule. */
(function () {
  window.createMorningRoutine = function ({ gridEl, speak, openTalk }) {
    const KEY = "jaemin-morning-board-v1";
    let selected = "", enteredToday = "", cleanup = () => {}, config;
    const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    function validDate(value) {
      return typeof value === "string" && /^20\d\d-\d\d-\d\d$/.test(value)
        && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
    }
    let days;
    function load() {
      days = window.appStorage.load(KEY, {}, value => value && typeof value === "object" && !Array.isArray(value)
        && Object.keys(value).length <= 31 && Object.entries(value).every(([date, day]) => validDate(date)
          && day && Array.isArray(day.plan) && day.plan.length <= 14 && day.plan.every(id => Object.hasOwn(config.cards, id))
          && typeof day.datePlaced === "boolean" && (day.weather === "" || config.weather.some(w => w.label === day.weather))
          && Number.isInteger(day.placed) && day.placed >= 0 && day.placed <= day.plan.length
          && Number.isInteger(day.done) && day.done >= 0 && day.done <= day.placed));
    }
    function save() {
      // Retain current selection plus the latest 29 days; no unlimited history.
      const keep = Object.keys(days).filter(k => k !== selected).sort().slice(-29);
      days = Object.fromEntries([...keep, selected].filter(k => days[k]).map(k => [k, days[k]]));
      window.appStorage.save(KEY, days);
    }
    function dayState() {
      if (!days[selected]) {
        const weekday = new Date(selected + "T12:00:00+09:00").getUTCDay();
        days[selected] = { plan: [...(config.plans[weekday] || [])], datePlaced: false, weather: "", placed: 0, done: 0 };
      }
      return days[selected];
    }
    const node = (tag, cls, text) => {
      const n = document.createElement(tag); if (cls) n.className = cls;
      if (text !== undefined) n.textContent = text; return n;
    };
    function button(text, fn, cls = "mr-button") {
      const b = node("button", cls, text); b.type = "button"; b.onclick = fn; return b;
    }
    function art(card) {
      if (!card.image) { const s = node("span", "mr-symbol", card.symbol); s.setAttribute("aria-hidden", "true"); return s; }
      const img = node("img"); img.src = card.image; img.alt = ""; img.draggable = false; return img;
    }
    function picture(card, action, cls = "mr-card") {
      const b = button("", action, cls); b.setAttribute("aria-label", card.label);
      b.append(art(card), node("strong", "", card.label)); return b;
    }
    function changePlan(update) {
      const d = dayState(); update(d.plan); d.placed = 0; d.done = 0; save(); draw();
    }
    function draw() {
      cleanup(); cleanup = () => {}; gridEl.replaceChildren(); gridEl.className = "morning-board";
      const d = dayState();
      const [year, month, date] = selected.split("-").map(Number);
      const weekday = new Intl.DateTimeFormat("ko-KR", { weekday: "long", timeZone: "Asia/Seoul" }).format(new Date(selected + "T12:00:00+09:00"));
      const dateText = `${year}년 ${month}월 ${date}일 ${weekday}`;
      const header = node("div", "mr-header");
      header.append(node("h2", "", selected === today() ? "오늘 하루" : "다른 날 미리 보기"), button("말하기", openTalk));
      gridEl.append(header);
      const calendar = node("div", "mr-calendar");
      calendar.append(button(d.datePlaced ? dateText : "오늘 날짜 붙이기 · " + dateText, () => {
        d.datePlaced = true; save(); speak(`오늘은 ${dateText}입니다`); draw();
      }, "mr-date"));
      if (d.weather) calendar.append(button("날씨 · " + d.weather + " (바꾸기)", () => { d.weather = ""; save(); draw(); }));
      gridEl.append(calendar);
      if (!d.datePlaced) {
        gridEl.append(node("p", "mr-instruction", "날짜 카드를 눌러 붙여요."));
      } else if (!d.weather) {
        gridEl.append(node("p", "mr-instruction", "창밖을 보고 날씨를 골라요."));
        const choices = node("div", "mr-weather");
        config.weather.forEach(w => choices.append(picture(w, () => { d.weather = w.label; save(); speak(w.label); draw(); })));
        gridEl.append(choices);
      } else if (!d.plan.length) {
        gridEl.append(node("p", "mr-instruction", "정해진 일정이 없어요. 보호자 설정에서 오늘 일정을 넣어주세요."));
      } else {
        const building = d.placed < d.plan.length;
        gridEl.append(node("p", "mr-instruction", building ? "카드를 다음 자리에 붙여요. 눌러서 붙여도 돼요." : "오늘 일정을 만들었어요. 다녀온 뒤 다 했어요를 눌러요."));
        const body = node("div", "mr-body");
        const board = node("div", "mr-sequence"); board.setAttribute("aria-label", "오늘 일정 순서");
        let drop;
        d.plan.forEach((id, i) => {
          const placed = i < d.placed, card = config.cards[id];
          const slot = node("div", "mr-slot" + (i < d.done ? " mr-done" : "") + (i === d.done && !building ? " mr-now" : ""));
          slot.append(node("span", "mr-number", `${i + 1}`));
          if (placed) slot.append(picture(card, () => speak(card.speech)));
          else if (i === d.placed) { drop = button("여기에 붙여요", attach, "mr-drop"); slot.append(drop); }
          else slot.append(node("span", "mr-empty", "다음"));
          if (i < d.done) slot.append(node("span", "mr-badge", "다 했어요"));
          board.append(slot);
        });
        body.append(board);
        const side = node("div", "mr-side");
        function attach() { if (d.placed >= d.plan.length) return; const card = config.cards[d.plan[d.placed++]]; save(); speak(card.speech); draw(); }
        if (building) {
          side.append(node("strong", "", "이번 카드"));
          const card = picture(config.cards[d.plan[d.placed]], attach, "mr-card mr-source");
          side.append(card, node("p", "", "끌어서 붙이거나 사진을 눌러요."));
          card.addEventListener("pointerdown", e => {
            if (!e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
            const startX = e.clientX, startY = e.clientY, pid = e.pointerId;
            let moved = false;
            const move = event => {
              if (event.pointerId !== pid) return;
              if (Math.hypot(event.clientX-startX,event.clientY-startY)>10) moved = true;
              if (moved) { event.preventDefault(); card.style.transform = `translate(${event.clientX-startX}px, ${event.clientY-startY}px)`; }
            };
            const stop = () => {
              document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", end); document.removeEventListener("pointercancel", cancel);
              card.style.transform = "";
            };
            const end = event => {
              if (event.pointerId !== pid) return;
              stop();
              if (!moved) return;
              const box = drop.getBoundingClientRect();
              // Suppress the synthetic click after a drag (including a missed drop).
              card.onclick = null;
              if (event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom) attach();
              else draw();
            };
            const cancel = event => { if (event.pointerId === pid) { stop(); draw(); } };
            document.addEventListener("pointermove", move, { passive: false }); document.addEventListener("pointerup", end); document.addEventListener("pointercancel", cancel);
            cleanup = stop;
          });
        } else if (d.done < d.plan.length) {
          side.append(node("strong", "", "지금"), picture(config.cards[d.plan[d.done]], () => speak(config.cards[d.plan[d.done]].speech)));
          side.append(button("다 했어요", () => { d.done++; save(); speak("다 했어요"); draw(); }, "mr-button mr-complete"));
          side.append(node("p", "", d.done + 1 < d.plan.length ? "다음 · " + config.cards[d.plan[d.done + 1]].label : "마지막 일정이에요"));
        } else side.append(node("p", "mr-instruction", "오늘 일정을 모두 마쳤어요."));
        if (d.done > 0) side.append(button("완료 한 칸 되돌리기", () => { d.done--; save(); draw(); }));
        body.append(side); gridEl.append(body);
      }
      const settings = node("details", "mr-settings"); settings.append(node("summary", "", "보호자 · 날짜 / 오늘 일정 수정"));
      settings.append(node("p", "", "수정은 선택한 날짜에만 적용됩니다. 일정 수정 시 붙이기와 완료 표시를 처음부터 시작합니다."));
      const dateLabel = node("label", "", "날짜 선택 ");
      const input = node("input"); input.type = "date"; input.value = selected; input.min = "2000-01-01"; input.max = "2099-12-31";
      input.onchange = () => { if (validDate(input.value)) { selected = input.value; draw(); } }; dateLabel.append(input); settings.append(dateLabel);
      settings.append(button("오늘로 돌아가기", () => { selected = today(); draw(); }));
      const editor = node("ol", "mr-editor");
      d.plan.forEach((id, i) => {
        const row = node("li"); row.append(node("span", "", config.cards[id].label));
        if (i) row.append(button("위로", () => changePlan(plan => { [plan[i-1],plan[i]]=[plan[i],plan[i-1]]; })));
        if (i < d.plan.length-1) row.append(button("아래로", () => changePlan(plan => { [plan[i+1],plan[i]]=[plan[i],plan[i+1]]; })));
        row.append(button("빼기", () => changePlan(plan => plan.splice(i,1)))); editor.append(row);
      }); settings.append(editor);
      const select = node("select"); select.setAttribute("aria-label", "추가할 일정");
      Object.entries(config.cards).forEach(([id,c]) => { const option = node("option", "", c.label); option.value=id; select.append(option); });
      const add = button("일정 추가", () => changePlan(plan => { if (plan.length<14) plan.push(select.value); })); add.disabled=d.plan.length>=14;
      settings.append(select, add, button("이 날짜의 기본 일정으로 초기화", () => {
        if (!window.confirm("붙인 카드와 완료 표시도 초기화할까요?")) return;
        delete days[selected]; dayState(); save(); draw();
      }));
      gridEl.append(settings);
    }
    return {
      render(screen) {
        config = screen;
        if (!days) load();
        if (!selected || enteredToday !== today()) { selected = today(); enteredToday = today(); }
        draw();
      },
      clear() { cleanup(); cleanup = () => {}; selected = ""; }
    };
  };
})();
