/**
 * app-data.js — 일반 화면 데이터와 YouTube 목록
 *
 * 메인, 사람, 일정, 날짜, 아이패드, 밥/간식, 화장실, 외출, 날씨 화면은
 * 이 파일에서 관리합니다. 공부하기 관련 화면은 study-data.js에 있습니다.
 */

const DATA = {
  youtube: {
    busVideo:   "https://www.youtube.com/watch?v=Bks5WybVkQ0&t=441s",
    pororo:     "https://www.youtube.com/watch?v=NUb53dtqt6E&t=1002s",
    gayo:       "https://www.youtube.com/watch?v=ekr2nIex040",
    bus1: "https://www.youtube.com/watch?v=Bks5WybVkQ0&t=441s",
    bus2: "https://www.youtube.com/watch?v=Iz1YrvCq5x4",
    bus3: "https://www.youtube.com/watch?v=qz5mck_-jXM",
    bus4: "https://www.youtube.com/watch?v=fa6RXRvixXI",
    bus5: "https://www.youtube.com/watch?v=A1JfsShN2GE",
    bus6: "https://www.youtube.com/watch?v=EZvRpLoNazg",
    pororo1: "https://www.youtube.com/watch?v=NUb53dtqt6E",
    pororo2: "https://www.youtube.com/watch?v=t8vR8wN9rXw",
    pororo3: "https://www.youtube.com/watch?v=4wW5vR3n0no",
    pororo4: "https://www.youtube.com/watch?v=W9D5ZQdYQqY",
    pororo5: "https://www.youtube.com/watch?v=G2bT3Q5h1gM",
    pororo6: "https://www.youtube.com/watch?v=u8Qx4M5cGxA",
    kongsuni1: "https://www.youtube.com/watch?v=NUb53dtqt6E",
    kongsuni2: "https://www.youtube.com/watch?v=ekr2nIex040",
    kongsuni3: "https://www.youtube.com/watch?v=Iz1YrvCq5x4",
    kongsuni4: "https://www.youtube.com/watch?v=qz5mck_-jXM",
    kongsuni5: "https://www.youtube.com/watch?v=fa6RXRvixXI",
    kongsuni6: "https://www.youtube.com/watch?v=A1JfsShN2GE",
    tayo1: "https://www.youtube.com/watch?v=Bks5WybVkQ0&t=441s",
    tayo2: "https://www.youtube.com/watch?v=Iz1YrvCq5x4",
    tayo3: "https://www.youtube.com/watch?v=qz5mck_-jXM",
    tayo4: "https://www.youtube.com/watch?v=fa6RXRvixXI",
    tayo5: "https://www.youtube.com/watch?v=A1JfsShN2GE",
    tayo6: "https://www.youtube.com/watch?v=EZvRpLoNazg",
    bebefin1: "https://www.youtube.com/watch?v=ekr2nIex040",
    bebefin2: "https://www.youtube.com/watch?v=NUb53dtqt6E",
    bebefin3: "https://www.youtube.com/watch?v=Iz1YrvCq5x4",
    bebefin4: "https://www.youtube.com/watch?v=qz5mck_-jXM",
    bebefin5: "https://www.youtube.com/watch?v=fa6RXRvixXI",
    bebefin6: "https://www.youtube.com/watch?v=A1JfsShN2GE",
    pinkfong1: "https://www.youtube.com/watch?v=ekr2nIex040",
    pinkfong2: "https://www.youtube.com/watch?v=NUb53dtqt6E",
    pinkfong3: "https://www.youtube.com/watch?v=Iz1YrvCq5x4",
    pinkfong4: "https://www.youtube.com/watch?v=qz5mck_-jXM",
    pinkfong5: "https://www.youtube.com/watch?v=fa6RXRvixXI",
    pinkfong6: "https://www.youtube.com/watch?v=A1JfsShN2GE",
    gayo1: "https://www.youtube.com/watch?v=ekr2nIex040",
    gayo2: "https://www.youtube.com/watch?v=Bks5WybVkQ0&t=441s",
    gayo3: "https://www.youtube.com/watch?v=Iz1YrvCq5x4",
    gayo4: "https://www.youtube.com/watch?v=qz5mck_-jXM",
    gayo5: "https://www.youtube.com/watch?v=fa6RXRvixXI",
    gayo6: "https://www.youtube.com/watch?v=A1JfsShN2GE",
    busrailNara: "https://www.youtube.com/@busrail-nara",
    seoulDrive: "https://www.youtube.com/@TheSeoulDrive",
    bebefinChannel: "https://www.youtube.com/@%EB%B2%A0%EB%B2%A0%ED%95%80",
    pororoChannel: "https://www.youtube.com/@%EB%BD%80%EB%A1%9C%EB%A1%9C%EA%B3%B5%EC%8B%9D%EC%B1%84%EB%84%90",
    ukuleleSearch: "https://www.youtube.com/results?search_query=%EC%9A%B0%EC%BF%A0%EB%A0%90%EB%A0%88+%EC%97%B0%EC%A3%BC",
    pianoSearch: "https://www.youtube.com/results?search_query=%ED%94%BC%EC%95%84%EB%85%B8+%EC%97%B0%EC%A3%BC",
    mealRiceYoutube: "https://www.youtube.com/watch?v=7IPlzOBDxSc&list=RD7IPlzOBDxSc&start_radio=1"
  },

  screens: {
    // ── 메인 ──────────────────────────────────────────────────────────────────
    main: {
      title: "메인 화면",
      helper: "버튼을 누르면 음성으로 읽어줍니다.",
      hero: [],
      items: [
        { label: "아이패드",   nav: "ipadHome",     image: "./images/ipad.png" },
        { label: "밥 먹기",   nav: "meal",         image: "./images/meal.png" },
        { label: "화장실",    nav: "toilet",       image: "./images/pee.png" },
        { label: "외출",      nav: "scheduleHomeOuting", image: "./images/outing.png" },
        { label: "잠자고 싶어", image: "./images/sleep.png", speech: "잠자고 싶어" },
        { label: "공부하기",  nav: "studyHome",    image: "./images/study.png" },
        { label: "다음",      nav: "main_p2",      image: "./images/outing.png" }
      ],
      layout: "main"
    },

    main_p2: {
      title: "메인 화면 (2)",
      helper: "추가 카테고리를 선택하세요.",
      hero: [],
      items: [
        { label: "교통수단사람장소 외출", nav: "outingHome", image: "./images/outing.png" },
        { label: "차타고싶어", nav: "outingPlace", image: "./images/dadcar.png" },
        { label: "학교",      nav: "outingSchool", image: "./images/outing_school1.png" },
        { label: "화장실",    nav: "toilet",       image: "./images/pee.png" },
        { label: "요일별 스케줄", nav: "scheduleWeekly", image: "./images/app_schedule.svg" },
        { label: "날짜",      nav: "dateHome",     image: "./images/app_date.svg" },
        { label: "과목",      nav: "subjectHome",  icon: "📚" },
        { label: "장소",      nav: "placeHome",    image: "./images/outing_park1.png" },
        { label: "이전",      nav: "main",         image: "./images/home.png" },
        { label: "다음",      nav: "main_p3",      image: "./images/outing.png" }
      ],
      layout: "main",
      showPlayer: false
    },

    main_p3: {
      title: "메인 화면 (3)",
      helper: "추가 카테고리를 선택하세요.",
      hero: [],
      items: [
        { label: "사람",      nav: "peopleHome",   image: "./images/outing_person_me.png" },
        { label: "날씨",      nav: "weatherHome",  image: "./images/weather.png" },
        { label: "화장실",    nav: "toilet",       image: "./images/pee.png" },
        { label: "이전",      nav: "main_p2",      image: "./images/home.png" },
        { label: "다음",      nav: "main",         image: "./images/outing.png" }
      ],
      layout: "main",
      showPlayer: false
    },

    // ── 사람 ──────────────────────────────────────────────────────────────────
    peopleHome: {
      title: "사람",
      helper: "사람을 골라보세요.",
      hero: [],
      items: [
        { label: "우리집 가족", nav: "peopleHomeFamily", image: "./images/home.png" },
        { label: "선생님",     nav: "peopleTeachers",   image: "./images/school_homeroom_teacher.png" },
        { label: "학교 친구",  nav: "peopleSchoolFriends", image: "./images/school_friends.png" },
        { label: "가족",       nav: "peopleRelatives",  image: "./images/outing_person_grandma.png" },
        { label: "모든 사람",  nav: "peopleAll",        image: "./images/outing_person_me.png" }
      ],
      layout: "main",
      showPlayer: false
    },

    peopleHomeFamily: {
      title: "우리집 가족",
      helper: "우리집 가족을 선택하세요.",
      hero: [],
      items: [
        { label: "나", image: "./images/outing_person_me.png" },
        { label: "아빠", image: "./images/outing_person_dad.png" },
        { label: "엄마", image: "./images/outing_person_mom.png" },
        { label: "나 홍재민", image: "./images/outing_person_me.png", speech: "내 이름은 홍재민이야" },
        { label: "아빠 홍진혁", image: "./images/outing_person_dad.png", speech: "아빠 이름은 홍진혁이야" },
        { label: "엄마 김주리", image: "./images/outing_person_mom.png", speech: "엄마 이름은 김주리야" }
      ],
      layout: "main",
      showPlayer: false
    },

    peopleTeachers: {
      title: "선생님",
      helper: "선생님을 선택하세요.",
      hero: [],
      items: [
        { label: "활동보조 선생님", image: "./images/outing_person_activity_support.png" },
        { label: "담임선생님", image: "./images/school_homeroom_teacher.png" },
        { label: "실무사 선생님", icon: "👩‍🏫" },
        { label: "사람과소통 김지은 선생님", image: "./images/person/사람과소통 김지은선생님1.png", imageFit: "cover" },
        { label: "큰나무병원 선생님", image: "./images/therapy_class_cognitive.png" },
        { label: "세브란스 병원 선생님", image: "./images/therapy_center_severance.png" }
      ],
      layout: "main",
      showPlayer: false
    },

    peopleSchoolFriends: {
      title: "학교 친구",
      helper: "친구를 선택하세요.",
      hero: [],
      items: [
        { label: "건민", image: "./images/school_friends_건민.png" },
        { label: "동하", image: "./images/school_friends_동하.png" },
        { label: "승우", image: "./images/school_friends_승우.png" },
        { label: "윤희", image: "./images/school_friends_윤희.png" },
        { label: "윤희 2", image: "./images/school_friends_윤희1.png" },
        { label: "하린", image: "./images/school_friends_하린.png" }
      ],
      layout: "main",
      showPlayer: false
    },

    peopleRelatives: {
      title: "가족",
      helper: "가족을 선택하세요.",
      hero: [],
      items: [
        { label: "할머니", image: "./images/outing_person_grandma.png" },
        { label: "할아버지", image: "./images/outing_person_grandpa.png" },
        { label: "큰엄마", icon: "👩" },
        { label: "큰아빠", icon: "👨" },
        { label: "라희", image: "./images/person/rahee.png" },
        { label: "라온이", image: "./images/person/raon.png" },
        { label: "엄마", image: "./images/outing_person_mom.png" },
        { label: "아빠", image: "./images/outing_person_dad.png" },
        { label: "나", image: "./images/outing_person_me.png" }
      ],
      layout: "main",
      showPlayer: false
    },

    peopleAll: {
      title: "모든 사람",
      helper: "사람을 선택하세요.",
      hero: [],
      items: [
        { label: "나", image: "./images/outing_person_me.png" },
        { label: "엄마", image: "./images/outing_person_mom.png" },
        { label: "아빠", image: "./images/outing_person_dad.png" },
        { label: "활동보조 선생님", image: "./images/outing_person_activity_support.png" },
        { label: "담임선생님", image: "./images/school_homeroom_teacher.png" },
        { label: "실무사 선생님", icon: "👩‍🏫" },
        { label: "사람과소통 김지은 선생님", image: "./images/person/사람과소통 김지은선생님1.png", imageFit: "cover" },
        { label: "큰나무병원 선생님", image: "./images/therapy_class_cognitive.png" },
        { label: "세브란스 병원 선생님", image: "./images/therapy_center_severance.png" },
        { label: "건민", image: "./images/school_friends_건민.png" },
        { label: "동하", image: "./images/school_friends_동하.png" },
        { label: "승우", image: "./images/school_friends_승우.png" },
        { label: "윤희", image: "./images/school_friends_윤희.png" },
        { label: "윤희 2", image: "./images/school_friends_윤희1.png" },
        { label: "하린", image: "./images/school_friends_하린.png" },
        { label: "할머니", image: "./images/outing_person_grandma.png" },
        { label: "할아버지", image: "./images/outing_person_grandpa.png" },
        { label: "큰엄마", icon: "👩" },
        { label: "큰아빠", icon: "👨" },
        { label: "라희", image: "./images/person/rahee.png" },
        { label: "라온이", image: "./images/person/raon.png" }
      ],
      layout: "main",
      showPlayer: false
    },

    // ── 스케줄 ────────────────────────────────────────────────────────────────
    scheduleHome: {
      title: "스케줄표",
      helper: "스케줄 관련 항목을 선택하세요.",
      hero: [],
      items: [
        { label: "오늘 일정", nav: "scheduleToday",        image: "./images/school_classroom.png" },
        { label: "집 스케줄", nav: "scheduleHomeActivity", image: "./images/home.png" },
        { label: "장보기", nav: "scheduleShopping", image: "./images/outing_mart1.png" },
        { label: "요일별 스케줄", nav: "scheduleWeekly",     image: "./images/school_classroom.png" },
        { label: "일일 스케줄표", nav: "scheduleDailyVisual", image: "./images/school_classroom.png" },
        { label: "내일 일정" }
      ],
      layout: "main",
      showPlayer: false
    },

    scheduleDailyVisual: {
      title: "일일 시각 스케줄",
      helper: "오늘 스케줄을 순서대로 볼 수 있어요.",
      hero: [],
      items: [],
      layout: "dailyVisual",
      showPlayer: false
    },

    scheduleWeekly: {
      title: "요일별 스케줄",
      helper: "",
      hero: [],
      items: [
        { label: "버전 1", nav: "scheduleWeeklyV1", image: "./images/app_schedule.svg" },
        { label: "버전 2", nav: "scheduleWeeklyV2", image: "./images/app_schedule.svg" }
      ],
      layout: "main",
      showPlayer: false
    },

    scheduleWeeklyV1: {
      title: "요일별 스케줄 버전 1",
      helper: "",
      hero: [],
      items: [],
      layout: "weeklySchedule",
      showPlayer: false
    },

    scheduleWeeklyV2: {
      title: "요일별 스케줄 버전 2",
      helper: "",
      hero: [],
      items: [],
      layout: "weeklyDayPicker",
      showPlayer: false
    },

    scheduleWeeklyDay: {
      title: "",
      helper: "",
      hero: [],
      items: [],
      layout: "weeklyDay",
      showPlayer: false
    },

    scheduleWeeklyDetail: {
      title: "",
      helper: "",
      hero: [],
      items: [],
      layout: "weeklyDetail",
      showPlayer: false
    },

    scheduleHomeOuting: {
      title: "외출",
      helper: "외출할 일을 순서대로 골라요.",
      hero: [],
      items: [],
      layout: "homeActivityPicker",
      homeActivityGroupId: "outing",
      showPlayer: false
    },

    scheduleHomeActivity: {
      title: "집 스케줄 만들기",
      helper: "할 일을 순서대로 눌러서 선택하세요. 다시 누르면 취소돼요.",
      hero: [],
      items: [],
      layout: "homeActivityPicker",
      showPlayer: false
    },

    scheduleHomeRun: {
      title: "집 스케줄",
      helper: "할 일을 완료했으면 눌러서 지워요.",
      hero: [],
      items: [],
      layout: "homeScheduleRunner",
      showPlayer: false
    },

    scheduleShopping: {
      title: "장보기",
      helper: "어디에 가고 무엇을 살지 골라요.",
      hero: [],
      items: [],
      layout: "shoppingPlanner",
      showPlayer: false
    },

    scheduleShoppingRun: {
      title: "장보기",
      helper: "큰 카드를 눌러서 완료해요.",
      hero: [],
      items: [],
      layout: "shoppingRunner",
      showPlayer: false
    },

    scheduleToday: {
      title: "오늘 일정",
      helper: "요일을 선택하세요.",
      hero: [],
      items: [
        { label: "월~목 일정", nav: "scheduleMTh",    image: "./images/school_classroom.png" },
        { label: "금요일 일정", nav: "scheduleFriday", image: "./images/transport_calltaxi.png" }
      ],
      layout: "main",
      showPlayer: false
    },

    scheduleMTh: {
      title: "월~목 일정",
      helper: "순서대로 눌러 말해 보세요. (치료실은 선택)",
      hero: [],
      items: [
        { label: "1. 학교가요",           image: "./images/school_classroom.png" },
        { label: "2. 장애인 콜택시 타요",  image: "./images/transport_calltaxi.png" },
        { label: "3. 치료실 선택",         nav: "scheduleTodayTherapy" },
        { label: "4. 장애인 콜택시 타요",  image: "./images/transport_calltaxi.png" },
        { label: "5. 집에 와요",           image: "./images/home.png" }
      ],
      layout: "main",
      showPlayer: false
    },

    scheduleFriday: {
      title: "금요일 일정",
      helper: "치료실 2개 선택 후 전체 일정을 확인하세요.",
      hero: [],
      items: [
        { label: "오전 치료실 선택",  nav: "scheduleFridayTherapy1", image: "./images/therapy_center_severance.png" },
        { label: "오후 치료실 선택",  nav: "scheduleFridayTherapy2", image: "./images/therapy_center_severance.png" },
        { label: "전체 일정 보기",    nav: "scheduleFridayFinalResult", image: "./images/school_classroom.png" }
      ],
      layout: "main",
      showPlayer: false
    },

    scheduleFridayTherapy1: {
      title: "오전 치료실 선택",
      helper: "치료실과 과목을 선택하세요.",
      hero: [],
      items: [],
      layout: "fridayClassPicker",
      fridaySlot: 1,
      showPlayer: false
    },

    scheduleFridayTherapy1Result: {
      title: "오전 수업 일정",
      helper: "선택한 수업이에요.",
      hero: [],
      items: [],
      layout: "main",
      showPlayer: false
    },

    scheduleFridayTherapy2: {
      title: "오후 치료실 선택",
      helper: "치료실과 과목을 선택하세요.",
      hero: [],
      items: [],
      layout: "fridayClassPicker",
      fridaySlot: 2,
      showPlayer: false
    },

    scheduleFridayTherapy2Result: {
      title: "오후 수업 일정",
      helper: "선택한 수업이에요.",
      hero: [],
      items: [],
      layout: "main",
      showPlayer: false
    },

    scheduleFridayFinalResult: {
      title: "금요일 전체 일정",
      helper: "순서대로 눌러 말해 보세요.",
      hero: [],
      items: [],
      layout: "main",
      showPlayer: false
    },

    // 치료실 선택 (1~2개 병원 체크 → 각 병원 수업 선택)
    scheduleTodayTherapy: {
      title: "치료실 선택",
      helper: "오늘 갈 치료실을 1~2개 선택하세요.",
      hero: [],
      items: [],
      layout: "therapyCenterPicker",
      showPlayer: false
    },

    scheduleTodayClassesA: {
      title: "수업 선택 (1번째 치료실)",
      helper: "수업을 선택하세요.",
      hero: [],
      items: [],
      layout: "therapyClassPicker",
      centerIndex: 0,
      showPlayer: false
    },

    scheduleTodayClassesB: {
      title: "수업 선택 (2번째 치료실)",
      helper: "수업을 선택하세요.",
      hero: [],
      items: [],
      layout: "therapyClassPicker",
      centerIndex: 1,
      showPlayer: false
    },

    scheduleTodayTherapyResult: {
      title: "오늘 일정",
      helper: "선택한 치료실/수업 일정이에요.",
      hero: [],
      items: [],
      layout: "main",
      showPlayer: false
    },

    // ── 과목 ──────────────────────────────────────────────────────────────────
    subjectHome: {
      title: "과목",
      helper: "과목을 선택하세요.",
      hero: [],
      items: [
        { label: "국어" },
        { label: "수학" },
        { label: "체육" },
        { label: "음악" },
        { label: "미술" }
      ],
      layout: "main",
      showPlayer: false
    },

    // ── 날짜 ──────────────────────────────────────────────────────────────────
    dateHome: {
      title: "날짜",
      helper: "날짜/요일을 말해보세요.",
      hero: [],
      items: [],
      layout: "main",
      showPlayer: false
    },

    dateWeatherPicker: {
      title: "날씨 선택",
      helper: "오늘 날씨를 선택하세요.",
      hero: [],
      items: [
        { label: "맑음",     image: "./images/weather_cards/sunny.svg" },
        { label: "흐림",     image: "./images/weather_cards/cloudy.svg" },
        { label: "비",       image: "./images/weather_cards/rain.svg" },
        { label: "눈",       image: "./images/weather_cards/snow.svg" }
      ],
      layout: "main",
      showPlayer: false
    },

    dateMonthPicker: {
      title: "월 선택",
      helper: "1월~12월 중에서 선택하세요.",
      hero: [],
      items: Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1}월` })),
      layout: "main",
      showPlayer: false
    },

    dateDayPicker: {
      title: "일 선택",
      helper: "1일~30일 중에서 선택하세요.",
      hero: [],
      items: Array.from({ length: 30 }, (_, i) => ({ label: `${i + 1}일` })),
      layout: "main",
      showPlayer: false
    },

    dateWeekdayPicker: {
      title: "요일 선택",
      helper: "요일을 선택하세요.",
      hero: [],
      items: [
        { label: "월요일" }, { label: "화요일" }, { label: "수요일" },
        { label: "목요일" }, { label: "금요일" }, { label: "토요일" }, { label: "일요일" }
      ],
      layout: "main",
      showPlayer: false
    },

    // ── 공부하기 (동적 생성) ──────────────────────────────────────────────────
    studyHome: {
      title: "공부하기",
      helper: "카테고리를 선택하세요.",
      hero: [],
      items: STUDY_SCREEN_MAP.homeItems,
      layout: "main",
      showPlayer: false
    },

    ...STUDY_SCREEN_MAP.rest,

    // ── 아이패드 / 유튜브 ────────────────────────────────────────────────────
    ipadHome: {
      title: "아이패드(유튜브)",
      helper: "아이패드에서 사용할 기능을 선택하세요.",
      hero: [],
      items: [{ label: "유튜브", nav: "ipadYouTube", image: "./images/youtube.png", icon: "▶️" }],
      layout: "main",
      showPlayer: false
    },

    ipadYouTube: {
      title: "유튜브",
      helper: "원하는 메뉴를 선택하세요.",
      hero: [],
      items: [
        { label: "뚜버기의 외출", youtube: "busrailNara", image: "./images/bus.png" },
        { label: "서울드라이브", youtube: "seoulDrive", image: "./images/seouldrive.png" },
        { label: "베베핀", youtube: "bebefinChannel", image: "./images/bebefinn.png" },
        { label: "뽀로로", youtube: "pororoChannel", image: "./images/pororo.png" },
        { label: "우쿠렐레", youtube: "ukuleleSearch", image: "./images/ukulele.png" },
        { label: "피아노", youtube: "pianoSearch", image: "./images/piano.png" },
        { label: "노래",      nav: "ipadMusic",    image: "./images/sing.png" }
      ],
      layout: "main",
      showPlayer: false
    },

    ipadMusic: {
      title: "노래",
      helper: "원하는 콘텐츠를 선택하세요.",
      hero: [],
      items: [
        { label: "뽀로로", nav: "pororoList",   youtube: "pororo",   image: "https://img.youtube.com/vi/NUb53dtqt6E/hqdefault.jpg" },
        { label: "콩순이", nav: "kongsuniList", youtube: "kongsuni1",image: "https://img.youtube.com/vi/NUb53dtqt6E/hqdefault.jpg" },
        { label: "타요",   nav: "tayoList",     youtube: "tayo1",    image: "https://img.youtube.com/vi/Bks5WybVkQ0/hqdefault.jpg" },
        { label: "베베핀", nav: "bebefinList",  youtube: "bebefin1", image: "https://img.youtube.com/vi/ekr2nIex040/hqdefault.jpg" },
        { label: "핑크퐁", nav: "pinkfongList", youtube: "pinkfong1",image: "https://img.youtube.com/vi/ekr2nIex040/hqdefault.jpg" },
        { label: "가요",   nav: "gayoList",     youtube: "gayo1",    image: "https://img.youtube.com/vi/ekr2nIex040/hqdefault.jpg" }
      ],
      layout: "main",
      showPlayer: false
    },

    busVideoList: {
      title: "버스 영상",
      helper: "보고 싶은 버스 영상을 선택하세요.",
      hero: [],
      items: Array.from({ length: 6 }, (_, i) => ({ label: `버스 ${i + 1}`, youtube: `bus${i + 1}`, playInApp: true })),
      layout: "media",
      showPlayer: false
    },

    pororoList: {
      title: "뽀로로",
      helper: "보고 싶은 뽀로로 영상을 선택하세요.",
      hero: [],
      items: Array.from({ length: 6 }, (_, i) => ({ label: `뽀로로 ${i + 1}`, youtube: `pororo${i + 1}`, playInApp: true })),
      layout: "media",
      showPlayer: false
    },

    kongsuniList: {
      title: "콩순이",
      helper: "보고 싶은 콩순이 영상을 선택하세요.",
      hero: [],
      items: Array.from({ length: 6 }, (_, i) => ({ label: `콩순이 ${i + 1}`, youtube: `kongsuni${i + 1}`, playInApp: true })),
      layout: "media",
      showPlayer: false
    },

    tayoList: {
      title: "타요",
      helper: "보고 싶은 타요 영상을 선택하세요.",
      hero: [],
      items: Array.from({ length: 6 }, (_, i) => ({ label: `타요 ${i + 1}`, youtube: `tayo${i + 1}`, playInApp: true })),
      layout: "media",
      showPlayer: false
    },

    bebefinList: {
      title: "베베핀",
      helper: "보고 싶은 베베핀 영상을 선택하세요.",
      hero: [],
      items: Array.from({ length: 6 }, (_, i) => ({ label: `베베핀 ${i + 1}`, youtube: `bebefin${i + 1}`, playInApp: true })),
      layout: "media",
      showPlayer: false
    },

    pinkfongList: {
      title: "핑크퐁",
      helper: "보고 싶은 핑크퐁 영상을 선택하세요.",
      hero: [],
      items: Array.from({ length: 6 }, (_, i) => ({ label: `핑크퐁 ${i + 1}`, youtube: `pinkfong${i + 1}`, playInApp: true })),
      layout: "media",
      showPlayer: false
    },

    gayoList: {
      title: "가요",
      helper: "듣고 싶은 가요를 선택하세요.",
      hero: [],
      items: Array.from({ length: 6 }, (_, i) => ({ label: `가요 ${i + 1}`, youtube: `gayo${i + 1}`, playInApp: true })),
      layout: "media",
      showPlayer: false
    },

    youtubePlayer: {
      title: "영상 재생",
      helper: "영상을 보고 뒤로 가기로 돌아가세요.",
      hero: [],
      items: [],
      layout: "detail",
      showPlayer: true
    },

    // ── 일상 ──────────────────────────────────────────────────────────────────
    meal: {
      title: "밥 먹기",
      helper: "원하는 카테고리를 선택하세요.",
      hero: [],
      items: [
        { label: "밥",   nav: "mealRice",      image: "./images/meal.png" },
        { label: "간식", nav: "mealSnack",     image: "./images/meal_eggtart.png" },
        { label: "과일", nav: "mealFruit",     image: "./images/apple.png" },
        { label: "야채", nav: "mealVegetable", image: "./images/tomato.png" },
        { label: "음료", nav: "mealDrink",     image: "./images/meal_juice.png" },
        { label: "빵",   nav: "mealBread",     image: "./images/outing_bakery.png" },
        { label: "커피", nav: "mealCoffee",    icon: "☕" }
      ],
      layout: "main"
    },

    mealRice: {
      title: "밥",
      helper: "먹고 싶은 것을 선택하세요.",
      hero: [],
      items: [
        { label: "밥",   image: "./images/meal_rice.png" },
        { label: "물",   image: "./images/water.png" },
        { label: "주스", image: "./images/meal_juice.png" },
        { label: "우유", image: "./images/meal_milk.png" },
        { label: "두유", image: "./images/meal_soymilk.png" },
        { label: "화장실", image: "./images/pee.png", speech: "화장실" },
        { label: "유튜브", image: "./images/youtube.png", youtube: "mealRiceYoutube", sideSlot: true }
      ],
      layout: "main"
    },

    mealSnack: {
      title: "간식",
      helper: "먹고 싶은 간식을 선택하세요.",
      hero: [],
      items: [
        { label: "에그타르트", image: "./images/meal_eggtart.png" },
        { label: "요플레",     image: "./images/yogurt.png" },
        { label: "요구르트",   image: "./images/yogurt_drink.png" },
        { label: "주스",       image: "./images/meal_juice.png" },
        { label: "워터젤리",   image: "./images/water_jelly.png" },
        { label: "화장실",     image: "./images/pee.png", speech: "화장실" },
        { label: "우유",       image: "./images/meal_milk.png" },
        { label: "두유",       image: "./images/meal_soymilk.png" },
        { label: "과자",       icon: "🍪" },
        { label: "젤리",       icon: "🍬" },
        { label: "아이스크림", icon: "🍦" }
      ],
      layout: "main"
    },

    mealFruit: {
      title: "과일",
      helper: "먹고 싶은 과일을 선택하세요.",
      hero: [],
      items: [
        { label: "사과",       image: "./images/apple.png" },
        { label: "바나나",     image: "./images/bannana.png" },
        { label: "딸기",       image: "./images/strawberry.png" },
        { label: "포도",       image: "./images/grape.png" },
        { label: "수박",       image: "./images/watermelon.png" },
        { label: "귤",         icon: "🍊" },
        { label: "오렌지",     image: "./images/orange.png" },
        { label: "블루베리",   icon: "🫐" }
      ],
      layout: "main"
    },

    mealVegetable: {
      title: "야채",
      helper: "먹고 싶은 야채를 선택하세요.",
      hero: [],
      items: [
        { label: "토마토",   image: "./images/tomato.png" },
        { label: "당근",     icon: "🥕" },
        { label: "오이",     icon: "🥒" },
        { label: "브로콜리", icon: "🥦" },
        { label: "옥수수",   icon: "🌽" },
        { label: "고구마",   icon: "🍠" }
      ],
      layout: "main"
    },

    mealDrink: {
      title: "음료",
      helper: "마시고 싶은 것을 선택하세요.",
      hero: [],
      items: [
        { label: "물",       image: "./images/water.png" },
        { label: "주스",     image: "./images/meal_juice.png" },
        { label: "우유",     image: "./images/meal_milk.png" },
        { label: "두유",     image: "./images/meal_soymilk.png" },
        { label: "워터젤리", image: "./images/water_jelly.png" },
        { label: "요구르트", image: "./images/yogurt_drink.png" },
        { label: "바나나우유", icon: "🍌" },
        { label: "딸기우유", icon: "🍓" },
        { label: "초코우유", icon: "🍫" },
        { label: "수박주스", icon: "🍉" },
        { label: "밀크쉐이크", icon: "🥤" },
        { label: "콜라", icon: "🥤" },
        { label: "사이다", icon: "🥤" },
        { label: "환타", icon: "🥤" }
      ],
      layout: "main"
    },

    mealBread: {
      title: "빵",
      helper: "먹고 싶은 빵을 선택하세요.",
      hero: [],
      items: [
        { label: "빵",         image: "./images/outing_bakery.png" },
        { label: "식빵",       icon: "🍞" },
        { label: "크루아상",   icon: "🥐" },
        { label: "에그타르트", image: "./images/meal_eggtart.png" },
        { label: "케이크",     icon: "🎂" },
        { label: "파리바게트", image: "./images/home_schedule/paris_baguette.png" }
      ],
      layout: "main"
    },

    mealCoffee: {
      title: "커피",
      helper: "마시고 싶은 것을 선택하세요.",
      hero: [],
      items: [
        { label: "커피", icon: "☕" }
      ],
      layout: "main"
    },

    toilet: {
      title: "화장실",
      helper: "원하는 것을 선택하세요.",
      hero: [],
      items: [
        { label: "물소리", nav: "toiletWaterVideo", image: "./images/watersound.png", immediateNav: true, silent: true },
        { label: "똥싸고 싶어요",   image: "./images/poo.png" },
        { label: "오줌싸고 싶어요", image: "./images/pee.png" },
        { label: "양치",           image: "./images/brush.png" },
        { label: "손씻기",         image: "./images/wash_hands.png" },
        { label: "세수하기",       image: "./images/wash_face.png" },
        { label: "샤워하기",       image: "./images/shower.png" }
      ],
      layout: "media",
      showPlayer: false
    },

    toiletWaterVideo: {
      title: "물소리",
      helper: "물소리 영상을 봐요.",
      hero: [],
      items: [],
      layout: "localVideo",
      showPlayer: false,
      video: {
        src: "./video/watersound.mp4",
        poster: "./images/watersound.png",
        label: "물소리"
      }
    },

    // ── 외출하기 ──────────────────────────────────────────────────────────────
    outingHome: {
      title: "외출하기",
      helper: "사람, 장소, 이동수단을 선택할 수 있어요.",
      hero: [
        { label: "버스",   image: "./images/outing.png" },
        { label: "아빠차", image: "./images/dad car.png" }
      ],
      items: [
        { label: "사람 선택",    nav: "outingPerson" },
        { label: "장소 선택",    nav: "outingPlace" },
        { label: "이동수단 선택", nav: "outingTransport" }
      ],
      layout: "detail"
    },

    outingPerson: {
      title: "사람 선택",
      helper: "누가 함께 가나요?",
      hero: [],
      items: [
        { label: "나",            image: "./images/outing_person_me.png" },
        { label: "엄마",          image: "./images/outing_person_mom.png" },
        { label: "아빠",          image: "./images/outing_person_dad.png" },
        { label: "활동보조 선생님", image: "./images/outing_person_activity_support.png" },
        { label: "할아버지",       image: "./images/outing_person_grandpa.png" },
        { label: "할머니",         image: "./images/outing_person_grandma.png" }
      ],
      layout: "main",
      showPlayer: false
    },

    outingPlace: {
      title: "장소 선택",
      helper: "어디로 갈까요?",
      hero: [],
      items: [
        { label: "공원",                      image: "./images/outing_park1.png" },
        { label: "마트",                      image: "./images/outing_mart1.png" },
        { label: "빵집",                      image: "./images/outing_bakery.png" },
        { label: "카페",                      image: "./images/outing_cafe.png" },
        { label: "이케아",                    image: "./images/ikea.png" },
        { label: "홈플러스", nav: "outingHomeplus", image: "./images/homeplus.png" }
      ],
      layout: "main",
      showPlayer: false
    },

    placeHome: {
      title: "장소",
      helper: "어디로 갈까요?",
      hero: [],
      items: [
        { label: "학교", nav: "outingSchool", image: "./images/school_classroom.png" },
        { label: "공원",                      image: "./images/outing_park1.png" },
        { label: "마트",                      image: "./images/outing_mart1.png" },
        { label: "빵집",                      image: "./images/outing_bakery.png" },
        { label: "카페",                      image: "./images/outing_cafe.png" },
        { label: "이케아",                    image: "./images/ikea.png" },
        { label: "홈플러스", nav: "outingHomeplus", image: "./images/homeplus.png" }
      ],
      layout: "main",
      showPlayer: false
    },

    outingHomeplus: {
      title: "홈플러스",
      helper: "홈플러스에서 어디로 갈까요?",
      hero: [],
      items: [
        { label: "마트",   image: "./images/homeplus.png" },
        { label: "카페",   image: "./images/edia_cafe.png" },
        { label: "식당",   image: "./images/homeplus_foodcourt.png" },
        { label: "다이소", image: "./images/stickerbook_mart.png" }
      ],
      layout: "main",
      showPlayer: false
    },

    // ── 학교 ──────────────────────────────────────────────────────────────────
    outingSchool: {
      title: "학교",
      helper: "어디로 갈까요? (더 보기는 「다음」)",
      hero: [],
      items: [
        { label: "신발장",     image: "./images/school_shoe_locker.png" },
        { label: "엘리베이터", image: "./images/school_elevator.png" },
        { label: "화장실",     image: "./images/school_restroom.png" },
        { label: "교실",       image: "./images/school_classroom.png" },
        { label: "담임선생님", image: "./images/school_homeroom_teacher.png" },
        { label: "친구들",     nav: "outingSchoolFriends", image: "./images/school_friends.png" },
        { label: "다음",       nav: "outingSchool_p2",     image: "./images/study.png" }
      ],
      layout: "main",
      showPlayer: false
    },

    outingSchoolFriends: {
      title: "친구들",
      helper: "친구를 선택하세요.",
      hero: [],
      items: [
        { label: "건민",  image: "./images/school_friends_건민.png" },
        { label: "동하",  image: "./images/school_friends_동하.png" },
        { label: "승우",  image: "./images/school_friends_승우.png" },
        { label: "윤희",  image: "./images/school_friends_윤희.png" },
        { label: "윤희 2",image: "./images/school_friends_윤희1.png" },
        { label: "하린",  image: "./images/school_friends_하린.png" }
      ],
      layout: "main",
      showPlayer: false
    },

    outingSchool_p2: {
      title: "학교",
      helper: "계속 선택하세요. (「이전」「다음」)",
      hero: [],
      items: [
        { label: "교과실",       image: "./images/school_subject_room.png" },
        { label: "급식실",       image: "./images/school_cafeteria.png" },
        { label: "무한상상실",   image: "./images/school_imagination_room.png" },
        { label: "학교정원",     image: "./images/school_garden.png" },
        { label: "디지털액티브실",image: "./images/school_digital_active_room.png" },
        { label: "체육관",       image: "./images/school_gym.png" },
        { label: "다음", nav: "outingSchool_p3", image: "./images/study.png" },
        { label: "이전", nav: "outingSchool",    image: "./images/study.png" }
      ],
      layout: "main",
      showPlayer: false
    },

    outingSchool_p3: {
      title: "학교",
      helper: "마지막 항목이에요.",
      hero: [],
      items: [
        { label: "보치아경기", image: "./images/school_boccia.png" },
        { label: "이전", nav: "outingSchool_p2", image: "./images/study.png" }
      ],
      layout: "main",
      showPlayer: false
    },

    outingTransport: {
      title: "이동수단 선택",
      helper: "어떻게 이동할까요?",
      hero: [],
      items: [
        { label: "걸어서",      image: "./images/transport_walk.png" },
        { label: "자동차 키",    image: "./images/dad_carkey.png",   subScreen: "outingCarTypes" },
        { label: "버스",        image: "./images/bus.png" },
        { label: "지하철",      image: "./images/transport_subway_JM.png" },
        { label: "자전거",      image: "./images/transport_bike.png" },
        { label: "장애인콜택시", image: "./images/transport_calltaxi.png" }
      ],
      layout: "main",
      showPlayer: false
    },

    outingCarTypes: {
      title: "자동차 종류",
      helper: "어떤 차를 탈까요?",
      hero: [],
      items: [
        { label: "아빠차",  image: "./images/dad car.png" },
        { label: "자동차1", image: "./images/transport_car.png" },
        { label: "자동차2", image: "./images/transport_car.png" }
      ],
      layout: "main",
      showPlayer: false
    },

    // ── 날씨 ──────────────────────────────────────────────────────────────────
    weatherHome: {
      title: "날씨",
      helper: "오늘 날씨를 선택하세요.",
      hero: [],
      items: [
        { label: "맑음",     image: "./images/weather_cards/sunny.svg", videoUrl: "https://www.youtube.com/watch?v=CrG6uJmNHZY", videoQuery: "맑은 하늘 짧은 영상" },
        { label: "흐림",     image: "./images/weather_cards/cloudy.svg", videoQuery: "흐린 하늘 구름 짧은 영상" },
        { label: "비",       image: "./images/weather_cards/rain.svg", videoUrl: "https://www.youtube.com/watch?v=T97dDOuJp60", videoQuery: "비 내리는 짧은 영상" },
        { label: "눈",       image: "./images/weather_cards/snow.svg", videoUrl: "https://www.youtube.com/watch?v=gs4oEpvJYAQ&list=PLy6aYif98q-gp3PHFfZCD9f8-Xt5xR2Sl", videoQuery: "눈 내리는 짧은 영상" }
      ],
      layout: "main",
      showPlayer: false
    }
  }
};
