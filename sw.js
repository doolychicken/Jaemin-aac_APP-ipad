/**
 * Service Worker for AAC App
 * Strategy: Cache-first for images, network-first for HTML/JS/CSS
 * On first visit, pre-caches all images so subsequent loads are instant.
 */

importScripts('./js/data/speech-manifest.js?v=399');

const CACHE_VERSION = 'v399';
const CACHE_NAME = `jaemin-aac-${CACHE_VERSION}`;

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './css/features/study-puzzle.css',
  './css/features/recycling-game.css',
  './css/features/mart-cart-game.css',
  './css/features/traffic-light-game.css',
  './css/features/face-parts-game.css',
  './css/date-overrides.css',
  './css/features/play-school.css',
  './js/features/play-school.js',
  './js/core/instrument-sounds.js',
  './js/data/study-data.js',
  './js/data/app-data.js',
  './js/core/pager.js',
  './js/core/runtime.js',
  './js/core/offline-speech.js',
  './js/core/offline-status.js',
  './js/data/speech-manifest.js',
  ...self.OFFLINE_SPEECH.assets,
  './js/features/schedule.js',
  './js/features/study-puzzle.js',
  './js/features/recycling-game.js',
  './js/features/mart-cart-game.js',
  './js/features/traffic-light-game.js',
  './js/features/face-parts-game.js',
  './js/main.js',
  './audio/watersound.mp3',
  './video/watersound.mp4',
  ...Array.from({ length: 16 }, (_, i) => `./images/photo_aac/actions_${String(i + 1).padStart(2, '0')}.jpg`),
  ...Array.from({ length: 16 }, (_, i) => `./images/photo_aac/daily_${String(i + 1).padStart(2, '0')}.jpg`),
  ...Array.from({ length: 16 }, (_, i) => `./images/photo_aac/feelings_hobbies_${String(i + 1).padStart(2, '0')}.jpg`),
  ...Array.from({ length: 16 }, (_, i) => `./images/photo_aac/places_answers_${String(i + 1).padStart(2, '0')}.jpg`),
  ...Array.from({ length: 24 }, (_, i) => i === 3
      ? './images/photo_aac/routine_ai_04_soap.jpg'
      : i === 4
        ? './images/photo_aac/routine_ai_05_v2.jpg'
        : i === 5
        ? './images/photo_aac/routine_ai_06_vanity.jpg'
        : i === 6
          ? './images/photo_aac/routine_ai_07_vanity.jpg'
          : i === 7
            ? './images/photo_aac/routine_ai_08_photo_white_shirt.jpg'
            : i === 8
              ? './images/photo_aac/routine_ai_09_photo.jpg'
              : `./images/photo_aac/routine_ai_${String(i + 1).padStart(2, '0')}.jpg`),
  './images/photo_aac/routine_ai_03_family.jpg',
  './images/photo_aac/routine_ai_brush_perio_cup.png',
  './images/photo_aac/routine_ai_hairwash_shampoo.jpg',
  './images/photo_aac/routine_ai_bubblebath_white_shirt.jpg',
  './images/photo_aac/routine_ai_ipad_youtube.jpg',
  './images/photo_aac/routine_ai_tv_bebefinn.jpg',
  './images/photo_aac/routine_ai_elevator_1_badge.jpg',
  './images/photo_aac/routine_ai_elevator_10_badge.jpg',
  './images/photo_aac/routine_ai_dry_after_shower.jpg',
  './images/photo_aac/routine_ai_hairdryer.jpg',
  ...Array.from({ length: 16 }, (_, i) => `./images/photo_aac/home_leisure_${String(i + 1).padStart(2, '0')}.jpg`),
  ...Array.from({ length: 16 }, (_, i) => `./images/photo_aac/outing_weather_${String(i + 1).padStart(2, '0')}.jpg`),
  ...Array.from({ length: 16 }, (_, i) => `./images/photo_aac/preferred_${String(i + 1).padStart(2, '0')}.jpg`),
  // ── Images ──
  './images/apple.png',
  './images/app_icons/app-icon-180.png',
  './images/app_icons/app-icon-192.png',
  './images/app_icons/app-icon-512.png',
  './images/bannana.png',
  './images/brush.png',
  './images/bus.png',
  './images/birthday.png',
  './images/breads/bread_croissant.jpg',
  './images/breads/bread_red_bean.jpg',
  './images/breads/bread_sausage.jpg',
  './images/breads/bread_sliced.jpg',
  './images/breads/bread_soboro.jpg',
  './images/cake.jpg',
  './images/chocomilk.jpg',
  './images/cofee.png',
  './images/real_items/animal_learning.jpg',
  './images/real_items/banana_milk.jpg',
  './images/real_items/beef.jpg',
  './images/real_items/broccoli.jpg',
  './images/real_items/calendar_learning.jpg',
  './images/real_items/cheese.jpg',
  './images/real_items/chicken.jpg',
  './images/real_items/chocolate_milk.jpg',
  './images/real_items/coca_cola_can_v2.png',
  './images/real_items/color_learning.jpg',
  './images/real_items/corn.jpg',
  './images/real_items/cookies_v2.png',
  './images/real_items/crackers_v2.png',
  './images/real_items/cucumber.jpg',
  './images/real_items/gummy_jelly.jpg',
  './images/real_items/hangul_learning.jpg',
  './images/real_items/ice_cream.jpg',
  './images/real_items/lemon_lime_soda.jpg',
  './images/real_items/milkshake.jpg',
  './images/real_items/orange_soda.jpg',
  './images/real_items/pork.jpg',
  './images/real_items/potato_chips_v2.png',
  './images/real_items/snacks.jpg',
  './images/real_items/seoul_strawberry_milk_v2.png',
  './images/real_items/sweet_potato.jpg',
  './images/real_items/watermelon_juice.jpg',
  './images/dad car.png',
  './images/dadcar.png',
  './images/dad_carkey.png',
  './images/eggs.png',
  './images/edia_cafe.png',
  './images/emotions/angry.jpg',
  './images/emotions/happy.jpg',
  './images/emotions/help.jpg',
  './images/emotions/hurt.jpg',
  './images/emotions/sad.jpg',
  './images/emotions/scared.jpg',
  './images/emotions/tired.jpg',
  './images/emotions/uncomfortable.jpg',
  './images/fire truck.png',
  './images/fire_station.png',
  './images/fruit_blueberry.jpg',
  './images/fruit_tangerine.jpg',
  './images/face_game/face_base_v2.png',
  './images/face_game/face_complete_v2.png',
  './images/face_game/feature_eyebrows_pair.png',
  './images/face_game/feature_eyes_pair.png',
  './images/face_game/feature_left_ear.png',
  './images/face_game/feature_left_eye.png',
  './images/face_game/feature_left_eyebrow.png',
  './images/face_game/feature_mouth.png',
  './images/face_game/feature_nose.png',
  './images/face_game/feature_right_ear.png',
  './images/face_game/feature_right_eye.png',
  './images/face_game/feature_right_eyebrow.png',
  './images/face_game/jaemin_face_base.png',
  './images/face_game/jaemin_face_complete.png',
  './images/face_game/jaemin_eyebrows.png',
  './images/face_game/jaemin_eyes.png',
  './images/face_game/jaemin_left_ear.png',
  './images/face_game/jaemin_mouth.png',
  './images/face_game/jaemin_nose.png',
  './images/face_game/jaemin_right_ear.png',
  './images/grape.png',
  './images/grape1.png',
  './images/home.png',
  './images/homeplus.png',
  './images/homeplus_foodcourt.png',
  './images/ikea.png',
  './images/mapocentral_library.png',
  './images/mart_cart_jaemin.png',
  './images/meal_expressions/cold.jpg',
  './images/meal_expressions/delicious.jpg',
  './images/meal_expressions/hot.jpg',
  './images/meal_expressions/more_please.jpg',
  './images/meal_expressions/not_delicious.jpg',
  './images/meal_expressions/stop_eating.jpg',
  './images/mart_items/apple.png',
  './images/mart_items/banana.png',
  './images/mart_items/carrot_real_v3.png',
  './images/mart_items/chocomilk.png',
  './images/mart_items/egg.png',
  './images/mart_items/grape.png',
  './images/mart_items/juice.png',
  './images/mart_items/milk.png',
  './images/mart_items/pepper.png',
  './images/mart_items/pineapple_real_v2.png',
  './images/mart_items/strawberry.png',
  './images/mart_items/tomato.png',
  './images/mart_items/water_jelly.png',
  './images/mart_items/watermelon.png',
  './images/mart_items/yogurt.png',
  './images/mart_items/yogurt_drink.png',
  './images/traffic_game/car.jpg',
  './images/traffic_game/car_blue.png',
  './images/traffic_game/car_red.png',
  './images/traffic_game/car_silver.png',
  './images/traffic_game/crosswalk.jpg',
  './images/traffic_game/jaemin_walk.png',
  './images/traffic_game/traffic_light.jpg',
  './images/traffic_game/traffic_tile.jpg',
  './images/app_schedule.svg',
  './images/app_date.svg',
  './images/bebefinn.png',
  './images/home_schedule/recycling_station.png',
  './images/home_schedule/paris_baguette.png',
  './images/home_schedule/playground.png',
  './images/home_schedule/hanaro_mart.png',
  './images/home_schedule/homeplus.png',
  './images/home_schedule/hansalim.png',
  './images/home_schedule/fire_station.png',
  './images/home_schedule/post_office.png',
  './images/therapy/communication_with_people.png',
  './images/therapy/severance_physical_therapy.png',
  './images/ipad.png',
  './images/knobpuzzle_fruits.png',
  './images/knobpuzzle_numbers.png',
  './images/knobpuzzle_numbers2.png',
  './images/knobpuzzle_numbers3.png',
  './images/knobpuzzle_shapes.png',
  './images/knobpuzzle_shapes2.png',
  './images/knobpuzzle_vehicles.png',
  './images/meal.png',
  './images/meal_bowl_v2.png',
  './images/meal_rice.png',
  './images/meal_rice1.png',
  './images/meal_juice.png',
  './images/meal_milk.png',
  './images/meal_milk_large_v2.png',
  './images/meal_soymilk.png',
  './images/meal_eggtart.png',
  './images/water_jelly.png',
  './images/yogurt.png',
  './images/yogurt_drink.png',
  './images/orange.png',
  './images/outing.png',
  './images/outing_bakery.png',
  './images/outing_cafe.png',
  './images/outing_mart1.png',
  './images/outing_park1.png',
  './images/outing_person_activity_support.png',
  './images/outing_person_dad.png',
  './images/outing_person_grandma.png',
  './images/outing_person_grandpa.png',
  './images/outing_person_me.png',
  './images/outing_person_mom.png',
  './images/person/사람과소통 김지은선생님1.png',
  './images/person/dad.png',
  './images/person/me.png',
  './images/person/mom.png',
  './images/person/rahee.png',
  './images/person/raon.png',
  './images/outing_school1.png',
  './images/paris_baguatte.png',
  './images/places/paris_baguette_buying_bread.jpg',
  './images/places/cafe_with_dad.png',
  './images/pee.png',
  './images/pineapple.png',
  './images/piano.png',
  './images/policecar.png',
  './images/policestation.png',
  './images/poo.png',
  './images/pororo.png',
  './images/pororo.jpg',
  './images/recycling_can.jpg',
  './images/recycling_foam.jpg',
  './images/recycling_glass.png',
  './images/recycling_paper.jpg',
  './images/recycling_plastic.jpg',
  './images/recycling_station.png',
  './images/school bus.png',
  './images/school_boccia.png',
  './images/school_cafeteria.png',
  './images/school_classroom.png',
  './images/school_digital_active_room.png',
  './images/school_elevator.png',
  './images/school_friends.png',
  './images/school_friends_\uAC74\uBBFC.png',
  './images/school_friends_\uB3D9\uD558.png',
  './images/school_friends_\uC2B9\uC6B0.png',
  './images/school_friends_\uC724\uD76C.png',
  './images/school_friends_\uC724\uD76C1.png',
  './images/school_friends_\uD558\uB9B0.png',
  './images/school_garden.png',
  './images/school_gym.png',
  './images/school_homeroom_teacher.png',
  './images/school_imagination_room.png',
  './images/school_restroom.png',
  './images/school_shoe_locker.png',
  './images/school_subject_room.png',
  './images/seouldrive.png',
  './images/shower.png',
  './images/sleep.png',
  './images/sing.png',
  './images/shoes.png',
  './images/stickerbook_animal.png',
  './images/stickerbook_eyenosemouth.png',
  './images/stickerbook_fruit.png',
  './images/stickerbook_language.png',
  './images/stickerbook_mart.png',
  './images/stickerbook_myhome.png',
  './images/stickerbook_number.png',
  './images/stickerbook_pet.png',
  './images/stickerbook_shape.png',
  './images/stickerbook_vehicle.png',
  './images/spoon.jpg',
  './images/strawberry.png',
  './images/study.png',
  './images/study_animal_icon.svg',
  './images/study_color_icon.svg',
  './images/study_hangul_icon.svg',
  './images/study_number_puzzle_icon.svg',
  './images/study_number_puzzle2_icon.svg',
  './images/study_color_pencil.png',
  './images/study_pegboard.png',
  './images/study_soundbook_card.png',
  './images/therapy_center_severance.png',
  './images/therapy_class_cognitive.png',
  './images/therapy_class_music.png',
  './images/therapy_class_speech.png',
  './images/therapy_class_swallowing.png',
  './images/toilet.png',
  './images/tomato.png',
  './images/toothbush.png',
  './images/toothpaste.png',
  './images/transport_bike.png',
  './images/transport_bus.png',
  './images/transport_calltaxi.png',
  './images/transport_car.png',
  './images/transport_subway.png',
  './images/transport_subway_JM.png',
  './images/transport_walk.png',
  './images/ukulele.png',
  './images/wash_face.png',
  './images/wash_hands.png',
  './images/water.png',
  './images/watersound.png',
  './images/watermelon.png',
  './images/weather.png',
  './images/weather_cards/sunny.svg',
  './images/weather_cards/cloudy.svg',
  './images/weather_cards/rain.svg',
  './images/weather_cards/snow.svg',
  './images/weather_cards/wind.svg',
  './images/weather_cards/thunder.svg',
  './images/youtube.png',
];

const READY_URL = new URL('./offline-ready.json', self.registration.scope).href;

async function broadcast(state) {
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  windows.filter(client => client.url.startsWith(self.registration.scope)).forEach(client =>
    client.postMessage({ type: 'OFFLINE_STATUS', version: CACHE_VERSION, ...state }));
}

async function getStatus() {
  const cache = await caches.open(CACHE_NAME);
  const paths = new Set((await cache.keys()).map(request => new URL(request.url).pathname));
  const complete = PRECACHE_ASSETS.every(asset => paths.has(new URL(asset, self.registration.scope).pathname));
  return { ready: complete && !!(await cache.match(READY_URL)), completed: PRECACHE_ASSETS.length, total: PRECACHE_ASSETS.length };
}

async function precacheEverything(repair = false) {
  const cache = await caches.open(CACHE_NAME);
  let completed = 0;
  await broadcast({ ready: false, completed, total: PRECACHE_ASSETS.length });
  for (let i = 0; i < PRECACHE_ASSETS.length; i += 8) {
    await Promise.all(PRECACHE_ASSETS.slice(i, i + 8).map(async asset => {
      if (repair && await cache.match(asset, { ignoreSearch: true })) { completed++; return; }
      // Content-addressed speech packs are immutable across app updates.
      if (/^\.\/audio\/speech\/pack-\d+-[a-f0-9]{10}\.wav$/.test(asset)) {
        const previous = await caches.match(new URL(asset, self.registration.scope).href);
        if (previous?.status === 200) {
          await cache.put(asset, previous);
          completed++;
          return;
        }
      }
      const response = await fetch(new Request(new URL(asset, self.registration.scope), { cache: 'reload' }));
      if (response.status !== 200) throw new Error(`Unable to save ${asset}: ${response.status}`);
      await cache.put(asset, response);
      completed++;
    }));
    await broadcast({ ready: false, completed, total: PRECACHE_ASSETS.length });
  }
  await cache.put(READY_URL, new Response(JSON.stringify({ version: CACHE_VERSION, count: completed }),
    { headers: { 'Content-Type': 'application/json' } }));
  await broadcast({ ready: true, completed, total: PRECACHE_ASSETS.length });
}

let repairJob = null;
self.addEventListener('message', event => {
  if (event.data?.type === 'GET_OFFLINE_STATUS') {
    event.waitUntil(getStatus().then(status => event.source?.postMessage({
      type: 'OFFLINE_STATUS', version: CACHE_VERSION, ...status
    })));
  }
  if (event.data?.type === 'REPAIR_OFFLINE') {
    if (!repairJob) repairJob = precacheEverything(true)
      .catch(() => broadcast({ ready: false, error: true }))
      .finally(() => { repairJob = null; });
    event.waitUntil(repairJob);
  }
});

self.addEventListener('install', event => {
  event.waitUntil(precacheEverything().then(() => self.skipWaiting()).catch(async error => {
    await broadcast({ ready: false, error: true });
    throw error; // Preserve the previously complete worker on an interrupted download.
  }));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith('jaemin-aac-') && key !== CACHE_NAME)
    .map(key => caches.delete(key))))
    .then(() => self.clients.claim()).then(() => getStatus()).then(broadcast));
});

// Safari seeks with byte ranges even when playing a completely cached file.
async function rangedResponse(request, response) {
  const range = request.headers.get('Range');
  if (!range) return response;
  const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (!match || (!match[1] && !match[2])) return response;
  const bytes = await response.arrayBuffer();
  const size = bytes.byteLength;
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= size) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
  }
  const headers = new Headers(response.headers);
  headers.delete('Content-Encoding');
  headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
  headers.set('Content-Length', String(end - start + 1));
  headers.set('Accept-Ranges', 'bytes');
  return new Response(bytes.slice(start, end + 1), { status: 206, statusText: 'Partial Content', headers });
}

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin
    || !url.href.startsWith(self.registration.scope)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(event.request, { ignoreSearch: true });
    if (cached) return rangedResponse(event.request, cached);
    try {
      const response = await fetch(event.request);
      if (response.status === 200 && !event.request.headers.has('Range')) {
        const copy = response.clone();
        event.waitUntil(cache.put(event.request, copy).catch(() => broadcast({ ready: false, error: true })));
      }
      return response;
    } catch (_) {
      if (event.request.mode === 'navigate') {
        const shell = await cache.match('./index.html');
        if (shell) return shell;
      }
      return Response.error();
    }
  })());
});
