/* Photo AAC provides the situations. Household sticker books provide the objects. */
(function () {
  'use strict';

  const sticker = (label, book, piece) => ({ label, book, piece });
  const image = (label, file) => ({ label, image: './images/' + file });
  const situation = (label, file) => image(label, 'photo_aac/' + file);
  const task = (id, prompt, cue, answers, distractors) => ({ id, prompt, cue, answers, distractors });

  const objects = {
    paddle: sticker('밥주걱', 'kitchen', 'paddle'),
    bowl: sticker('밥그릇', 'kitchen', 'bowl'),
    plate: sticker('접시', 'kitchen', 'plate'),
    spoon: sticker('숟가락', 'kitchen', 'spoon'),
    dishSoap: sticker('퐁퐁', 'kitchen', 'dish-soap'),
    sponge: sticker('수세미', 'kitchen', 'sponge'),
    rubberGloves: sticker('고무장갑', 'kitchen', 'rubber-gloves'),
    purifier: sticker('정수기', 'kitchen', 'purifier'),
    glass: sticker('물컵', 'kitchen', 'glass'),
    pot: sticker('냄비', 'kitchen', 'pot'),
    kettle: sticker('주전자', 'kitchen', 'kettle'),
    blender: sticker('믹서기', 'kitchen', 'blender'),
    toothbrush: sticker('칫솔', 'bathroom', 'brush'),
    toothpaste: sticker('치약', 'bathroom', 'paste'),
    rinseCup: sticker('양치컵', 'bathroom', 'cup'),
    dryer: sticker('드라이기', 'bathroom', 'dryer'),
    towel: sticker('수건', 'bathroom', 'roll'),
    soap: sticker('비누', 'bathroom', 'soap'),
    shampoo: sticker('샴푸', 'bathroom', 'shampoo'),
    lotion: sticker('로션', 'bathroom', 'lotion'),
    comb: image('머리빗', 'play_life_prep/comb.webp'),
    heatedMat: image('전기장판', 'play_life_prep/heated-mat.webp'),
    tv: sticker('텔레비전', 'living', 'tv'),
    tvRemote: sticker('TV 리모컨', 'living', 'remote'),
    acRemote: sticker('에어컨 리모컨', 'living', 'acremote'),
    aircon: sticker('에어컨', 'living', 'aircon'),
    fan: sticker('선풍기', 'living', 'fan'),
    plant: sticker('꽃 화분', 'living', 'flowering-pot'),
    wateringCan: sticker('물뿌리개', 'living', 'watering-can'),
    carKey: image('차키', 'dad_carkey.png'),
    laptop: image('노트북', 'play_household/laptop.webp'),
    tablet: image('아이패드', 'play_household/tablet.webp'),
    bag: sticker('가방', 'wardrobe', 'bag'),
    coat: sticker('겉옷', 'wardrobe', 'coat'),
    shoes: sticker('신발', 'wardrobe', 'shoes'),
    socks: sticker('양말', 'wardrobe', 'socks'),
    pajamas: sticker('잠옷', 'wardrobe', 'pajamas'),
    birthdayCake: PHOTO_AAC_CELEBRATION.cake,
    birthdayCandle: PHOTO_AAC_CELEBRATION.candle,
    birthdayHat: PHOTO_AAC_CELEBRATION.hat,
    birthdayGift: PHOTO_AAC_CELEBRATION.gift,
    microphone: PHOTO_AAC_CELEBRATION.microphone,
    ...PHOTO_AAC_TRANSPORT
  };

  const topics = [
    { id: 'kitchen', label: '주방', tasks: [
      task('rice', '밥을 푸려면 무엇이 필요할까요?', situation('밥 푸기', 'places_answers_15.jpg'), ['paddle', 'bowl'], ['rubberGloves', 'glass', 'kettle']),
      task('dishes', '손으로 설거지할 물건을 골라요', situation('설거지하기', 'feelings_hobbies_02.jpg'), ['dishSoap', 'sponge', 'rubberGloves'], ['paddle', 'kettle', 'lotion']),
      task('water', '정수기에서 물을 받으려면 무엇이 필요할까요?', objects.purifier, ['glass'], ['plate', 'paddle', 'pot']),
      task('soup', '국을 끓일 물건을 골라요', situation('요리하기', 'feelings_hobbies_01.jpg'), ['pot'], ['sponge', 'glass', 'plate']),
      task('blend', '과일을 갈 때 어떤 기계를 쓸까요?', situation('믹서기 돌리기', 'daily_13.jpg'), ['blender'], ['purifier', 'kettle']),
      task('eat', '밥을 떠먹을 때 무엇이 필요할까요?', situation('아침밥 먹기', 'routine_ai_03.jpg'), ['spoon'], ['rubberGloves', 'kettle', 'paddle'])
    ] },
    { id: 'bathroom', label: '화장실·몸단장', tasks: [
      task('brush', '양치할 물건을 골라요', situation('양치하기', 'routine_ai_brush_perio_cup.png'), ['toothbrush', 'toothpaste', 'rinseCup'], ['comb', 'lotion', 'rubberGloves']),
      task('dry', '머리를 말리려면 무엇이 필요할까요?', situation('머리 말리기', 'routine_ai_hairdryer.jpg'), ['dryer'], ['lotion', 'rinseCup', 'toothpaste']),
      task('comb', '머리를 빗으려면 무엇이 필요할까요?', situation('머리빗질', 'routine_ai_07_vanity.jpg'), ['comb'], ['rinseCup', 'soap', 'paddle']),
      task('wash', '손을 깨끗이 씻으려면 무엇을 쓸까요?', situation('손씻기', 'routine_ai_22.jpg'), ['soap'], ['paddle', 'comb', 'toothpaste']),
      task('hair', '머리를 감으려면 무엇을 쓸까요?', situation('머리감기', 'routine_ai_hairwash_shampoo.jpg'), ['shampoo'], ['dryer', 'comb', 'lotion']),
      task('face', '얼굴에 묻은 물기를 무엇으로 닦을까요?', situation('수건으로 얼굴닦기', 'routine_ai_05_v2.jpg'), ['towel'], ['rinseCup', 'paddle', 'comb']),
      task('lotion', '얼굴에 바를 물건을 골라요', situation('로션 바르기', 'routine_ai_06_vanity.jpg'), ['lotion'], ['toothpaste', 'soap', 'dryer'])
    ] },
    { id: 'living', label: '거실·외출', tasks: [
      task('tv', 'TV를 켤 리모컨을 골라요', situation('TV 보기', 'routine_ai_tv_bebefinn.jpg'), ['tvRemote'], ['acRemote', 'carKey', 'comb']),
      task('ac', '에어컨을 켤 리모컨을 골라요', situation('에어컨 틀기', 'daily_06.jpg'), ['acRemote'], ['tvRemote', 'carKey', 'paddle']),
      task('car', '자동차 시동을 걸 때 무엇이 필요할까요?', situation('차 타기', 'home_leisure_14.jpg'), ['carKey'], ['tvRemote', 'acRemote', 'tablet']),
      task('laptop', '어떤 기기를 쓰고 있나요?', situation('노트북 하기', 'feelings_hobbies_14.jpg'), ['laptop'], ['tv', 'tablet', 'acRemote']),
      task('tablet', '유튜브를 보고 있는 기기를 골라요', situation('아이패드 보기', 'routine_ai_ipad_youtube.jpg'), ['tablet'], ['laptop', 'carKey', 'fan']),
      task('bag', '학교에 갈 가방을 골라요', situation('가방메기', 'routine_ai_14.jpg'), ['bag'], ['pajamas', 'towel', 'wateringCan']),
      task('shoes', '밖에 나갈 때 발에 신을 것을 골라요', situation('신발 신기', 'routine_ai_16.jpg'), ['shoes'], ['coat', 'bag', 'pajamas']),
      task('socks', '신발을 신기 전에 발에 신을 것을 골라요', situation('양말 신기', 'routine_ai_12.jpg'), ['socks'], ['coat', 'bag', 'comb'])
    ] },
    { id: 'weather', label: '날씨·식물', tasks: [
      task('hot', '더울 때 바람이 나오는 물건을 골라요', situation('덥다', 'daily_08.jpg'), [['aircon', 'fan']], ['heatedMat', 'pot', 'tv']),
      task('cold', '추울 때 이불 아래를 따뜻하게 해 주는 물건을 골라요', situation('춥다', 'daily_09.jpg'), ['heatedMat'], ['fan', 'aircon', 'wateringCan']),
      task('flowers', '화분에 물을 주려면 무엇이 필요할까요?', objects.plant, ['wateringCan'], ['dryer', 'acRemote', 'paddle'])
    ] },
    { id: 'celebration', label: '생일·노래방', tasks: [
      task('birthday', '생일 축하에 필요한 물건 네 가지를 준비해요', PHOTO_AAC_CELEBRATION.birthday,
        ['birthdayCake', 'birthdayCandle', 'birthdayHat', 'birthdayGift'], ['microphone', 'tvRemote', 'kettle']),
      task('karaoke', '노래방에서 노래하려면 무엇이 필요할까요?', PHOTO_AAC_CELEBRATION.karaoke,
        ['microphone'], ['tvRemote', 'birthdayGift', 'laptop'])
    ] }
  ];
  const transport = [
    { id: 'emergencyVehicles', label: '우리를 도와주는 차', tasks: [
      task('police', '경찰차와 관련 있는 장소를 찾아요', objects.policeCar,
        ['policeStation'], ['fireStation', 'airport']),
      task('fire', '소방차와 관련 있는 장소와 사람을 찾아요', objects.fireEngine,
        ['fireStation', 'firefighter'], ['policeStation', 'taxiDriver', 'pilot']),
      task('ambulance', '구급차와 관련 있는 사람과 장소를 찾아요', objects.ambulance,
        ['patient', 'hospital'], ['taxiDriver', 'airport', 'subwayStation'])
    ] },
    { id: 'publicTransit', label: '버스·지하철', tasks: [
      task('bus', '버스를 탈 때 볼 수 있는 사진을 찾아요', objects.bus,
        ['transitCard', 'fareReader', 'stopButton', 'busInterior'], ['taxiDriver', 'pilot', 'subwayInterior']),
      task('subway', '지하철 안과 지하철역 사진을 찾아요', objects.subway,
        ['subwayInterior', 'subwayStation'], ['busInterior', 'airport', 'fireStation'])
    ] },
    { id: 'taxiAndPlane', label: '택시·비행기', tasks: [
      task('taxi', '택시를 운전하는 사람을 찾아요', objects.taxi,
        ['taxiDriver'], ['pilot', 'firefighter']),
      task('airplane', '비행기와 관련 있는 장소와 사람을 찾아요', objects.airplane,
        ['airport', 'pilot'], ['hospital', 'firefighter', 'taxiDriver'])
    ] }
  ];
  window.LIFE_PREP = { objects, topics, transport };
})();
