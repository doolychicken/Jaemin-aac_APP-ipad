/**
 * Schedule feature module.
 *
 * Extracted from app.js to keep schedule state, persistence, and renderers
 * behind a small public interface.
 */
(function () {
  function createScheduleFeature(ctx) {
    const {
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
    } = ctx;
const THERAPY_MAX_SELECT = 3;
const THERAPY_OPTIONS = ["언어", "인지", "음악", "연하", "작업", "물리"];
const THERAPY_OPTIONS_BY_CENTER = {
  "큰나무병원":  ["언어", "인지", "음악"],
  "세브란스병원": ["언어", "작업", "연하", "물리"],
  "사람과소통":  ["언어"]
};
const THERAPY_CENTER_IMAGE = {
  "세브란스병원": "./images/therapy_center_severance.png",
  "사람과소통": "./images/therapy/communication_with_people.png"
};
const THERAPY_CLASS_IMAGE = {
  "언어": "./images/therapy_class_speech.png",
  "인지": "./images/therapy_class_cognitive.png",
  "음악": "./images/therapy_class_music.png",
  "물리": "./images/therapy/severance_physical_therapy.png"
};
const THERAPY_CLASS_EMOJI = {
  "언어": "🗣️", "인지": "🧠", "음악": "🎵",
  "연하": "💧", "작업": "🖐️", "물리": "🏃"
};
const therapySelection = {
  centers: [],          // 선택한 병원 이름 배열 (최대 2)
  classesByCenter: {}   // { "큰나무병원": ["언어", "인지"], ... }
};

const fridayTherapySelection = {
  slot1: { center: null, classes: [] },
  slot2: { center: null, classes: [] }
};

// ── 주간 스케줄 상수 및 상태 ─────────────────────────────────────────────────
const SCHEDULE_DAYS = ["월", "화", "수", "목", "금", "토", "일"];

const SCHEDULE_ACTIVITY_DEFS = [
  { type: "school",     label: "학교",       shortLabel: "학교",    image: "./images/school_classroom.png",         emoji: "🏫" },
  { type: "home",       label: "집",         shortLabel: "집",      image: "./images/home.png",                     emoji: "🏠" },
  { type: "큰나무",     label: "큰나무병원", shortLabel: "큰나무",  image: null,                                    emoji: "🌳" },
  { type: "세브란스",   label: "세브란스병원", shortLabel: "세브란스", image: "./images/therapy_center_severance.png", emoji: "🏥" },
  { type: "사람과소통", label: "사람과소통", shortLabel: "소통",    image: "./images/therapy/communication_with_people.png", emoji: "🗣️" },
  { type: "mart",       label: "마트",       shortLabel: "마트",    image: "./images/outing_mart1.png",             emoji: "🛒" },
  { type: "bakery",     label: "빵가게",     shortLabel: "빵가게",  image: "./images/outing_bakery.png",            emoji: "🥐" },
  { type: "cafe",       label: "카페",       shortLabel: "카페",    image: "./images/outing_cafe.png",              emoji: "☕" },
  { type: "park",       label: "공원",       shortLabel: "공원",    image: "./images/outing_park1.png",             emoji: "🌳" },
  { type: "calltaxi",  label: "장애인콜택시", shortLabel: "콜택시",  image: "./images/transport_calltaxi.png",       emoji: "🚕" },
  { type: "fieldtrip", label: "학교 현장학습", shortLabel: "현장학습", image: "./images/school bus.png",               emoji: "🚌" },
];

const SCHEDULE_PERSON_DEFS = [
  { label: "나",              image: "./images/outing_person_me.png",               emoji: "🙋",  groups: ["family"] },
  { label: "엄마",            image: "./images/outing_person_mom.png",              emoji: "👩",  groups: ["family", "home"] },
  { label: "아빠",            image: "./images/outing_person_dad.png",              emoji: "👨",  groups: ["family", "home"] },
  { label: "활동보조 선생님", image: "./images/outing_person_activity_support.png", emoji: "🤝",  groups: ["family", "school"] },
  { label: "할아버지",        image: "./images/outing_person_grandpa.png",          emoji: "👴",  groups: ["family", "home"] },
  { label: "할머니",          image: "./images/outing_person_grandma.png",          emoji: "👵",  groups: ["family", "home"] },
  { label: "큰나무 언어 선생님",  image: "./images/therapy_class_speech.png",    emoji: "🗣️", groups: ["큰나무"] },
  { label: "큰나무 인지 선생님",  image: "./images/therapy_class_cognitive.png", emoji: "🧠",  groups: ["큰나무"] },
  { label: "큰나무 음악 선생님",  image: "./images/therapy_class_music.png",     emoji: "🎵",  groups: ["큰나무"] },
  { label: "큰나무 작업 선생님",  image: null,                                   emoji: "🖐️", groups: ["큰나무"] },
  { label: "큰나무 물리 선생님",  image: null,                                   emoji: "🏃",  groups: ["큰나무"] },
  { label: "큰나무 연하 선생님",  image: null,                                   emoji: "💧",  groups: ["큰나무"] },
  { label: "세브란스 언어 선생님", image: null, emoji: "🗣️", groups: ["세브란스"] },
  { label: "세브란스 작업 선생님", image: null, emoji: "🖐️", groups: ["세브란스"] },
  { label: "세브란스 연하 선생님", image: null, emoji: "💧",  groups: ["세브란스"] },
  { label: "세브란스 물리 선생님", image: "./images/therapy/severance_physical_therapy.png", emoji: "🏃",  groups: ["세브란스"] },
  { label: "사람과소통 선생님",   image: "./images/therapy/communication_with_people.png", emoji: "🗣️", groups: ["사람과소통"] },
  { label: "담임선생님",        image: "./images/school_homeroom_teacher.png",       emoji: "👩‍🏫", groups: ["school"] },
  { label: "건민",             image: "./images/school_friends_건민.png",            emoji: "🧒",  groups: ["school"] },
  { label: "동하",             image: "./images/school_friends_동하.png",            emoji: "🧒",  groups: ["school"] },
  { label: "승우",             image: "./images/school_friends_승우.png",            emoji: "🧒",  groups: ["school"] },
  { label: "윤희",             image: "./images/school_friends_윤희.png",            emoji: "🧒",  groups: ["school"] },
  { label: "하린",             image: "./images/school_friends_하린.png",            emoji: "🧒",  groups: ["school"] },
];

function getDefaultWeeklySchedule() {
  return {
    "월": [{ type: "school", people: [] }, { type: "home", people: [] }],
    "화": [{ type: "school", people: [] }, { type: "home", people: [] }],
    "수": [{ type: "school", people: [] }, { type: "home", people: [] }],
    "목": [{ type: "school", people: [] }, { type: "home", people: [] }],
    "금": [{ type: "school", people: [] }, { type: "home", people: [] }],
    "토": [{ type: "home", people: [] }],
    "일": [{ type: "home", people: [] }],
  };
}

// 각 활동에 허용된 사람 그룹 정의 (오염 데이터 자동 정리용)
const ALLOWED_GROUPS_BY_ACT = {
  "school":     ["school"],
  "fieldtrip":  ["school"],
  "home":       ["home"],
  "큰나무":     ["큰나무"],
  "세브란스":   ["세브란스"],
  "사람과소통": ["사람과소통"],
  // 마트/카페/공원 등은 home 그룹만
  "_default":   ["home"],
};

function cleanWeeklySchedule(data) {
  const inGroup = (pd, g) => (pd.groups || [pd.group || ""]).includes(g);
  Object.values(data).forEach((acts) => {
    acts.forEach((act) => {
      const allowedGroups = ALLOWED_GROUPS_BY_ACT[act.type] || ALLOWED_GROUPS_BY_ACT["_default"];
      act.people = (act.people || []).filter((pLabel) => {
        const pd = SCHEDULE_PERSON_DEFS.find((p) => p.label === pLabel);
        if (!pd) return false;
        return allowedGroups.some((g) => inGroup(pd, g));
      });
    });
  });
  return data;
}

function loadWeeklySchedule() {
  try {
    const raw = localStorage.getItem("jaemin-weekly-v1");
    if (raw) {
      const parsed = JSON.parse(raw);
      return cleanWeeklySchedule(parsed);
    }
  } catch (_) {}
  return getDefaultWeeklySchedule();
}

function saveWeeklySchedule() {
  try {
    localStorage.setItem("jaemin-weekly-v1", JSON.stringify(weeklyScheduleData));
  } catch (_) {}
}

const WEEKLY_DAY_COLORS = [
  { bg: "#fef9c3", border: "#fbbf24", text: "#713f12" }, // 월 - 노랑
  { bg: "#ffedd5", border: "#fb923c", text: "#7c2d12" }, // 화 - 주황
  { bg: "#dcfce7", border: "#4ade80", text: "#14532d" }, // 수 - 초록
  { bg: "#dbeafe", border: "#60a5fa", text: "#1e3a8a" }, // 목 - 파랑
  { bg: "#ede9fe", border: "#a78bfa", text: "#4c1d95" }, // 금 - 보라
  { bg: "#fce7f3", border: "#f472b6", text: "#831843" }, // 토 - 핑크
  { bg: "#fee2e2", border: "#f87171", text: "#7f1d1d" }, // 일 - 빨강
];

function formatScheduleDayLabel(day) {
  return `${day}요일`;
}

function loadWeeklyPeriods() {
  try {
    const raw = localStorage.getItem("jaemin-weekly-periods-v1");
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return ["오전", "오후"];
}

function saveWeeklyPeriods() {
  try {
    localStorage.setItem("jaemin-weekly-periods-v1", JSON.stringify(weeklyPeriodLabels));
  } catch (_) {}
}

let weeklyScheduleData  = loadWeeklySchedule();
let weeklyPeriodLabels  = loadWeeklyPeriods();
let weeklyDetailAct     = null; // { type, people, day } — 상세 페이지용
let weeklySelectedDay   = null; // 하루 스케줄 페이지용
let weeklyDayEditMode   = false; // 하루 스케줄 수정 모드
let weeklyEditMode      = false;
let weeklyEditDay       = "월";
let weeklyEditPersonFor = null; // 사람 선택 중인 activity index (null = 활동 선택 단계)
let weeklyEditPeriods   = false; // 시간대 레이블 편집 중

// ── 집 스케줄 상태 ───────────────────────────────────────────────────────────
const HOME_ACTIVITY_GROUPS = [
  {
    id: "outing",
    label: "외출",
    image: "./images/outing.png",
    emoji: "🚶",
    activities: [
      { label: "장보기",     image: "./images/outing_mart1.png", emoji: "🛒", nav: "scheduleShopping" },
      { label: "분리수거장", image: "./images/home_schedule/recycling_station.png", emoji: "♻️" },
      { label: "하나로마트", image: "./images/home_schedule/hanaro_mart.png", emoji: "🛒" },
      { label: "홈플러스",   image: "./images/homeplus.png", emoji: "🛒" },
      { label: "한살림",     image: "./images/home_schedule/hansalim.png", emoji: "🥬" },
      { label: "파리바게트", image: "./images/home_schedule/paris_baguette.png", emoji: "🥐" },
      { label: "마포중앙도서관", image: "./images/mapocentral_library.png", emoji: "📚" },
      { label: "놀이터",     image: "./images/home_schedule/playground.png", emoji: "🛝" },
      { label: "우체국",     image: "./images/home_schedule/post_office.png", emoji: "📮" },
      { label: "소방서",     image: "./images/home_schedule/fire_station.png", emoji: "🚒" }
    ]
  },
  {
    id: "outingShopping",
    label: "외출 + 장보기",
    image: "./images/outing_mart1.png",
    emoji: "🛒",
    activities: [
      { label: "분리수거장", image: "./images/home_schedule/recycling_station.png", emoji: "♻️" },
      { label: "하나로마트", image: "./images/home_schedule/hanaro_mart.png", emoji: "🛒" },
      { label: "홈플러스",   image: "./images/homeplus.png", emoji: "🛒" },
      { label: "한살림",     image: "./images/home_schedule/hansalim.png", emoji: "🥬" },
      { label: "파리바게트", image: "./images/home_schedule/paris_baguette.png", emoji: "🥐" },
      { label: "마포중앙도서관", image: "./images/mapocentral_library.png", emoji: "📚" },
      { label: "놀이터",     image: "./images/home_schedule/playground.png", emoji: "🛝" },
      { label: "우체국",     image: "./images/home_schedule/post_office.png", emoji: "📮" },
      { label: "소방서",     image: "./images/home_schedule/fire_station.png", emoji: "🚒" }
    ]
  },
  {
    id: "home",
    label: "집에만 있을 때",
    image: "./images/home.png",
    emoji: "🏠",
    activities: [
      { label: "간식 먹기", image: "./images/meal_eggtart.png", emoji: "🍪" },
      { label: "밥 먹기",   image: "./images/meal.png", emoji: "🍚" },
      { label: "샤워하기", image: "./images/shower.png", emoji: "🚿" },
      { label: "양치하기", image: "./images/brush.png", emoji: "🪥" },
      { label: "잠자기",   image: null, emoji: "😴" }
    ]
  }
];
const HOME_ACTIVITIES = HOME_ACTIVITY_GROUPS.flatMap((group) => group.activities);
let homeActivityGroupId = "";
let homeScheduleGroupId = "";
let homeActivityPage = 0;
let homeSchedule = [];
let homeScheduleRemaining = [];
let homeShoppingTargetLabel = "";

const SHOPPING_PLACES = [
  {
    id: "hanaro",
    label: "하나로마트",
    image: "./images/home_schedule/hanaro_mart.png",
    items: [
      { label: "물", image: "./images/water.png" },
      { label: "우유", image: "./images/meal_milk.png" },
      { label: "두유", image: "./images/meal_soymilk.png" },
      { label: "주스", image: "./images/meal_juice.png" },
      { label: "바나나", image: "./images/bannana.png" },
      { label: "딸기", image: "./images/strawberry.png" }
    ]
  },
  {
    id: "hansalim",
    label: "한살림",
    image: "./images/home_schedule/hansalim.png",
    items: [
      { label: "계란", image: "./images/eggs.png" },
      { label: "우유", image: "./images/meal_milk.png" },
      { label: "두유", image: "./images/meal_soymilk.png" },
      { label: "사과", image: "./images/apple.png" },
      { label: "토마토", image: "./images/tomato.png" },
      { label: "물", image: "./images/water.png" }
    ]
  },
  {
    id: "homeplus",
    label: "홈플러스",
    image: "./images/homeplus.png",
    items: [
      { label: "물", image: "./images/water.png" },
      { label: "우유", image: "./images/meal_milk.png" },
      { label: "두유", image: "./images/meal_soymilk.png" },
      { label: "주스", image: "./images/meal_juice.png" },
      { label: "요구르트", image: "./images/yogurt_drink.png" },
      { label: "바나나", image: "./images/bannana.png" }
    ]
  },
  {
    id: "paris",
    label: "파리바게트",
    image: "./images/home_schedule/paris_baguette.png",
    items: [
      { label: "빵", image: "./images/outing_bakery.png" },
      { label: "에그타르트", image: "./images/meal_eggtart.png" },
      { label: "우유", image: "./images/meal_milk.png" },
      { label: "주스", image: "./images/meal_juice.png" },
      { label: "케이크", image: "./images/outing_bakery.png" },
      { label: "샌드위치", image: "./images/outing_bakery.png" }
    ]
  }
];
let shoppingPlace = null;
let shoppingItems = [];
let shoppingRemaining = [];

function isOutingScheduleGroup(groupOrId) {
  const id = typeof groupOrId === "string" ? groupOrId : groupOrId?.id;
  return id === "outing" || id === "outingShopping";
}

function isOutingShoppingMode() {
  return homeActivityGroupId === "outingShopping";
}

function getShoppingPlaceByLabel(label) {
  return SHOPPING_PLACES.find((place) => place.label === label) || null;
}

function getHomeScheduleEntryLabel(entry) {
  return typeof entry === "string" ? entry : entry?.label || "";
}

function getHomeScheduleEntryIndex(label) {
  return homeSchedule.findIndex((entry) => getHomeScheduleEntryLabel(entry) === label);
}

function getHomeScheduleEntry(label) {
  const idx = getHomeScheduleEntryIndex(label);
  return idx >= 0 ? homeSchedule[idx] : null;
}

function getHomeScheduleActivity(entry) {
  const label = getHomeScheduleEntryLabel(entry);
  const activeGroup = HOME_ACTIVITY_GROUPS.find((group) => group.id === homeActivityGroupId);
  return activeGroup?.activities.find((item) => item.label === label)
    || HOME_ACTIVITIES.find((item) => item.label === label)
    || null;
}

function makeHomeScheduleEntry(activity) {
  if (!isOutingShoppingMode()) return activity.label;
  const place = getShoppingPlaceByLabel(activity.label);
  return {
    label: activity.label,
    image: activity.image,
    emoji: activity.emoji,
    canShop: !!place,
    items: []
  };
}

function buildHomeScheduleRunSteps() {
  const steps = [];
  homeSchedule.forEach((entry) => {
    const activity = getHomeScheduleActivity(entry) || {};
    const label = getHomeScheduleEntryLabel(entry);
    const itemEntry = typeof entry === "string" ? null : entry;
    steps.push({
      label,
      speech: label,
      image: itemEntry?.image || activity.image,
      emoji: itemEntry?.emoji || activity.emoji,
      order: steps.length + 1
    });
    (itemEntry?.items || []).forEach((item) => {
      steps.push({
        label: `${item.label} 사요`,
        speech: `${item.label} 사요`,
        image: item.image,
        emoji: item.emoji || "🛒",
        order: steps.length + 1
      });
    });
  });
  return steps;
}
const schedulePager = window.createTilePager({
  getScopeKey: () => navStack.map((x) => x.key).join("/"),
  render,
  speak
});

function paginateScheduleList(list, suffix, reserveSlots = 0) {
  return schedulePager.paginate(list, suffix, { reserveSlots });
}

function appendSchedulePager(pageInfo) {
  schedulePager.append(gridEl, pageInfo);
}

// ── 날짜 선택 상태 ───────────────────────────────────────────────────────────

function buildTherapyPlanItems() {
  const result = [
    { label: "1. 학교가요",         image: "./images/school_classroom.png" },
    { label: "2. 장애인 콜택시 타요", image: "./images/transport_calltaxi.png" }
  ];
  let idx = 3;
  therapySelection.centers.forEach((center) => {
    const classes = therapySelection.classesByCenter[center] || [];
    result.push({
      label: `${idx++}. ${center} 치료실 가요`,
      ...(THERAPY_CENTER_IMAGE[center] ? { image: THERAPY_CENTER_IMAGE[center] } : {})
    });
    classes.forEach((cls) => result.push({
      label: `${idx++}. ${cls} 수업 받아요`,
      ...(THERAPY_CLASS_IMAGE[cls] ? { image: THERAPY_CLASS_IMAGE[cls] } : {})
    }));
    result.push({ label: `${idx++}. 장애인 콜택시 타요`, image: "./images/transport_calltaxi.png" });
  });
  result.push({ label: `${idx}. 집에 와요`, image: "./images/home.png" });
  return result;
}

function renderCenterPicker() {
  appMainEl.classList.remove("app--spotlight");
  spotlightViewEl.style.display = "none";
  spotlightBtnEl.onclick = null;
  heroEl.style.display = "none";
  heroEl.className = "hero";
  gridEl.style.display = "";
  gridEl.innerHTML = "";
  gridEl.className = "grid outing-picker";

  const _stamp = navStack.map((x) => x.key).join(",");
  if (therapySelection._stamp !== _stamp) {
    therapySelection._stamp = _stamp;
    therapySelection.centers = [];
    therapySelection.classesByCenter = {};
  }

  const CENTERS = ["큰나무병원", "세브란스병원", "사람과소통"];
  const CENTER_EMOJI = { "큰나무병원": "🌳", "세브란스병원": "🏥", "사람과소통": "🗣️" };
  const MAX_CENTERS = 2;

  CENTERS.forEach((name) => {
    const btn = document.createElement("button");
    const selected = therapySelection.centers.includes(name);
    btn.className = `tile${selected ? " is-selected" : ""}`;
    if (THERAPY_CENTER_IMAGE[name]) {
      const img = document.createElement("img");
      img.src = THERAPY_CENTER_IMAGE[name];
      img.alt = name;
      setupImageElement(img, true);
      btn.appendChild(img);
    } else {
      const art = document.createElement("div");
      art.className = "tile-art";
      art.textContent = CENTER_EMOJI[name] || "🏥";
      btn.appendChild(art);
    }
    const label = document.createElement("div");
    label.className = "tile-label";
    label.textContent = name;
    btn.appendChild(label);
    if (selected) {
      const check = document.createElement("span");
      check.className = "tile-check";
      check.textContent = therapySelection.centers.length > 1
        ? `${therapySelection.centers.indexOf(name) + 1}` : "✓";
      btn.appendChild(check);
    }
    btn.addEventListener("click", () => {
      speak(name);
      const idx = therapySelection.centers.indexOf(name);
      if (idx >= 0) therapySelection.centers.splice(idx, 1);
      else if (therapySelection.centers.length < MAX_CENTERS) therapySelection.centers.push(name);
      render();
    });
    gridEl.appendChild(btn);
  });

  const nextBtn = document.createElement("button");
  nextBtn.className = "btn main";
  nextBtn.disabled = therapySelection.centers.length === 0;
  nextBtn.textContent = therapySelection.centers.length === 0
    ? "치료실을 선택하세요"
    : `다음 → ${therapySelection.centers[0]} 수업 선택`;
  nextBtn.addEventListener("click", () => {
    if (!therapySelection.centers.length) return;
    speak("수업 선택");
    pushScreen("scheduleTodayClassesA", `${therapySelection.centers[0]} 수업`);
    render();
  });
  gridEl.appendChild(nextBtn);
}

function renderClassPicker(centerIndex) {
  appMainEl.classList.remove("app--spotlight");
  spotlightViewEl.style.display = "none";
  spotlightBtnEl.onclick = null;
  heroEl.style.display = "none";
  heroEl.className = "hero";
  gridEl.style.display = "";
  gridEl.innerHTML = "";
  gridEl.className = "grid outing-picker";

  const center = therapySelection.centers[centerIndex] || "";
  if (!therapySelection.classesByCenter[center]) therapySelection.classesByCenter[center] = [];
  const selected = therapySelection.classesByCenter[center];
  const centerOptions = THERAPY_OPTIONS_BY_CENTER[center] || THERAPY_OPTIONS;

  const headerBtn = document.createElement("button");
  headerBtn.className = "btn main";
  headerBtn.style.cssText = "pointer-events:none; opacity:0.75; grid-column:1/-1;";
  headerBtn.textContent = `${centerIndex + 1}번째 치료실: ${center}`;
  gridEl.appendChild(headerBtn);

  centerOptions.forEach((name) => {
    const btn = document.createElement("button");
    const isSelected = selected.includes(name);
    btn.className = `tile${isSelected ? " is-selected" : ""}`;
    if (THERAPY_CLASS_IMAGE[name]) {
      const img = document.createElement("img");
      img.src = THERAPY_CLASS_IMAGE[name];
      img.alt = name;
      setupImageElement(img, true);
      btn.appendChild(img);
    } else {
      const art = document.createElement("div");
      art.className = "tile-art";
      art.textContent = THERAPY_CLASS_EMOJI[name] || "🧩";
      btn.appendChild(art);
    }
    const label = document.createElement("div");
    label.className = "tile-label";
    label.textContent = name;
    btn.appendChild(label);
    if (isSelected) {
      const check = document.createElement("span");
      check.className = "tile-check";
      check.textContent = "✓";
      btn.appendChild(check);
    }
    btn.addEventListener("click", () => {
      speak(name);
      const idx = selected.indexOf(name);
      if (idx >= 0) selected.splice(idx, 1);
      else selected.push(name);
      render();
    });
    gridEl.appendChild(btn);
  });

  const isLast = centerIndex >= therapySelection.centers.length - 1;
  const doneBtn = document.createElement("button");
  doneBtn.className = "btn main";
  doneBtn.disabled = selected.length === 0;
  doneBtn.textContent = selected.length === 0
    ? "수업을 한 개 이상 선택하세요"
    : isLast
      ? `완료 (${selected.length}개 선택)`
      : `다음 → ${therapySelection.centers[centerIndex + 1]} 수업 선택`;
  doneBtn.addEventListener("click", () => {
    if (!selected.length) return;
    if (!isLast) {
      speak("다음 수업 선택");
      pushScreen("scheduleTodayClassesB", `${therapySelection.centers[centerIndex + 1]} 수업`);
    } else {
      speak("수업 선택 완료");
      DATA.screens.scheduleTodayTherapyResult.items = buildTherapyPlanItems();
      pushScreen("scheduleTodayTherapyResult", "오늘 일정");
    }
    render();
  });
  gridEl.appendChild(doneBtn);
}

// 이전 코드 호환용
function renderTherapyPicker(screen) { renderClassPicker(screen.centerIndex || 0); }

// ── 집 스케줄 활동 선택 ────────────────────────────────────────────────────
function renderHomeActivityPicker() {
  appMainEl.classList.remove("app--spotlight");
  spotlightViewEl.style.display = "none";
  spotlightBtnEl.onclick = null;
  heroEl.style.display = "none";
  heroEl.className = "hero";
  gridEl.style.display = "";
  gridEl.innerHTML = "";
  gridEl.className = "grid home-activity-picker";

  function appendActivityTile(activity) {
    const orderIdx = getHomeScheduleEntryIndex(activity.label);
    const isSelected = orderIdx >= 0;
    const btn = document.createElement("button");
    btn.className = `tile${isSelected ? " is-selected" : ""}`;

    if (activity.image) {
      const img = document.createElement("img");
      img.src = activity.image;
      img.alt = activity.label;
      setupImageElement(img, true);
      img.addEventListener("error", () => {
        img.remove();
        const art = document.createElement("div");
        art.className = "tile-art";
        art.textContent = activity.emoji;
        btn.insertBefore(art, btn.firstChild);
      }, { once: true });
      btn.appendChild(img);
    } else {
      const art = document.createElement("div");
      art.className = "tile-art";
      art.textContent = activity.emoji;
      btn.appendChild(art);
    }

    const lbl = document.createElement("div");
    lbl.className = "tile-label";
    lbl.textContent = activity.label;
    btn.appendChild(lbl);

    if (isSelected) {
      const check = document.createElement("span");
      check.className = "tile-check";
      check.textContent = String(orderIdx + 1);
      btn.appendChild(check);
    }

    btn.addEventListener("click", () => {
      if (activity.nav) {
        speak(activity.label);
        pushScreen(activity.nav, activity.label);
        render();
        return;
      }
      speak(activity.label);
      const idx = getHomeScheduleEntryIndex(activity.label);
      if (isOutingShoppingMode()) {
        const place = getShoppingPlaceByLabel(activity.label);
        if (idx >= 0 && place) {
          homeShoppingTargetLabel = activity.label;
        } else if (idx >= 0) {
          homeSchedule.splice(idx, 1);
        } else {
          homeSchedule.push(makeHomeScheduleEntry(activity));
          if (place) homeShoppingTargetLabel = activity.label;
        }
      } else if (idx >= 0) {
        homeSchedule.splice(idx, 1);
      } else {
        homeSchedule.push(activity.label);
      }
      render();
    });

    gridEl.appendChild(btn);
  }

  function appendControls() {
    if (!homeActivityGroupId) return;

    const actions = document.createElement("div");
    actions.className = "home-activity-actions";

    const backBtn = document.createElement("button");
    backBtn.className = "btn";
    backBtn.textContent = "뒤로 가기";
    backBtn.addEventListener("click", () => {
      homeActivityGroupId = "";
      homeActivityPage = 0;
      speak("뒤로 가기");
      render();
    });
    actions.appendChild(backBtn);

    const startBtn = document.createElement("button");
    startBtn.className = "btn main";
    startBtn.disabled = homeSchedule.length === 0;
    const runStepCount = buildHomeScheduleRunSteps().length;
    startBtn.textContent = homeSchedule.length === 0
      ? "할 일을 선택하세요"
      : `시작하기 → (${runStepCount}단계)`;
    startBtn.addEventListener("click", () => {
      if (!homeSchedule.length) return;
      homeScheduleRemaining = buildHomeScheduleRunSteps();
      speak("시작해봐요");
      pushScreen("scheduleHomeRun", "집 스케줄 실행");
      render();
    });
    actions.appendChild(startBtn);
    gridEl.appendChild(actions);
  }

  function appendHomeActivityPager(group) {
    if (!isOutingScheduleGroup(group) || group.activities.length <= 6) return;

    const btn = document.createElement("button");
    const label = homeActivityPage === 0 ? "다음" : "이전";
    btn.className = `tile-nav-arrow tile-nav-arrow--${label === "이전" ? "prev" : "next"}`;
    btn.type = "button";
    btn.setAttribute("aria-label", label);
    btn.textContent = label;
    btn.addEventListener("click", () => {
      homeActivityPage = homeActivityPage === 0 ? 1 : 0;
      speak(label);
      render();
    });
    gridEl.appendChild(btn);
  }

  function renderHomeShoppingItems(group) {
    const place = getShoppingPlaceByLabel(homeShoppingTargetLabel);
    const activity = group.activities.find((item) => item.label === homeShoppingTargetLabel);
    const entryIndex = getHomeScheduleEntryIndex(homeShoppingTargetLabel);
    if (!place || !activity || entryIndex < 0) {
      homeShoppingTargetLabel = "";
      return false;
    }

    if (typeof homeSchedule[entryIndex] === "string") {
      homeSchedule[entryIndex] = makeHomeScheduleEntry(activity);
    }
    const entry = homeSchedule[entryIndex];
    if (!Array.isArray(entry.items)) entry.items = [];

    titleEl.textContent = `${place.label}에서 살 물건`;
    helperEl.textContent = "살 물건을 골라요. 다 고르면 장소 선택으로 돌아가요.";
    gridEl.className = "grid home-activity-picker";

    place.items.forEach((item) => {
      const selectedIndex = entry.items.findIndex((picked) => picked.label === item.label);
      const btn = document.createElement("button");
      btn.className = `tile${selectedIndex >= 0 ? " is-selected" : ""}`;
      if (item.image) {
        const img = document.createElement("img");
        img.src = item.image;
        img.alt = item.label;
        setupImageElement(img, true);
        btn.appendChild(img);
      } else {
        const art = document.createElement("div");
        art.className = "tile-art";
        art.textContent = item.emoji || "🛒";
        btn.appendChild(art);
      }
      const lbl = document.createElement("div");
      lbl.className = "tile-label";
      lbl.textContent = item.label;
      btn.appendChild(lbl);
      if (selectedIndex >= 0) {
        const check = document.createElement("span");
        check.className = "tile-check";
        check.textContent = String(selectedIndex + 1);
        btn.appendChild(check);
      }
      btn.addEventListener("click", () => {
        speak(item.label);
        const idx = entry.items.findIndex((picked) => picked.label === item.label);
        if (idx >= 0) entry.items.splice(idx, 1);
        else entry.items.push(item);
        render();
      });
      gridEl.appendChild(btn);
    });

    const actions = document.createElement("div");
    actions.className = "home-activity-actions";

    const removeBtn = document.createElement("button");
    removeBtn.className = "btn";
    removeBtn.textContent = "장소 빼기";
    removeBtn.addEventListener("click", () => {
      homeSchedule.splice(entryIndex, 1);
      homeShoppingTargetLabel = "";
      speak("장소 빼기");
      render();
    });
    actions.appendChild(removeBtn);

    const doneBtn = document.createElement("button");
    doneBtn.className = "btn main";
    doneBtn.textContent = "장소 선택으로";
    doneBtn.addEventListener("click", () => {
      homeShoppingTargetLabel = "";
      speak("장소 선택으로");
      render();
    });
    actions.appendChild(doneBtn);
    gridEl.appendChild(actions);
    return true;
  }

  if (!homeActivityGroupId) {
    titleEl.textContent = "집 스케줄 만들기";
    helperEl.textContent = "외출인지, 집에만 있을 때인지 먼저 골라요.";
    HOME_ACTIVITY_GROUPS.forEach((group) => {
      const btn = document.createElement("button");
      btn.className = "tile";
      if (group.image) {
        const img = document.createElement("img");
        img.src = group.image;
        img.alt = group.label;
        setupImageElement(img, true);
        btn.appendChild(img);
      } else {
        const art = document.createElement("div");
        art.className = "tile-art";
        art.textContent = group.emoji;
        btn.appendChild(art);
      }
      const lbl = document.createElement("div");
      lbl.className = "tile-label";
      lbl.textContent = group.label;
      btn.appendChild(lbl);
      btn.addEventListener("click", () => {
        if (homeScheduleGroupId && homeScheduleGroupId !== group.id) homeSchedule = [];
        homeActivityGroupId = group.id;
        homeScheduleGroupId = group.id;
        homeActivityPage = 0;
        homeShoppingTargetLabel = "";
        speak(group.label);
        render();
      });
      gridEl.appendChild(btn);
    });
    return;
  }

  const group = HOME_ACTIVITY_GROUPS.find((item) => item.id === homeActivityGroupId) || HOME_ACTIVITY_GROUPS[0];
  if (isOutingShoppingMode() && homeShoppingTargetLabel && renderHomeShoppingItems(group)) return;

  titleEl.textContent = `${group.label} 스케줄`;
  helperEl.textContent = isOutingShoppingMode()
    ? "장소를 순서대로 고르고, 마트와 빵집은 살 물건도 골라요."
    : "할 일을 클릭한 순서대로 골라요. 다시 누르면 취소돼요.";
  if (isOutingScheduleGroup(group) && group.activities.length > 6) {
    gridEl.className = "grid home-activity-picker grid--side-pager";
  }
  const visibleActivities = isOutingScheduleGroup(group)
    ? group.activities.slice(homeActivityPage === 0 ? 0 : 6, homeActivityPage === 0 ? 6 : group.activities.length)
    : group.activities;
  visibleActivities.forEach(appendActivityTile);
  appendHomeActivityPager(group);
  appendControls();
}

// ── 집 스케줄 실행 화면 ───────────────────────────────────────────────────
function renderHomeScheduleRunner() {
  appMainEl.classList.remove("app--spotlight");
  spotlightViewEl.style.display = "none";
  spotlightBtnEl.onclick = null;
  heroEl.style.display = "none";
  heroEl.className = "hero";
  gridEl.style.display = "";
  gridEl.innerHTML = "";
  gridEl.className = "grid home-runner-grid";

  // 모두 완료
  if (homeScheduleRemaining.length === 0) {
    const doneWrap = document.createElement("div");
    doneWrap.className = "home-runner-complete";
    const emoji = document.createElement("div");
    emoji.className = "home-runner-complete-emoji";
    emoji.textContent = "🎉";
    const msg = document.createElement("div");
    msg.className = "home-runner-complete-text";
    msg.textContent = "모두 다 했어요!";
    const sub = document.createElement("div");
    sub.className = "home-runner-complete-sub";
    sub.textContent = "정말 잘했어요!";
    doneWrap.appendChild(emoji);
    doneWrap.appendChild(msg);
    doneWrap.appendChild(sub);
    gridEl.appendChild(doneWrap);

    const againBtn = document.createElement("button");
    againBtn.className = "btn main";
    againBtn.style.cssText = "grid-column:1/-1; margin-top:8px;";
    againBtn.textContent = "처음부터 다시";
    againBtn.addEventListener("click", () => {
      homeScheduleRemaining = buildHomeScheduleRunSteps();
      render();
    });
    gridEl.appendChild(againBtn);
    return;
  }

  // helperEl에 남은 개수 표시
  helperEl.textContent = `남은 할 일: ${homeScheduleRemaining.length}가지 · 큰 카드를 눌러서 완료`;

  const rawStep = homeScheduleRemaining[0];
  const label = typeof rawStep === "string" ? rawStep : rawStep.label;
  const activity = typeof rawStep === "string"
    ? HOME_ACTIVITIES.find((a) => a.label === label)
    : rawStep;
  const originalOrder = typeof rawStep === "string"
    ? Math.max(getHomeScheduleEntryIndex(label), 0) + 1
    : rawStep.order || 1;
  const btn = document.createElement("button");
  btn.className = "tile home-runner-tile home-runner-current";

  if (activity?.image) {
    const img = document.createElement("img");
    img.src = activity.image;
    img.alt = label;
    setupImageElement(img, true);
    img.addEventListener("error", () => {
      img.remove();
      const art = document.createElement("div");
      art.className = "tile-art";
      art.textContent = activity?.emoji || "✅";
      btn.insertBefore(art, btn.firstChild);
    }, { once: true });
    btn.appendChild(img);
  } else {
    const art = document.createElement("div");
    art.className = "tile-art";
    art.textContent = activity?.emoji || "✅";
    btn.appendChild(art);
  }

  const lbl = document.createElement("div");
  lbl.className = "tile-label";
  lbl.textContent = label;
  btn.appendChild(lbl);

  const numBadge = document.createElement("span");
  numBadge.className = "tile-check";
  numBadge.textContent = String(originalOrder);
  btn.appendChild(numBadge);

  btn.addEventListener("click", () => {
    btn.disabled = true;
    const afterSpeech = Promise.resolve(speak(`${activity?.speech || label} 완료!`));
    afterSpeech.finally(() => {
      btn.classList.add("home-runner-done-anim");
      btn.addEventListener("animationend", () => {
        const finishedAll = homeScheduleRemaining.length === 1;
        homeScheduleRemaining.shift();
        render();
        if (finishedAll) {
          window.setTimeout(() => speak("모두 다 했어요! 정말 잘했어요!"), 250);
        }
      }, { once: true });
    });
  });

  gridEl.appendChild(btn);

  // 처음부터 다시 버튼
  const resetBtn = document.createElement("button");
  resetBtn.className = "btn";
  resetBtn.style.cssText = "grid-column:1/-1; background:#f1f5f9; color:#64748b; min-height:56px; font-size:1rem;";
  resetBtn.textContent = "처음부터 다시";
  resetBtn.addEventListener("click", () => {
    homeScheduleRemaining = buildHomeScheduleRunSteps();
    render();
  });
  gridEl.appendChild(resetBtn);
}

// ── 장보기 AAC ──────────────────────────────────────────────────────────────
function renderShoppingPlanner() {
  appMainEl.classList.remove("app--spotlight");
  spotlightViewEl.style.display = "none";
  spotlightBtnEl.onclick = null;
  heroEl.style.display = "none";
  heroEl.className = "hero";
  gridEl.style.display = "";
  gridEl.innerHTML = "";
  gridEl.className = "grid home-activity-picker";

  function appendImageOrEmoji(btn, item, fallbackEmoji) {
    if (item.image) {
      const img = document.createElement("img");
      img.src = item.image;
      img.alt = item.label;
      setupImageElement(img, true);
      img.addEventListener("error", () => {
        img.remove();
        const art = document.createElement("div");
        art.className = "tile-art";
        art.textContent = item.emoji || fallbackEmoji || "🛒";
        btn.insertBefore(art, btn.firstChild);
      }, { once: true });
      btn.appendChild(img);
    } else {
      const art = document.createElement("div");
      art.className = "tile-art";
      art.textContent = item.emoji || fallbackEmoji || "🛒";
      btn.appendChild(art);
    }
  }

  function appendTile(item, onClick, selectedIndex = -1) {
    const btn = document.createElement("button");
    btn.className = `tile${selectedIndex >= 0 ? " is-selected" : ""}`;
    appendImageOrEmoji(btn, item, "🛒");
    const lbl = document.createElement("div");
    lbl.className = "tile-label";
    lbl.textContent = item.label;
    btn.appendChild(lbl);
    if (selectedIndex >= 0) {
      const check = document.createElement("span");
      check.className = "tile-check";
      check.textContent = String(selectedIndex + 1);
      btn.appendChild(check);
    }
    btn.addEventListener("click", onClick);
    gridEl.appendChild(btn);
  }

  function appendControls() {
    const actions = document.createElement("div");
    actions.className = "home-activity-actions";

    const placeBtn = document.createElement("button");
    placeBtn.className = "btn";
    placeBtn.textContent = "장소 다시";
    placeBtn.addEventListener("click", () => {
      shoppingPlace = null;
      shoppingItems = [];
      speak("장소 다시");
      render();
    });
    actions.appendChild(placeBtn);

    const startBtn = document.createElement("button");
    startBtn.className = "btn main";
    startBtn.disabled = shoppingItems.length === 0;
    startBtn.textContent = shoppingItems.length === 0
      ? "살 물건을 선택하세요"
      : `장보기 시작 → (${shoppingItems.length}개)`;
    startBtn.addEventListener("click", () => {
      if (!shoppingPlace || shoppingItems.length === 0) return;
      shoppingRemaining = [
        { type: "place", label: `${shoppingPlace.label}에 가요`, image: shoppingPlace.image, speech: `${shoppingPlace.label}에 가요` },
        ...shoppingItems.map((item) => ({
          type: "item",
          label: `${item.label} 사요`,
          image: item.image,
          emoji: item.emoji,
          speech: `${item.label} 사요`
        }))
      ];
      speak("장보기 시작");
      pushScreen("scheduleShoppingRun", "장보기 실행");
      render();
    });
    actions.appendChild(startBtn);
    gridEl.appendChild(actions);
  }

  if (!shoppingPlace) {
    titleEl.textContent = "장보기";
    helperEl.textContent = "어디로 갈까요?";
    SHOPPING_PLACES.forEach((place) => {
      appendTile(place, () => {
        shoppingPlace = place;
        shoppingItems = [];
        speak(place.label);
        render();
      });
    });
    return;
  }

  titleEl.textContent = `${shoppingPlace.label} 장보기`;
  helperEl.textContent = "살 물건을 클릭한 순서대로 골라요. 다시 누르면 취소돼요.";
  shoppingPlace.items.forEach((item) => {
    const selectedIndex = shoppingItems.findIndex((picked) => picked.label === item.label);
    appendTile(item, () => {
      speak(item.speech || item.label);
      const idx = shoppingItems.findIndex((picked) => picked.label === item.label);
      if (idx >= 0) shoppingItems.splice(idx, 1);
      else shoppingItems.push(item);
      render();
    }, selectedIndex);
  });
  appendControls();
}

function renderShoppingRunner() {
  appMainEl.classList.remove("app--spotlight");
  spotlightViewEl.style.display = "none";
  spotlightBtnEl.onclick = null;
  heroEl.style.display = "none";
  heroEl.className = "hero";
  gridEl.style.display = "";
  gridEl.innerHTML = "";
  gridEl.className = "grid home-runner-grid";

  if (shoppingRemaining.length === 0) {
    const doneWrap = document.createElement("div");
    doneWrap.className = "home-runner-complete";
    const emoji = document.createElement("div");
    emoji.className = "home-runner-complete-emoji";
    emoji.textContent = "🛒";
    const msg = document.createElement("div");
    msg.className = "home-runner-complete-text";
    msg.textContent = "장보기를 다 했어요!";
    const sub = document.createElement("div");
    sub.className = "home-runner-complete-sub";
    sub.textContent = "정말 잘했어요!";
    doneWrap.appendChild(emoji);
    doneWrap.appendChild(msg);
    doneWrap.appendChild(sub);
    gridEl.appendChild(doneWrap);

    const againBtn = document.createElement("button");
    againBtn.className = "btn main";
    againBtn.style.cssText = "grid-column:1/-1; margin-top:8px;";
    againBtn.textContent = "다시 장보기";
    againBtn.addEventListener("click", () => {
      shoppingRemaining = [
        { type: "place", label: `${shoppingPlace.label}에 가요`, image: shoppingPlace.image, speech: `${shoppingPlace.label}에 가요` },
        ...shoppingItems.map((item) => ({ type: "item", label: `${item.label} 사요`, image: item.image, emoji: item.emoji, speech: `${item.label} 사요` }))
      ];
      render();
    });
    gridEl.appendChild(againBtn);
    return;
  }

  helperEl.textContent = `남은 장보기: ${shoppingRemaining.length}가지 · 큰 카드를 눌러서 완료`;
  const step = shoppingRemaining[0];
  const btn = document.createElement("button");
  btn.className = "tile home-runner-tile home-runner-current";
  if (step.image) {
    const img = document.createElement("img");
    img.src = step.image;
    img.alt = step.label;
    setupImageElement(img, true);
    btn.appendChild(img);
  } else {
    const art = document.createElement("div");
    art.className = "tile-art";
    art.textContent = step.emoji || "🛒";
    btn.appendChild(art);
  }
  const lbl = document.createElement("div");
  lbl.className = "tile-label";
  lbl.textContent = step.label;
  btn.appendChild(lbl);
  const numBadge = document.createElement("span");
  numBadge.className = "tile-check";
  numBadge.textContent = String(Math.max(1, (shoppingItems.length + 1) - shoppingRemaining.length + 1));
  btn.appendChild(numBadge);
  btn.addEventListener("click", () => {
    btn.disabled = true;
    const afterSpeech = Promise.resolve(speak(`${step.label} 완료!`));
    afterSpeech.finally(() => {
      btn.classList.add("home-runner-done-anim");
      btn.addEventListener("animationend", () => {
        const finishedAll = shoppingRemaining.length === 1;
        shoppingRemaining.shift();
        render();
        if (finishedAll) {
          window.setTimeout(() => speak("장보기를 다 했어요! 정말 잘했어요!"), 250);
        }
      }, { once: true });
    });
  });
  gridEl.appendChild(btn);

  const resetBtn = document.createElement("button");
  resetBtn.className = "btn";
  resetBtn.style.cssText = "grid-column:1/-1; background:#f1f5f9; color:#64748b; min-height:56px; font-size:1rem;";
  resetBtn.textContent = "처음부터 다시";
  resetBtn.addEventListener("click", () => {
    if (!shoppingPlace) return;
    shoppingRemaining = [
      { type: "place", label: `${shoppingPlace.label}에 가요`, image: shoppingPlace.image, speech: `${shoppingPlace.label}에 가요` },
      ...shoppingItems.map((item) => ({ type: "item", label: `${item.label} 사요`, image: item.image, emoji: item.emoji, speech: `${item.label} 사요` }))
    ];
    render();
  });
  gridEl.appendChild(resetBtn);
}

// ── 주간 스케줄 헬퍼 ─────────────────────────────────────────────────────────
// 얼굴 사진 생성: 이미지 없으면 emoji 원형 아바타로 대체
function makeFaceImg(pd, className) {
  const wrap = document.createElement("div");
  wrap.className = `person-avatar ${className || ""}`;
  wrap.title = pd.label;

  const img = document.createElement("img");
  img.src = pd.image;
  img.alt = pd.label;
  img.loading = "eager";
  img.onerror = () => {
    img.style.display = "none";
    const fb = document.createElement("div");
    fb.className = "person-avatar-emoji";
    fb.textContent = pd.emoji || "👤";
    wrap.appendChild(fb);
  };
  wrap.appendChild(img);
  return wrap;
}

// ── 주간 스케줄 뷰 ───────────────────────────────────────────────────────────
function makeWeeklyEmptyCell() {
  const el = document.createElement("div");
  el.className = "wt-empty";
  return el;
}

function renderWeeklySchedule() {
  appMainEl.classList.remove("app--spotlight");
  spotlightViewEl.style.display = "none";
  spotlightBtnEl.onclick = null;
  heroEl.style.display = "none";
  heroEl.className = "hero";
  gridEl.style.display = "";
  gridEl.innerHTML = "";
  gridEl.className = "weekly-outer";

  if (weeklyEditMode) {
    renderWeeklyEditor();
    return;
  }

  titleEl.textContent = "요일별 스케줄 버전 1";
  helperEl.textContent = "";

  // 최대 행 수 계산 (시간대 레이블 수 vs 실제 활동 수 중 큰 것)
  const maxRows = Math.max(
    weeklyPeriodLabels.length,
    ...SCHEDULE_DAYS.map((d) => (weeklyScheduleData[d] || []).length)
  );

  // CSS grid 열: [시간대 레이블] + [7개 요일]
  const grid = document.createElement("div");
  grid.className = "wt-grid";

  // ── 헤더 행: 빈 코너 + 요일 7개 ──
  const corner = document.createElement("div");
  corner.className = "wt-corner";
  grid.appendChild(corner);

  SCHEDULE_DAYS.forEach((day, di) => {
    const c = WEEKLY_DAY_COLORS[di];
    const hdr = document.createElement("button");
    hdr.className = "wt-dayhdr wt-dayhdr--btn";
    hdr.textContent = formatScheduleDayLabel(day);
    hdr.style.cssText = `background:${c.bg}; color:${c.text}; border-color:${c.border};`;
    hdr.setAttribute("aria-label", `${formatScheduleDayLabel(day)} 스케줄 보기`);
    hdr.addEventListener("click", () => {
      speak(formatScheduleDayLabel(day));
      weeklySelectedDay = day;
      pushScreen("scheduleWeeklyDay", formatScheduleDayLabel(day));
      render();
    });
    grid.appendChild(hdr);
  });

  // ── 활동 행 ──
  for (let row = 0; row < maxRows; row++) {
    // 시간대 레이블 셀
    const periodCell = document.createElement("div");
    periodCell.className = "wt-period";
    periodCell.textContent = weeklyPeriodLabels[row] || `${row + 1}`;
    grid.appendChild(periodCell);

    // 각 요일 셀
    SCHEDULE_DAYS.forEach((day, di) => {
      const acts = weeklyScheduleData[day] || [];
      const act  = acts[row];
      if (!act) { grid.appendChild(makeWeeklyEmptyCell()); return; }

      const def = SCHEDULE_ACTIVITY_DEFS.find((d) => d.type === act.type);
      if (!def) { grid.appendChild(makeWeeklyEmptyCell()); return; }

      const c = WEEKLY_DAY_COLORS[di];
      const tile = document.createElement("button");
      tile.className = "wt-tile";
      tile.setAttribute("aria-label", def.label);
      tile.style.setProperty("--day-border", c.border);
      tile.style.setProperty("--day-bg",     c.bg);

      if (def.image) {
        const img = document.createElement("img");
        img.src = def.image;
        img.alt = def.label;
        img.className = "wt-img";
        img.loading = "eager";
        img.referrerPolicy = "no-referrer";
        tile.appendChild(img);
      } else {
        const art = document.createElement("div");
        art.className = "wt-art";
        art.textContent = def.emoji;
        tile.appendChild(art);
      }

      const lbl = document.createElement("div");
      lbl.className = "wt-lbl";
      lbl.textContent = def.shortLabel || def.label;
      tile.appendChild(lbl);

      if (act.people && act.people.length > 0) {
        const faces = document.createElement("div");
        faces.className = "weekly-faces";
        act.people.slice(0, 2).forEach((pLabel) => {
          const pd = SCHEDULE_PERSON_DEFS.find((p) => p.label === pLabel);
          if (!pd) return;
          faces.appendChild(makeFaceImg(pd, "weekly-face"));
        });
        tile.appendChild(faces);
      }

      tile.addEventListener("click", () => {
        speak(def.label);
        weeklyDetailAct = { type: act.type, people: act.people || [], day };
        pushScreen("scheduleWeeklyDetail", def.label);
        render();
      });

      grid.appendChild(tile);
    });
  }

  gridEl.appendChild(grid);

  // ── 버튼 행: 수정 + 초기화 ──
  const btnRow = document.createElement("div");
  btnRow.style.cssText = "display:flex;gap:10px;margin-top:4px;";

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "weekly-edit-btn primary";
  editBtn.textContent = "✏️ 수정";
  editBtn.addEventListener("click", () => {
    weeklyEditMode = true; weeklyEditDay = "월";
    weeklyEditPersonFor = null; weeklyEditPeriods = false;
    render();
  });
  btnRow.appendChild(editBtn);

  const resetBtn = document.createElement("button");
  resetBtn.className = "weekly-edit-btn weekly-reset-btn";
  resetBtn.type = "button";
  resetBtn.textContent = "🗑 초기화";
  resetBtn.addEventListener("click", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    if (!confirm("주간 스케줄을 모두 초기화할까요?\n입력한 내용이 모두 지워집니다.")) return;
    try {
      localStorage.removeItem("jaemin-weekly-v1");
      localStorage.removeItem("jaemin-weekly-periods-v1");
    } catch (_) { /* 사생활 보호 모드 등 */ }
    weeklyScheduleData = getDefaultWeeklySchedule();
    weeklyPeriodLabels = ["오전", "오후"];
    saveWeeklySchedule();
    saveWeeklyPeriods();
    weeklyEditMode = false;
    weeklyEditPersonFor = null;
    weeklyEditPeriods = false;
    render();
  });
  btnRow.appendChild(resetBtn);
  gridEl.appendChild(btnRow);
}

function renderWeeklyDayPicker() {
  appMainEl.classList.remove("app--spotlight");
  spotlightViewEl.style.display = "none";
  spotlightBtnEl.onclick = null;
  heroEl.style.display = "none";
  heroEl.className = "hero";
  gridEl.style.display = "";
  gridEl.innerHTML = "";
  gridEl.className = "weekly-day-picker";

  if (weeklyEditMode) {
    renderWeeklyEditor();
    return;
  }

  titleEl.textContent = "요일별 스케줄 버전 2";
  helperEl.textContent = "";

  SCHEDULE_DAYS.forEach((day, di) => {
    const c = WEEKLY_DAY_COLORS[di];
    const card = document.createElement("button");
    card.type = "button";
    card.className = "weekly-day-card";
    card.style.setProperty("--day-bg", c.bg);
    card.style.setProperty("--day-border", c.border);
    card.style.setProperty("--day-text", day === "토" || day === "일" ? "#dc2626" : "#111827");
    card.setAttribute("aria-label", `${formatScheduleDayLabel(day)} 스케줄 보기`);

    const label = document.createElement("div");
    label.className = "weekly-day-card-title";
    label.textContent = formatScheduleDayLabel(day);
    card.appendChild(label);

    card.addEventListener("click", () => {
      speak(formatScheduleDayLabel(day));
      weeklySelectedDay = day;
      pushScreen("scheduleWeeklyDay", formatScheduleDayLabel(day));
      render();
    });

    gridEl.appendChild(card);
  });
}

// ── 일일 / 요일별 시각 스케줄 — 공통 카드 그리드 (일일과 동일 UI) ─────────────
/** @param {"order"|"period"} numMode — order: 1,2,3… / period: 오전·오후 등 */
function createDvScheduleCardGrid(acts, dayKey, numMode) {
  const cardGrid = document.createElement("div");
  cardGrid.className = "dv-grid dv-grid--flow";

  acts.forEach((act, idx) => {
    const def = SCHEDULE_ACTIVITY_DEFS.find((d) => d.type === act.type);
    if (!def) return;

    const card = document.createElement("button");
    card.className = "dv-card";
    card.setAttribute("aria-label", def.label);

    const num = document.createElement("div");
    num.className = "dv-num";
    const numText = numMode === "period"
      ? String(weeklyPeriodLabels[idx] !== undefined ? weeklyPeriodLabels[idx] : idx + 1)
      : String(idx + 1);
    num.textContent = numText;
    if (numText.length > 2) num.classList.add("dv-num--wide");
    card.appendChild(num);

    const imgWrap = document.createElement("div");
    imgWrap.className = "dv-img-wrap";
    if (def.image) {
      const img = document.createElement("img");
      img.src = def.image;
      img.alt = def.label;
      img.className = "dv-img";
      img.loading = "eager";
      img.referrerPolicy = "no-referrer";
      imgWrap.appendChild(img);
    } else {
      const art = document.createElement("div");
      art.className = "dv-art";
      art.textContent = def.emoji;
      imgWrap.appendChild(art);
    }
    card.appendChild(imgWrap);

    const textBlock = document.createElement("div");
    textBlock.className = "dv-text-block";

    const lbl = document.createElement("div");
    lbl.className = "dv-lbl";
    lbl.textContent = def.label;
    textBlock.appendChild(lbl);

    card.appendChild(textBlock);
    card.addEventListener("click", () => {
      speak(def.label);
      weeklyDetailAct = { type: act.type, people: act.people || [], day: dayKey };
      pushScreen("scheduleWeeklyDetail", def.label);
      render();
    });
    cardGrid.appendChild(card);
  });

  return cardGrid;
}

// ── 일일 시각 스케줄 ──────────────────────────────────────────────────────────
function renderDailyVisual() {
  appMainEl.classList.remove("app--spotlight");
  spotlightViewEl.style.display = "none";
  spotlightBtnEl.onclick = null;
  heroEl.style.display = "none";
  gridEl.style.display = "";
  gridEl.innerHTML = "";
  gridEl.className = "dv-outer dv-outer--fit dv-outer--daily";

  const KO_DAYS = ["일", "월", "화", "수", "목", "금", "토"];
  const today = new Date();
  const todayDay = KO_DAYS[today.getDay()];
  const month   = today.getMonth() + 1;
  const date    = today.getDate();
  const acts    = (weeklyScheduleData[todayDay] || []);

  titleEl.textContent = "일일 시각 스케줄";
  helperEl.textContent = "";

  const dateBar = document.createElement("div");
  dateBar.className = "dv-date-bar dv-date-bar--daily";

  const dateNum = document.createElement("span");
  dateNum.className = "dv-date-num";
  dateNum.textContent = `${month}월 ${date}일`;
  dateBar.appendChild(dateNum);

  const dayBadge = document.createElement("span");
  dayBadge.className = "dv-day-badge";
  dayBadge.textContent = `${todayDay}`;
  dateBar.appendChild(dayBadge);

  gridEl.appendChild(dateBar);

  if (acts.length === 0) {
    const empty = document.createElement("div");
    empty.className = "dv-empty";
    empty.textContent = "오늘 스케줄이 없어요. 주간 스케줄에서 오늘 활동을 추가해 주세요.";
    gridEl.appendChild(empty);
    return;
  }

  gridEl.appendChild(createDvScheduleCardGrid(acts, todayDay, "order"));
}

// ── 주간에서 요일 탭 → 일일 시각 스케줄과 동일 형식 (가로 줄바꿈) ─────────────
function renderWeeklyDaySchedule() {
  appMainEl.classList.remove("app--spotlight");
  spotlightViewEl.style.display = "none";
  spotlightBtnEl.onclick = null;
  heroEl.style.display = "none";
  heroEl.className = "hero";
  gridEl.style.display = "";
  gridEl.innerHTML = "";
  gridEl.className = "dv-outer dv-outer--fit";

  const day = weeklySelectedDay;
  if (!day) { popScreen(); render(); return; }

  const acts = weeklyScheduleData[day] || [];
  const dayLabel = formatScheduleDayLabel(day);
  titleEl.textContent = `${dayLabel} 스케줄`;
  helperEl.textContent = "";

  const dateBar = document.createElement("div");
  dateBar.className = "dv-date-bar";
  const dateNum = document.createElement("span");
  dateNum.className = "dv-date-num";
  dateNum.textContent = dayLabel;
  dateBar.appendChild(dateNum);
  const dayBadge = document.createElement("span");
  dayBadge.className = "dv-day-badge";
  dayBadge.textContent = day;
  dateBar.appendChild(dayBadge);
  gridEl.appendChild(dateBar);

  const actionRow = document.createElement("div");
  actionRow.className = "weekly-day-actions";
  const editDayBtn = document.createElement("button");
  editDayBtn.type = "button";
  editDayBtn.className = "weekly-edit-btn weekly-edit-btn--primary";
  editDayBtn.textContent = "수정";
  editDayBtn.addEventListener("click", () => {
    speak(`${dayLabel} 스케줄 수정`);
    weeklyEditMode = true;
    weeklyEditDay = day;
    weeklyEditPersonFor = null;
    weeklyEditPeriods = false;
    if (currentKey() === "scheduleWeeklyDay") popScreen();
    render();
  });
  actionRow.appendChild(editDayBtn);
  gridEl.appendChild(actionRow);

  if (acts.length === 0) {
    const empty = document.createElement("div");
    empty.className = "dv-empty";
    empty.textContent = "";
    gridEl.appendChild(empty);
    return;
  }

  gridEl.appendChild(createDvScheduleCardGrid(acts, day, "period"));
}

// ── 주간 스케줄 상세 페이지 ───────────────────────────────────────────────────
function renderWeeklyDetail() {
  appMainEl.classList.remove("app--spotlight");
  spotlightViewEl.style.display = "none";
  spotlightBtnEl.onclick = null;
  heroEl.style.display = "none";
  heroEl.className = "hero";
  gridEl.style.display = "";
  gridEl.innerHTML = "";
  gridEl.className = "wdetail-outer";

  if (!weeklyDetailAct) { popScreen(); render(); return; }

  const def = SCHEDULE_ACTIVITY_DEFS.find((d) => d.type === weeklyDetailAct.type);
  if (!def) { popScreen(); render(); return; }

  // 요일 표시
  titleEl.textContent = def.label;
  helperEl.textContent = weeklyDetailAct.day + "요일";

  // ── 활동 히어로 카드 (탭하면 이름 읽기) ──
  const hero = document.createElement("button");
  hero.className = "wdetail-hero";
  hero.setAttribute("aria-label", def.label);

  if (def.image) {
    const img = document.createElement("img");
    img.src = def.image;
    img.alt = def.label;
    img.className = "wdetail-hero-img";
    img.loading = "eager";
    img.referrerPolicy = "no-referrer";
    hero.appendChild(img);
  } else {
    const art = document.createElement("div");
    art.className = "wdetail-hero-art";
    art.textContent = def.emoji;
    hero.appendChild(art);
  }

  const heroLbl = document.createElement("div");
  heroLbl.className = "wdetail-hero-lbl";
  heroLbl.textContent = def.label;
  hero.appendChild(heroLbl);

  hero.addEventListener("click", () => speak(def.label));
  gridEl.appendChild(hero);

  // ── 함께하는 사람 ──
  const people = weeklyDetailAct.people || [];

  const heading = document.createElement("div");
  heading.className = "wdetail-heading";
  heading.textContent = people.length > 0 ? "함께하는 사람" : "아직 함께하는 사람이 없어요";
  gridEl.appendChild(heading);

  if (people.length > 0) {
    const peopleRow = document.createElement("div");
    peopleRow.className = "wdetail-people-row";

    people.forEach((pLabel) => {
      const pd = SCHEDULE_PERSON_DEFS.find((p) => p.label === pLabel);
      if (!pd) return;

      const btn = document.createElement("button");
      btn.className = "wdetail-person-btn";
      btn.setAttribute("aria-label", pLabel);

      const avatar = makeFaceImg(pd, "wdetail-avatar");
      btn.appendChild(avatar);

      const lbl = document.createElement("div");
      lbl.className = "wdetail-person-lbl";
      lbl.textContent = pLabel;
      btn.appendChild(lbl);

      btn.addEventListener("click", () => speak(pLabel));
      peopleRow.appendChild(btn);
    });

    gridEl.appendChild(peopleRow);
  }

  // 처음 진입 시 활동 이름 자동 읽기
  speak(def.label);
}

// ── 사람 선택 버튼 생성 헬퍼 ────────────────────────────────────────────────
function makePersonPickerBtn(pd, actEntry, maxPeople) {
  const isSelected  = actEntry.people.includes(pd.label);
  const isMaxed     = !isSelected && actEntry.people.length >= maxPeople;

  const btn = document.createElement("button");
  btn.className = `weekly-person-btn${isSelected ? " is-selected" : ""}${isMaxed ? " is-maxed" : ""}`;
  btn.disabled = isMaxed;

  // 아바타 (이미지 or emoji)
  const avatar = makeFaceImg(pd, "weekly-person-avatar-img");
  btn.appendChild(avatar);

  const lbl = document.createElement("div");
  lbl.className = "weekly-person-lbl";
  lbl.textContent = pd.label;
  btn.appendChild(lbl);

  if (isSelected) {
    const chk = document.createElement("span");
    chk.className = "tile-check";
    chk.textContent = "✓";
    btn.appendChild(chk);
  }

  btn.addEventListener("click", () => {
    if (isMaxed) return;
    speak(pd.label);
    const idx = actEntry.people.indexOf(pd.label);
    if (idx >= 0) actEntry.people.splice(idx, 1);
    else actEntry.people.push(pd.label);
    saveWeeklySchedule();
    render();
  });
  return btn;
}

// ── 주간 스케줄 편집 ─────────────────────────────────────────────────────────
function renderWeeklyEditor() {
  titleEl.textContent = "스케줄 편집";

  // 요일 탭 + 시간대 탭
  const tabRow = document.createElement("div");
  tabRow.className = "weekly-tab-row";
  SCHEDULE_DAYS.forEach((day, di) => {
    const c = WEEKLY_DAY_COLORS[di];
    const tab = document.createElement("button");
    tab.className = `weekly-tab${day === weeklyEditDay && !weeklyEditPeriods ? " weekly-tab--active" : ""}`;
    tab.textContent = day;
    if (!weeklyEditPeriods && day === weeklyEditDay) {
      tab.style.cssText = `background:${c.bg}; color:${c.text}; border-color:${c.border};`;
    }
    tab.addEventListener("click", () => {
      weeklyEditDay = day; weeklyEditPersonFor = null; weeklyEditPeriods = false;
      render();
    });
    tabRow.appendChild(tab);
  });
  // 시간대 탭
  const periodTab = document.createElement("button");
  periodTab.className = `weekly-tab${weeklyEditPeriods ? " weekly-tab--active" : ""}`;
  periodTab.style.cssText = weeklyEditPeriods ? "" : "color:#64748b; font-size:0.8rem;";
  periodTab.textContent = "⏰";
  periodTab.title = "시간대 편집";
  periodTab.addEventListener("click", () => {
    weeklyEditPeriods = true; weeklyEditPersonFor = null;
    render();
  });
  tabRow.appendChild(periodTab);
  gridEl.appendChild(tabRow);

  // ── 시간대 레이블 편집 ──
  if (weeklyEditPeriods) {
    helperEl.textContent = "각 시간대 이름을 수정하세요.";
    const heading = document.createElement("div");
    heading.className = "weekly-edit-heading";
    heading.textContent = "시간대 이름 편집";
    gridEl.appendChild(heading);

    const periodsWrap = document.createElement("div");
    periodsWrap.className = "weekly-periods-edit";

    weeklyPeriodLabels.forEach((label, i) => {
      const row = document.createElement("div");
      row.className = "weekly-period-row";

      const numBadge = document.createElement("span");
      numBadge.className = "weekly-period-num";
      numBadge.textContent = `${i + 1}`;
      row.appendChild(numBadge);

      const input = document.createElement("input");
      input.type = "text";
      input.className = "weekly-period-input";
      input.value = label;
      input.maxLength = 6;
      input.addEventListener("input", () => {
        weeklyPeriodLabels[i] = input.value || `${i + 1}`;
        saveWeeklyPeriods();
      });
      row.appendChild(input);

      // 삭제 버튼 (3개 이상일 때만)
      if (weeklyPeriodLabels.length > 1) {
        const delBtn = document.createElement("button");
        delBtn.className = "weekly-period-del";
        delBtn.textContent = "✕";
        delBtn.addEventListener("click", () => {
          weeklyPeriodLabels.splice(i, 1);
          saveWeeklyPeriods();
          render();
        });
        row.appendChild(delBtn);
      }
      periodsWrap.appendChild(row);
    });
    gridEl.appendChild(periodsWrap);

    if (weeklyPeriodLabels.length < 6) {
      const addBtn = document.createElement("button");
      addBtn.className = "weekly-edit-btn";
      addBtn.textContent = "+ 시간대 추가";
      addBtn.addEventListener("click", () => {
        weeklyPeriodLabels.push(`${weeklyPeriodLabels.length + 1}번`);
        saveWeeklyPeriods();
        render();
      });
      gridEl.appendChild(addBtn);
    }

    const doneBtn = document.createElement("button");
    doneBtn.className = "weekly-edit-btn weekly-edit-btn--primary";
    doneBtn.textContent = "✓ 완료";
    doneBtn.addEventListener("click", () => { weeklyEditPeriods = false; render(); });
    gridEl.appendChild(doneBtn);
    return;
  }

  const dayActs    = weeklyScheduleData[weeklyEditDay] || [];
  const dayActTypes = dayActs.map((a) => a.type);

  if (weeklyEditPersonFor !== null) {
    // ── 사람 선택 단계 ──
    const MAX_PEOPLE = 20;
    const actEntry = dayActs[weeklyEditPersonFor];
    const def = SCHEDULE_ACTIVITY_DEFS.find((d) => d.type === actEntry?.type);

    const heading = document.createElement("div");
    heading.className = "weekly-edit-heading";
    heading.textContent = `${def?.label || ""} — 함께하는 사람`;
    gridEl.appendChild(heading);

    const inGroup = (pd, g) => (pd.groups || [pd.group]).includes(g);

    // ── 헬퍼: 섹션 만들기 ──
    // ── 활동 유형에 따른 섹션 설정 ──
    const actType = actEntry?.type || "";
    const CENTER_MAP = {
      "큰나무":     { icon: "🏥", label: "큰나무병원 선생님" },
      "세브란스":   { icon: "🏥", label: "세브란스병원 선생님" },
      "사람과소통": { icon: "🏥", label: "사람과소통 선생님" },
    };
    const centerKey = Object.keys(CENTER_MAP).find((k) => actType === k);
    const isSchoolAct = ["school", "fieldtrip"].includes(actType);

    const collectPeople = (group) => SCHEDULE_PERSON_DEFS.filter((p) => inGroup(p, group));

    // ── 섹션별 전체선택 포함 렌더 헬퍼 ──
    const makeSection = (icon, label, people) => {
      if (!people.length) return;

      // 헤더 행: 섹션 이름 + 전체선택 버튼
      const hdrRow = document.createElement("div");
      hdrRow.className = "weekly-person-section-hdr-row";

      const hdr = document.createElement("span");
      hdr.className = "weekly-person-section-hdr";
      hdr.textContent = `${icon} ${label}`;
      hdrRow.appendChild(hdr);

      const toggleAllBtn = document.createElement("button");
      toggleAllBtn.className = "section-select-all-btn";
      const allLabels = people.map((p) => p.label);
      const refreshToggleBtn = () => {
        const sel = new Set(actEntry.people || []);
        const allSel = allLabels.every((l) => sel.has(l));
        toggleAllBtn.textContent = allSel ? "전체 해제" : "전체 선택";
        toggleAllBtn.classList.toggle("is-all-selected", allSel);
      };
      refreshToggleBtn();
      toggleAllBtn.addEventListener("click", () => {
        const sel = new Set(actEntry.people || []);
        const allSel = allLabels.every((l) => sel.has(l));
        if (allSel) {
          actEntry.people = actEntry.people.filter((l) => !allLabels.includes(l));
        } else {
          const existing = new Set(actEntry.people || []);
          allLabels.forEach((l) => existing.add(l));
          actEntry.people = [...existing];
        }
        saveWeeklySchedule(weeklyScheduleData);
        render();
      });
      hdrRow.appendChild(toggleAllBtn);
      gridEl.appendChild(hdrRow);

      const grid = document.createElement("div");
      grid.className = "weekly-person-grid";
      people.forEach((pd) => grid.appendChild(makePersonPickerBtn(pd, actEntry, MAX_PEOPLE)));
      gridEl.appendChild(grid);
    };

    // 활동 유형에 따라 해당 그룹만 표시
    if (centerKey) {
      const { icon, label } = CENTER_MAP[centerKey];
      makeSection(icon, label, collectPeople(centerKey));
    } else if (isSchoolAct) {
      makeSection("🏫", "학교 선생님 · 친구", collectPeople("school"));
    } else if (actType === "home") {
      makeSection("🏠", "집 사람", collectPeople("home"));
    } else {
      // 마트·카페·공원 등: 집 사람들
      makeSection("🏠", "함께 가는 사람", collectPeople("home"));
    }

    const backBtn2 = document.createElement("button");
    backBtn2.className = "weekly-edit-btn";
    backBtn2.style.marginTop = "6px";
    backBtn2.textContent = "← 활동 선택으로 돌아가기";
    backBtn2.addEventListener("click", () => { weeklyEditPersonFor = null; render(); });
    gridEl.appendChild(backBtn2);

  } else {
    // ── 활동 선택 단계 ──
    helperEl.textContent = `${weeklyEditDay}요일 활동을 선택하세요.`;

    const actList = document.createElement("div");
    actList.className = "weekly-act-list";

    SCHEDULE_ACTIVITY_DEFS.forEach((def) => {
      const isChecked = dayActTypes.includes(def.type);
      const actIdx    = dayActTypes.indexOf(def.type);
      const actEntry  = isChecked ? dayActs[actIdx] : null;

      const row = document.createElement("div");
      row.className = `weekly-act-row${isChecked ? " weekly-act-row--checked" : ""}`;

      // 왼쪽: 활동 토글 영역
      const toggleBtn = document.createElement("button");
      toggleBtn.className = "weekly-act-toggle";

      const checkIcon = document.createElement("span");
      checkIcon.className = "weekly-act-checkmark";
      checkIcon.textContent = isChecked ? "☑" : "☐";
      toggleBtn.appendChild(checkIcon);

      if (def.image) {
        const img = document.createElement("img");
        img.src = def.image;
        img.alt = def.label;
        img.className = "weekly-act-img";
        img.loading = "eager";
        toggleBtn.appendChild(img);
      } else {
        const art = document.createElement("span");
        art.className = "weekly-act-art";
        art.textContent = def.emoji;
        toggleBtn.appendChild(art);
      }

      const lbl = document.createElement("span");
      lbl.className = "weekly-act-lbl";
      lbl.textContent = def.label;
      toggleBtn.appendChild(lbl);

      toggleBtn.addEventListener("click", () => {
        if (isChecked) {
          weeklyScheduleData[weeklyEditDay] = dayActs.filter((a) => a.type !== def.type);
        } else {
          weeklyScheduleData[weeklyEditDay] = [...dayActs, { type: def.type, people: [] }];
        }
        saveWeeklySchedule();
        render();
      });
      row.appendChild(toggleBtn);

      // 오른쪽: 사람 선택 버튼 (선택된 활동만)
      if (isChecked && actEntry) {
        const facesBtn = document.createElement("button");
        facesBtn.className = "weekly-act-faces-btn";

        if (actEntry.people.length > 0) {
          actEntry.people.slice(0, 2).forEach((pLabel) => {
            const pd = SCHEDULE_PERSON_DEFS.find((p) => p.label === pLabel);
            if (!pd) return;
            facesBtn.appendChild(makeFaceImg(pd, "weekly-face"));
          });
        } else {
          facesBtn.innerHTML = `<span style="font-size:1.4rem;color:#94a3b8;">👤+</span>`;
        }

        facesBtn.addEventListener("click", () => {
          weeklyEditPersonFor = actIdx;
          render();
        });
        row.appendChild(facesBtn);
      }

      actList.appendChild(row);
    });
    gridEl.appendChild(actList);

    const doneBtn = document.createElement("button");
    doneBtn.className = "weekly-edit-btn weekly-edit-btn--primary";
    doneBtn.textContent = "✓ 편집 완료";
    doneBtn.addEventListener("click", () => {
      weeklyEditMode = false;
      weeklyEditPersonFor = null;
      render();
    });
    gridEl.appendChild(doneBtn);
  }
}

// ── 금요일 완성 일정 빌더 ────────────────────────────────────────────────────
function buildFridayPlanItems() {
  const result = [];
  let idx = 1;
  const addTaxi = () => result.push({ label: `${idx++}. 장애인 콜택시 타요`, image: "./images/transport_calltaxi.png" });
  const addSlot = (slot) => {
    if (slot.center) {
      result.push({ label: `${idx++}. ${slot.center} 치료실 가요`, ...(THERAPY_CENTER_IMAGE[slot.center] ? { image: THERAPY_CENTER_IMAGE[slot.center] } : {}) });
      slot.classes.forEach((cls) => result.push({ label: `${idx++}. ${cls} 수업 받아요`, ...(THERAPY_CLASS_IMAGE[cls] ? { image: THERAPY_CLASS_IMAGE[cls] } : {}) }));
    }
  };
  addTaxi();
  addSlot(fridayTherapySelection.slot1);
  addTaxi();
  result.push({ label: `${idx++}. 학교 가요`, image: "./images/school_classroom.png" });
  addTaxi();
  addSlot(fridayTherapySelection.slot2);
  addTaxi();
  result.push({ label: `${idx++}. 집에 와요`, image: "./images/home.png" });
  return result;
}

// ── 금요일 치료실 슬롯 피커 ──────────────────────────────────────────────────
function renderFridaySlotPicker(slotKey) {
  appMainEl.classList.remove("app--spotlight");
  spotlightViewEl.style.display = "none";
  heroEl.style.display = "none";
  gridEl.style.display = "";
  gridEl.innerHTML = "";
  gridEl.className = "grid";

  const slot = fridayTherapySelection[slotKey];
  const CENTERS = ["큰나무병원", "세브란스병원", "사람과소통"];
  const CENTER_EMOJI = { "큰나무병원": "🌳", "세브란스병원": "🏥", "사람과소통": "🗣️" };

  if (!slot.center) {
    titleEl.textContent = "치료실 선택";
    CENTERS.forEach((name) => {
      const btn = document.createElement("button");
      btn.className = "tile";
      if (THERAPY_CENTER_IMAGE[name]) {
        const img = document.createElement("img");
        img.src = THERAPY_CENTER_IMAGE[name]; img.alt = name;
        setupImageElement(img, true);
        btn.appendChild(img);
      } else {
        const art = document.createElement("div");
        art.className = "tile-art";
        art.textContent = CENTER_EMOJI[name] || "🏥";
        btn.appendChild(art);
      }
      const lbl = document.createElement("div");
      lbl.className = "tile-label";
      lbl.textContent = name;
      btn.appendChild(lbl);
      btn.addEventListener("click", () => { speak(name); slot.center = name; slot.classes = []; render(); });
      gridEl.appendChild(btn);
    });
  } else {
    titleEl.textContent = `${slot.center} 과목 선택`;
    const options = THERAPY_OPTIONS_BY_CENTER[slot.center] || THERAPY_OPTIONS;
    options.forEach((name) => {
      const isSelected = slot.classes.includes(name);
      const btn = document.createElement("button");
      btn.className = `tile${isSelected ? " is-selected" : ""}`;
      if (THERAPY_CLASS_IMAGE[name]) {
        const img = document.createElement("img");
        img.src = THERAPY_CLASS_IMAGE[name]; img.alt = name;
        setupImageElement(img, true);
        btn.appendChild(img);
      } else {
        const art = document.createElement("div");
        art.className = "tile-art";
        art.textContent = THERAPY_CLASS_EMOJI[name] || "🧩";
        btn.appendChild(art);
      }
      const lbl = document.createElement("div");
      lbl.className = "tile-label"; lbl.textContent = name;
      btn.appendChild(lbl);
      if (isSelected) {
        const check = document.createElement("span");
        check.className = "tile-check"; check.textContent = "✓";
        btn.appendChild(check);
      }
      btn.addEventListener("click", () => {
        speak(name);
        const idx = slot.classes.indexOf(name);
        if (idx >= 0) slot.classes.splice(idx, 1); else slot.classes.push(name);
        render();
      });
      gridEl.appendChild(btn);
    });

    const backBtn2 = document.createElement("button");
    backBtn2.className = "btn";
    backBtn2.textContent = "← 치료실 다시 선택";
    backBtn2.addEventListener("click", () => { slot.center = null; slot.classes = []; render(); });
    gridEl.appendChild(backBtn2);

    const doneBtn = document.createElement("button");
    doneBtn.className = "btn main";
    doneBtn.disabled = slot.classes.length === 0;
    doneBtn.textContent = slot.classes.length === 0 ? "과목을 선택하세요" : `완료 (${slot.classes.length}개 선택)`;
    doneBtn.addEventListener("click", () => {
      if (!slot.classes.length) return;
      speak("선택 완료");
      // 두 슬롯 모두 선택됐으면 전체 일정 결과 표시, 아니면 뒤로
      if (fridayTherapySelection.slot1.center && fridayTherapySelection.slot2.center) {
        DATA.screens.scheduleFridayFinalResult.items = buildFridayPlanItems();
        while (currentKey() !== "scheduleFriday" && navStack.length > 1) popScreen();
        pushScreen("scheduleFridayFinalResult", "금요일 일정");
      } else {
        while (currentKey() !== "scheduleFriday" && navStack.length > 1) popScreen();
      }
      render();
    });
    gridEl.appendChild(doneBtn);
  }
}

// ── 날짜 화면 ────────────────────────────────────────────────────────────────

    const scheduleLayouts = new Set([
      "weeklySchedule",
      "weeklyDayPicker",
      "dailyVisual",
      "weeklyDay",
      "weeklyDetail",
      "homeActivityPicker",
      "homeScheduleRunner",
      "shoppingPlanner",
      "shoppingRunner",
      "therapyCenterPicker",
      "therapyClassPicker",
      "therapyPicker",
      "fridayClassPicker"
    ]);

    function handles(key) {
      const screen = DATA.screens[key] || {};
      return key === "scheduleFridayFinalResult" || scheduleLayouts.has(screen.layout);
    }

    function renderSchedule(key, screen) {
      if (key === "scheduleFridayFinalResult") {
        DATA.screens.scheduleFridayFinalResult.items = buildFridayPlanItems();
      }
      if (screen.homeActivityGroupId && homeActivityGroupId !== screen.homeActivityGroupId) {
        homeActivityGroupId = screen.homeActivityGroupId;
        homeScheduleGroupId = screen.homeActivityGroupId;
        homeActivityPage = 0;
        homeShoppingTargetLabel = "";
      }

      if (screen.layout === "weeklySchedule") {
        renderWeeklySchedule();
      } else if (screen.layout === "weeklyDayPicker") {
        renderWeeklyDayPicker();
      } else if (screen.layout === "dailyVisual") {
        renderDailyVisual();
      } else if (screen.layout === "weeklyDay") {
        renderWeeklyDaySchedule();
      } else if (screen.layout === "weeklyDetail") {
        renderWeeklyDetail();
      } else if (screen.layout === "homeActivityPicker") {
        renderHomeActivityPicker();
      } else if (screen.layout === "homeScheduleRunner") {
        renderHomeScheduleRunner();
      } else if (screen.layout === "shoppingPlanner") {
        renderShoppingPlanner();
      } else if (screen.layout === "shoppingRunner") {
        renderShoppingRunner();
      } else if (screen.layout === "therapyCenterPicker") {
        renderCenterPicker();
      } else if (screen.layout === "therapyClassPicker") {
        renderClassPicker(screen.centerIndex || 0);
      } else if (screen.layout === "therapyPicker") {
        renderTherapyPicker(screen);
      } else if (screen.layout === "fridayClassPicker") {
        const slotKey = screen.fridaySlot === 1 ? "slot1" : "slot2";
        renderFridaySlotPicker(slotKey);
      }
    }

    function handleBack(key) {
      const screen = DATA.screens[key] || {};
      if (key === "scheduleHomeActivity" && homeActivityGroupId) {
        if (homeShoppingTargetLabel) {
          homeShoppingTargetLabel = "";
          render();
          return true;
        }
        if (homeActivityPage > 0) {
          homeActivityPage = 0;
          render();
          return true;
        }
        homeActivityGroupId = "";
        homeActivityPage = 0;
        homeShoppingTargetLabel = "";
        render();
        return true;
      }
      if (screen.homeActivityGroupId && homeActivityPage > 0) {
        homeActivityPage = 0;
        render();
        return true;
      }
      if (key === "scheduleShopping" && shoppingPlace) {
        shoppingPlace = null;
        shoppingItems = [];
        shoppingRemaining = [];
        render();
        return true;
      }
      if ((screen.layout === "weeklySchedule" || screen.layout === "weeklyDayPicker") && weeklyEditMode) {
        if (weeklyEditPersonFor !== null) {
          weeklyEditPersonFor = null;
        } else {
          weeklyEditMode = false;
        }
        render();
        return true;
      }
      if (key === "scheduleWeeklyDay") {
        weeklyDayEditMode = false;
      }
      return false;
    }

    function resetToHome() {
      weeklyDayEditMode = false;
      weeklyEditMode = false;
      weeklyEditPersonFor = null;
      weeklyEditPeriods = false;
      homeActivityGroupId = "";
      homeScheduleGroupId = "";
      homeActivityPage = 0;
      homeShoppingTargetLabel = "";
      shoppingPlace = null;
      shoppingItems = [];
      shoppingRemaining = [];
    }

    return {
      handles,
      render: renderSchedule,
      handleBack,
      resetToHome
    };
  }

  window.createScheduleFeature = createScheduleFeature;
})();
