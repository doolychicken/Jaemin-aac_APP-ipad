/**
 * app.js — 앱 로직 (상태, 렌더링, 이벤트 핸들러)
 *
 * DATA 객체는 data.js 에서 정의됩니다.
 * HTML 구조는 index.html 에 있습니다.
 */

// ── DOM 참조 ──────────────────────────────────────────────────────────────────
const titleEl            = document.getElementById("screenTitle");
const backBtn            = document.getElementById("backButton");
const homeBtn            = document.getElementById("homeButton") || { style: {}, addEventListener: () => {} };
const crumbEl            = document.getElementById("breadcrumb");
const gridEl             = document.getElementById("buttonGrid");
const appMainEl          = document.querySelector("main.app");
const spotlightViewEl    = document.getElementById("spotlightView");
const spotlightBtnEl     = document.getElementById("spotlightButton");
const spotlightImgEl     = document.getElementById("spotlightImage");
const helperEl           = document.getElementById("helperText");
const heroEl             = document.getElementById("heroRow");
const playerWrapEl       = document.getElementById("playerWrap");
const playerEl           = document.getElementById("youtubePlayer");
const openInYoutubeButton= document.getElementById("openInYoutubeButton");
const returnHintEl       = document.getElementById("returnHint");

// ── 네비게이션 상태 ──────────────────────────────────────────────────────────
const navStack = [{ key: "main", label: "메인" }];
let selectedYoutube = "";

function currentKey()           { return navStack[navStack.length - 1]?.key || "main"; }
function pushScreen(key, label) { navStack.push({ key, label }); selectedYoutube = ""; }
function popScreen()            { if (navStack.length > 1) navStack.pop(); }
function breadcrumbText() {
  const parts = navStack.filter((x) => x.key !== "main").map((x) => x.label);
  return parts.join(" > ");
}
const mainPager = window.createTilePager({
  getScopeKey: () => navStack.map((x) => x.key).join("/"),
  render,
  speak
});

function resetPageState(prefix) { mainPager.reset(prefix); }
function paginateItems(items, layout = "main", suffix = "", reserveSlots = 0) {
  return mainPager.paginate(items, suffix, { layout, reserveSlots });
}
function appendPagerButtons(container, pageInfo) { mainPager.append(container, pageInfo); }

// ── 외출 플래너 상태 ─────────────────────────────────────────────────────────
const OUTING_MAX_PERSON = 4;
let outingPlannerMode = "";
const outingSelection = { people: [], place: null, transport: null };

// ── 날짜 선택 상태 ───────────────────────────────────────────────────────────
const WEEKDAY_OPTIONS = ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"];
const WEATHER_OPTIONS = ["맑음", "흐림", "비", "눈", "바람", "천둥번개"];
const WEATHER_EMOJI   = { "맑음": "☀️", "흐림": "🌥️", "비": "🌧️", "눈": "❄️", "바람": "💨", "천둥번개": "⚡" };
let datePlannerMode = "";
let guardianDateSetup = false;
const dateSelection = { year: null, month: null, day: null, weekday: null, weather: null };
let dateCardFocus = "year";
let dateActivityMode = "";
const datePuzzleBlankSelection = { year: null, month: null, day: null, weekday: null, weather: null };

// ── TTS ──────────────────────────────────────────────────────────────────────
let preferredKoVoice = null;
let ttsWarmedUp = false;
const isAppleMobile = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const useDirectYoutubeOpen = true;

const isAndroid = /android/i.test(navigator.userAgent);

const scheduleFeature = window.createScheduleFeature({
  DATA,
  gridEl,
  titleEl,
  helperEl,
  appMainEl,
  heroEl,
  spotlightViewEl,
  spotlightBtnEl,
  speak,
  render,
  pushScreen,
  popScreen,
  currentKey,
  navStack,
  setupImageElement
});

// ── 1. 한국어 목소리 선택 (fallback: default 목소리) ─────────────────────────
function pickPreferredKoVoice() {
  if (!("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices() || [];
  if (!voices.length) return null;
  const koVoices = voices.filter((v) => (v.lang || "").toLowerCase().startsWith("ko"));
  if (koVoices.length) {
    const priorities = [/female/i, /woman/i, /여성/, /google/i, /premium|neural|natural/i];
    for (const rule of priorities) {
      const found = koVoices.find((v) => rule.test(v.name || "") || rule.test(v.voiceURI || ""));
      if (found) return found;
    }
    return koVoices[0];
  }
  // 한국어 없으면 브라우저 기본(default) 목소리 우선, 없으면 첫 번째
  return voices.find((v) => v.default) || voices[0] || null;
}

// ── 2. speak: 안드로이드 정교한 예외 처리 ────────────────────────────────────
function speak(text) {
  if (!("speechSynthesis" in window)) return;
  if (!preferredKoVoice) preferredKoVoice = pickPreferredKoVoice();

  const doSpeak = () => {
    const u = new SpeechSynthesisUtterance(text);
    if (preferredKoVoice) {
      u.voice = preferredKoVoice;
      u.lang = preferredKoVoice.lang || "ko-KR";
    } else {
      u.lang = "ko-KR";
    }
    u.rate = 0.95;
    u.pitch = 1.0;
    window.speechSynthesis.resume();
    window.speechSynthesis.speak(u);
  };

  if (isAndroid) {
    // 안드로이드: 재생 중일 때만 cancel, 아닐 때는 바로 재생
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setTimeout(doSpeak, 80);
    } else {
      setTimeout(doSpeak, 50);
    }
  } else {
    window.speechSynthesis.cancel();
    doSpeak();
  }
}

function playPuzzleSound(kind = "success") {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    const notes = kind === "success"
      ? [{ f: 660, t: 0 }, { f: 880, t: 0.08 }, { f: 1175, t: 0.16 }]
      : [{ f: 220, t: 0 }, { f: 165, t: 0.12 }];

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.36);

    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      osc.type = kind === "success" ? "sine" : "triangle";
      osc.frequency.setValueAtTime(note.f, ctx.currentTime + note.t);
      osc.connect(gain);
      osc.start(ctx.currentTime + note.t);
      osc.stop(ctx.currentTime + note.t + 0.12);
    });

    setTimeout(() => ctx.close().catch(() => {}), 520);
  } catch (_e) {}
}

// ── 3. warmupTTS: 첫 터치 시 오디오 엔진 강제 활성화 ─────────────────────────
function playWeatherSound(label = "") {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(1, now + 0.02);
    master.connect(ctx.destination);

    function tone(freq, start, duration, type = "sine", volume = 0.12) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + start);
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(volume, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
      osc.connect(gain);
      gain.connect(master);
      osc.start(now + start);
      osc.stop(now + start + duration + 0.04);
    }

    function noise(start, duration, lowpass, volume = 0.08) {
      const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * duration)), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
      const source = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(lowpass, now + start);
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(volume, now + start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
      source.buffer = buffer;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      source.start(now + start);
      source.stop(now + start + duration);
    }

    const name = String(label);
    if (name.includes("맑")) {
      tone(784, 0, 0.16, "sine", 0.10);
      tone(988, 0.10, 0.16, "sine", 0.10);
      tone(1319, 0.20, 0.20, "sine", 0.09);
    } else if (name.includes("흐")) {
      tone(294, 0, 0.42, "triangle", 0.08);
      tone(247, 0.10, 0.38, "triangle", 0.06);
    } else if (name.includes("비")) {
      [0, 0.08, 0.16, 0.24, 0.32].forEach((t, i) => tone(1100 + i * 80, t, 0.06, "sine", 0.055));
    } else if (name.includes("눈")) {
      tone(988, 0, 0.22, "sine", 0.08);
      tone(1319, 0.16, 0.26, "sine", 0.07);
      tone(1568, 0.34, 0.22, "sine", 0.05);
    } else if (name.includes("바람")) {
      noise(0, 0.62, 900, 0.07);
      tone(330, 0.08, 0.45, "sine", 0.035);
    } else if (name.includes("천둥") || name.includes("번개")) {
      noise(0, 0.45, 180, 0.12);
      tone(82, 0.05, 0.46, "sawtooth", 0.06);
    } else {
      tone(660, 0, 0.16, "sine", 0.08);
      tone(880, 0.12, 0.16, "sine", 0.08);
    }

    setTimeout(() => ctx.close().catch(() => {}), 900);
  } catch (_e) {}
}

function warmupTTS() {
  if (!("speechSynthesis" in window) || ttsWarmedUp) return;
  ttsWarmedUp = true;
  if (!preferredKoVoice) preferredKoVoice = pickPreferredKoVoice();
  const warm = new SpeechSynthesisUtterance("\u200b"); // 제로폭 공백
  warm.lang = preferredKoVoice?.lang || "ko-KR";
  if (preferredKoVoice) warm.voice = preferredKoVoice;
  warm.volume = 0;
  warm.rate = 1.0;
  window.speechSynthesis.resume();
  window.speechSynthesis.speak(warm);
  setTimeout(() => window.speechSynthesis.cancel(), 200);
}

// ── YouTube 유틸 ─────────────────────────────────────────────────────────────
function getYouTubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.replace("/", "").trim();
    return u.searchParams.get("v");
  } catch (_e) { return ""; }
}

function parseStartSeconds(url) {
  try {
    const u = new URL(url);
    const t = u.searchParams.get("t");
    if (!t) return 0;
    if (/^\d+$/.test(t)) return Number(t);
    const m = t.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/);
    if (!m) return 0;
    return Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0);
  } catch (_e) { return 0; }
}

function setPlayer(youtubeUrl) {
  const id = getYouTubeId(youtubeUrl);
  if (!id) return;
  selectedYoutube = youtubeUrl;
  const start = parseStartSeconds(youtubeUrl);
  const startQuery = start > 0 ? `&start=${start}` : "";
  playerEl.src = `https://www.youtube-nocookie.com/embed/${id}?playsinline=1&autoplay=1&rel=0&modestbranding=1${startQuery}`;
}

function openYoutubeDirect(url) {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

function resolveYoutube(item) {
  if (!item.youtube) return "";
  return DATA.youtube[item.youtube] || "";
}

function getThumbnail(youtubeUrl) {
  const id = getYouTubeId(youtubeUrl);
  if (!id) return "";
  return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
}

// ── 이미지 프리페치 ──────────────────────────────────────────────────────────
function setupImageElement(img, eager = false) {
  img.loading = eager ? "eager" : "lazy";
  img.decoding = "async";
  img.referrerPolicy = "no-referrer";
  img.draggable = false;
}

const prefetchedImages = new Set();
function prefetchLocalImage(src) {
  if (!src || !src.startsWith("./images/")) return;
  if (prefetchedImages.has(src)) return;
  prefetchedImages.add(src);
  const im = new Image();
  setupImageElement(im, true);
  im.src = src;
}

function prefetchScreenImages(screenKey) {
  const screen = DATA.screens[screenKey];
  if (!screen) return;
  (screen.hero || []).forEach((it) => prefetchLocalImage(it.image));
  (screen.items || []).forEach((it) => prefetchLocalImage(it.image));
  if (screen.spotlight && screen.spotlight.image) prefetchLocalImage(screen.spotlight.image);
}

function prefetchLikelyNextScreens(screenKey) {
  if (screenKey === "outingPlace") {
    prefetchScreenImages("outingSchool");
  } else if (screenKey === "outingSchool") {
    prefetchScreenImages("outingSchoolFriends");
    prefetchScreenImages("outingSchool_p2");
  } else if (screenKey === "outingSchool_p2") {
    prefetchScreenImages("outingSchool_p3");
  }
}

// ── 외출 플래너 ──────────────────────────────────────────────────────────────
function outingOptions(kind) {
  if (kind === "person")    return DATA.screens.outingPerson.items    || [];
  if (kind === "place")     return DATA.screens.outingPlace.items     || [];
  if (kind === "transport") return DATA.screens.outingTransport.items || [];
  return [];
}

function isOutingSelected(kind, item) {
  if (kind === "person")    return outingSelection.people.some((p) => p.label === item.label);
  if (kind === "place")     return outingSelection.place     && outingSelection.place.label     === item.label;
  if (kind === "transport") return outingSelection.transport && outingSelection.transport.label === item.label;
  return false;
}

function toggleOutingSelection(kind, item) {
  if (kind === "person") {
    const idx = outingSelection.people.findIndex((p) => p.label === item.label);
    if (idx >= 0) { outingSelection.people.splice(idx, 1); return; }
    if (outingSelection.people.length >= OUTING_MAX_PERSON) return;
    outingSelection.people.push({ label: item.label, image: item.image || "./images/outing_person_me.png" });
    if (outingSelection.people.length >= OUTING_MAX_PERSON) outingPlannerMode = "";
    return;
  }
  if (kind === "place") {
    outingSelection.place = { label: item.label, image: item.image || "./images/outing_school1.png" };
    outingPlannerMode = "";
    return;
  }
  if (kind === "transport") {
    outingSelection.transport = { label: item.label, image: item.image || "./images/transport_bus.png" };
    outingPlannerMode = "";
  }
}

function getOutingHeroItems() {
  const peopleCards = outingSelection.people.length
    ? outingSelection.people.map((p, i) => ({ label: `사람${i + 1}: ${p.label}`, image: p.image }))
    : [{ label: "사람: 미선택", image: "./images/outing_person_me.png" }];
  return [
    ...peopleCards,
    { label: `장소: ${outingSelection.place?.label || "미선택"}`,        image: outingSelection.place?.image     || "./images/outing_school1.png" },
    { label: `교통수단: ${outingSelection.transport?.label || "미선택"}`, image: outingSelection.transport?.image || "./images/transport_bus.png" }
  ];
}

function renderOutingPlanner() {
  appMainEl.classList.remove("app--spotlight");
  spotlightViewEl.style.display = "none";
  spotlightBtnEl.onclick = null;
  heroEl.style.display = "none";
  heroEl.className = "hero";
  gridEl.style.display = "";
  gridEl.innerHTML = "";

  if (outingPlannerMode) {
    // ── 선택 화면: 항목들 표시 ──
    gridEl.className = "grid";
    const pageInfo = paginateItems(
      outingOptions(outingPlannerMode),
      "main",
      `outing-${outingPlannerMode}`,
      outingPlannerMode === "person" ? 1 : 0
    );
    pageInfo.items.forEach((item) => {
      const btn = document.createElement("button");
      btn.className = "tile" + (isOutingSelected(outingPlannerMode, item) ? " is-selected" : "");
      const img = document.createElement("img");
      img.src = item.image || "./images/study.png";
      img.alt = item.label;
      setupImageElement(img, true);
      const lbl = document.createElement("div");
      lbl.className = "tile-label";
      lbl.textContent = item.label;
      btn.appendChild(img);
      btn.appendChild(lbl);
      if (isOutingSelected(outingPlannerMode, item)) {
        const check = document.createElement("span");
        check.className = "tile-check";
        check.textContent = "✓";
        btn.appendChild(check);
      }
      btn.addEventListener("click", () => {
        speak(item.label);
        if (item.subScreen) {
          pushScreen(item.subScreen, item.label);
          render();
          return;
        }
        toggleOutingSelection(outingPlannerMode, item);
        render();
      });
      gridEl.appendChild(btn);
    });
    appendPagerButtons(gridEl, pageInfo);

    if (outingPlannerMode === "person" && pageInfo.page === pageInfo.totalPages - 1) {
      const doneBtn = document.createElement("button");
      doneBtn.className = "btn";
      doneBtn.textContent = "선택 완료";
      doneBtn.addEventListener("click", () => {
        speak("사람 선택 완료");
        outingPlannerMode = "";
        render();
      });
      gridEl.appendChild(doneBtn);
    }
    return;
  }

  // ── 메인 요약 화면: 3개 타일 ──
  gridEl.className = "grid outing-summary-tiles";
  const tiles = [
    {
      kind: "person",
      title: "사람",
      image: outingSelection.people.length
        ? outingSelection.people[0].image
        : "./images/outing_person_me.png",
      subtitle: outingSelection.people.length
        ? outingSelection.people.map((p) => p.label).join(", ")
        : "눌러서 선택",
    },
    {
      kind: "place",
      title: "장소",
      image: outingSelection.place?.image || "./images/outing_school1.png",
      subtitle: outingSelection.place?.label || "눌러서 선택",
    },
    {
      kind: "transport",
      title: "이동수단",
      image: outingSelection.transport?.image || "./images/transport_bus.png",
      subtitle: outingSelection.transport?.label || "눌러서 선택",
    },
  ];

  tiles.forEach(({ kind, title, image, subtitle }) => {
    const btn = document.createElement("button");
    btn.className = "tile outing-summary-tile";

    if (kind === "person") {
      // 선택된 사람이 있으면 최대 3명 사진을 격자로 표시
      const people = outingSelection.people;
      const photoWrap = document.createElement("div");
      photoWrap.className = "outing-person-photos" + (people.length === 0 ? " outing-person-empty" : "");
      if (people.length === 0) {
        const img = document.createElement("img");
        img.src = "./images/outing_person_me.png";
        img.alt = "사람";
        setupImageElement(img, true);
        photoWrap.appendChild(img);
      } else {
        people.forEach((p) => {
          const img = document.createElement("img");
          img.src = p.image;
          img.alt = p.label;
          setupImageElement(img, true);
          photoWrap.appendChild(img);
        });
      }
      btn.appendChild(photoWrap);
    } else {
      const img = document.createElement("img");
      img.src = image;
      img.alt = title;
      setupImageElement(img, true);
      btn.appendChild(img);
    }

    const lbl = document.createElement("div");
    lbl.className = "tile-label";
    lbl.textContent = `${title}: ${subtitle}`;
    btn.appendChild(lbl);
    btn.addEventListener("click", () => {
      speak(title);
      outingPlannerMode = kind;
      render();
    });
    gridEl.appendChild(btn);
  });
}

// ── 치료 선택 ────────────────────────────────────────────────────────────────
function renderDateHome() {
  // 오늘 날짜 초기화 (최초 1회)
  if (!dateSelection._initialized) {
    const now = new Date();
    dateSelection.month   = now.getMonth() + 1;
    dateSelection.day     = now.getDate();
    const wNames = ["일요일","월요일","화요일","수요일","목요일","금요일","토요일"];
    dateSelection.weekday = wNames[now.getDay()];
    dateSelection._initialized = true;
  }

  appMainEl.classList.remove("app--spotlight");
  spotlightViewEl.style.display = "none";
  spotlightBtnEl.onclick = null;
  heroEl.style.display = "none";
  heroEl.className = "hero";
  gridEl.style.display = "";
  gridEl.innerHTML = "";
  gridEl.className = "date-home-wrap";

  const weather     = dateSelection.weather;
  const weatherEmoji = weather ? (WEATHER_EMOJI[weather] || "🌤️") : null;

  function buildFullText() {
    return `오늘은 ${dateSelection.month}월 ${dateSelection.day}일 ${dateSelection.weekday}${dateSelection.weather ? " " + dateSelection.weather : ""}`;
  }

  // ── 드럼 피커 생성 함수 ──
  function createDrumPicker(initVal, min, max, unit, onCommit) {
    let curVal     = initVal;
    let dragStartY = 0;
    let dragStartV = initVal;
    let dragging   = false;

    const wrap   = document.createElement("div");
    wrap.className = "date-drum";

    const upBtn  = document.createElement("button");
    upBtn.type   = "button";
    upBtn.className = "date-drum-arrow";
    upBtn.setAttribute("aria-label", `${unit} 올리기`);
    upBtn.textContent = "▲";

    const numRow = document.createElement("div");
    numRow.className = "date-drum-numrow";

    const numEl  = document.createElement("div");
    numEl.className = "date-drum-number";

    numRow.appendChild(numEl);   // 숫자만 박스 안에

    const unitEl = document.createElement("div");
    unitEl.className = "date-drum-unit";
    unitEl.textContent = unit;   // 박스 바깥에 배치

    const downBtn = document.createElement("button");
    downBtn.type  = "button";
    downBtn.className = "date-drum-arrow";
    downBtn.setAttribute("aria-label", `${unit} 내리기`);
    downBtn.textContent = "▼";

    const range = max - min + 1;
    function clamp(v) { return ((v - min) % range + range) % range + min; }

    function display(v, offset = 0) {
      curVal = clamp(v);
      numEl.textContent = curVal;
      numRow.style.transform = offset ? `translateY(${offset * 0.38}px)` : "";
      numRow.style.opacity   = offset ? String(Math.max(0.45, 1 - Math.abs(offset) * 0.007)) : "";
    }

    display(initVal);

    upBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      display(curVal + 1);
      onCommit(curVal);
    });
    downBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      display(curVal - 1);
      onCommit(curVal);
    });

    numRow.addEventListener("pointerdown", (e) => {
      dragging   = true;
      dragStartY = e.clientY;
      dragStartV = curVal;
      numRow.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    numRow.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dy    = e.clientY - dragStartY;
      const steps = -Math.round(dy / 38);
      display(dragStartV + steps, dy);
    });
    numRow.addEventListener("pointerup", (e) => {
      if (!dragging) return;
      dragging = false;
      const dy    = e.clientY - dragStartY;
      const steps = -Math.round(dy / 38);
      display(dragStartV + steps);
      onCommit(curVal);
    });
    numRow.addEventListener("pointercancel", () => { dragging = false; display(curVal); });

    wrap.appendChild(upBtn);
    wrap.appendChild(numRow);
    wrap.appendChild(downBtn);

    // 바깥 컨테이너: [드럼] + [단위 레이블]
    const outer = document.createElement("div");
    outer.className = "date-drum-outer";
    outer.appendChild(wrap);
    outer.appendChild(unitEl);
    return outer;
  }

  // ── 날짜 카드 ──
  const dateCard = document.createElement("div");
  dateCard.className = "date-card";

  const badge = document.createElement("div");
  badge.className = "date-card-badge";
  badge.textContent = "오늘 📅";
  dateCard.appendChild(badge);

  // ── 드럼 피커 행 (먼저 선언 — 꼭지 이벤트에서 참조) ──
  const drumRow = document.createElement("div");
  drumRow.className = "date-drum-row";

  // ── 오늘 꼭지 3개 ──
  const chipNow = new Date();
  const chipM   = chipNow.getMonth() + 1;
  const chipD   = chipNow.getDate();
  const chipWS  = ["일","월","화","수","목","금","토"][chipNow.getDay()];
  const chipWF  = ["일요일","월요일","화요일","수요일","목요일","금요일","토요일"][chipNow.getDay()];

  function makeDragChip(displayText, sublabel, onApply) {
    const chip = document.createElement("div");
    chip.className = "date-today-chip";
    chip.innerHTML =
      `<span class="chip-vals">${displayText}</span>` +
      `<span class="chip-sub">${sublabel}</span>` +
      `<span class="chip-hint">↓</span>`;

    let cDrag = false, cSX = 0, cSY = 0, cRect0 = null, cGhost = null;

    chip.addEventListener("pointerdown", (e) => {
      cDrag = true; cSX = e.clientX; cSY = e.clientY;
      cRect0 = chip.getBoundingClientRect();
      chip.setPointerCapture(e.pointerId);
      cGhost = chip.cloneNode(true);
      cGhost.className = "date-today-chip date-today-chip--ghost";
      Object.assign(cGhost.style, {
        position: "fixed", left: cRect0.left + "px", top: cRect0.top + "px",
        width: cRect0.width + "px", zIndex: "9999", pointerEvents: "none", margin: "0"
      });
      document.body.appendChild(cGhost);
      chip.classList.add("date-today-chip--dragging");
      e.preventDefault();
    });

    chip.addEventListener("pointermove", (e) => {
      if (!cDrag || !cGhost) return;
      cGhost.style.left = (cRect0.left + e.clientX - cSX) + "px";
      cGhost.style.top  = (cRect0.top  + e.clientY - cSY) + "px";
      const ov = document.elementFromPoint(e.clientX, e.clientY);
      drumRow.classList.toggle("date-drum-row--highlight",
        !!(ov?.closest(".date-drum-row, .date-drum-outer, .date-drum")));
    });

    chip.addEventListener("pointerup", (e) => {
      if (!cDrag) return;
      cDrag = false;
      chip.classList.remove("date-today-chip--dragging");
      drumRow.classList.remove("date-drum-row--highlight");
      if (cGhost) { cGhost.remove(); cGhost = null; }
      const moved = Math.hypot(e.clientX - cSX, e.clientY - cSY) > 12;
      if (!moved) { onApply(); return; }
      const ov = document.elementFromPoint(e.clientX, e.clientY);
      if (ov?.closest(".date-drum-row, .date-drum-outer, .date-drum, .date-card") ||
          (e.clientY - cSY) > 40) onApply();
    });

    chip.addEventListener("pointercancel", () => {
      cDrag = false;
      chip.classList.remove("date-today-chip--dragging");
      drumRow.classList.remove("date-drum-row--highlight");
      if (cGhost) { cGhost.remove(); cGhost = null; }
    });

    return chip;
  }

  const chipRow = document.createElement("div");
  chipRow.className = "date-chip-row";
  chipRow.appendChild(makeDragChip(String(chipM), "월", () => { dateSelection.month   = chipM;  render(); }));
  chipRow.appendChild(makeDragChip(String(chipD), "일", () => { dateSelection.day     = chipD;  render(); }));
  chipRow.appendChild(makeDragChip(chipWS, "요일",    () => { dateSelection.weekday = chipWF; render(); }));

  dateCard.appendChild(chipRow);

  drumRow.appendChild(
    createDrumPicker(dateSelection.month, 1, 12, "월", (v) => { dateSelection.month = v; render(); })
  );

  drumRow.appendChild(
    createDrumPicker(dateSelection.day, 1, 31, "일", (v) => { dateSelection.day = v; render(); })
  );

  // 요일 드럼 피커
  const WDAY_FULL = ["월요일","화요일","수요일","목요일","금요일","토요일","일요일"];
  let wdayIdx = WDAY_FULL.indexOf(dateSelection.weekday);
  if (wdayIdx < 0) wdayIdx = 0;

  const weekdayDrum = (() => {
    let curIdx = wdayIdx;
    let dragStartY = 0, dragStartIdx = wdayIdx, isDragging = false;

    const wrap = document.createElement("div");
    wrap.className = "date-drum";

    const upBtn2 = document.createElement("button");
    upBtn2.type = "button"; upBtn2.className = "date-drum-arrow"; upBtn2.textContent = "▲";

    const wdRow = document.createElement("div");
    wdRow.className = "date-drum-numrow";

    const wdNameEl = document.createElement("div");
    wdNameEl.className = "date-drum-number date-drum-number--wd";

    wdRow.appendChild(wdNameEl);   // 요일명(수/목/금)만 박스 안에

    const wdSuffixEl = document.createElement("div");
    wdSuffixEl.className = "date-drum-unit date-drum-unit--wd";
    wdSuffixEl.textContent = "요일";  // 박스 바깥에 배치

    const downBtn2 = document.createElement("button");
    downBtn2.type = "button"; downBtn2.className = "date-drum-arrow"; downBtn2.textContent = "▼";

    function ci(i) { return ((i % 7) + 7) % 7; }
    function dispWd(idx, off = 0) {
      curIdx = ci(idx);
      wdNameEl.textContent = WDAY_FULL[curIdx].replace("요일", "");
      wdRow.style.transform = off ? `translateY(${off * 0.38}px)` : "";
      wdRow.style.opacity   = off ? String(Math.max(0.45, 1 - Math.abs(off) * 0.007)) : "";
    }
    dispWd(curIdx);

    upBtn2.addEventListener("click",   (e) => { e.stopPropagation(); dispWd(curIdx - 1); dateSelection.weekday = WDAY_FULL[curIdx]; render(); });
    downBtn2.addEventListener("click", (e) => { e.stopPropagation(); dispWd(curIdx + 1); dateSelection.weekday = WDAY_FULL[curIdx]; render(); });

    wdRow.addEventListener("pointerdown", (e) => { isDragging = true; dragStartY = e.clientY; dragStartIdx = curIdx; wdRow.setPointerCapture(e.pointerId); e.preventDefault(); });
    wdRow.addEventListener("pointermove", (e) => { if (!isDragging) return; const dy = e.clientY - dragStartY; dispWd(dragStartIdx - Math.round(dy / 38), dy); });
    wdRow.addEventListener("pointerup",   (e) => { if (!isDragging) return; isDragging = false; const dy = e.clientY - dragStartY; dispWd(dragStartIdx - Math.round(dy / 38)); dateSelection.weekday = WDAY_FULL[curIdx]; render(); });
    wdRow.addEventListener("pointercancel", () => { isDragging = false; dispWd(curIdx); });

    wrap.appendChild(upBtn2); wrap.appendChild(wdRow); wrap.appendChild(downBtn2);

    const wdOuter = document.createElement("div");
    wdOuter.className = "date-drum-outer";
    wdOuter.appendChild(wrap);
    wdOuter.appendChild(wdSuffixEl);
    return wdOuter;
  })();

  drumRow.appendChild(weekdayDrum);
  dateCard.appendChild(drumRow);

  // 선택된 날씨 배지
  if (weather) {
    const wb = document.createElement("div");
    wb.className = "date-card-weather";
    wb.textContent = `${weatherEmoji} ${weather}`;
    dateCard.appendChild(wb);
  }

  gridEl.appendChild(dateCard);

  // ── 날씨 선택 섹션 ──
  const weatherSection = document.createElement("div");
  weatherSection.className = "date-weather-section";

  const weatherLabel = document.createElement("div");
  weatherLabel.className = "date-weather-label";
  weatherLabel.textContent = "오늘 날씨";
  weatherSection.appendChild(weatherLabel);

  const weatherGrid = document.createElement("div");
  weatherGrid.className = "date-weather-grid";

  DATA.screens.dateWeatherPicker.items.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "date-weather-tile" + (dateSelection.weather === item.label ? " is-selected" : "");
    const img = document.createElement("img");
    img.src = item.image; img.alt = item.label;
    setupImageElement(img, true);
    const lbl = document.createElement("div");
    lbl.className = "date-weather-tile-label";
    lbl.textContent = item.label;
    btn.appendChild(img); btn.appendChild(lbl);
    btn.addEventListener("click", () => { speak(item.label); dateSelection.weather = item.label; render(); });
    weatherGrid.appendChild(btn);
  });

  weatherSection.appendChild(weatherGrid);
  gridEl.appendChild(weatherSection);

  // ── 전체 문장 읽기 버튼 ──
  const sentenceBtn = document.createElement("button");
  sentenceBtn.type = "button";
  sentenceBtn.className = "date-sentence-btn";
  const ft = buildFullText();
  sentenceBtn.innerHTML = `<span class="date-sentence-icon">🔊</span><span>${ft}</span>`;
  sentenceBtn.addEventListener("click", () => speak(buildFullText()));
  gridEl.appendChild(sentenceBtn);
}

// 사진 카드판 방식 날짜 화면. 위의 예전 날짜 함수보다 뒤에 선언되어 이 함수가 사용됩니다.
function renderDateHome() {
  const today = new Date();
  const weekdayNames = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
  const weekdayChoices = ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"];
  const weatherItems = DATA.screens.dateWeatherPicker.items || [];
  const yearChoices = [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1];

  if (!dateSelection._initialized) {
    dateSelection.year = today.getFullYear();
    dateSelection.month = today.getMonth() + 1;
    dateSelection.day = today.getDate();
    dateSelection.weekday = weekdayNames[today.getDay()];
    dateSelection._initialized = true;
  }

  appMainEl.classList.remove("app--spotlight");
  spotlightViewEl.style.display = "none";
  spotlightBtnEl.onclick = null;
  heroEl.style.display = "none";
  heroEl.className = "hero";
  gridEl.style.display = "";
  gridEl.innerHTML = "";
  gridEl.className = "date-board";
  helperEl.textContent = "빈칸을 누르고 아래 카드를 골라 붙여요.";

  function focusLabel(kind) {
    return { year: "년", month: "월", day: "일", weekday: "요일", weather: "날씨" }[kind] || "";
  }

  function buildFullText() {
    const weatherText = dateSelection.weather ? ` 날씨는 ${dateSelection.weather}입니다.` : "";
    return `오늘은 ${dateSelection.year}년 ${dateSelection.month}월 ${dateSelection.day}일 ${dateSelection.weekday}입니다.${weatherText}`;
  }

  function applyToday() {
    dateSelection.year = today.getFullYear();
    dateSelection.month = today.getMonth() + 1;
    dateSelection.day = today.getDate();
    dateSelection.weekday = weekdayNames[today.getDay()];
    if (!weekdayChoices.includes(dateSelection.weekday)) dateSelection.weekday = "월요일";
  }

  function setFocus(nextFocus) {
    dateCardFocus = nextFocus;
    speak(focusLabel(nextFocus));
    render();
  }

  function makeSlot(kind, value, unit, options = {}) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `date-slot${dateCardFocus === kind ? " is-active" : ""}${options.wide ? " date-slot--wide" : ""}${options.weather ? " date-slot--weather" : ""}`;
    btn.setAttribute("aria-label", `${focusLabel(kind)} 선택`);

    if (options.weather && value) {
      const weather = weatherItems.find((item) => item.label === value);
      if (weather?.image) {
        const img = document.createElement("img");
        img.src = weather.image;
        img.alt = value;
        setupImageElement(img, true);
        btn.appendChild(img);
      }
    }

    const main = document.createElement("span");
    main.className = "date-slot-main";
    main.textContent = value || "?";
    btn.appendChild(main);

    if (unit) {
      const suffix = document.createElement("span");
      suffix.className = "date-slot-unit";
      suffix.textContent = unit;
      btn.appendChild(suffix);
    }

    btn.addEventListener("click", () => setFocus(kind));
    return btn;
  }

  function makeOptionCard(label, onPick, options = {}) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `date-option-card${options.selected ? " is-selected" : ""}${options.weather ? " date-option-card--weather" : ""}`;

    if (options.image) {
      const img = document.createElement("img");
      img.src = options.image;
      img.alt = label;
      setupImageElement(img, true);
      btn.appendChild(img);
    }

    const text = document.createElement("span");
    text.textContent = label;
    btn.appendChild(text);
    btn.addEventListener("click", () => {
      onPick();
      if (options.weather) playWeatherSound(label);
      speak(label);
      render();
    });
    return btn;
  }

  function getOptionsForFocus() {
    if (dateCardFocus === "year") {
      return yearChoices.map((year) => makeOptionCard(String(year), () => {
        dateSelection.year = year;
        dateCardFocus = "month";
      }, { selected: dateSelection.year === year }));
    }

    if (dateCardFocus === "month") {
      return Array.from({ length: 12 }, (_, i) => i + 1).map((month) => makeOptionCard(String(month), () => {
        dateSelection.month = month;
        dateCardFocus = "day";
      }, { selected: dateSelection.month === month }));
    }

    if (dateCardFocus === "day") {
      return Array.from({ length: 31 }, (_, i) => i + 1).map((day) => makeOptionCard(String(day), () => {
        dateSelection.day = day;
        dateCardFocus = "weekday";
      }, { selected: dateSelection.day === day }));
    }

    if (dateCardFocus === "weekday") {
      return weekdayChoices.map((weekday) => makeOptionCard(weekday.replace("요일", ""), () => {
        dateSelection.weekday = weekday;
        dateCardFocus = "weather";
      }, { selected: dateSelection.weekday === weekday }));
    }

    return weatherItems.map((item) => makeOptionCard(item.label, () => {
      dateSelection.weather = item.label;
    }, { selected: dateSelection.weather === item.label, image: item.image, weather: true }));
  }

  const board = document.createElement("section");
  board.className = "date-card-board";
  board.appendChild(makeSlot("year", dateSelection.year, "년", { wide: true }));
  board.appendChild(makeSlot("month", dateSelection.month, "월"));
  board.appendChild(makeSlot("day", dateSelection.day, "일"));
  board.appendChild(makeSlot("weekday", dateSelection.weekday?.replace("요일", ""), "요일"));
  board.appendChild(makeSlot("weather", dateSelection.weather, "", { wide: true, weather: true }));
  gridEl.appendChild(board);

  const optionPanel = document.createElement("section");
  optionPanel.className = `date-option-panel date-option-panel--${dateCardFocus}`;

  const optionTitle = document.createElement("div");
  optionTitle.className = "date-option-title";
  optionTitle.textContent = `${focusLabel(dateCardFocus)} 카드 고르기`;
  optionPanel.appendChild(optionTitle);

  const optionGrid = document.createElement("div");
  optionGrid.className = "date-option-grid";
  getOptionsForFocus().forEach((btn) => optionGrid.appendChild(btn));
  optionPanel.appendChild(optionGrid);
  gridEl.appendChild(optionPanel);

  const actionRow = document.createElement("div");
  actionRow.className = "date-action-row";

  const todayBtn = document.createElement("button");
  todayBtn.type = "button";
  todayBtn.className = "date-action-btn";
  todayBtn.textContent = "오늘 카드 붙이기";
  todayBtn.addEventListener("click", () => {
    applyToday();
    dateCardFocus = "weather";
    speak("오늘 날짜를 붙였어요");
    render();
  });
  actionRow.appendChild(todayBtn);

  const speakBtn = document.createElement("button");
  speakBtn.type = "button";
  speakBtn.className = "date-action-btn date-action-btn--primary";
  speakBtn.textContent = "문장 읽기";
  speakBtn.addEventListener("click", () => speak(buildFullText()));
  actionRow.appendChild(speakBtn);
  gridEl.appendChild(actionRow);
}

// 이전 코드 호환용 alias
function renderDatePlanner() { renderDateHome(); }

function initDateSelectionToday() {
  const today = new Date();
  const weekdayNames = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
  if (!dateSelection._initialized) {
    dateSelection.year = today.getFullYear();
    dateSelection.month = today.getMonth() + 1;
    dateSelection.day = today.getDate();
    dateSelection.weekday = weekdayNames[today.getDay()];
    dateSelection._initialized = true;
  }
}

function dateSentenceText() {
  const weatherText = dateSelection.weather ? ` 날씨는 ${dateSelection.weather}입니다.` : "";
  return `오늘은 ${dateSelection.year}년 ${dateSelection.month}월 ${dateSelection.day}일 ${dateSelection.weekday}입니다.${weatherText}`;
}

function renderDateHome() {
  initDateSelectionToday();

  if (!dateActivityMode) {
    appMainEl.classList.remove("app--spotlight");
    spotlightViewEl.style.display = "none";
    spotlightBtnEl.onclick = null;
    heroEl.style.display = "none";
    heroEl.className = "hero";
    gridEl.style.display = "";
    gridEl.innerHTML = "";
    gridEl.className = "date-mode-select";
    helperEl.textContent = "날짜 활동 방법을 골라요.";

    const modes = [
      { mode: "cards", title: "버전 1", sub: "빈칸을 누르고 카드를 골라 붙여요." },
      { mode: "puzzle", title: "버전 2", sub: "오늘 날짜가 보이고, 카드를 끌어 맞춰요." },
      { mode: "blankPuzzle", title: "버전 3", sub: "년 월 일 요일 날씨 빈칸을 직접 채워요." },
    ];

    modes.forEach((item) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "date-mode-card";
      const title = document.createElement("div");
      title.className = "date-mode-title";
      title.textContent = item.title;
      const sub = document.createElement("div");
      sub.className = "date-mode-sub";
      sub.textContent = item.sub;
      btn.appendChild(title);
      btn.appendChild(sub);
      btn.addEventListener("click", () => {
        dateActivityMode = item.mode;
        speak(item.title);
        render();
      });
      gridEl.appendChild(btn);
    });
    return;
  }

  if (dateActivityMode === "puzzle" || dateActivityMode === "blankPuzzle") {
    renderDatePuzzle();
    return;
  }

  renderDateCardPicker();
}

function renderDateCardPicker() {
  initDateSelectionToday();
  appMainEl.classList.remove("app--spotlight");
  spotlightViewEl.style.display = "none";
  spotlightBtnEl.onclick = null;
  heroEl.style.display = "none";
  heroEl.className = "hero";
  gridEl.style.display = "";
  gridEl.innerHTML = "";
  gridEl.className = "date-board";
  helperEl.textContent = "빈칸을 누르고 아래 카드를 골라 붙여요.";

  const today = new Date();
  const weekdayChoices = ["월요일", "화요일", "수요일", "목요일", "금요일"];
  const weatherItems = DATA.screens.dateWeatherPicker.items || [];
  const yearChoices = [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1];

  function focusLabel(kind) {
    return { year: "년", month: "월", day: "일", weekday: "요일", weather: "날씨" }[kind] || "";
  }

  function makeSlot(kind, value, unit, options = {}) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `date-slot${dateCardFocus === kind ? " is-active" : ""}${options.wide ? " date-slot--wide" : ""}${options.weather ? " date-slot--weather" : ""}`;
    btn.addEventListener("click", () => {
      dateCardFocus = kind;
      speak(focusLabel(kind));
      render();
    });

    if (options.weather && value) {
      const weather = weatherItems.find((item) => item.label === value);
      if (weather?.image) {
        const img = document.createElement("img");
        img.src = weather.image;
        img.alt = value;
        setupImageElement(img, true);
        btn.appendChild(img);
      }
    }

    const main = document.createElement("span");
    main.className = "date-slot-main";
    main.textContent = value || "?";
    btn.appendChild(main);

    if (unit) {
      const suffix = document.createElement("span");
      suffix.className = "date-slot-unit";
      suffix.textContent = unit;
      btn.appendChild(suffix);
    }
    return btn;
  }

  function makeOptionCard(label, onPick, options = {}) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `date-option-card${options.selected ? " is-selected" : ""}${options.weather ? " date-option-card--weather" : ""}`;
    if (options.image) {
      const img = document.createElement("img");
      img.src = options.image;
      img.alt = label;
      setupImageElement(img, true);
      btn.appendChild(img);
    }
    const text = document.createElement("span");
    text.textContent = label;
    btn.appendChild(text);
    btn.addEventListener("click", () => {
      onPick();
      if (options.weather) playWeatherSound(label);
      speak(label);
      render();
    });
    return btn;
  }

  function optionsForFocus() {
    if (dateCardFocus === "year") {
      return yearChoices.map((year) => makeOptionCard(String(year), () => {
        dateSelection.year = year;
        dateCardFocus = "month";
      }, { selected: dateSelection.year === year }));
    }
    if (dateCardFocus === "month") {
      return Array.from({ length: 12 }, (_, i) => i + 1).map((month) => makeOptionCard(String(month), () => {
        dateSelection.month = month;
        dateCardFocus = "day";
      }, { selected: dateSelection.month === month }));
    }
    if (dateCardFocus === "day") {
      return Array.from({ length: 31 }, (_, i) => i + 1).map((day) => makeOptionCard(String(day), () => {
        dateSelection.day = day;
        dateCardFocus = "weekday";
      }, { selected: dateSelection.day === day }));
    }
    if (dateCardFocus === "weekday") {
      return weekdayChoices.map((weekday) => makeOptionCard(weekday.replace("요일", ""), () => {
        dateSelection.weekday = weekday;
        dateCardFocus = "weather";
      }, { selected: dateSelection.weekday === weekday }));
    }
    return weatherItems.map((item) => makeOptionCard(item.label, () => {
      dateSelection.weather = item.label;
    }, { selected: dateSelection.weather === item.label, image: item.image, weather: true }));
  }

  const board = document.createElement("section");
  board.className = "date-card-board";
  board.appendChild(makeSlot("year", dateSelection.year, "년", { wide: true }));
  board.appendChild(makeSlot("month", dateSelection.month, "월"));
  board.appendChild(makeSlot("day", dateSelection.day, "일"));
  board.appendChild(makeSlot("weekday", dateSelection.weekday?.replace("요일", ""), "요일"));
  board.appendChild(makeSlot("weather", dateSelection.weather, "", { wide: true, weather: true }));
  gridEl.appendChild(board);

  const optionPanel = document.createElement("section");
  optionPanel.className = `date-option-panel date-option-panel--${dateCardFocus}`;
  const optionTitle = document.createElement("div");
  optionTitle.className = "date-option-title";
  optionTitle.textContent = `${focusLabel(dateCardFocus)} 카드 고르기`;
  optionPanel.appendChild(optionTitle);
  const optionGrid = document.createElement("div");
  optionGrid.className = "date-option-grid";
  optionsForFocus().forEach((btn) => optionGrid.appendChild(btn));
  optionPanel.appendChild(optionGrid);
  gridEl.appendChild(optionPanel);

  const actionRow = document.createElement("div");
  actionRow.className = "date-action-row";
  const modeBtn = document.createElement("button");
  modeBtn.type = "button";
  modeBtn.className = "date-action-btn";
  modeBtn.textContent = "버전 선택";
  modeBtn.addEventListener("click", () => {
    dateActivityMode = "";
    render();
  });
  actionRow.appendChild(modeBtn);

  const speakBtn = document.createElement("button");
  speakBtn.type = "button";
  speakBtn.className = "date-action-btn date-action-btn--primary";
  speakBtn.textContent = "문장 읽기";
  speakBtn.addEventListener("click", () => speak(dateSentenceText()));
  actionRow.appendChild(speakBtn);
  gridEl.appendChild(actionRow);
}

function renderDatePuzzle() {
  initDateSelectionToday();
  appMainEl.classList.remove("app--spotlight");
  spotlightViewEl.style.display = "none";
  spotlightBtnEl.onclick = null;
  heroEl.style.display = "none";
  heroEl.className = "hero";
  gridEl.style.display = "";
  gridEl.innerHTML = "";
  gridEl.className = "date-puzzle";
  helperEl.textContent = "빈칸을 누르고 아래 카드를 끌어 맞춰요.";

  const weatherItems = DATA.screens.dateWeatherPicker.items || [];
  const weekdayChoices = ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"];
  const isBlankPuzzle = dateActivityMode === "blankPuzzle";
  const answer = {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
    weekday: ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"][new Date().getDay()],
    weather: dateSelection.weather
  };
  const puzzle = isBlankPuzzle ? datePuzzleBlankSelection : dateSelection;
  const nextDateFocus = { year: "month", month: "day", day: "weekday", weekday: "weather", weather: "weather" };

  function displayValue(kind) {
    const value = puzzle[kind];
    if (value) return value;
    return isBlankPuzzle ? "" : "?";
  }

  function unitOnlyLabel(kind, unit) {
    return isBlankPuzzle && !puzzle[kind] ? unit : "";
  };

  function showPuzzleSuccess(targetEl, label) {
    playPuzzleSound("success");
    if (targetEl) {
      targetEl.classList.add("is-matched");
      const burst = document.createElement("span");
      burst.className = "date-puzzle-burst";
      burst.textContent = "✓";
      targetEl.appendChild(burst);
    }
    speak(String(label));
    setTimeout(render, 420);
  }

  function showPuzzleMiss() {
    playPuzzleSound("miss");
    speak("여기가 아니에요");
  }

  function setDropValue(kind, value, targetEl) {
    const targetSelection = isBlankPuzzle ? datePuzzleBlankSelection : dateSelection;
    if (kind === "year") targetSelection.year = Number(value);
    if (kind === "month") targetSelection.month = Number(value);
    if (kind === "day") targetSelection.day = Number(value);
    if (kind === "weekday") targetSelection.weekday = value;
    if (kind === "weather") targetSelection.weather = value;
    if (isBlankPuzzle && kind !== "weather") dateSelection[kind] = targetSelection[kind];
    if (kind === "weather") dateSelection.weather = value;
    if (kind === "weather") playWeatherSound(value);
    dateCardFocus = nextDateFocus[kind] || "weather";
    showPuzzleSuccess(targetEl, value);
  }

  function allowDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.add("is-ready");
  }

  function leaveDrop(e) {
    e.currentTarget.classList.remove("is-ready");
  }

  function makeDropSlot(kind, unit, value, options = {}) {
    const slot = document.createElement("button");
    slot.type = "button";
    slot.className = `date-puzzle-slot${options.wide ? " date-puzzle-slot--wide" : ""}${options.weather ? " date-puzzle-slot--weather" : ""}`;
    slot.dataset.kind = kind;
    if (dateCardFocus === kind) slot.classList.add("is-active");
    slot.addEventListener("click", () => {
      dateCardFocus = kind;
      speak(unit);
      render();
    });
    slot.addEventListener("dragover", allowDrop);
    slot.addEventListener("dragleave", leaveDrop);
    slot.addEventListener("drop", (e) => {
      e.preventDefault();
      leaveDrop(e);
      const sourceKind = e.dataTransfer.getData("text/kind");
      const valueText = e.dataTransfer.getData("text/value");
      if (sourceKind !== kind || !valueText) {
        showPuzzleMiss();
        return;
      }
      setDropValue(kind, valueText, e.currentTarget);
    });

    if (options.weather && value) {
      const weather = weatherItems.find((item) => item.label === value);
      if (weather?.image) {
        const img = document.createElement("img");
        img.src = weather.image;
        img.alt = value;
        setupImageElement(img, true);
        slot.appendChild(img);
      }
    }

    const main = document.createElement("span");
    main.className = "date-puzzle-slot-main";
    main.textContent = value || unitOnlyLabel(kind, unit) || "?";
    slot.appendChild(main);

    const suffix = document.createElement("span");
    suffix.className = "date-puzzle-slot-unit";
    suffix.textContent = value ? unit : "";
    slot.appendChild(suffix);
    return slot;
  }

  function makeDragCard(kind, value, label, options = {}) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `date-drag-card${options.weather ? " date-drag-card--weather" : ""}`;
    card.draggable = true;
    card.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/kind", kind);
      e.dataTransfer.setData("text/value", String(value));
      e.dataTransfer.effectAllowed = "move";
    });
    card.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse") return;
      const rect = card.getBoundingClientRect();
      const ghost = card.cloneNode(true);
      ghost.classList.add("date-drag-card--ghost");
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
      card.setPointerCapture(e.pointerId);
      card.classList.add("is-dragging");
      e.preventDefault();

      function move(ev) {
        ghost.style.left = `${rect.left + ev.clientX - e.clientX}px`;
        ghost.style.top = `${rect.top + ev.clientY - e.clientY}px`;
        const target = document.elementFromPoint(ev.clientX, ev.clientY)?.closest(".date-puzzle-slot");
        document.querySelectorAll(".date-puzzle-slot.is-ready").forEach((el) => el.classList.remove("is-ready"));
        if (target?.dataset.kind === kind) target.classList.add("is-ready");
      }

      function up(ev) {
        card.releasePointerCapture(e.pointerId);
        card.removeEventListener("pointermove", move);
        card.removeEventListener("pointerup", up);
        card.removeEventListener("pointercancel", cancel);
        card.classList.remove("is-dragging");
        ghost.remove();
        const target = document.elementFromPoint(ev.clientX, ev.clientY)?.closest(".date-puzzle-slot");
        document.querySelectorAll(".date-puzzle-slot.is-ready").forEach((el) => el.classList.remove("is-ready"));
        if (target?.dataset.kind === kind) setDropValue(kind, value, target);
        else showPuzzleMiss();
      }

      function cancel() {
        card.removeEventListener("pointermove", move);
        card.removeEventListener("pointerup", up);
        card.removeEventListener("pointercancel", cancel);
        card.classList.remove("is-dragging");
        ghost.remove();
        document.querySelectorAll(".date-puzzle-slot.is-ready").forEach((el) => el.classList.remove("is-ready"));
      }

      card.addEventListener("pointermove", move);
      card.addEventListener("pointerup", up);
      card.addEventListener("pointercancel", cancel);
    });
    card.addEventListener("click", () => {
      if (options.weather) playWeatherSound(label);
      speak(label);
    });

    if (options.image) {
      const img = document.createElement("img");
      img.src = options.image;
      img.alt = label;
      setupImageElement(img, true);
      card.appendChild(img);
    }

    const text = document.createElement("span");
    text.textContent = label;
    card.appendChild(text);
    return card;
  }

  const board = document.createElement("section");
  board.className = "date-puzzle-board";
  board.appendChild(makeDropSlot("year", "년", displayValue("year"), { wide: true }));
  board.appendChild(makeDropSlot("month", "월", displayValue("month")));
  board.appendChild(makeDropSlot("day", "일", displayValue("day")));
  board.appendChild(makeDropSlot("weekday", "요일", puzzle.weekday ? puzzle.weekday.replace("요일", "") : unitOnlyLabel("weekday", "요일")));
  board.appendChild(makeDropSlot("weather", "날씨", displayValue("weather"), { wide: true, weather: true }));
  gridEl.appendChild(board);

  const tray = document.createElement("section");
  tray.className = "date-puzzle-tray";
  const trayTitle = document.createElement("div");
  trayTitle.className = "date-puzzle-tray-title";
  trayTitle.textContent = `${{
    year: "년",
    month: "월",
    day: "일",
    weekday: "요일",
    weather: "날씨"
  }[dateCardFocus] || "카드"} 카드`;
  tray.appendChild(trayTitle);

  const cardGrid = document.createElement("div");
  cardGrid.className = `date-puzzle-card-grid date-puzzle-card-grid--${dateCardFocus}`;

  function twoNumberChoices(value, min, max) {
    const other = value < max ? value + 1 : value - 1;
    return [value, Math.max(min, Math.min(max, other))];
  }

  if (dateCardFocus === "year") {
    twoNumberChoices(Number(answer.year), 2020, 2035).forEach((year) => {
      cardGrid.appendChild(makeDragCard("year", year, String(year)));
    });
  } else if (dateCardFocus === "month") {
    twoNumberChoices(Number(answer.month), 1, 12).forEach((month) => {
      cardGrid.appendChild(makeDragCard("month", month, String(month)));
    });
  } else if (dateCardFocus === "day") {
    twoNumberChoices(Number(answer.day), 1, 31).forEach((day) => {
      cardGrid.appendChild(makeDragCard("day", day, String(day)));
    });
  } else if (dateCardFocus === "weekday") {
    weekdayChoices.forEach((weekday) => {
      cardGrid.appendChild(makeDragCard("weekday", weekday, weekday.replace("요일", "")));
    });
  } else {
    weatherItems.forEach((item) => {
      cardGrid.appendChild(makeDragCard("weather", item.label, item.label, { image: item.image, weather: true }));
    });
  }
  tray.appendChild(cardGrid);
  gridEl.appendChild(tray);

  const actionRow = document.createElement("div");
  actionRow.className = "date-action-row";

  const modeBtn = document.createElement("button");
  modeBtn.type = "button";
  modeBtn.className = "date-action-btn";
  modeBtn.textContent = "버전 선택";
  modeBtn.addEventListener("click", () => {
    dateActivityMode = "";
    render();
  });
  actionRow.appendChild(modeBtn);

  const speakBtn = document.createElement("button");
  speakBtn.type = "button";
  speakBtn.className = "date-action-btn date-action-btn--primary";
  speakBtn.textContent = "문장 읽기";
  speakBtn.addEventListener("click", () => speak(dateSentenceText()));
  actionRow.appendChild(speakBtn);
  gridEl.appendChild(actionRow);
}

// ── 공통 렌더 함수 ───────────────────────────────────────────────────────────
function renderHero(items) {
  heroEl.innerHTML = "";
  if (!items || !items.length) { heroEl.style.display = "none"; return; }
  heroEl.style.display = "grid";
  items.forEach((item) => {
    const btn = document.createElement("button");
    if (item.image) {
      btn.className = "tile";
      const img = document.createElement("img");
      img.src = item.image; img.alt = item.label;
      const label = document.createElement("div");
      label.className = "tile-label"; label.textContent = item.label;
      btn.appendChild(img); btn.appendChild(label);
    } else {
      btn.className = "btn hero";
      btn.textContent = item.label;
    }
    btn.addEventListener("click", () => {
      speak(item.label);
      if (item.nav) { pushScreen(item.nav, item.label); render(); }
    });
    heroEl.appendChild(btn);
  });
}

function renderButtons(items, layout) {
  gridEl.innerHTML = "";
  const isMain  = layout === "main";
  const isMedia = layout === "media";
  gridEl.className = isMain ? "grid" : (isMedia ? "grid media" : "grid detail");
  const pageInfo = paginateItems(items || [], layout);

  pageInfo.items.forEach((item, index) => {
    const btn  = document.createElement("button");
    const yUrl = resolveYoutube(item);

    if ((isMain && item.image) || (isMedia && (item.image || yUrl))) {
      const isNavBtn = isMain && (item.label === "다음" || item.label === "이전");
      btn.className = isNavBtn ? "tile tile-nav" : "tile";
      if (!isNavBtn) {
        const img = document.createElement("img");
        img.src = item.image || getThumbnail(yUrl); img.alt = item.label;
        setupImageElement(img, index < 2 || !!(item.image && item.image.startsWith("./images/")));
        btn.appendChild(img);
      }
      const label = document.createElement("div");
      label.className = "tile-label"; label.textContent = item.label;
      btn.appendChild(label);
    } else if (isMain) {
      btn.className = "tile";
      const art = document.createElement("div");
      art.className = "tile-art";
      art.textContent = item.icon || (
        item.label.includes("버스") ? "🚌" :
        (item.label.includes("음악") || item.label.includes("노래")) ? "🎵" :
        item.label.includes("유튜브") ? "▶️" : "📌"
      );
      const label = document.createElement("div");
      label.className = "tile-label"; label.textContent = item.label;
      btn.appendChild(art); btn.appendChild(label);
    } else {
      btn.className = isMain ? "btn main" : "btn";
      if (!isMain && yUrl && yUrl === selectedYoutube) btn.classList.add("selected");
      btn.textContent = item.label;
    }

    btn.addEventListener("click", () => {
      // 날짜 picker 처리
      if (currentKey() === "dateMonthPicker") {
        dateSelection.month = Number(item.label.replace("월", ""));
        speak(item.label); popScreen();
        if (guardianDateSetup) pushScreen("dateDayPicker", "일 선택");
        render(); return;
      }
      if (currentKey() === "dateDayPicker") {
        dateSelection.day = Number(item.label.replace("일", ""));
        speak(item.label); popScreen();
        if (guardianDateSetup) pushScreen("dateWeekdayPicker", "요일 선택");
        render(); return;
      }
      if (currentKey() === "dateWeekdayPicker") {
        dateSelection.weekday = item.label;
        speak(item.label);
        guardianDateSetup = false;
        while (currentKey() !== "dateHome" && navStack.length > 1) popScreen();
        render(); return;
      }
      if (currentKey() === "dateWeatherPicker") {
        dateSelection.weather = item.label;
        playWeatherSound(item.label);
        speak(item.label); popScreen(); render(); return;
      }

      if (currentKey() === "weatherHome") {
        playWeatherSound(item.label);
      }
      speak(item.label);
      window.setTimeout(() => {
        if (item.nav) { pushScreen(item.nav, item.label); render(); return; }
        if (yUrl) {
          if (item.playInApp && !useDirectYoutubeOpen) {
            pushScreen("youtubePlayer", item.label); setPlayer(yUrl); render();
          } else {
            const screen = DATA.screens[currentKey()] || {};
            if (screen.showPlayer) { setPlayer(yUrl); render(); }
            else openYoutubeDirect(yUrl);
          }
        }
      }, 70);
    });

    if (item.nav) {
      btn.addEventListener("pointerdown", () => prefetchScreenImages(item.nav), { passive: true });
    }
    gridEl.appendChild(btn);
  });
  appendPagerButtons(gridEl, pageInfo);
}

// ── 메인 렌더 ────────────────────────────────────────────────────────────────
function render() {
  const key    = currentKey();
  const screen = DATA.screens[key] || DATA.screens.main;
  const isMain = key === "main";
  backBtn.style.display = isMain ? "none" : "inline-flex";
  homeBtn.style.display = isMain ? "none" : "inline-flex";
  titleEl.textContent = screen.title || "AAC";
  helperEl.textContent = screen.helper || "";
  const crumb = breadcrumbText();
  crumbEl.textContent = crumb;
  crumbEl.style.display = crumb ? "block" : "none";
  renderHero(screen.hero);

  if (screen.showPlayer) {
    playerWrapEl.style.display = "block";
    openInYoutubeButton.style.display = "inline-flex";
    const screenYoutubeUrls = (screen.items || []).map((x) => resolveYoutube(x)).filter(Boolean);
    if (screenYoutubeUrls.length && selectedYoutube && !screenYoutubeUrls.includes(selectedYoutube))
      selectedYoutube = "";
    const firstUrl = screenYoutubeUrls[0] || "";
    if (!selectedYoutube && firstUrl) setPlayer(firstUrl);
  } else {
    playerWrapEl.style.display = "none";
    openInYoutubeButton.style.display = "none";
    playerEl.src = "";
  }

  const isSpotlight = screen.layout === "spotlight" && screen.spotlight?.image;
  const isEmpty     = screen.layout === "empty";


  if (key === "outingHome") {
    if (outingPlannerMode) {
      const modeTitle = { person: "사람 선택", place: "장소 선택", transport: "이동수단 선택" };
      titleEl.textContent = modeTitle[outingPlannerMode] || "선택";
    }
    renderOutingPlanner();
  } else if (key === "outingCarTypes") {
    // 자동차 서브 선택 → 고르면 transport로 저장 후 outingHome으로 복귀
    appMainEl.classList.remove("app--spotlight");
    spotlightViewEl.style.display = "none";
    heroEl.style.display = "none";
    gridEl.style.display = "";
    gridEl.innerHTML = "";
    gridEl.className = "grid";
    const pageInfo = paginateItems(screen.items || [], "main", "car-types");
    pageInfo.items.forEach((item) => {
      const btn = document.createElement("button");
      btn.className = "tile";
      const img = document.createElement("img");
      img.src = item.image || "./images/transport_car.png";
      img.alt = item.label;
      setupImageElement(img, true);
      const lbl = document.createElement("div");
      lbl.className = "tile-label";
      lbl.textContent = item.label;
      btn.appendChild(img);
      btn.appendChild(lbl);
      btn.addEventListener("click", () => {
        speak(item.label);
        outingSelection.transport = { label: item.label, image: item.image || "./images/transport_car.png" };
        outingPlannerMode = "";
        while (currentKey() !== "outingHome" && navStack.length > 1) popScreen();
        render();
      });
      gridEl.appendChild(btn);
    });
    appendPagerButtons(gridEl, pageInfo);
  } else if (key === "dateHome") {
    renderDateHome();
  } else if (scheduleFeature.handles(key)) {
    scheduleFeature.render(key, screen);
  } else if (isSpotlight) {
    appMainEl.classList.add("app--spotlight");
    spotlightViewEl.style.display = "flex";
    gridEl.style.display = "none";
    gridEl.innerHTML = "";
    spotlightImgEl.src = screen.spotlight.image;
    spotlightImgEl.alt = screen.spotlight.label || screen.title || "";
    setupImageElement(spotlightImgEl, true);
    const spotLabel = screen.spotlight.label || screen.title || "";
    spotlightBtnEl.setAttribute("aria-label", `${spotLabel}, 눌러서 읽기`);
    spotlightBtnEl.onclick = () => speak(spotLabel);
  } else if (isEmpty) {
    appMainEl.classList.add("app--spotlight");
    spotlightViewEl.style.display = "none";
    spotlightBtnEl.onclick = null;
    gridEl.style.display = "none";
    gridEl.innerHTML = "";
  } else {
    appMainEl.classList.remove("app--spotlight");
    spotlightViewEl.style.display = "none";
    spotlightBtnEl.onclick = null;
    heroEl.className = "hero";
    gridEl.style.display = "";
    renderButtons(screen.items || [], screen.layout || (isMain ? "main" : "detail"));
  }

  requestAnimationFrame(() => prefetchLikelyNextScreens(key));
}

// ── 이벤트 핸들러 ────────────────────────────────────────────────────────────
backBtn.addEventListener("click", () => {
  speak("뒤로 가기");
  if (currentKey() === "outingHome" && outingPlannerMode) {
    outingPlannerMode = "";
    render();
    return;
  }
  if (scheduleFeature.handleBack(currentKey())) return;
  popScreen();
  selectedYoutube = "";
  render();
});

homeBtn.addEventListener("click", () => {
  speak("홈");
  while (navStack.length > 1) popScreen();
  outingPlannerMode = "";
  scheduleFeature.resetToHome();
  selectedYoutube = "";
  resetPageState();
  render();
});

openInYoutubeButton.addEventListener("click", () => {
  if (!selectedYoutube) return;
  speak("유튜브에서 열기");
  openYoutubeDirect(selectedYoutube);
});

// ── 4. 목소리 강제 로딩: 0.2초 간격으로 계속 확인 ───────────────────────────
if ("speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    preferredKoVoice = pickPreferredKoVoice();
  };
  preferredKoVoice = pickPreferredKoVoice();
  // Chrome/Android: getVoices()가 빈 배열을 반환할 때를 대비해 0.2초 간격으로 재시도
  let voiceRetry = 0;
  const voiceTimer = setInterval(() => {
    const v = pickPreferredKoVoice();
    if (v) { preferredKoVoice = v; clearInterval(voiceTimer); return; }
    if (voiceRetry++ > 30) clearInterval(voiceTimer); // 최대 6초
  }, 200);
}

window.addEventListener("pointerdown", warmupTTS, { once: true });
window.addEventListener("touchstart",  warmupTTS, { once: true });

if (isAppleMobile) returnHintEl.style.display = "block";

let resizeRenderTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeRenderTimer);
  resizeRenderTimer = setTimeout(render, 120);
});
window.addEventListener("orientationchange", () => {
  clearTimeout(resizeRenderTimer);
  resizeRenderTimer = setTimeout(render, 180);
});

// ── 앱 시작 ──────────────────────────────────────────────────────────────────
render();
