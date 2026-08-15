/**
 * Service Worker for AAC App
 * Strategy: Cache-first for images, network-first for HTML/JS/CSS
 * On first visit, pre-caches all images so subsequent loads are instant.
 */

const CACHE_VERSION = 'v360';
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
  './js/data/study-data.js',
  './js/data/app-data.js',
  './js/core/pager.js',
  './js/features/schedule.js',
  './js/features/study-puzzle.js',
  './js/features/recycling-game.js',
  './js/features/mart-cart-game.js',
  './js/features/traffic-light-game.js',
  './js/features/face-parts-game.js',
  './js/main.js',
  './audio/watersound.mp3',
  './video/watersound.mp4',
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
  './images/real_items/cola.jpg',
  './images/real_items/color_learning.jpg',
  './images/real_items/corn.jpg',
  './images/real_items/cucumber.jpg',
  './images/real_items/gummy_jelly.jpg',
  './images/real_items/hangul_learning.jpg',
  './images/real_items/ice_cream.jpg',
  './images/real_items/lemon_lime_soda.jpg',
  './images/real_items/milkshake.jpg',
  './images/real_items/orange_soda.jpg',
  './images/real_items/pork.jpg',
  './images/real_items/snacks.jpg',
  './images/real_items/strawberry_milk.jpg',
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
  './images/mart_items/pineapple.png',
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

// ── Install: pre-cache everything ──────────────────────────────────────────
async function precacheEverything() {
  const cache = await caches.open(CACHE_NAME);
  // Small batches are reliable on Android tablets. A failed required file
  // keeps the previous complete worker active instead of installing partially.
  const batchSize = 8;
  for (let i = 0; i < PRECACHE_ASSETS.length; i += batchSize) {
    await cache.addAll(PRECACHE_ASSETS.slice(i, i + batchSize));
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(precacheEverything().then(() => self.skipWaiting()));
});

// ── Activate: delete old caches ────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim()).then(async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      await Promise.all(windows.map((client) => {
        const current = new URL(client.url);
        if (current.origin !== self.location.origin || current.searchParams.get('app') === '360') return;
        current.searchParams.set('app', '360');
        return client.navigate(current.href);
      }));
    })
  );
});

// ── Fetch: cache-first for images, network-first for everything else ────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle GET requests from the same origin
  if (event.request.method !== 'GET') return;

  const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(url.pathname);

  if (isImage) {
    // Cache-first: serve instantly from cache, fall back to network
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(event.request, { ignoreSearch: true }).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((response) => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          });
        })
      )
    );
  } else {
    // Network-first for HTML/JS/CSS: 항상 네트워크에서 최신 파일 가져오고,
    // 오프라인일 때만 캐시에서 제공
    event.respondWith(
      fetch(event.request).then((response) => {
        if (response.ok) {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
        }
        return response;
      }).catch(() => caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request, { ignoreSearch: true });
        if (cached) return cached;
        if (event.request.mode === 'navigate') return cache.match('./index.html');
        return Response.error();
      }))
    );
  }
});
