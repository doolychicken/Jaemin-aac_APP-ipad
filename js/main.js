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
const fullscreenBtn      = document.getElementById("fullscreenButton") || { style: {}, addEventListener: () => {}, setAttribute: () => {} };
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
const TEACHING_AID_PROGRESS_KEY = "jaemin-teaching-aid-progress-v2";
let completedTeachingAids = loadCompletedTeachingAids();

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
function paginateItems(items, layout = "main", suffix = "", reserveSlots = 0, options = {}) {
  return mainPager.paginate(items, suffix, { layout, reserveSlots, ...options });
}
function appendPagerButtons(container, pageInfo, options = {}) { mainPager.append(container, pageInfo, options); }

function weekdayColorClass(value) {
  const text = String(value || "").trim();
  return text.startsWith("토") || text.startsWith("일") ? "weekday-text--weekend" : "weekday-text--weekday";
}

function applyWeekdayTextColor(el, value) {
  if (!el) return;
  el.classList.remove("weekday-text--weekday", "weekday-text--weekend");
  el.classList.add(weekdayColorClass(value));
}

function loadCompletedTeachingAids() {
  try {
    const raw = localStorage.getItem(TEACHING_AID_PROGRESS_KEY);
    const values = JSON.parse(raw || "[]");
    return new Set(Array.isArray(values) ? values.map(String) : []);
  } catch {
    return new Set();
  }
}

function saveCompletedTeachingAids() {
  try {
    localStorage.setItem(TEACHING_AID_PROGRESS_KEY, JSON.stringify(Array.from(completedTeachingAids)));
  } catch {}
}

function isTeachingAidComplete(id) {
  return !!id && completedTeachingAids.has(String(id));
}

function teachingAidItemCompletionId(item) {
  if (!item) return "";
  return item.teachingAidTaskId || item.nav || "";
}

function teachingAidCurrentCompletionId(item = null) {
  return teachingAidItemCompletionId(item) || currentKey();
}

function filterCompletedTeachingAidItems(items) {
  if (!isInTeachingAidFlow()) return items || [];
  if (currentKey() === "studyTeachingAids") return items || [];
  return (items || []).filter((item) => {
    if (item.label === "다음" || item.label === "이전") return true;
    const completionId = teachingAidItemCompletionId(item);
    return !completionId || !isTeachingAidComplete(completionId);
  });
}

function completeTeachingAid(id, label = "교구", groupId = "") {
  if (!id) return false;
  const key = String(id);
  const wasComplete = completedTeachingAids.has(key);
  completedTeachingAids.add(key);
  if (groupId) completedTeachingAids.add(String(groupId));
  saveCompletedTeachingAids();
  resetPageState();
  helperEl.textContent = `${label} 완료! 뒤로 가면 다음 교구만 남아요.`;
  speak(wasComplete ? `${label} 완료했어요` : `${label} 완료`);
  return !wasComplete;
}

function resetTeachingAidProgress() {
  completedTeachingAids = new Set();
  saveCompletedTeachingAids();
  resetPageState("main/studyTeachingAids");
}

function remainingTeachingAidItems() {
  const screen = DATA.screens.studyTeachingAids || {};
  return filterCompletedTeachingAidItems(screen.items || []);
}

function isInTeachingAidFlow() {
  return navStack.some((entry) => entry.key === "studyTeachingAids");
}

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
let dateStepPage = "year";
const datePuzzleBlankSelection = { year: null, month: null, day: null, weekday: null, weather: null };
const dateStepFinalSelection = { year: null, month: null, day: null, weekday: null, weather: null };

// ── TTS ──────────────────────────────────────────────────────────────────────
let preferredKoVoice = null;
let ttsWarmedUp = false;
let sharedAudioCtx = null;
let ttsRequestId = 0;
const APP_SOUND_GAIN = 2.5;
const isAppleMobile = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const useDirectYoutubeOpen = true;

const isAndroid = /android/i.test(navigator.userAgent);
let softFullscreenMode = false;

function getFullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}

function isStandaloneDisplay() {
  const standalone = window.navigator.standalone === true;
  const displayStandalone = window.matchMedia
    ? window.matchMedia("(display-mode: standalone)").matches || window.matchMedia("(display-mode: fullscreen)").matches
    : false;
  return standalone || displayStandalone;
}

function syncFullscreenButton() {
  const active = !!getFullscreenElement() || softFullscreenMode || isStandaloneDisplay();
  fullscreenBtn.textContent = active ? "↙ 기본화면" : "⛶ 전체화면";
  fullscreenBtn.setAttribute("aria-pressed", active ? "true" : "false");
}

function setSoftFullscreenMode(active) {
  softFullscreenMode = active;
  appMainEl.classList.toggle("app--fullscreen-soft", active);
  document.body.classList.toggle("body--fullscreen-soft", active);
  syncFullscreenButton();
  requestAnimationFrame(() => {
    try { window.scrollTo(0, 1); } catch (_) {}
  });
}

async function toggleFullscreenMode() {
  if (getFullscreenElement() || softFullscreenMode) {
    const exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen;
    if (getFullscreenElement() && exitFullscreen) {
      try { await exitFullscreen.call(document); } catch (_) {}
    }
    setSoftFullscreenMode(false);
    speak("기본 화면");
    return;
  }

  const target = document.documentElement;
  const requestFullscreen = target.requestFullscreen || target.webkitRequestFullscreen;
  if (requestFullscreen) {
    try {
      await requestFullscreen.call(target);
      setSoftFullscreenMode(true);
      speak("전체 화면");
      return;
    } catch (_) {
      // iPad Safari may expose the API but reject it for normal pages.
    }
  }

  setSoftFullscreenMode(true);
  speak("전체 화면");
}

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

const studyPuzzleFeature = window.createStudyPuzzleFeature({
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
});

const recyclingGameFeature = window.createRecyclingGameFeature({
  appMainEl,
  spotlightViewEl,
  spotlightBtnEl,
  heroEl,
  gridEl,
  helperEl,
  playPuzzleSound,
  speak,
  render
});

const martCartGameFeature = window.createMartCartGameFeature({
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
});

const trafficLightGameFeature = window.createTrafficLightGameFeature({
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
});

const facePartsGameFeature = window.createFacePartsGameFeature({
  appMainEl,
  spotlightViewEl,
  spotlightBtnEl,
  heroEl,
  gridEl,
  helperEl,
  playPuzzleSound,
  speak,
  render
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

function unlockAudioOnce() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!sharedAudioCtx) sharedAudioCtx = new AudioCtx();
    if (sharedAudioCtx.state === "suspended") sharedAudioCtx.resume().catch(() => {});

    const now = sharedAudioCtx.currentTime;
    const gain = sharedAudioCtx.createGain();
    const osc = sharedAudioCtx.createOscillator();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.012, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    osc.frequency.setValueAtTime(880, now);
    osc.connect(gain);
    gain.connect(sharedAudioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  } catch (_e) {}
}

// ── 2. speak: 안드로이드 정교한 예외 처리 ────────────────────────────────────
function speak(text) {
  if (!("speechSynthesis" in window)) return Promise.resolve();
  if (!preferredKoVoice) preferredKoVoice = pickPreferredKoVoice();
  const spokenText = String(text || "").trim();
  if (!spokenText) return Promise.resolve();
  ttsRequestId += 1;

  return new Promise((resolve) => {
    const doSpeak = () => {
      if (!preferredKoVoice) preferredKoVoice = pickPreferredKoVoice();
      const u = new SpeechSynthesisUtterance(spokenText);
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        clearTimeout(fallbackTimer);
        resolve();
      };
      const fallbackMs = Math.min(3600, Math.max(650, String(text || "").length * 120 + 360));
      const fallbackTimer = setTimeout(finish, fallbackMs);

      u.onend = finish;
      u.onerror = finish;

      if (preferredKoVoice) {
        u.voice = preferredKoVoice;
        u.lang = preferredKoVoice.lang || "ko-KR";
      } else {
        u.lang = "ko-KR";
      }
      u.rate = isAndroid ? 1.0 : (isAppleMobile ? 0.92 : 1.15);
      u.pitch = 1.0;
      u.volume = 1.0;
      try { window.speechSynthesis.resume(); } catch (_) {}
      try { window.speechSynthesis.speak(u); } catch (_) { finish(); }
    };

    if (isAndroid) {
      unlockAudioOnce();
      try { window.speechSynthesis.cancel(); } catch (_) {}
      try { window.speechSynthesis.resume(); } catch (_) {}
      setTimeout(doSpeak, 140);
    } else {
      window.speechSynthesis.cancel();
      doSpeak();
    }
  });
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
    gain.gain.exponentialRampToValueAtTime(0.14 * APP_SOUND_GAIN, ctx.currentTime + 0.02);
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
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(APP_SOUND_GAIN, now + 0.02);
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
      tone(784, 0, 0.16, "sine", 0.14);
      tone(988, 0.10, 0.16, "sine", 0.14);
      tone(1319, 0.20, 0.20, "sine", 0.12);
    } else if (name.includes("흐")) {
      tone(294, 0, 0.42, "triangle", 0.12);
      tone(247, 0.10, 0.38, "triangle", 0.09);
    } else if (name.includes("비")) {
      [0, 0.08, 0.16, 0.24, 0.32].forEach((t, i) => tone(1100 + i * 80, t, 0.06, "sine", 0.085));
    } else if (name.includes("눈")) {
      tone(988, 0, 0.22, "sine", 0.11);
      tone(1319, 0.16, 0.26, "sine", 0.10);
      tone(1568, 0.34, 0.22, "sine", 0.08);
    } else if (name.includes("바람")) {
      noise(0, 0.62, 900, 0.11);
      tone(330, 0.08, 0.45, "sine", 0.055);
    } else if (name.includes("천둥") || name.includes("번개")) {
      noise(0, 0.45, 180, 0.16);
      tone(82, 0.05, 0.46, "sawtooth", 0.09);
    } else {
      tone(660, 0, 0.16, "sine", 0.08);
      tone(880, 0.12, 0.16, "sine", 0.08);
    }

    setTimeout(() => ctx.close().catch(() => {}), 900);
  } catch (_e) {}
}

let waterSoundState = null;
let mediaSoundState = null;

function stopMediaSound() {
  if (!mediaSoundState) return;
  const audio = mediaSoundState.audio;
  mediaSoundState = null;
  try {
    audio.pause();
    audio.currentTime = 0;
  } catch (_e) {}
}

function toggleMediaSound(src, loop) {
  if (!src) return;
  if (mediaSoundState && mediaSoundState.src === src) {
    stopMediaSound();
    return;
  }
  stopMediaSound();
  stopWaterSound();
  const audio = new Audio(src);
  mediaSoundState = { audio, src };
  audio.loop = !!loop;
  audio.volume = Math.max(0, Math.min(1, APP_SOUND_GAIN));
  audio.addEventListener("ended", () => {
    if (mediaSoundState && mediaSoundState.audio === audio) mediaSoundState = null;
  }, { once: true });
  audio.play().catch(() => {
    stopMediaSound();
    speak("소리를 재생할 수 없어요");
  });
}

function stopWaterSound() {
  if (!waterSoundState) return;
  const { ctx, sources, gain } = waterSoundState;
  waterSoundState = null;
  try {
    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value || 0.0001), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    sources.forEach((source) => {
      try { source.stop(now + 0.4); } catch (_) {}
    });
    window.setTimeout(() => ctx.close().catch(() => {}), 700);
  } catch (_e) {
    try { ctx.close().catch(() => {}); } catch (_) {}
  }
}

function toggleWaterSound() {
  if (waterSoundState) {
    stopWaterSound();
    return;
  }
  stopMediaSound();
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      speak("물소리를 재생할 수 없어요");
      return;
    }
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const master = ctx.createGain();
    const low = ctx.createBiquadFilter();
    const high = ctx.createBiquadFilter();
    const now = ctx.currentTime;
    const sources = [];

    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.42 * APP_SOUND_GAIN, now + 0.18);
    low.type = "lowpass";
    low.frequency.setValueAtTime(2600, now);
    high.type = "highpass";
    high.frequency.setValueAtTime(80, now);
    high.connect(low);
    low.connect(master);
    master.connect(ctx.destination);

    function makeNoise(duration, gainValue, filterFreq, q = 0.8) {
      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < data.length; i += 1) {
        const raw = Math.random() * 2 - 1;
        last = (last * 0.72) + (raw * 0.28);
        data[i] = last * (0.75 + Math.random() * 0.25);
      }
      const source = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      source.buffer = buffer;
      source.loop = true;
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(filterFreq, now);
      filter.Q.setValueAtTime(q, now);
      gain.gain.setValueAtTime(gainValue, now);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(high);
      source.start(now);
      sources.push(source);
    }

    makeNoise(1.1, 0.9, 460, 0.55);
    makeNoise(0.7, 0.5, 1600, 0.7);
    makeNoise(1.6, 0.28, 3200, 0.9);
    waterSoundState = { ctx, sources, gain: master };
  } catch (_e) {
    waterSoundState = null;
    speak("물소리를 재생할 수 없어요");
  }
}

function warmupTTS() {
  if (ttsWarmedUp) return;
  ttsWarmedUp = true;
  const warmupRequestId = ttsRequestId;
  unlockAudioOnce();
  if (!("speechSynthesis" in window)) return;
  if (!preferredKoVoice) preferredKoVoice = pickPreferredKoVoice();
  if (isAndroid) return;
  const warm = new SpeechSynthesisUtterance(isAndroid ? "아" : " ");
  warm.lang = preferredKoVoice?.lang || "ko-KR";
  if (preferredKoVoice) warm.voice = preferredKoVoice;
  warm.volume = isAndroid ? 0.01 : 0;
  warm.rate = 1.0;
  try { window.speechSynthesis.cancel(); } catch (_) {}
  try { window.speechSynthesis.resume(); } catch (_) {}
  try { window.speechSynthesis.speak(warm); } catch (_) {}
  setTimeout(() => {
    if (ttsRequestId !== warmupRequestId) return;
    try { window.speechSynthesis.cancel(); } catch (_) {}
  }, isAndroid ? 360 : 200);
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
  const originQuery = window.location.origin && window.location.origin !== "null"
    ? `&origin=${encodeURIComponent(window.location.origin)}`
    : "";
  playerEl.referrerPolicy = "strict-origin-when-cross-origin";
  playerEl.src = `https://www.youtube.com/embed/${id}?playsinline=1&autoplay=1&rel=0&modestbranding=1${startQuery}${originQuery}`;
}

function openYoutubeDirect(url) {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

function youtubeSearchUrl(query) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function resolveYoutube(item) {
  if (item.videoUrl) return item.videoUrl;
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
      applyWeekdayTextColor(wdNameEl, WDAY_FULL[curIdx]);
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
    if (kind === "weekday") applyWeekdayTextColor(main, value);
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
    if (options.weekday) applyWeekdayTextColor(text, label);
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
      }, { selected: dateSelection.weekday === weekday, weekday: true }));
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
      { mode: "cards", title: "카드 맞추기", icon: "123", sub: "빈칸을 누르고 숫자를 골라요." },
      { mode: "puzzle", title: "드래그 퍼즐", icon: "↔", sub: "카드를 끌어서 맞춰요." },
      { mode: "blankPuzzle", title: "빈칸 채우기", icon: "?", sub: "년 월 일 요일을 채워요." },
      { mode: "stepFlow", title: "한 장씩 하기", icon: "1", sub: "천천히 하나씩 골라요." },
      { mode: "boardFill", title: "버전 5", icon: "5", sub: "사진판처럼 빈칸을 채워요." },
    ];

    modes.forEach((item) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "date-mode-card";
      const icon = document.createElement("div");
      icon.className = "date-mode-icon";
      icon.textContent = item.icon;
      const title = document.createElement("div");
      title.className = "date-mode-title";
      title.textContent = item.title;
      const sub = document.createElement("div");
      sub.className = "date-mode-sub";
      sub.textContent = item.sub;
      btn.appendChild(icon);
      btn.appendChild(title);
      btn.appendChild(sub);
      btn.addEventListener("click", () => {
        dateActivityMode = item.mode;
        if (item.mode === "stepFlow" || item.mode === "boardFill") {
          dateCardFocus = "year";
          dateStepPage = "year";
          Object.assign(datePuzzleBlankSelection, { year: null, month: null, day: null, weekday: null, weather: null });
          Object.assign(dateStepFinalSelection, { year: null, month: null, day: null, weekday: null, weather: null });
        }
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

  if (dateActivityMode === "stepFlow") {
    renderDateStepFlowDrag();
    return;
  }

  if (dateActivityMode === "boardFill") {
    renderDateBoardFill();
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
    const field = document.createElement("div");
    field.className = `date-field date-field--${kind}${options.wide ? " date-field--wide" : ""}`;

    const fixedLabel = document.createElement("div");
    fixedLabel.className = "date-field-label";
    fixedLabel.textContent = focusLabel(kind);
    field.appendChild(fixedLabel);

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
    if (kind === "weekday") applyWeekdayTextColor(main, value);
    btn.appendChild(main);
    field.appendChild(btn);
    return field;
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
    if (options.weekday) applyWeekdayTextColor(text, label);
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
      }, { selected: dateSelection.weekday === weekday, weekday: true }));
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

function renderDateStepFlow() {
  initDateSelectionToday();
  appMainEl.classList.remove("app--spotlight");
  spotlightViewEl.style.display = "none";
  spotlightBtnEl.onclick = null;
  heroEl.style.display = "none";
  heroEl.className = "hero";
  gridEl.style.display = "";
  gridEl.innerHTML = "";
  gridEl.className = `date-step date-step--${dateStepPage}`;
  helperEl.textContent = "한 장씩 고르고 다음으로 넘어가요.";

  const today = new Date();
  const weatherItems = DATA.screens.dateWeatherPicker.items || [];
  const weekdayChoices = ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"];
  const todayWeekday = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"][today.getDay()];

  function selectStep(nextStep) {
    dateStepPage = nextStep;
    render();
  }

  function choiceButton(label, selected, onPick, options = {}) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `date-step-choice${selected ? " is-selected" : ""}${options.image ? " date-step-choice--image" : ""}`;
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
      if (options.next) window.setTimeout(() => selectStep(options.next), 160);
      else render();
    });
    return btn;
  }

  function summaryCard(kind, value, unit, options = {}) {
    const card = document.createElement("div");
    card.className = `date-step-summary-card${options.weather ? " date-step-summary-card--weather" : ""}`;
    card.dataset.label = unit || kind;
    if (options.weather && value) {
      const weather = weatherItems.find((item) => item.label === value);
      if (weather?.image) {
        const img = document.createElement("img");
        img.src = weather.image;
        img.alt = value;
        setupImageElement(img, true);
        card.appendChild(img);
      }
    }
    const main = document.createElement("span");
    main.className = "date-step-summary-main";
    main.textContent = value || kind;
    if (kind === "weekday") applyWeekdayTextColor(main, value);
    card.appendChild(main);
    if (unit && value) {
      const suffix = document.createElement("span");
      suffix.className = "date-step-summary-unit";
      suffix.textContent = unit;
      card.appendChild(suffix);
    }
    return card;
  }

  function addActions(prevStep, nextStep, primaryLabel = "다음") {
    const row = document.createElement("div");
    row.className = "date-action-row";
    const back = document.createElement("button");
    back.type = "button";
    back.className = "date-action-btn";
    back.textContent = prevStep ? "이전" : "버전 선택";
    back.addEventListener("click", () => {
      if (prevStep) {
        selectStep(prevStep);
      } else {
        dateActivityMode = "";
        render();
      }
    });
    row.appendChild(back);

    const next = document.createElement("button");
    next.type = "button";
    next.className = "date-action-btn date-action-btn--primary";
    next.textContent = primaryLabel;
    next.addEventListener("click", () => {
      if (nextStep) selectStep(nextStep);
      else speak(dateSentenceText());
    });
    row.appendChild(next);
    gridEl.appendChild(row);
  }

  if (dateStepPage === "year") {
    const board = document.createElement("section");
    board.className = "date-step-focus-card";
    board.appendChild(summaryCard("년", dateSelection.year, "년"));
    gridEl.appendChild(board);

    const choices = document.createElement("section");
    choices.className = "date-step-choice-grid date-step-choice-grid--year";
    [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1].forEach((year) => {
      choices.appendChild(choiceButton(String(year), dateSelection.year === year, () => {
        dateSelection.year = year;
      }, { next: "date" }));
    });
    gridEl.appendChild(choices);
    addActions(null, "date");
    return;
  }

  if (dateStepPage === "date") {
    const board = document.createElement("section");
    board.className = "date-step-summary-grid date-step-summary-grid--three";
    board.appendChild(summaryCard("월", dateSelection.month, "월"));
    board.appendChild(summaryCard("일", dateSelection.day, "일"));
    board.appendChild(summaryCard("요일", dateSelection.weekday?.replace("요일", ""), "요일"));
    gridEl.appendChild(board);

    const panel = document.createElement("section");
    panel.className = "date-step-multi-panel";
    const groups = [
      {
        title: "월",
        className: "date-step-choice-grid--month",
        choices: [today.getMonth() + 1, today.getMonth() + 2 <= 12 ? today.getMonth() + 2 : today.getMonth()],
        selected: (value) => dateSelection.month === value,
        pick: (value) => { dateSelection.month = value; }
      },
      {
        title: "일",
        className: "date-step-choice-grid--day",
        choices: [today.getDate(), today.getDate() < 31 ? today.getDate() + 1 : today.getDate() - 1],
        selected: (value) => dateSelection.day === value,
        pick: (value) => { dateSelection.day = value; }
      },
      {
        title: "요일",
        className: "date-step-choice-grid--weekday",
        choices: weekdayChoices,
        selected: (value) => dateSelection.weekday === value,
        pick: (value) => { dateSelection.weekday = value; },
        weekday: true
      }
    ];
    groups.forEach((group) => {
      const wrap = document.createElement("div");
      wrap.className = "date-step-choice-group";
      const title = document.createElement("div");
      title.className = "date-step-choice-title";
      title.textContent = group.title;
      wrap.appendChild(title);
      const choiceGrid = document.createElement("div");
      choiceGrid.className = `date-step-choice-grid ${group.className}`;
      group.choices.forEach((value) => {
        const text = typeof value === "number" ? String(value) : value.replace("요일", "");
        choiceGrid.appendChild(choiceButton(text, group.selected(value), () => group.pick(value), { weekday: group.weekday }));
      });
      wrap.appendChild(choiceGrid);
      panel.appendChild(wrap);
    });
    gridEl.appendChild(panel);
    addActions("year", "weather");
    return;
  }

  if (dateStepPage === "weather") {
    const board = document.createElement("section");
    board.className = "date-step-focus-card date-step-focus-card--weather";
    board.appendChild(summaryCard("날씨", dateSelection.weather, "", { weather: true }));
    gridEl.appendChild(board);

    const choices = document.createElement("section");
    choices.className = "date-step-choice-grid date-step-choice-grid--weather";
    weatherItems.forEach((item) => {
      choices.appendChild(choiceButton(item.label, dateSelection.weather === item.label, () => {
        dateSelection.weather = item.label;
      }, { image: item.image, weather: true, next: "summary" }));
    });
    gridEl.appendChild(choices);
    addActions("date", "summary");
    return;
  }

  const summary = document.createElement("section");
  summary.className = "date-step-summary-grid date-step-summary-grid--final";
  summary.appendChild(summaryCard("년", dateSelection.year, "년"));
  summary.appendChild(summaryCard("월", dateSelection.month, "월"));
  summary.appendChild(summaryCard("일", dateSelection.day, "일"));
  summary.appendChild(summaryCard("요일", dateSelection.weekday?.replace("요일", ""), "요일"));
  summary.appendChild(summaryCard("날씨", dateSelection.weather, "", { weather: true }));
  gridEl.appendChild(summary);

  const sentence = document.createElement("button");
  sentence.type = "button";
  sentence.className = "date-step-sentence";
  sentence.textContent = dateSentenceText();
  sentence.addEventListener("click", () => speak(dateSentenceText()));
  gridEl.appendChild(sentence);
  addActions("weather", null, "문장 읽기");
}

function renderDateStepFlowDrag() {
  initDateSelectionToday();
  appMainEl.classList.remove("app--spotlight");
  spotlightViewEl.style.display = "none";
  spotlightBtnEl.onclick = null;
  heroEl.style.display = "none";
  heroEl.className = "hero";
  gridEl.style.display = "";
  gridEl.innerHTML = "";
  gridEl.className = `date-step date-step--${dateStepPage}`;
  helperEl.textContent = "";
  helperEl.style.display = "none";
  crumbEl.textContent = "카드를 끌어서 같은 빈칸에 맞춰요.";
  crumbEl.style.display = "block";

  const today = new Date();
  const weatherItems = DATA.screens.dateWeatherPicker.items || [];
  const weekdayChoices = ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"];
  let activeDragCard = null;
  const answer = {
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    day: today.getDate(),
    weekday: ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"][today.getDay()],
    weather: datePuzzleBlankSelection.weather || dateSelection.weather
  };

  function gotoStep(step) {
    dateStepPage = step;
    if (step === "date" && !["month", "day"].includes(dateCardFocus)) dateCardFocus = "month";
    if (step === "weekday") dateCardFocus = "weekday";
    if (step === "weather") dateCardFocus = "weather";
    if (step === "summary") {
      dateCardFocus = "year";
      Object.assign(dateStepFinalSelection, { year: null, month: null, day: null, weekday: null, weather: null });
    }
    render();
  }

  function nextAfterMatch(kind) {
    if (dateStepPage === "summary") {
      if (kind === "year") dateCardFocus = "month";
      else if (kind === "month") dateCardFocus = "day";
      else if (kind === "day") dateCardFocus = "weekday";
      else if (kind === "weekday") dateCardFocus = "weather";
      else dateCardFocus = "weather";
      return "summary";
    }
    if (kind === "year") {
      dateCardFocus = "month";
      return "date";
    }
    if (kind === "month") {
      dateCardFocus = "day";
      return "date";
    }
    if (kind === "day") {
      dateCardFocus = "weekday";
      return "weekday";
    }
    if (kind === "weekday") return "weather";
    if (kind === "weather") return "summary";
    return "date";
  }

  function spokenStepLabel(kind, value) {
    if (kind === "year") return `${value}년`;
    if (kind === "month") return `${value}월`;
    if (kind === "day") return `${value}일`;
    if (kind === "weather") return `날씨 ${value}`;
    return String(value);
  }

  function currentSlotSpeechValue(kind, fallbackValue) {
    const source = dateStepPage === "summary" ? dateStepFinalSelection : datePuzzleBlankSelection;
    return source[kind] || fallbackValue;
  }

  function fillMatchedSlot(kind, value, targetEl) {
    if (!targetEl) return;
    if (kind === "weather") {
      const weather = weatherItems.find((item) => item.label === value);
      if (weather?.image && !targetEl.querySelector("img")) {
        const img = document.createElement("img");
        img.src = weather.image;
        img.alt = value;
        setupImageElement(img, true);
        targetEl.insertBefore(img, targetEl.firstChild);
      }
    }
    const main = targetEl.querySelector(".date-puzzle-slot-main");
    const suffix = targetEl.querySelector(".date-puzzle-slot-unit");
    if (main) main.textContent = kind === "weekday" ? String(value).replace("요일", "") : String(value);
    if (kind === "weekday" && main) applyWeekdayTextColor(main, value);
    targetEl.dataset.speechValue = String(value);
    if (suffix) {
      suffix.textContent = kind === "year" ? "년" :
        kind === "month" ? "월" :
        kind === "day" ? "일" :
        kind === "weekday" ? "요일" : "";
    }
  }

  function hideMatchedDragCard(kind, value, sourceEl) {
    const cards = sourceEl ? [sourceEl] : Array.from(gridEl.querySelectorAll(".date-drag-card"));
    cards.forEach((card) => {
      if (card.dataset.kind === kind && card.dataset.value === String(value)) {
        card.classList.add("is-used");
        card.disabled = true;
      }
    });
  }

  function setMatched(kind, value, targetEl, sourceEl = activeDragCard) {
    if (kind === "year" && Number(value) !== answer.year) return showMiss();
    if (kind === "month" && Number(value) !== answer.month) return showMiss();
    if (kind === "day" && Number(value) !== answer.day) return showMiss();
    if (kind === "weekday" && value !== answer.weekday) return showMiss();
    if (kind === "weather" && !value) return showMiss();

    const stored = kind === "year" || kind === "month" || kind === "day" ? Number(value) : value;
    const targetSelection = dateStepPage === "summary" ? dateStepFinalSelection : datePuzzleBlankSelection;
    targetSelection[kind] = stored;
    dateSelection[kind] = stored;
    playPuzzleSound("success");
    fillMatchedSlot(kind, stored, targetEl);
    targetEl?.classList.add("is-matched");
    hideMatchedDragCard(kind, value, sourceEl);
    const next = nextAfterMatch(kind);
    const summaryComplete = dateStepPage === "summary" && isStepSummaryComplete(targetSelection);
    const afterSpeech = Promise.resolve(speak(spokenStepLabel(kind, stored)));
    const advance = () => {
      if (dateStepPage === "summary") {
        window.setTimeout(() => {
          render();
          if (summaryComplete) {
            window.setTimeout(() => speak(dateSentenceText()), 260);
          }
        }, 180);
      } else {
        window.setTimeout(() => gotoStep(next), 180);
      }
    };
    afterSpeech.finally(() => {
      if (kind === "weather") {
        playWeatherSound(value);
        window.setTimeout(advance, 650);
        return;
      }
      advance();
    });
  }

  function showMiss() {
    playPuzzleSound("miss");
    speak("여기가 아니에요");
  }

  function makeDropSlot(kind, unit, value, options = {}) {
    const slot = document.createElement("button");
    slot.type = "button";
    const isFocused = (
      (dateStepPage === "date" && ["month", "day"].includes(kind)) ||
      (dateStepPage === "weekday" && kind === "weekday") ||
      (dateStepPage === "weather" && kind === "weather") ||
      dateStepPage === "summary"
    ) && dateCardFocus === kind;
    slot.className = `date-puzzle-slot date-step-drop-slot${isFocused ? " is-active" : ""}${options.wide ? " date-puzzle-slot--wide" : ""}${options.weather ? " date-puzzle-slot--weather" : ""}`;
    slot.dataset.kind = kind;
    slot.dataset.label = unit;
    const speechValue = currentSlotSpeechValue(kind, value);
    if (speechValue) slot.dataset.speechValue = String(speechValue);
    slot.addEventListener("click", () => {
      if (
        (dateStepPage === "date" && ["month", "day"].includes(kind)) ||
        (dateStepPage === "weekday" && kind === "weekday") ||
        (dateStepPage === "weather" && kind === "weather") ||
        dateStepPage === "summary"
      ) {
        dateCardFocus = kind;
        const nextSpeechValue = currentSlotSpeechValue(kind, slot.dataset.speechValue || value);
        speak(nextSpeechValue ? spokenStepLabel(kind, nextSpeechValue) : unit);
        render();
      }
    });
    slot.addEventListener("dragover", (e) => {
      e.preventDefault();
      slot.classList.add("is-ready");
    });
    slot.addEventListener("dragleave", () => slot.classList.remove("is-ready"));
    slot.addEventListener("drop", (e) => {
      e.preventDefault();
      slot.classList.remove("is-ready");
      const sourceKind = e.dataTransfer.getData("text/kind");
      const sourceValue = e.dataTransfer.getData("text/value");
      if (sourceKind !== kind || !sourceValue) return showMiss();
      setMatched(kind, sourceValue, slot, activeDragCard);
      activeDragCard = null;
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
    main.textContent = value || "?";
    if (kind === "weekday") applyWeekdayTextColor(main, value);
    slot.appendChild(main);

    const suffix = document.createElement("span");
    suffix.className = "date-puzzle-slot-unit";
    suffix.textContent = value && unit ? unit : "";
    slot.appendChild(suffix);
    return slot;
  }

  function makeStepUnitPair(kind, unit, value, options = {}) {
    const pair = document.createElement("div");
    pair.className = `date-step-unit-pair date-step-unit-pair--${kind}`;
    const label = document.createElement("span");
    label.className = "date-step-unit-label";
    label.textContent = unit;
    const slot = makeDropSlot(kind, unit, value, options);
    if (kind === "weather") {
      pair.appendChild(label);
      pair.appendChild(slot);
    } else {
      pair.appendChild(slot);
      pair.appendChild(label);
    }
    return pair;
  }

  function makeDragCard(kind, value, label, options = {}) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `date-drag-card${options.weather ? " date-drag-card--weather" : ""}`;
    card.dataset.kind = kind;
    card.dataset.value = String(value);
    card.draggable = true;
    let suppressNextClick = false;
    function speakCardLabel() {
      if (options.weather) playWeatherSound(label);
      speak(options.speechLabel || label);
    }
    card.addEventListener("dragstart", (e) => {
      activeDragCard = card;
      e.dataTransfer.setData("text/kind", kind);
      e.dataTransfer.setData("text/value", String(value));
      e.dataTransfer.effectAllowed = "move";
    });
    card.addEventListener("dragend", () => {
      activeDragCard = null;
    });
    card.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse") return;
      activeDragCard = card;
      const rect = card.getBoundingClientRect();
      let didMove = false;
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
        const dx = ev.clientX - e.clientX;
        const dy = ev.clientY - e.clientY;
        if ((dx * dx) + (dy * dy) > 64) didMove = true;
        ghost.style.left = `${rect.left + ev.clientX - e.clientX}px`;
        ghost.style.top = `${rect.top + ev.clientY - e.clientY}px`;
        const target = document.elementFromPoint(ev.clientX, ev.clientY)?.closest(".date-step-drop-slot");
        document.querySelectorAll(".date-step-drop-slot.is-ready").forEach((el) => el.classList.remove("is-ready"));
        if (didMove && target?.dataset.kind === kind) target.classList.add("is-ready");
      }

      function up(ev) {
        card.releasePointerCapture(e.pointerId);
        card.removeEventListener("pointermove", move);
        card.removeEventListener("pointerup", up);
        card.removeEventListener("pointercancel", cancel);
        card.classList.remove("is-dragging");
        ghost.remove();
        const target = document.elementFromPoint(ev.clientX, ev.clientY)?.closest(".date-step-drop-slot");
        document.querySelectorAll(".date-step-drop-slot.is-ready").forEach((el) => el.classList.remove("is-ready"));
        suppressNextClick = true;
        if (!didMove) speakCardLabel();
        else if (target?.dataset.kind === kind) setMatched(kind, value, target, card);
        else showMiss();
        activeDragCard = null;
      }

      function cancel() {
        card.removeEventListener("pointermove", move);
        card.removeEventListener("pointerup", up);
        card.removeEventListener("pointercancel", cancel);
        card.classList.remove("is-dragging");
        ghost.remove();
        document.querySelectorAll(".date-step-drop-slot.is-ready").forEach((el) => el.classList.remove("is-ready"));
        activeDragCard = null;
      }

      card.addEventListener("pointermove", move);
      card.addEventListener("pointerup", up);
      card.addEventListener("pointercancel", cancel);
    });
    card.addEventListener("click", () => {
      if (suppressNextClick) {
        suppressNextClick = false;
        return;
      }
      speakCardLabel();
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
    if (kind === "weekday") applyWeekdayTextColor(text, value);
    card.appendChild(text);
    return card;
  }

  function twoNumberChoices(value, min, max) {
    const other = value < max ? value + 1 : value - 1;
    return [value, Math.max(min, Math.min(max, other))];
  }

  function isStepSummaryComplete(selection) {
    return ["year", "month", "day", "weekday", "weather"].every((key) => selection[key]);
  }

  function resetStepFlow() {
    dateStepPage = "year";
    dateCardFocus = "year";
    Object.assign(datePuzzleBlankSelection, { year: null, month: null, day: null, weekday: null, weather: null });
    Object.assign(dateStepFinalSelection, { year: null, month: null, day: null, weekday: null, weather: null });
    render();
  }

  function addActions(prevStep, nextStep, primaryText = "다음") {
    const row = document.createElement("div");
    row.className = "date-action-row date-action-row--reset";
    const back = document.createElement("button");
    back.type = "button";
    back.className = "date-action-btn";
    back.textContent = prevStep ? "이전" : "버전 선택";
    back.addEventListener("click", () => {
      if (prevStep) gotoStep(prevStep);
      else {
        dateActivityMode = "";
        render();
      }
    });
    row.appendChild(back);

    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "date-action-btn";
    reset.textContent = "처음부터 다시";
    reset.addEventListener("click", resetStepFlow);
    row.appendChild(reset);

    const next = document.createElement("button");
    next.type = "button";
    next.className = "date-action-btn date-action-btn--primary";
    next.textContent = primaryText;
    next.addEventListener("click", () => {
      if (nextStep) gotoStep(nextStep);
      else speak(dateSentenceText());
    });
    row.appendChild(next);
    gridEl.appendChild(row);
  }

  if (dateStepPage === "year") {
    const board = document.createElement("section");
    board.className = "date-step-focus-card";
    board.appendChild(makeStepUnitPair("year", "년", datePuzzleBlankSelection.year, { wide: true }));
    gridEl.appendChild(board);

    const tray = document.createElement("section");
    tray.className = "date-puzzle-tray";
    const cardGrid = document.createElement("div");
    cardGrid.className = "date-puzzle-card-grid date-puzzle-card-grid--year";
    cardGrid.appendChild(makeDragCard("year", answer.year, String(answer.year)));
    tray.appendChild(cardGrid);
    gridEl.appendChild(tray);
    addActions(null, "date");
    return;
  }

  if (dateStepPage === "date") {
    if (!["month", "day"].includes(dateCardFocus)) dateCardFocus = "month";
    const board = document.createElement("section");
    board.className = "date-puzzle-board date-step-date-board";
    board.appendChild(makeStepUnitPair("month", "월", datePuzzleBlankSelection.month));
    board.appendChild(makeStepUnitPair("day", "일", datePuzzleBlankSelection.day));
    gridEl.appendChild(board);

    const tray = document.createElement("section");
    tray.className = "date-puzzle-tray";
    const trayTitle = document.createElement("div");
    trayTitle.className = "date-puzzle-tray-title";
    trayTitle.textContent = `${{ month: "월", day: "일", weekday: "요일" }[dateCardFocus]} 카드`;
    tray.appendChild(trayTitle);
    const cardGrid = document.createElement("div");
    cardGrid.className = `date-puzzle-card-grid date-puzzle-card-grid--${dateCardFocus}`;
    const focusGroup = {
      month: { kind: "month", values: twoNumberChoices(answer.month, 1, 12), label: (v) => String(v) },
      day: { kind: "day", values: twoNumberChoices(answer.day, 1, 31), label: (v) => String(v) }
    }[dateCardFocus];
    focusGroup.values.forEach((value) => {
      cardGrid.appendChild(makeDragCard(focusGroup.kind, value, focusGroup.label(value)));
    });
    tray.appendChild(cardGrid);
    gridEl.appendChild(tray);
    addActions("year", "weekday");
    return;
  }

  if (dateStepPage === "weekday") {
    dateCardFocus = "weekday";
    const board = document.createElement("section");
    board.className = "date-step-focus-card date-step-focus-card--weekday";
    board.appendChild(makeStepUnitPair("weekday", "요일", datePuzzleBlankSelection.weekday ? datePuzzleBlankSelection.weekday.replace("요일", "") : ""));
    gridEl.appendChild(board);

    const tray = document.createElement("section");
    tray.className = "date-puzzle-tray";
    const cardGrid = document.createElement("div");
    cardGrid.className = "date-puzzle-card-grid date-puzzle-card-grid--weekday";
    weekdayChoices.forEach((weekday) => {
      cardGrid.appendChild(makeDragCard("weekday", weekday, weekday.replace("요일", ""), { speechLabel: weekday }));
    });
    tray.appendChild(cardGrid);
    gridEl.appendChild(tray);
    addActions("date", "weather");
    return;
  }

  if (dateStepPage === "weather") {
    const board = document.createElement("section");
    board.className = "date-step-focus-card date-step-focus-card--weather";
    board.appendChild(makeStepUnitPair("weather", "날씨", datePuzzleBlankSelection.weather, { weather: true, wide: true }));
    gridEl.appendChild(board);

    const tray = document.createElement("section");
    tray.className = "date-puzzle-tray";
    const cardGrid = document.createElement("div");
    cardGrid.className = "date-puzzle-card-grid date-puzzle-card-grid--weather";
    weatherItems.forEach((item) => {
      cardGrid.appendChild(makeDragCard("weather", item.label, item.label, { image: item.image, weather: true }));
    });
    tray.appendChild(cardGrid);
    gridEl.appendChild(tray);
    addActions("weekday", "summary");
    return;
  }

  if (!["year", "month", "day", "weekday", "weather"].includes(dateCardFocus)) dateCardFocus = "year";
  const summaryComplete = isStepSummaryComplete(dateStepFinalSelection);
  const summary = document.createElement("section");
  summary.className = `date-puzzle-board date-step-final-board${summaryComplete ? " is-complete" : ""}`;
  summary.appendChild(makeStepUnitPair("year", "년", dateStepFinalSelection.year, { wide: true }));
  summary.appendChild(makeStepUnitPair("month", "월", dateStepFinalSelection.month));
  summary.appendChild(makeStepUnitPair("day", "일", dateStepFinalSelection.day));
  summary.appendChild(makeStepUnitPair("weekday", "요일", dateStepFinalSelection.weekday ? dateStepFinalSelection.weekday.replace("요일", "") : ""));
  summary.appendChild(makeStepUnitPair("weather", "날씨", dateStepFinalSelection.weather, { weather: true, wide: true }));
  gridEl.appendChild(summary);

  if (!summaryComplete) {
    const tray = document.createElement("section");
    tray.className = "date-puzzle-tray";
    const trayTitle = document.createElement("div");
    trayTitle.className = "date-puzzle-tray-title";
    trayTitle.textContent = `${{ year: "년", month: "월", day: "일", weekday: "요일", weather: "날씨" }[dateCardFocus]} 카드`;
    tray.appendChild(trayTitle);
    const cardGrid = document.createElement("div");
    cardGrid.className = `date-puzzle-card-grid date-puzzle-card-grid--${dateCardFocus}`;
    if (dateCardFocus === "year") {
      cardGrid.appendChild(makeDragCard("year", answer.year, String(answer.year)));
    } else if (dateCardFocus === "month") {
      twoNumberChoices(answer.month, 1, 12).forEach((month) => {
        cardGrid.appendChild(makeDragCard("month", month, String(month)));
      });
    } else if (dateCardFocus === "day") {
      twoNumberChoices(answer.day, 1, 31).forEach((day) => {
        cardGrid.appendChild(makeDragCard("day", day, String(day)));
      });
    } else if (dateCardFocus === "weekday") {
      weekdayChoices.forEach((weekday) => {
        cardGrid.appendChild(makeDragCard("weekday", weekday, weekday.replace("요일", ""), { speechLabel: weekday }));
      });
    } else {
      weatherItems.forEach((item) => {
        cardGrid.appendChild(makeDragCard("weather", item.label, item.label, { image: item.image, weather: true }));
      });
    }
    tray.appendChild(cardGrid);
    gridEl.appendChild(tray);
  }

  if (summaryComplete) {
    const sentence = document.createElement("button");
    sentence.type = "button";
    sentence.className = "date-step-sentence date-step-sentence--complete";
    sentence.textContent = dateSentenceText();
    sentence.addEventListener("click", () => speak(dateSentenceText()));
    gridEl.appendChild(sentence);
  }
  addActions("weather", null, "문장 읽기");
}

function renderDateBoardFill() {
  initDateSelectionToday();
  appMainEl.classList.remove("app--spotlight");
  spotlightViewEl.style.display = "none";
  spotlightBtnEl.onclick = null;
  heroEl.style.display = "none";
  heroEl.className = "hero";
  gridEl.style.display = "";
  gridEl.innerHTML = "";
  gridEl.className = "date-board-fill";
  helperEl.textContent = "카드를 끌어서 같은 빈칸에 넣어요.";

  const today = new Date();
  const weatherItems = DATA.screens.dateWeatherPicker.items || [];
  const weekdayChoices = ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"];
  const answer = {
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    day: today.getDate(),
    weekday: ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"][today.getDay()],
    weather: datePuzzleBlankSelection.weather || dateSelection.weather
  };
  const labels = { year: "년", month: "월", day: "일", weekday: "요일", weather: "날씨" };
  const order = ["year", "month", "day", "weekday", "weather"];
  if (!order.includes(dateCardFocus)) dateCardFocus = "year";

  function formatValue(kind, value) {
    if (!value) return "?";
    if (kind === "weekday") return String(value).replace("요일", "");
    return String(value);
  }

  function spokenValue(kind, value) {
    if (kind === "year") return `${value}년`;
    if (kind === "month") return `${value}월`;
    if (kind === "day") return `${value}일`;
    if (kind === "weather") return `날씨 ${value}`;
    return String(value);
  }

  function nextFocus(kind) {
    const idx = order.indexOf(kind);
    return order[Math.min(idx + 1, order.length - 1)] || "weather";
  }

  function setBoardValue(kind, value, targetEl) {
    const stored = kind === "year" || kind === "month" || kind === "day" ? Number(value) : value;
    datePuzzleBlankSelection[kind] = stored;
    dateSelection[kind] = stored;
    dateCardFocus = kind;
    if (kind === "weather") {
      playWeatherSound(stored);
    } else {
      playPuzzleSound("success");
    }
    if (targetEl) {
      targetEl.classList.add("is-matched");
      const burst = document.createElement("span");
      burst.className = "date-puzzle-burst";
      burst.textContent = "✓";
      targetEl.appendChild(burst);
    }
    const afterSpeech = Promise.resolve(speak(spokenValue(kind, stored)));
    afterSpeech.finally(() => {
      dateCardFocus = nextFocus(kind);
      render();
    });
    render();
  }

  function showBoardMiss() {
    playPuzzleSound("miss");
    speak("여기가 아니에요");
  }

  function allowDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.add("is-ready");
  }

  function leaveDrop(e) {
    e.currentTarget.classList.remove("is-ready");
  }

  function makeFixedLabel(kind, text) {
    const label = document.createElement("div");
    label.className = `date-board-fill-fixed date-board-fill-fixed--${kind}`;
    label.textContent = text;
    return label;
  }

  function makeSlot(kind) {
    const value = datePuzzleBlankSelection[kind];
    const slot = document.createElement("button");
    slot.type = "button";
    slot.className = `date-board-fill-slot date-board-fill-slot--${kind}${dateCardFocus === kind ? " is-active" : ""}${value ? " is-filled" : ""}`;
    slot.dataset.kind = kind;
    slot.addEventListener("click", () => {
      dateCardFocus = kind;
      speak(value ? spokenValue(kind, value) : labels[kind]);
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
        showBoardMiss();
        return;
      }
      setBoardValue(kind, valueText, e.currentTarget);
    });

    if (kind === "weather" && value) {
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
    main.className = "date-board-fill-main";
    main.textContent = formatValue(kind, value);
    if (kind === "weekday") applyWeekdayTextColor(main, value);
    slot.appendChild(main);
    return slot;
  }

  function twoNumberChoices(value, min, max) {
    const other = value < max ? value + 1 : value - 1;
    return [value, Math.max(min, Math.min(max, other))];
  }

  function choiceItems() {
    if (dateCardFocus === "year") return [{ kind: "year", value: answer.year, label: String(answer.year) }];
    if (dateCardFocus === "month") {
      return twoNumberChoices(answer.month, 1, 12).map((value) => ({ kind: "month", value, label: String(value) }));
    }
    if (dateCardFocus === "day") {
      return twoNumberChoices(answer.day, 1, 31).map((value) => ({ kind: "day", value, label: String(value) }));
    }
    if (dateCardFocus === "weekday") {
      return weekdayChoices.map((value) => ({ kind: "weekday", value, label: value.replace("요일", "") }));
    }
    return weatherItems.map((item) => ({ kind: "weather", value: item.label, label: item.label, image: item.image }));
  }

  function makeChoice(item) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `date-board-fill-card${item.image ? " date-board-fill-card--image" : ""}`;
    btn.draggable = true;
    btn.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/kind", item.kind);
      e.dataTransfer.setData("text/value", String(item.value));
      e.dataTransfer.effectAllowed = "move";
    });
    btn.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse") return;
      const rect = btn.getBoundingClientRect();
      const ghost = btn.cloneNode(true);
      ghost.classList.add("date-board-fill-card--ghost");
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
      btn.setPointerCapture(e.pointerId);
      btn.classList.add("is-dragging");
      e.preventDefault();
      let moved = false;

      function move(ev) {
        if (Math.hypot(ev.clientX - e.clientX, ev.clientY - e.clientY) > 8) moved = true;
        ghost.style.left = `${rect.left + ev.clientX - e.clientX}px`;
        ghost.style.top = `${rect.top + ev.clientY - e.clientY}px`;
        const target = document.elementFromPoint(ev.clientX, ev.clientY)?.closest(".date-board-fill-slot");
        document.querySelectorAll(".date-board-fill-slot.is-ready").forEach((el) => el.classList.remove("is-ready"));
        if (target?.dataset.kind === item.kind) target.classList.add("is-ready");
      }

      function up(ev) {
        btn.releasePointerCapture(e.pointerId);
        btn.removeEventListener("pointermove", move);
        btn.removeEventListener("pointerup", up);
        btn.removeEventListener("pointercancel", cancel);
        btn.classList.remove("is-dragging");
        ghost.remove();
        const target = document.elementFromPoint(ev.clientX, ev.clientY)?.closest(".date-board-fill-slot");
        document.querySelectorAll(".date-board-fill-slot.is-ready").forEach((el) => el.classList.remove("is-ready"));
        if (!moved) {
          if (item.kind === "weather") playWeatherSound(item.value);
          speak(item.kind === "weather" ? `날씨 ${item.label}` : item.label);
          return;
        }
        if (target?.dataset.kind === item.kind) setBoardValue(item.kind, item.value, target);
        else showBoardMiss();
      }

      function cancel() {
        btn.removeEventListener("pointermove", move);
        btn.removeEventListener("pointerup", up);
        btn.removeEventListener("pointercancel", cancel);
        btn.classList.remove("is-dragging");
        ghost.remove();
        document.querySelectorAll(".date-board-fill-slot.is-ready").forEach((el) => el.classList.remove("is-ready"));
      }

      btn.addEventListener("pointermove", move);
      btn.addEventListener("pointerup", up);
      btn.addEventListener("pointercancel", cancel);
    });
    if (item.image) {
      const img = document.createElement("img");
      img.src = item.image;
      img.alt = item.label;
      setupImageElement(img, true);
      btn.appendChild(img);
    }
    const text = document.createElement("span");
    text.textContent = item.label;
    if (item.kind === "weekday") applyWeekdayTextColor(text, item.value);
    btn.appendChild(text);
    btn.addEventListener("click", () => {
      if (item.kind === "weather") playWeatherSound(item.value);
      speak(item.kind === "weather" ? `날씨 ${item.label}` : item.label);
    });
    return btn;
  }

  function makePair(kind, labelText) {
    const pair = document.createElement("div");
    pair.className = `date-board-fill-pair date-board-fill-pair--${kind}`;
    const slot = makeSlot(kind);
    const label = makeFixedLabel(kind, labelText);
    if (kind === "weather") {
      pair.appendChild(label);
      pair.appendChild(slot);
    } else {
      pair.appendChild(slot);
      pair.appendChild(label);
    }
    return pair;
  }

  const board = document.createElement("section");
  board.className = "date-board-fill-board";
  board.appendChild(makePair("year", "년"));
  board.appendChild(makePair("month", "월"));
  board.appendChild(makePair("day", "일"));
  board.appendChild(makePair("weekday", "요일"));
  board.appendChild(makePair("weather", "날씨"));
  gridEl.appendChild(board);

  const tray = document.createElement("section");
  tray.className = "date-board-fill-tray";
  const title = document.createElement("div");
  title.className = "date-board-fill-title";
  title.textContent = `${labels[dateCardFocus]} 카드`;
  tray.appendChild(title);
  const cards = document.createElement("div");
  cards.className = `date-board-fill-cards date-board-fill-cards--${dateCardFocus}`;
  choiceItems().forEach((item) => cards.appendChild(makeChoice(item)));
  tray.appendChild(cards);
  gridEl.appendChild(tray);

  const actionRow = document.createElement("div");
  actionRow.className = "date-action-row date-action-row--reset";
  const modeBtn = document.createElement("button");
  modeBtn.type = "button";
  modeBtn.className = "date-action-btn";
  modeBtn.textContent = "버전 선택";
  modeBtn.addEventListener("click", () => {
    dateActivityMode = "";
    render();
  });
  actionRow.appendChild(modeBtn);

  const resetBtn = document.createElement("button");
  resetBtn.type = "button";
  resetBtn.className = "date-action-btn";
  resetBtn.textContent = "처음부터 다시";
  resetBtn.addEventListener("click", () => {
    dateCardFocus = "year";
    Object.assign(datePuzzleBlankSelection, { year: null, month: null, day: null, weekday: null, weather: null });
    render();
  });
  actionRow.appendChild(resetBtn);

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

  function spokenDropLabel(kind, value) {
    if (kind === "year") return `${value}년`;
    if (kind === "month") return `${value}월`;
    if (kind === "day") return `${value}일`;
    if (kind === "weather") return `날씨 ${value}`;
    return String(value);
  }

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
    dateCardFocus = nextDateFocus[kind] || "weather";
    showPuzzleSuccess(targetEl, spokenDropLabel(kind, value));
    if (kind === "weather") window.setTimeout(() => playWeatherSound(value), 420);
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
    slot.dataset.label = unit;
    if (dateCardFocus === kind) slot.classList.add("is-active");
    slot.addEventListener("click", () => {
      dateCardFocus = kind;
      speak(value ? spokenDropLabel(kind, value) : unit);
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
    main.textContent = value || "?";
    if (kind === "weekday") applyWeekdayTextColor(main, value);
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
    if (kind === "weekday") applyWeekdayTextColor(text, value);
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
    cardGrid.appendChild(makeDragCard("year", Number(answer.year), String(answer.year)));
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
      speak(item.speech || item.label);
      if (item.nav) { pushScreen(item.nav, item.label); render(); }
    });
    heroEl.appendChild(btn);
  });
}

function goToToilet() {
  speak("화장실");
  if (currentKey() !== "toilet") {
    pushScreen("toilet", "화장실");
    render();
  }
}

function hasVisibleToiletTile() {
  return Array.from(gridEl.querySelectorAll("button")).some((btn) => {
    return (btn.textContent || "").trim() === "화장실";
  });
}

function isMainMenuScreenKey() {
  const key = currentKey();
  return key === "main" || key.startsWith("main_p");
}

function shouldHideQuickToiletOnScreen() {
  const key = currentKey();
  return isMainMenuScreenKey()
    || key === "studyTeachingAids"
    || key === "studyAppLearning"
    || key.startsWith("schedule")
    || key.startsWith("date")
    || key.startsWith("weather")
    || key.startsWith("subject")
    || key.startsWith("people")
    || key === "outingSchool"
    || key === "outingSchoolFriends"
    || key.startsWith("outingSchool_p");
}

function appendQuickToiletTile(options = {}) {
  if (currentKey() === "toilet" || shouldHideQuickToiletOnScreen() || hasVisibleToiletTile()) return;
  if (!options.side && !options.free) return;
  if (options.side) {
    const sideControlCount = gridEl.querySelectorAll(".tile-nav-arrow").length + 1;
    gridEl.classList.add("grid--side-pager", "grid--side-pager-with-toilet");
    if (sideControlCount > 1) gridEl.classList.add("grid--side-pager-double");
    if (sideControlCount > 2) gridEl.classList.add("grid--side-pager-triple");
  }
  const btn = document.createElement("button");
  btn.className = options.side ? "tile quick-toilet-tile quick-toilet-side" : "tile quick-toilet-tile";
  btn.type = "button";

  const img = document.createElement("img");
  img.src = "./images/pee.png";
  img.alt = "화장실";
  setupImageElement(img, true);

  const label = document.createElement("div");
  label.className = "tile-label";
  label.textContent = "화장실";

  btn.appendChild(img);
  btn.appendChild(label);
  btn.addEventListener("click", goToToilet);
  gridEl.appendChild(btn);
}

function renderButtons(items, layout) {
  gridEl.innerHTML = "";
  const isMain  = layout === "main";
  const isMedia = layout === "media";
  const compactMainMenu = isMainMenuScreenKey() && window.matchMedia("(max-width: 760px)").matches;
  const usesSideFrame = (isMain || isMedia) && !compactMainMenu;
  const screen = DATA.screens[currentKey()] || {};
  const filteredItems = filterCompletedTeachingAidItems(items || []);
  const sideSlotItem = isMain && currentKey() === "mealRice"
    ? filteredItems.find((item) => item.sideSlot)
    : null;
  const rawItems = filteredItems;
  const hasToiletInScreen = rawItems.some((item) => item.label === "화장실");
  const shouldAddQuickToilet = currentKey() !== "toilet" && !hasToiletInScreen && !shouldHideQuickToiletOnScreen();
  const listItems = sideSlotItem ? filteredItems.filter((item) => item !== sideSlotItem) : filteredItems;
  const manualSideNavItems = usesSideFrame
    ? listItems.filter((item) => item.label === "다음" || item.label === "이전")
    : [];
  const manualContentItems = manualSideNavItems.length
    ? listItems.filter((item) => item.label !== "다음" && item.label !== "이전")
    : listItems;
  const pageInfo = sideSlotItem
    ? { items: listItems, page: 0, totalPages: 1, key: "", paged: false }
    : (usesSideFrame && manualSideNavItems.length)
      ? paginateItems(manualContentItems, layout, `manual-${currentKey()}`, 0, { sidePager: true })
      : paginateItems(listItems, layout, "", 0, {
          sidePager: usesSideFrame,
          firstPageSize: currentKey() === "toilet" ? 3 : undefined
        });
  const sideNavItems = usesSideFrame
    ? (manualSideNavItems.length
        ? (pageInfo.paged && pageInfo.page > 0 ? [] : manualSideNavItems)
        : pageInfo.items.filter((item) => item.label === "다음" || item.label === "이전"))
    : [];
  const visibleItems = sideNavItems.length
    ? pageInfo.items.filter((item) => item.label !== "다음" && item.label !== "이전")
    : pageInfo.items;
  const extraGridClass = `${currentKey() === "mealDrink" ? " grid--meal-drink" : ""}${currentKey() === "toilet" ? " grid--toilet" : ""}${compactMainMenu ? " grid--mobile-main-menu" : ""}`;
  const autoSideNavCount = usesSideFrame && pageInfo.paged
    ? Number(pageInfo.page > 0) + Number(pageInfo.page < pageInfo.totalPages - 1)
    : 0;
  const sideNavBaseCount = sideNavItems.length || autoSideNavCount;
  const sideControlCount = sideNavBaseCount + Number(shouldAddQuickToilet);
  const sideNavClass = usesSideFrame && sideControlCount
    ? ` grid--side-pager${sideControlCount > 1 ? " grid--side-pager-double" : ""}${sideControlCount > 2 ? " grid--side-pager-triple" : ""}${shouldAddQuickToilet ? " grid--side-pager-with-toilet" : ""}`
    : "";
  gridEl.className = isMain
    ? `grid${sideSlotItem ? " grid--side-pager grid--side-slot" : sideNavClass}${extraGridClass}`
    : (isMedia ? `grid media${sideNavClass}${extraGridClass}` : `grid detail${extraGridClass}`);

  function openWeatherVideo(item) {
    if (item.videoUrl) {
      openYoutubeDirect(item.videoUrl);
    } else if (item.videoQuery) {
      openYoutubeDirect(youtubeSearchUrl(item.videoQuery));
    } else {
      return;
    }
    playWeatherSound(item.label);
    speak(`${item.label} 영상 보기`);
  }

  function activateItem(item) {
    const yUrl = resolveYoutube(item);
    const speechText = item.speech || item.label;

    if (item.action === "waterSound") {
      toggleWaterSound();
      return;
    }

    if (item.audioUrl) {
      toggleMediaSound(item.audioUrl, item.loopAudio);
      return;
    }

    if (item.immediateNav && item.nav) {
      pushScreen(item.nav, item.label);
      render();
      return;
    }

    if (item.directOpen && yUrl) {
      window.location.href = yUrl;
      return;
    }

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
    if (isInTeachingAidFlow() && screen.teachingAidId && item.teachingAidId && !item.nav && !yUrl) {
      completeTeachingAid(teachingAidCurrentCompletionId(item), item.label || screen.title || "교구", screen.teachingAidId);
      render();
      return;
    }
    const moveAfterSpeech = () => window.setTimeout(() => {
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

    const speechDone = item.silent ? Promise.resolve() : Promise.resolve(speak(speechText));
    if (item.label === "다음" || item.label === "이전") {
      speechDone.finally(moveAfterSpeech);
    } else {
      moveAfterSpeech();
    }
  }

  visibleItems.forEach((item, index) => {
    const btn  = document.createElement("button");
    const yUrl = resolveYoutube(item);

    if ((isMain && item.image) || (isMedia && (item.image || yUrl))) {
      const isNavBtn = usesSideFrame && (item.label === "다음" || item.label === "이전");
      btn.className = isNavBtn ? "tile tile-nav" : "tile";
      if (currentKey() === "weatherHome" || currentKey() === "dateWeatherPicker") {
        btn.classList.add("tile--weather-choice");
      }
      if (!isNavBtn) {
        const img = document.createElement("img");
        img.src = item.image || getThumbnail(yUrl); img.alt = item.label;
        if (item.imageFit === "cover") img.classList.add("tile-img--cover");
        setupImageElement(img, index < 2 || !!(item.image && item.image.startsWith("./images/")));
        btn.appendChild(img);
      }
      const label = document.createElement("div");
      label.className = "tile-label"; label.textContent = item.label;
      btn.appendChild(label);
      if (currentKey() === "weatherHome" && item.videoQuery) {
        btn.classList.add("tile--has-video");
        const videoBtn = document.createElement("span");
        videoBtn.className = "tile-video-btn";
        videoBtn.textContent = "영상 보기";
        videoBtn.setAttribute("role", "button");
        videoBtn.setAttribute("tabindex", "0");
        videoBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          openWeatherVideo(item);
        });
        videoBtn.addEventListener("keydown", (e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          e.stopPropagation();
          openWeatherVideo(item);
        });
        btn.appendChild(videoBtn);
      }
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

    btn.addEventListener("click", (e) => {
      if (currentKey() === "weatherHome" && item.videoQuery && e.target.closest(".tile-video-btn")) {
        openWeatherVideo(item);
        return;
      }
      activateItem(item);
    });

    if (item.nav) {
      btn.addEventListener("pointerdown", () => prefetchScreenImages(item.nav), { passive: true });
    }
    gridEl.appendChild(btn);
  });

  if (currentKey() === "studyTeachingAids") {
    const resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.className = "tile";
    resetBtn.setAttribute("aria-label", "처음부터 다시");

    const art = document.createElement("div");
    art.className = "tile-art";
    art.textContent = "↻";

    const label = document.createElement("div");
    label.className = "tile-label";
    label.textContent = "처음부터 다시";

    resetBtn.appendChild(art);
    resetBtn.appendChild(label);
    resetBtn.addEventListener("click", () => {
      resetTeachingAidProgress();
      speak("처음부터 다시");
      render();
    });
    gridEl.appendChild(resetBtn);
  }

  sideNavItems.forEach((item) => {
    const btn = document.createElement("button");
    btn.className = `tile-nav-arrow tile-nav-arrow--${item.label === "이전" ? "prev" : "next"}`;
    btn.type = "button";
    btn.setAttribute("aria-label", item.label);
    btn.textContent = item.label;
    btn.addEventListener("click", () => activateItem(item));
    if (item.nav) {
      btn.addEventListener("pointerdown", () => prefetchScreenImages(item.nav), { passive: true });
    }
    gridEl.appendChild(btn);
  });
  if (sideSlotItem) {
    const btn = document.createElement("button");
    btn.className = "tile tile-side-slot";
    if (sideSlotItem.image) {
      const img = document.createElement("img");
      img.src = sideSlotItem.image;
      img.alt = sideSlotItem.label;
      setupImageElement(img, true);
      btn.appendChild(img);
    } else {
      const art = document.createElement("div");
      art.className = "tile-art";
      art.textContent = sideSlotItem.icon || "▶️";
      btn.appendChild(art);
    }
    const label = document.createElement("div");
    label.className = "tile-label";
    label.textContent = sideSlotItem.label;
    btn.appendChild(label);
    btn.addEventListener("click", () => activateItem(sideSlotItem));
    gridEl.appendChild(btn);
  } else {
    appendPagerButtons(gridEl, pageInfo, { sidePager: usesSideFrame });
  }
  appendQuickToiletTile({ side: usesSideFrame && !sideSlotItem && shouldAddQuickToilet });
}

function renderTeachingAidMissionComplete() {
  appMainEl.classList.remove("app--spotlight");
  spotlightViewEl.style.display = "none";
  spotlightBtnEl.onclick = null;
  heroEl.style.display = "none";
  gridEl.style.display = "";
  gridEl.innerHTML = "";
  gridEl.className = "teaching-aid-complete";
  helperEl.textContent = "모든 교구를 완료했어요.";

  const mark = document.createElement("div");
  mark.className = "teaching-aid-complete-mark";
  mark.textContent = "✓";

  const title = document.createElement("div");
  title.className = "teaching-aid-complete-title";
  title.textContent = "미션 클리어";

  const sub = document.createElement("div");
  sub.className = "teaching-aid-complete-sub";
  sub.textContent = "교구를 모두 해냈어요.";

  const resetBtn = document.createElement("button");
  resetBtn.type = "button";
  resetBtn.className = "btn main";
  resetBtn.textContent = "처음부터 다시";
  resetBtn.addEventListener("click", () => {
    resetTeachingAidProgress();
    speak("처음부터 다시");
    render();
  });

  gridEl.appendChild(mark);
  gridEl.appendChild(title);
  gridEl.appendChild(sub);
  gridEl.appendChild(resetBtn);
}

function renderTeachingAidEmptyComplete(screen) {
  appMainEl.classList.add("app--spotlight");
  spotlightViewEl.style.display = "none";
  spotlightBtnEl.onclick = null;
  heroEl.style.display = "none";
  gridEl.style.display = "";
  gridEl.innerHTML = "";
  gridEl.className = "teaching-aid-empty-complete";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn main teaching-aid-complete-button";
  btn.textContent = isTeachingAidComplete(currentKey()) ? "완료했어요" : "완료";
  btn.addEventListener("click", () => {
    completeTeachingAid(currentKey(), screen.title || "교구", screen.teachingAidId);
    render();
  });
  gridEl.appendChild(btn);
}

// ── 메인 렌더 ────────────────────────────────────────────────────────────────
function renderLocalVideo(screen) {
  appMainEl.classList.remove("app--spotlight");
  spotlightViewEl.style.display = "none";
  spotlightBtnEl.onclick = null;
  heroEl.style.display = "none";
  gridEl.style.display = "";
  gridEl.innerHTML = "";
  gridEl.className = "local-video-view";

  const videoData = screen.video || {};
  const video = document.createElement("video");
  video.className = "local-video-player";
  video.src = videoData.src || "";
  if (videoData.poster) video.poster = videoData.poster;
  video.controls = true;
  video.autoplay = true;
  video.loop = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.setAttribute("aria-label", videoData.label || screen.title || "동영상");
  video.addEventListener("click", () => {
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  });
  gridEl.appendChild(video);
  video.play().catch(() => {});
}

function render() {
  const key    = currentKey();
  const screen = DATA.screens[key] || DATA.screens.main;
  if (key !== "toilet") stopWaterSound();
  const isMain = key === "main";
  backBtn.style.display = isMain ? "none" : "inline-flex";
  homeBtn.style.display = isMain ? "none" : "inline-flex";
  titleEl.textContent = screen.title || "AAC";
  helperEl.textContent = screen.helper || "";
  if (isInTeachingAidFlow() && screen.teachingAidId && isTeachingAidComplete(currentKey())) {
    helperEl.textContent = `${screen.title || "교구"} 완료! 뒤로 가면 다음 교구만 남아요.`;
  }
  helperEl.style.display = "";
  const crumb = breadcrumbText();
  crumbEl.textContent = crumb;
  crumbEl.style.display = crumb ? "block" : "none";
  renderHero(screen.hero);

  if (screen.showPlayer) {
    playerWrapEl.style.display = "block";
    openInYoutubeButton.style.display = "inline-flex";
    returnHintEl.style.display = isAppleMobile ? "block" : "none";
    const screenYoutubeUrls = (screen.items || []).map((x) => resolveYoutube(x)).filter(Boolean);
    if (screenYoutubeUrls.length && selectedYoutube && !screenYoutubeUrls.includes(selectedYoutube))
      selectedYoutube = "";
    const firstUrl = screenYoutubeUrls[0] || "";
    if (!selectedYoutube && firstUrl) setPlayer(firstUrl);
  } else {
    playerWrapEl.style.display = "none";
    openInYoutubeButton.style.display = "none";
    returnHintEl.style.display = "none";
    playerEl.src = "";
  }

  const isSpotlight = screen.layout === "spotlight" && screen.spotlight?.image;
  const isEmpty     = screen.layout === "empty";


  if (key === "studyTeachingAids" && remainingTeachingAidItems().length === 0) {
    renderTeachingAidMissionComplete();
  } else if (key === "outingHome") {
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
  } else if (screen.layout === "studyPuzzle") {
    studyPuzzleFeature.render(screen);
  } else if (screen.layout === "recyclingGame") {
    recyclingGameFeature.render({ ...screen, key });
  } else if (screen.layout === "martCartGame") {
    martCartGameFeature.render({ ...screen, key });
  } else if (screen.layout === "trafficLightGame") {
    trafficLightGameFeature.render({ ...screen, key });
  } else if (screen.layout === "facePartsGame") {
    facePartsGameFeature.render({ ...screen, key });
  } else if (screen.layout === "localVideo") {
    renderLocalVideo(screen);
  } else if (isSpotlight) {
    appMainEl.classList.add("app--spotlight");
    spotlightViewEl.style.display = "flex";
    gridEl.style.display = "";
    gridEl.innerHTML = "";
    gridEl.className = "spotlight-toilet-wrap";
    spotlightImgEl.src = screen.spotlight.image;
    spotlightImgEl.alt = screen.spotlight.label || screen.title || "";
    setupImageElement(spotlightImgEl, true);
    const spotLabel = screen.spotlight.label || screen.title || "";
    spotlightBtnEl.setAttribute("aria-label", `${spotLabel}, 눌러서 읽기`);
    spotlightBtnEl.onclick = () => {
      if (isInTeachingAidFlow() && screen.teachingAidId) {
        completeTeachingAid(currentKey(), spotLabel, screen.teachingAidId);
        render();
        return;
      }
      speak(spotLabel);
    };
    appendQuickToiletTile({ free: true });
  } else if (isEmpty) {
    if (isInTeachingAidFlow() && screen.teachingAidId) {
      renderTeachingAidEmptyComplete(screen);
      return;
    }
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

  if (
    gridEl.style.display !== "none"
    && screen.layout !== "studyPuzzle"
    && screen.layout !== "recyclingGame"
    && screen.layout !== "martCartGame"
    && screen.layout !== "trafficLightGame"
    && screen.layout !== "facePartsGame"
    && screen.layout !== "localVideo"
    && !gridEl.classList.contains("teaching-aid-complete")
    && !gridEl.classList.contains("teaching-aid-empty-complete")
  ) {
    appendQuickToiletTile({ side: gridEl.classList.contains("grid--side-pager") });
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
  studyPuzzleFeature.clear();
  recyclingGameFeature.clear();
  martCartGameFeature.clear();
  facePartsGameFeature.clear();
  selectedYoutube = "";
  resetPageState();
  render();
});

fullscreenBtn.addEventListener("click", () => {
  toggleFullscreenMode();
});

document.addEventListener("fullscreenchange", syncFullscreenButton);
document.addEventListener("webkitfullscreenchange", syncFullscreenButton);

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

let resizeRenderTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeRenderTimer);
  resizeRenderTimer = setTimeout(render, 120);
});
window.addEventListener("orientationchange", () => {
  clearTimeout(resizeRenderTimer);
  resizeRenderTimer = setTimeout(render, 180);
});
syncFullscreenButton();

// ── 앱 시작 ──────────────────────────────────────────────────────────────────
render();
