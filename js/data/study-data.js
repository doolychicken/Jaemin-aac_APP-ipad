/**
 * study-data.js — 공부하기 화면과 퍼즐 데이터
 *
 * 숫자/한글/이름 퍼즐, 앱 공부, 교구 선택 화면은 이 파일에서 관리합니다.
 */

// ── 공부하기 화면 동적 생성 ──────────────────────────────────────────────────
function buildStudyScreensMap() {
  const BLANK_TILE_IMAGE =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23ffffff'/></svg>";

  const stickerKinds = [
    { label: "마트",     image: "./images/stickerbook_mart.png" },
    { label: "과일",     image: "./images/stickerbook_fruit.png" },
    { label: "우리집",   image: "./images/stickerbook_myhome.png" },
    { label: "동물",     image: "./images/stickerbook_animal.png" },
    { label: "탈것",     image: "./images/stickerbook_vehicle.png" },
    { label: "숫자",     image: "./images/stickerbook_number.png" },
    { label: "눈코입",   image: "./images/stickerbook_eyenosemouth.png" },
    { label: "한글",     image: "./images/stickerbook_language.png" },
    { label: "애완동물", image: "./images/stickerbook_pet.png" },
    { label: "모양.색깔",image: "./images/stickerbook_shape.png" }
  ];

  const knobKinds = [
    { label: "숫자", image: "./images/knobpuzzle_numbers.png" },
    { label: "모양", image: "./images/knobpuzzle_shapes2.png" },
    { label: "과일", image: "./images/knobpuzzle_fruits.png" },
    { label: "탈것", image: "./images/knobpuzzle_vehicles.png" }
  ];

  const defs = [
    {
      key: "studyPeg",
      label: "페그꼽기",
      studyTileImage: "./images/study_pegboard.png",
      subs: ["페그꼽기 ①", "페그꼽기 ②", "페그꼽기 ③", "페그꼽기 ④", "페그꼽기 ⑤", "페그꼽기 ⑥"]
    },
    {
      key: "studySoundCard",
      label: "사운드북 카드",
      studyTileImage: "./images/study_soundbook_card.png",
      subs: ["사운드북 카드 ①", "사운드북 카드 ②", "사운드북 카드 ③", "사운드북 카드 ④", "사운드북 카드 ⑤", "사운드북 카드 ⑥"]
    },
    {
      key: "studyColorPencil",
      label: "색연필",
      studyTileImage: "./images/study_color_pencil.png",
      subs: ["색연필 ①", "색연필 ②", "색연필 ③", "색연필 ④", "색연필 ⑤", "색연필 ⑥"]
    },
    {
      key: "studyCard",
      label: "카드",
      subs: ["카드 ①", "카드 ②", "카드 ③", "카드 ④", "카드 ⑤", "카드 ⑥"]
    }
  ];

  const rest = {};
  const teachingAidItems = [
    { label: "스티커북", nav: "studySticker",    image: "./images/stickerbook_mart.png", teachingAidId: "studySticker" },
    { label: "꼭지퍼즐", nav: "studyKnobPuzzle", image: "./images/knobpuzzle_fruits.png", teachingAidId: "studyKnobPuzzle" },
    ...defs.map((d) => ({
      label: d.label,
      nav: d.key,
      image: d.studyTileImage || "./images/study.png",
      teachingAidId: d.key
    }))
  ];

  const appStudyItems = [
    { label: "숫자",   nav: "studyNumbers",    image: "./images/stickerbook_number.png" },
    { label: "한글",   nav: "studyHangul",     image: "./images/stickerbook_language.png" },
    { label: "이름",   nav: "studyNames",      image: "./images/person/me.png" },
    { label: "사람",   nav: "studyPeople",     image: "./images/outing_person_me.png" },
    { label: "과일",   nav: "studySticker_2",  image: "./images/stickerbook_fruit.png" },
    { label: "우리집", nav: "studySticker_3",  image: "./images/stickerbook_myhome.png" },
    { label: "동물",   nav: "studySticker_4",  image: "./images/stickerbook_animal.png" },
    { label: "탈것",   nav: "studyVehicles",   image: "./images/stickerbook_vehicle.png" },
    { label: "색깔",   nav: "studySticker_10", image: "./images/stickerbook_shape.png" }
  ];

  const hangulLetterItems = [
    ["ㄱ", "기역"], ["ㄴ", "니은"], ["ㄷ", "디귿"], ["ㄹ", "리을"],
    ["ㅁ", "미음"], ["ㅂ", "비읍"], ["ㅅ", "시옷"], ["ㅇ", "이응"],
    ["ㅈ", "지읒"], ["ㅊ", "치읓"], ["ㅋ", "키읔"], ["ㅌ", "티읕"],
    ["ㅍ", "피읖"], ["ㅎ", "히읗"]
  ].map(([letter, speech]) => ({ label: letter, icon: letter, speech }));

  const nameStudyItems = [
    { label: "홍재민 버전1", nav: "studyNamePuzzleJaemin", image: "./images/person/me.png", speech: "내 이름은 홍재민이야" },
    { label: "홍재민 버전2", nav: "studyNamePuzzleJaeminV2", image: "./images/knobpuzzle_numbers.png", speech: "내 이름은 홍재민이야" },
    { label: "아빠 홍진혁 버전1", nav: "studyNamePuzzleDad", image: "./images/person/dad.png", speech: "아빠 이름은 홍진혁이야" },
    { label: "아빠 홍진혁 버전2", nav: "studyNamePuzzleDadV2", image: "./images/knobpuzzle_numbers.png", speech: "아빠 이름은 홍진혁이야" },
    { label: "엄마 김주리 버전1", nav: "studyNamePuzzleMom", image: "./images/person/mom.png", speech: "엄마 이름은 김주리야" },
    { label: "엄마 김주리 버전2", nav: "studyNamePuzzleMomV2", image: "./images/knobpuzzle_numbers.png", speech: "엄마 이름은 김주리야" }
  ];

  const studyPeopleProfiles = [
    { key: "me", label: "나", name: "홍재민", relation: "나", age: "13", image: "./images/outing_person_me.png", speech: "나는 홍재민이야. 나는 13살이야" },
    { key: "mom", label: "엄마", name: "김주리", relation: "엄마", image: "./images/outing_person_mom.png", speech: "엄마야. 엄마 이름은 김주리야" },
    { key: "dad", label: "아빠", name: "홍진혁", relation: "아빠", image: "./images/outing_person_dad.png", speech: "아빠야. 아빠 이름은 홍진혁이야" },
    { key: "activitySupportTeacher", label: "활동보조 선생님", relation: "선생님", image: "./images/outing_person_activity_support.png" },
    { key: "homeroomTeacher", label: "담임선생님", relation: "선생님", image: "./images/school_homeroom_teacher.png" },
    { key: "assistantTeacher", label: "실무사 선생님", relation: "선생님", icon: "👩‍🏫" },
    { key: "communicationTeacher", label: "사람과소통 김지은 선생님", relation: "선생님", image: "./images/person/사람과소통 김지은선생님1.png", imageFit: "cover" },
    { key: "bigTreeTeacher", label: "큰나무병원 선생님", relation: "선생님", image: "./images/therapy_class_cognitive.png" },
    { key: "severanceTeacher", label: "세브란스 병원 선생님", relation: "선생님", image: "./images/therapy_center_severance.png" },
    { key: "geonmin", label: "건민", relation: "친구", image: "./images/school_friends_건민.png" },
    { key: "dongha", label: "동하", relation: "친구", image: "./images/school_friends_동하.png" },
    { key: "seungwoo", label: "승우", relation: "친구", image: "./images/school_friends_승우.png" },
    { key: "yunhee", label: "윤희", relation: "친구", image: "./images/school_friends_윤희.png" },
    { key: "yunhee2", label: "윤희 2", relation: "친구", image: "./images/school_friends_윤희1.png" },
    { key: "harin", label: "하린", relation: "친구", image: "./images/school_friends_하린.png" },
    { key: "grandma", label: "할머니", relation: "할머니", image: "./images/outing_person_grandma.png" },
    { key: "grandpa", label: "할아버지", relation: "할아버지", image: "./images/outing_person_grandpa.png" },
    { key: "aunt", label: "큰엄마", relation: "큰엄마", icon: "👩" },
    { key: "uncle", label: "큰아빠", relation: "큰아빠", icon: "👨" },
    { key: "rahee", label: "라희", relation: "가족", image: "./images/person/rahee.png" },
    { key: "raon", label: "라온이", relation: "가족", image: "./images/person/raon.png" }
  ];

  const studyPeopleNameChoices = ["홍재민", "김주리", "홍진혁"];
  const studyPeopleRelationChoices = ["엄마", "나", "아빠"];
  const studyPeopleAgeChoices = ["12", "13", "14"];

  function choicePieces(choices) {
    return choices.map((label) => ({ label, value: label, speech: label }));
  }

  function ageChoicePieces(choices) {
    return choices.map((age) => ({ label: `${age}살`, value: age, speech: `${age}살` }));
  }

  function personTargetName(person) {
    return person.name || person.label;
  }

  function threeChoices(target, choices) {
    if (choices.includes(target)) return choices;
    const fallback = choices.filter((choice) => choice !== target);
    return [fallback[0] || target, target, fallback[1] || target].filter((choice, index, arr) => arr.indexOf(choice) === index);
  }

  function personRelationSpeech(person) {
    return person.label === person.relation
      ? `${person.label}야`
      : `${person.label}은 ${person.relation}이야`;
  }

  const vehicleStudyItems = [
    { label: "자동차", image: "./images/transport_car.png" },
    { label: "아빠 차", image: "./images/dad car.png" },
    { label: "버스", image: "./images/transport_bus.png" },
    { label: "버스 그림", image: "./images/bus.png", speech: "버스" },
    { label: "학교 버스", image: "./images/school bus.png" },
    { label: "콜택시", image: "./images/transport_calltaxi.png" },
    { label: "지하철", image: "./images/transport_subway.png" },
    { label: "지하철 타기", image: "./images/transport_subway_JM.png" },
    { label: "자전거", image: "./images/transport_bike.png" },
    { label: "탈것 퍼즐", image: "./images/knobpuzzle_vehicles.png", speech: "탈것" }
  ];

  const homeItems = [
    { label: "교구선택", nav: "studyTeachingAids", image: "./images/study_pegboard.png" },
    { label: "앱 공부",  nav: "studyAppLearning", image: "./images/stickerbook_number.png" }
  ];

  rest.studyTeachingAids = {
    title: "교구선택",
    helper: "교구를 선택하세요.",
    hero: [],
    items: teachingAidItems,
    layout: "main",
    showPlayer: false
  };

  rest.studyAppLearning = {
    title: "앱 공부",
    helper: "공부할 것을 선택하세요.",
    hero: [],
    items: appStudyItems,
    layout: "main",
    showPlayer: false
  };

  rest.studyNumbers = {
    title: "숫자",
    helper: "숫자 공부를 선택하세요.",
    hero: [],
    items: [
      { label: "숫자 퍼즐", nav: "studyNumberPuzzle", image: "./images/knobpuzzle_numbers.png" },
      { label: "숫자 퍼즐 2", nav: "studyNumberPuzzle2", image: "./images/knobpuzzle_numbers2.png" },
      { label: "숫자 카드", nav: "studySticker_6", image: "./images/stickerbook_number.png" }
    ],
    layout: "main",
    showPlayer: false
  };

  rest.studyNumberPuzzle = {
    title: "숫자 퍼즐",
    helper: "카드를 끌어서 같은 숫자 빈칸에 맞춰요.",
    hero: [],
    items: [],
    layout: "studyPuzzle",
    showPlayer: false,
    puzzle: {
      title: "1부터 10까지",
      completeSpeech: "숫자 퍼즐 완료! 정말 잘했어요!",
      slots: [
        { label: "1", value: "1", speech: "일" },
        { label: "2", value: "2", speech: "이" },
        { label: "3", value: "3", speech: "삼" },
        { label: "4", value: "4", speech: "사" },
        { label: "5", value: "5", speech: "오" },
        { label: "6", value: "6", speech: "육" },
        { label: "7", value: "7", speech: "칠" },
        { label: "8", value: "8", speech: "팔" },
        { label: "9", value: "9", speech: "구" },
        { label: "10", value: "10", speech: "십" }
      ],
      pieces: [
        { label: "1", value: "1", speech: "일" },
        { label: "2", value: "2", speech: "이" },
        { label: "3", value: "3", speech: "삼" },
        { label: "4", value: "4", speech: "사" },
        { label: "5", value: "5", speech: "오" },
        { label: "6", value: "6", speech: "육" },
        { label: "7", value: "7", speech: "칠" },
        { label: "8", value: "8", speech: "팔" },
        { label: "9", value: "9", speech: "구" },
        { label: "10", value: "10", speech: "십" }
      ]
    }
  };

  rest.studyNumberPuzzle2 = {
    title: "숫자 퍼즐 2",
    helper: "아래 숫자를 끌어서 나무판의 같은 숫자 자리에 맞춰요.",
    hero: [],
    items: [],
    layout: "studyPuzzle",
    showPlayer: false,
    puzzle: {
      title: "숫자 퍼즐 2",
      presentation: "number",
      theme: "wood",
      trayBatchSize: 3,
      successOverlay: true,
      completeSpeech: "숫자 퍼즐 2 완료! 정말 잘했어요!",
      slots: [
        { label: "1", value: "1", speech: "일" },
        { label: "2", value: "2", speech: "이" },
        { label: "3", value: "3", speech: "삼" },
        { label: "4", value: "4", speech: "사" },
        { label: "5", value: "5", speech: "오" },
        { label: "6", value: "6", speech: "육" },
        { label: "7", value: "7", speech: "칠" },
        { label: "8", value: "8", speech: "팔" },
        { label: "9", value: "9", speech: "구" },
        { label: "10", value: "10", speech: "십" }
      ],
      pieces: [
        { label: "1", value: "1", speech: "일" },
        { label: "2", value: "2", speech: "이" },
        { label: "3", value: "3", speech: "삼" },
        { label: "4", value: "4", speech: "사" },
        { label: "5", value: "5", speech: "오" },
        { label: "6", value: "6", speech: "육" },
        { label: "7", value: "7", speech: "칠" },
        { label: "8", value: "8", speech: "팔" },
        { label: "9", value: "9", speech: "구" },
        { label: "10", value: "10", speech: "십" }
      ]
    }
  };

  rest.studyHangul = {
    title: "한글",
    helper: "공부할 것을 선택하세요.",
    hero: [],
    items: [
      { label: "한글 퍼즐", nav: "studyHangulPuzzle", image: "./images/stickerbook_language.png" },
      { label: "가나다라 버전1", nav: "studyHangulGanadaraPuzzle", image: "./images/stickerbook_language.png" },
      { label: "가나다라 버전2", nav: "studyHangulGanadaraPuzzleV2", image: "./images/knobpuzzle_numbers.png" },
      { label: "ㄱㄴㄷ", nav: "studyHangulLetters", image: "./images/stickerbook_language.png" },
      { label: "이름", nav: "studyNames", image: "./images/person/me.png" }
    ],
    layout: "main",
    showPlayer: false
  };

  rest.studyHangulPuzzle = {
    title: "한글 퍼즐",
    helper: "글자 조각을 끌어서 같은 글자 자리에 맞춰요.",
    hero: [],
    items: [],
    layout: "studyPuzzle",
    showPlayer: false,
    puzzle: {
      title: "ㄱ부터 ㅎ까지",
      pageSize: 5,
      completeSpeech: "한글 퍼즐 완료! 정말 잘했어요!",
      slots: hangulLetterItems.map(({ label, speech }) => ({ label, value: label, speech })),
      pieces: hangulLetterItems.map(({ label, speech }) => ({ label, value: label, speech }))
    }
  };

  rest.studyHangulGanadaraPuzzle = {
    title: "가나다라 버전1",
    helper: "글자 조각을 끌어서 같은 글자 자리에 맞춰요.",
    hero: [],
    items: [],
    layout: "studyPuzzle",
    showPlayer: false,
    puzzle: {
      title: "가나다라 버전1 퍼즐",
      completeSpeech: "가나다라 버전1 퍼즐 완료! 정말 잘했어요!",
      slots: [
        { label: "가", value: "ga", speech: "가" },
        { label: "나", value: "na", speech: "나" },
        { label: "다", value: "da", speech: "다" },
        { label: "라", value: "ra", speech: "라" }
      ],
      pieces: [
        { label: "가", value: "ga", speech: "가" },
        { label: "나", value: "na", speech: "나" },
        { label: "다", value: "da", speech: "다" },
        { label: "라", value: "ra", speech: "라" }
      ]
    }
  };

  rest.studyHangulGanadaraPuzzleV2 = {
    title: "가나다라 버전2",
    helper: "아래 글자를 위로 끌어서 같은 글자 칸에 맞춰요.",
    hero: [],
    items: [],
    layout: "studyPuzzle",
    showPlayer: false,
    puzzle: {
      title: "가나다라 버전2 퍼즐",
      presentation: "number",
      completeSpeech: "가나다라 버전2 퍼즐 완료! 정말 잘했어요!",
      slots: [
        { label: "가", value: "ga", speech: "가" },
        { label: "나", value: "na", speech: "나" },
        { label: "다", value: "da", speech: "다" },
        { label: "라", value: "ra", speech: "라" }
      ],
      pieces: [
        { label: "가", value: "ga", speech: "가" },
        { label: "나", value: "na", speech: "나" },
        { label: "다", value: "da", speech: "다" },
        { label: "라", value: "ra", speech: "라" }
      ]
    }
  };

  rest.studyHangulLetters = {
    title: "ㄱㄴㄷ",
    helper: "글자를 누르면 읽어 줘요.",
    hero: [],
    items: hangulLetterItems,
    layout: "main",
    showPlayer: false
  };

  rest.studyNames = {
    title: "이름",
    helper: "이름을 누르면 읽어 줘요.",
    hero: [],
    items: nameStudyItems,
    layout: "main",
    showPlayer: false
  };

  rest.studyPeople = {
    title: "사람",
    helper: "사람을 골라 이름과 관계를 배워요.",
    hero: [],
    items: studyPeopleProfiles.map((person) => ({
      label: person.label,
      nav: `studyPerson_${person.key}`,
      image: person.image,
      icon: person.icon,
      imageFit: person.imageFit,
      speech: person.speech || person.label
    })),
    layout: "main",
    showPlayer: false
  };

  studyPeopleProfiles.forEach((person) => {
    const screenKey = `studyPerson_${person.key}`;
    const targetName = personTargetName(person);
    const nameChoices = threeChoices(targetName, studyPeopleNameChoices);
    const relationChoices = threeChoices(person.relation, studyPeopleRelationChoices);
    const menuItems = [
      { label: "이름 맞추기", nav: `${screenKey}_name`, image: person.image, icon: person.icon, imageFit: person.imageFit },
      { label: "누구인지 맞추기", nav: `${screenKey}_relation`, image: person.image, icon: person.icon, imageFit: person.imageFit }
    ];
    if (person.age) {
      menuItems.splice(1, 0, { label: "나이 맞추기", nav: `${screenKey}_age`, image: "./images/stickerbook_number.png" });
    }

    rest[screenKey] = {
      title: person.label,
      helper: "무엇을 배울지 골라요.",
      hero: [],
      items: menuItems,
      layout: "main",
      showPlayer: false
    };

    rest[`${screenKey}_name`] = {
      title: `${person.label} 이름`,
      helper: person.key === "me" ? "나의 이름은 누구야?" : `${person.label} 이름은 누구야?`,
      hero: [],
      items: [],
      layout: "studyPuzzle",
      showPlayer: false,
      puzzle: {
        title: `${person.label} 이름 맞추기`,
        image: person.image,
        imageLabel: person.label,
        theme: "people",
        completeSpeech: person.key === "me" ? `내 이름은 ${targetName}이야` : `${person.label} 이름은 ${targetName}이야`,
        slots: [
          { label: targetName, value: targetName, speech: targetName, placeholder: "이름" }
        ],
        pieces: choicePieces(nameChoices)
      }
    };

    rest[`${screenKey}_relation`] = {
      title: `${person.label} 누구`,
      helper: `${person.label}은 누구야?`,
      hero: [],
      items: [],
      layout: "studyPuzzle",
      showPlayer: false,
      puzzle: {
        title: `${person.label} 누구인지 맞추기`,
        image: person.image,
        imageLabel: person.label,
        theme: "people",
        completeSpeech: personRelationSpeech(person),
        slots: [
          { label: person.relation, value: person.relation, speech: person.relation, placeholder: "누구" }
        ],
        pieces: choicePieces(relationChoices)
      }
    };

    if (person.age) {
      rest[`${screenKey}_age`] = {
        title: `${person.label} 나이`,
        helper: "내 나이는 몇 살이야?",
        hero: [],
        items: [],
        layout: "studyPuzzle",
        showPlayer: false,
        puzzle: {
          title: `${person.label} 나이 맞추기`,
          image: person.image,
          imageLabel: person.label,
          theme: "people",
          completeSpeech: `나는 ${person.age}살이야`,
          slots: [
            { label: `${person.age}살`, value: person.age, speech: `${person.age}살`, placeholder: "몇 살" }
          ],
          pieces: ageChoicePieces(studyPeopleAgeChoices)
        }
      };
    }
  });

  rest.studyNamePuzzleJaemin = {
    title: "홍재민",
    helper: "이름 조각을 끌어서 맞춰요.",
    hero: [],
    items: [],
    layout: "studyPuzzle",
    showPlayer: false,
    puzzle: {
      title: "홍재민 이름 퍼즐",
      image: "./images/person/me.png",
      imageLabel: "홍재민",
      completeSpeech: "내 이름은 홍재민이야",
      slots: [
        { label: "홍", value: "hong", speech: "홍" },
        { label: "재", value: "jae", speech: "재" },
        { label: "민", value: "min", speech: "민" }
      ],
      pieces: [
        { label: "홍", value: "hong", speech: "홍" },
        { label: "재", value: "jae", speech: "재" },
        { label: "민", value: "min", speech: "민" }
      ]
    }
  };

  rest.studyNamePuzzleDad = {
    title: "아빠 홍진혁",
    helper: "이름 조각을 끌어서 맞춰요.",
    hero: [],
    items: [],
    layout: "studyPuzzle",
    showPlayer: false,
    puzzle: {
      title: "아빠 홍진혁 이름 퍼즐",
      image: "./images/person/dad.png",
      imageLabel: "아빠 홍진혁",
      completeSpeech: "아빠 이름은 홍진혁이야",
      slots: [
        { label: "홍", value: "hong", speech: "홍" },
        { label: "진", value: "jin", speech: "진" },
        { label: "혁", value: "hyeok", speech: "혁" }
      ],
      pieces: [
        { label: "홍", value: "hong", speech: "홍" },
        { label: "진", value: "jin", speech: "진" },
        { label: "혁", value: "hyeok", speech: "혁" }
      ]
    }
  };

  rest.studyNamePuzzleMom = {
    title: "엄마 김주리",
    helper: "이름 조각을 끌어서 맞춰요.",
    hero: [],
    items: [],
    layout: "studyPuzzle",
    showPlayer: false,
    puzzle: {
      title: "엄마 김주리 이름 퍼즐",
      image: "./images/person/mom.png",
      imageLabel: "엄마 김주리",
      completeSpeech: "엄마 이름은 김주리야",
      slots: [
        { label: "김", value: "kim", speech: "김" },
        { label: "주", value: "ju", speech: "주" },
        { label: "리", value: "ri", speech: "리" }
      ],
      pieces: [
        { label: "김", value: "kim", speech: "김" },
        { label: "주", value: "ju", speech: "주" },
        { label: "리", value: "ri", speech: "리" }
      ]
    }
  };

  rest.studyNamePuzzleJaeminV2 = {
    title: "홍재민 버전2",
    helper: "아래 이름 글자를 위로 끌어서 맞춰요.",
    hero: [],
    items: [],
    layout: "studyPuzzle",
    showPlayer: false,
    puzzle: {
      title: "홍재민 버전2 이름 퍼즐",
      presentation: "number",
      completeSpeech: "내 이름은 홍재민이야",
      slots: [
        { label: "홍", value: "hong", speech: "홍" },
        { label: "재", value: "jae", speech: "재" },
        { label: "민", value: "min", speech: "민" }
      ],
      pieces: [
        { label: "홍", value: "hong", speech: "홍" },
        { label: "재", value: "jae", speech: "재" },
        { label: "민", value: "min", speech: "민" }
      ]
    }
  };

  rest.studyNamePuzzleDadV2 = {
    title: "아빠 홍진혁 버전2",
    helper: "아래 이름 글자를 위로 끌어서 맞춰요.",
    hero: [],
    items: [],
    layout: "studyPuzzle",
    showPlayer: false,
    puzzle: {
      title: "아빠 홍진혁 버전2 이름 퍼즐",
      presentation: "number",
      completeSpeech: "아빠 이름은 홍진혁이야",
      slots: [
        { label: "홍", value: "hong", speech: "홍" },
        { label: "진", value: "jin", speech: "진" },
        { label: "혁", value: "hyeok", speech: "혁" }
      ],
      pieces: [
        { label: "홍", value: "hong", speech: "홍" },
        { label: "진", value: "jin", speech: "진" },
        { label: "혁", value: "hyeok", speech: "혁" }
      ]
    }
  };

  rest.studyNamePuzzleMomV2 = {
    title: "엄마 김주리 버전2",
    helper: "아래 이름 글자를 위로 끌어서 맞춰요.",
    hero: [],
    items: [],
    layout: "studyPuzzle",
    showPlayer: false,
    puzzle: {
      title: "엄마 김주리 버전2 이름 퍼즐",
      presentation: "number",
      completeSpeech: "엄마 이름은 김주리야",
      slots: [
        { label: "김", value: "kim", speech: "김" },
        { label: "주", value: "ju", speech: "주" },
        { label: "리", value: "ri", speech: "리" }
      ],
      pieces: [
        { label: "김", value: "kim", speech: "김" },
        { label: "주", value: "ju", speech: "주" },
        { label: "리", value: "ri", speech: "리" }
      ]
    }
  };

  rest.studyVehicles = {
    title: "탈것",
    helper: "탈것을 누르면 읽어 줘요.",
    hero: [],
    items: vehicleStudyItems,
    layout: "main",
    showPlayer: false
  };

  // 스티커북
  rest.studySticker = {
    title: "스티커북",
    helper: "원하는 종류를 선택하세요. (더 많은 종류는 「다음」)",
    hero: [],
    items: [
      ...stickerKinds.slice(0, 6).map((sub, i) => ({
        label: sub.label,
        nav: `studySticker_${i + 1}`,
        image: sub.image
      })),
      { label: "다음", nav: "studySticker_p2", image: "./images/study.png" }
    ],
    layout: "main",
    showPlayer: false
  };

  rest.studySticker_p2 = {
    title: "스티커북",
    helper: "나머지 종류를 선택하세요. (앞 화면은 「이전」)",
    hero: [],
    items: [
      ...stickerKinds.slice(6, 10).map((sub, i) => ({
        label: sub.label,
        nav: `studySticker_${i + 7}`,
        image: sub.image
      })),
      { label: "이전", nav: "studySticker", image: "./images/study.png" }
    ],
    layout: "main",
    showPlayer: false
  };

  stickerKinds.forEach((sub, i) => {
    const k = `studySticker_${i + 1}`;
    rest[k] = {
      title: sub.label,
      helper: "그림을 누르면 읽어 줘요.",
      hero: [],
      items: [],
      layout: "spotlight",
      spotlight: { image: sub.image, label: sub.label },
      teachingAidId: "studySticker",
      showPlayer: false
    };
  });

  // 꼭지퍼즐
  rest.studyKnobPuzzle = {
    title: "꼭지퍼즐",
    helper: "원하는 종류를 선택하세요.",
    hero: [],
    items: knobKinds.map((sub, i) => ({
      label: sub.label,
      nav: `studyKnobPuzzle_${i + 1}`,
      image: sub.image
    })),
    layout: "main",
    showPlayer: false
  };

  knobKinds.forEach((sub, i) => {
    const k = `studyKnobPuzzle_${i + 1}`;
    let items;
    if (sub.label === "숫자") {
      items = [
        { label: `${sub.label} · 1번`, image: "./images/knobpuzzle_numbers.png" },
        { label: `${sub.label} · 2번`, image: "./images/knobpuzzle_numbers2.png" },
        { label: `${sub.label} · 3번`, image: "./images/knobpuzzle_numbers3.png" },
        { label: `${sub.label} · 4번`, image: "./images/knobpuzzle_numbers.png" },
        { label: `${sub.label} · 5번`, image: "./images/knobpuzzle_numbers2.png" },
        { label: `${sub.label} · 6번`, image: "./images/knobpuzzle_numbers3.png" }
      ];
    } else if (sub.label === "모양") {
      items = [
        { label: `${sub.label} · 1번`, image: "./images/knobpuzzle_shapes2.png" },
        { label: `${sub.label} · 2번`, image: "./images/knobpuzzle_shapes.png" },
        { label: `${sub.label} · 3번`, image: "./images/knobpuzzle_shapes2.png" },
        { label: `${sub.label} · 4번`, image: "./images/knobpuzzle_shapes.png" },
        { label: `${sub.label} · 5번`, image: "./images/knobpuzzle_shapes2.png" },
        { label: `${sub.label} · 6번`, image: "./images/knobpuzzle_shapes.png" }
      ];
    } else {
      items = Array.from({ length: 6 }, (_, j) => ({
        label: `${sub.label} · ${j + 1}번`,
        image: sub.image
      }));
    }
    const visibleCount = sub.label === "숫자" ? 3 : (sub.label === "모양" ? 2 : 6);
    rest[k] = {
      title: sub.label,
      helper: "원하는 항목을 선택하세요.",
      hero: [],
      items: items.map((row, j) => ({
        label: row.label,
        nav: `${k}_${j + 1}`,
        image: j < visibleCount ? row.image : BLANK_TILE_IMAGE
      })),
      layout: "main",
      showPlayer: false
    };
    items.forEach((row, j) => {
      const leafKey = `${k}_${j + 1}`;
      const isBlankSlot =
        (sub.label === "숫자" && j >= 3) ||
        (sub.label === "모양" && j >= 2);
      rest[leafKey] = isBlankSlot
        ? { title: row.label, helper: "완료하려면 버튼을 눌러 주세요.", hero: [], items: [], layout: "empty", teachingAidId: "studyKnobPuzzle", showPlayer: false }
        : {
          title: row.label,
          helper: "그림을 누르면 읽어 줘요.",
          hero: [],
          items: [],
          layout: "spotlight",
          spotlight: { image: row.image, label: row.label },
          teachingAidId: "studyKnobPuzzle",
          showPlayer: false
        };
    });
  });

  // 나머지 공부하기 항목
  defs.forEach((d) => {
    const isSpotlightStudy =
      d.key === "studyPeg" || d.key === "studySoundCard" || d.key === "studyColorPencil";
    const isBlankCard = d.key === "studyCard";
    rest[d.key] = isSpotlightStudy
      ? {
        title: d.label,
        helper: "그림을 누르면 읽어 줘요.",
        hero: [],
        items: [],
        layout: "spotlight",
        spotlight: { image: d.studyTileImage || "./images/study.png", label: d.label },
        teachingAidId: d.key,
        showPlayer: false
      }
      : {
        title: d.label,
        helper: "원하는 종류를 선택하세요.",
        hero: [],
        items: d.subs.map((sub, i) => ({
          label: sub,
          nav: `${d.key}_${i + 1}`,
          image: isBlankCard ? BLANK_TILE_IMAGE : (d.studyTileImage || "./images/study.png")
        })),
        layout: "main",
        showPlayer: false
      };
    if (isSpotlightStudy) return;
    d.subs.forEach((sub, i) => {
      const k = `${d.key}_${i + 1}`;
      rest[k] = isBlankCard
        ? { title: sub, helper: "완료하려면 버튼을 눌러 주세요.", hero: [], items: [], layout: "empty", teachingAidId: d.key, showPlayer: false }
        : {
          title: sub,
          helper: "원하는 항목을 선택하세요.",
          hero: [],
          items: Array.from({ length: 6 }, (_, j) => ({
            label: `${sub} · ${j + 1}번`,
            image: "./images/study.png",
            teachingAidTaskId: `${k}_${j + 1}`,
            teachingAidId: d.key
          })),
          teachingAidId: d.key,
          layout: "main",
          showPlayer: false
        };
    });
  });

  return { homeItems, rest };
}

const STUDY_SCREEN_MAP = buildStudyScreensMap();

// ── 앱 전체 데이터 ────────────────────────────────────────────────────────────
