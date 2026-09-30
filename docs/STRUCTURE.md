# AAC App Structure

이 문서는 아이패드용 AAC 앱을 나중에 수정하기 쉽게 관리하기 위한 기준입니다.
화면에 보이는 기능을 유지하는 것이 우선이므로, 이미 앱에서 참조 중인 이미지 경로는 충분히 확인하기 전에는 옮기지 않습니다.

## Root Files

- `index.html`: 앱 시작 파일입니다. CSS와 JavaScript를 불러오는 순서와 캐시용 `?v=` 번호를 관리합니다.
- `sw.js`: 오프라인 캐시와 Safari/iPad 업데이트 버전을 관리합니다.
- `.gitignore`: 로컬 임시 파일, 저장된 페이지 덤프, 윈도우 복사본 파일을 Git에서 제외합니다.

루트에는 실행에 꼭 필요한 파일만 둡니다. 임시 파일, 백업 파일, 브라우저 저장 파일은 `_local/`이나 Git 제외 대상으로 둡니다.

## CSS

- `css/app.css`: 전체 화면, 버튼, 공통 레이아웃 스타일입니다.
- `css/date-overrides.css`: 날짜 화면 전용 보정 스타일입니다.
- `css/features/study-puzzle.css`: 공부하기 퍼즐 전용 스타일입니다.

새 기능의 스타일이 커지면 `css/features/feature-name.css` 형태로 분리합니다. 새 CSS를 추가하면 `index.html`과 `sw.js`에도 함께 등록합니다.

## JavaScript

- `js/data/app-data.js`: 메인 화면, 사람, 밥/간식, 화장실, 외출, 날씨, YouTube 같은 일반 화면 데이터입니다.
- `js/data/study-data.js`: 공부하기, 스티커북, 꼭지퍼즐, 숫자/한글/이름/상징 매칭 데이터입니다.
- `js/core/pager.js`: `다음` / `이전` 페이지 분할 공통 기능입니다.
- `js/core/runtime.js`: 화면 종료 시 취소할 타이머와 저장 데이터 검증·실패 안내를 담당합니다. 기능 모듈보다 먼저 불러옵니다.
- `js/core/offline-speech.js`: 저장한 한국어 음성을 재생하고 날짜·일정 문장을 조합합니다.
- `js/core/offline-status.js`: 다운로드 진행률, 준비 완료, 누락 파일 재시도를 표시하고 서비스워커를 등록합니다.
- `js/data/speech-manifest.js`: 음성 문구와 WAV 파일 내 재생 구간입니다. 빌드 스크립트로 생성합니다.
- `js/features/schedule.js`: 일정표, 집 스케줄, 장보기, 치료 일정 기능입니다.
- `js/features/study-puzzle.js`: 공부하기 퍼즐 렌더링과 드래그 동작입니다.
- `js/main.js`: 앱 시작, 화면 렌더링, 음성 출력, YouTube, 날짜 화면 연결을 담당합니다.
- `js/legacy/inline.js`: 이전 단일 파일 방식 코드입니다. 현재 `index.html`에서 불러오지 않습니다.

새 버튼이나 화면 이동은 먼저 `js/data/app-data.js` 또는 `js/data/study-data.js`에서 처리합니다. 동작 코드가 필요할 때만 `js/main.js`나 `js/features/*`를 수정합니다.

## Images

- `images/`: 앱에서 직접 쓰는 기본 이미지입니다.
- `images/home_schedule/`: 집 스케줄과 장보기 장소 이미지입니다.
- `images/person/`: 사람/가족 이미지입니다.
- `images/therapy/`: 치료 센터와 치료 관련 이미지입니다.
- `images/weather_cards/`: 날씨 카드 SVG 이미지입니다.

이미지 파일명은 가능하면 영어 소문자와 `_`를 사용합니다.

좋은 예:

- `sleep.png`
- `policestation.png`
- `meal_rice1.png`
- `home_schedule/paris_baguette.png`

피하고 싶은 예:

- `새 사진.png`
- `사진 (1).png`
- `image copy.png`
- `파일 - 복사본.png`

## Adding A New Image

1. 이미지를 적절한 폴더에 넣습니다.
2. 화면 데이터에서 `image: "./images/..."`로 연결합니다.
3. 오프라인에서도 필요하면 `sw.js`의 `PRECACHE_ASSETS`에 추가합니다.
4. `index.html`의 관련 `?v=`와 `sw.js`의 `CACHE_VERSION`을 함께 올립니다.
5. `scripts/audit-assets.ps1`로 누락 이미지가 없는지 확인합니다.

## Cache Rule

화면 데이터, 주요 JS, CSS, 서비스워커를 수정하면 버전을 올립니다.

- `index.html`: 수정한 CSS/JS 파일의 `?v=숫자`
- `sw.js`: `CACHE_VERSION`
- 서비스워커 등록 줄: `navigator.serviceWorker.register('./sw.js?v=숫자', ...)`

예: `v280` 다음 변경은 `v281`로 올립니다.

## Local Clutter

윈도우 탐색기에서 파일을 복사하면 `파일 - 복사본.png` 같은 파일이 생깁니다. 이런 파일은 앱에서 직접 쓰지 않는 한 Git에 올리지 않습니다.

현재 작업 폴더에 삭제 표시가 떠 있는 추적 파일이 있으면 먼저 왜 삭제됐는지 확인합니다. 특히 `images/outing.png`처럼 여러 화면에서 참조하는 파일은 삭제하면 화면 이미지가 깨질 수 있습니다.

## Safety Checklist

정리나 기능 수정 후에는 아래를 확인합니다.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\audit-assets.ps1
git diff --check
git status --short --branch
```

로컬 서버가 떠 있으면 페이지 응답도 확인합니다.

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:5173/index.html
```

## Organization Rules

- 실행 중인 경로를 깨지 않기 위해 이미지 파일 이동은 한 번에 크게 하지 않습니다.
- 안 쓰는 파일은 바로 삭제하지 말고 먼저 문서나 점검 결과로 확인합니다.
- 새 이미지와 새 데이터는 가능한 한 기존 폴더 규칙에 맞춥니다.
- 커밋할 때는 이번 작업에 필요한 파일만 `git add` 합니다.

## State and Delayed Work

- 게임의 지연 작업은 `createTaskScope()`로 관리하고 `clear()`에서 취소합니다. 화면을 벗어나거나 다시 시작하면 이전 게임의 예약 작업을 실행하지 않습니다.
- `main.js`는 화면 이동 요청의 순서와 렌더링 세대를 확인하여 이전 버튼의 지연 이동이 홈·뒤로 이동을 덮어쓰지 않도록 합니다.
- 집 일정과 장보기 목록·남은 단계는 `jaemin-schedule-session-v1`에 저장합니다. 다시 열어 같은 일정을 선택하면 `이어하기`로 진행할 수 있습니다. 홈 버튼은 목록을 지우지 않습니다.
- 저장 데이터가 잘못됐거나 저장에 실패하면 `storageNotice`에 안내합니다. 이 저장은 현재 브라우저에만 적용되며 다른 기기와 동기화되지 않습니다.

## Browser Regression Checks

Chrome이 설치된 Windows에서 다음 명령으로 검증합니다. 테스트는 임시 로컬 서버와 별도 브라우저 프로필을 사용합니다.

```powershell
python -m pip install --target _local/test-tools playwright
python scripts/test-app.py
```

화면 이동 취소, 게임 종료 후 지연 작업, 날짜 활동, 새로고침 후 일정 복원, 저장 오류 안내, Android 지연 음성 요청, 서비스워커 설치·오프라인 재시작을 확인합니다. 음성은 테스트 대역을 사용하므로 실제 iPad의 음성·터치 동작은 별도로 확인해야 합니다.

## Reusing App Study Materials (v401)

- `study-data.js`의 `buildStudyScreensMap()`은 기존 가족 사진·상징 매칭·이름 퍼즐에서 `playContent`를 만들어 놀이학교로 전달합니다. 부모가 관리하는 기존 학습 자료를 두 곳에 따로 복사하지 않습니다.
- `우리집 · 앱 공부`에는 우리 가족 찾기, 내 이름 완성, 생활 그림 연결이 있습니다. 가족은 나·엄마·아빠, 이름은 기존 홍재민 퍼즐의 조각 순서, 생활 그림은 기존 화장실·차키·수저·치약·소방서·경찰서의 대응 관계를 사용합니다. 기본 생활 범위는 앞의 3개이며 그림 범위를 늘리면 6개를 사용합니다.
- 이름 조각은 하나씩 누르며, 틀려도 진행을 지우지 않습니다. 기존 도움·쉬기·음성 끄기·완료 스티커를 함께 사용합니다. 앱 공부와 놀이학교 사이에 이동 버튼을 추가하고 뒤로 가기 기록이 반복해서 쌓이지 않도록 처리합니다.
- `test-play-school.py`에서 원본 자료 연결, 이름 순서·힌트·쉬기·기록·상호 이동·화면 크기를 검증하며 `test-offline.py`에서도 세 게임과 안내 음성을 확인합니다. v401 녹음 목록은 2,340개 구성 요소, 52개 WAV 팩입니다.

## Pair Games and Play Club (v400)

- 놀이학교에 숫자 짝 맞추기, 그림 짝 맞추기, 기억 카드 놀이를 추가했습니다. 숫자는 자동차 개수와 연결하고, 그림은 양쪽 카드를 누르며, 기억 놀이는 뒤집힌 카드 두 장을 선택합니다. 전체 10종을 종류별로 필터링할 수 있습니다.
- 기본은 2쌍·3판입니다. 기존 보호자 설정에서 3쌍·5판으로 변경할 수 있고 숫자 범위는 별도로 1~3 또는 1~5를 선택합니다. 기존 저장 데이터에는 숫자 범위 3을 기본 적용합니다.
- 기억 놀이는 틀린 카드가 자동으로 사라지지 않습니다. `다시 뒤집기`를 누를 때까지 보여줍니다. 도움은 모든 카드를 펼쳐 보여주고, 쉬기 후에도 진행 중인 판을 유지합니다. 어느 게임도 드래그를 요구하지 않습니다.
- 한 묶음을 완료하면 기존 완료 기록을 이용해 자동차 스티커를 표시합니다. 스티커 칸은 6개이며 이후에도 완료 횟수는 계속 쌓입니다. 새 짝 놀이의 첫 선택 성공·도움 기록은 개별 짝이 아니라 판 단위입니다.
- `python scripts/test-pair-games.py`는 숫자와 개수, 오답·도움, 짝 완성, 기억 카드, 수동 재시도, 쉬기, 저장 및 화면 크기를 검증합니다. 기존 놀이와 실제 오프라인 재생은 기존 두 테스트로 확인합니다. v400 음성은 2,317개 구성 요소와 51개 WAV 팩입니다.

## Instrument Free Play (v399)

- `재민이 놀이학교 → 악기 소리 놀이`는 피아노·북·기타·종을 두 개씩 크게 표시합니다. 정답이나 문제 수 없이 누를 때마다 해당 악기의 짧은 소리를 재생합니다.
- `js/core/instrument-sounds.js`에서 Web Audio로 악기별 음색을 합성합니다. 실제 악기 녹음 파일이나 외부 서비스는 사용하지 않습니다. 안내 음성을 꺼도 악기 소리는 재생하며, 화면의 소리 크기와 멈추기로 조절합니다.
- 다른 악기를 누르면 기존 소리를 중단합니다. 쉬기, 화면 이동, 앱이 배경으로 들어갈 때도 중단합니다. 재생은 사용자 클릭 안에서 오디오 컨텍스트를 활성화합니다.
- `test-play-school.py`는 버튼·음량·쉬기·화면 크기를, `test-offline.py`는 네 가지 음색의 오프라인 재생과 중단을 확인합니다. v399 음성 목록은 2,235개 구성 요소와 48개 WAV 팩입니다.

## Personalized Play School (v398)

- 메인 화면의 `재민이 놀이학교`에서 자동차 출발, 같은 그림 찾기, 듣고 골라요, 색깔 주차장, 주스 배달, 자동차 세기를 엽니다. 구현은 `js/features/play-school.js`, 스타일은 `css/features/play-school.css`에 있습니다.
- 기본은 보기 2개와 3문제이며 주스·화장실처럼 익숙한 그림부터 시작합니다. 모든 게임은 누르기로 할 수 있고 주차·배달은 드래그도 지원합니다. 시간 제한이나 감점 없이 도움, 쉬기, 화장실을 사용할 수 있습니다.
- 놀이 목록의 보호자 설정에서 보기 수, 문제 수, 그림 범위, 움직임, 안내 음성을 조절합니다. 설정과 완료·첫 선택 성공·도움 횟수는 현재 기기의 `jaemin-play-school-v1`에 저장합니다. 기록은 발달 평가가 아닙니다.
- v398 음성은 2,211개 구성 요소와 47개 WAV 팩입니다. 아래 v397 구성에 약 4 MiB를 추가했습니다. 음성 빌드는 기존 팩을 보존하고 새 문구만 추가하며 서비스워커 업데이트는 이름에 콘텐츠 해시가 있는 기존 팩을 재사용합니다.
- `python scripts/test-play-school.py`는 여섯 게임의 누르기, 선택적 드래그, 도움·쉬기, 기록·설정 저장, 화면 크기, 종료 후 지연 작업 취소를 확인합니다. `test-offline.py`는 새 게임과 녹음 안내의 오프라인 재생도 확인합니다. 물리적인 iPad 검증은 별도로 필요합니다.

## Offline Audio and Video (v397 baseline)

- 온라인에서 `오프라인 준비 완료 · 유튜브 제외`가 표시될 때까지 기다립니다. 최초 저장은 약 160 MiB입니다. 완료 후에는 그림·게임·일정과 앱에 포함된 한국어 문구, 물소리 영상·음성을 네트워크 없이 사용합니다.
- 음성은 Windows에 설치된 한국어 목소리로 로컬에서 생성했습니다. 문구를 외부 TTS 서비스로 전송하지 않습니다. 2,082개의 문구·문장 구성 요소를 44개 WAV 파일로 저장합니다. 날짜·일정 문장은 여러 구간을 조합합니다.
- 음성 데이터 중 최대 3개 파일의 디코딩 결과만 유지합니다. 새 문구를 누르면 기존 재생을 취소합니다. 새로운 어휘를 코드에 추가하면 아래 빌드를 다시 실행해야 합니다.
- 서비스워커가 필요한 파일 전체와 완료 표시를 저장한 뒤에만 준비 완료로 표시합니다. 저장 실패·파일 누락은 `다시 준비`로 복구합니다. 사이트 데이터를 지우거나 기기가 저장 데이터를 제거하면 온라인에서 다시 준비해야 합니다.
- 로컬 영상은 저장된 전체 파일로 `Range` 요청에 206/416 응답을 생성하여 오프라인 구간 이동을 지원합니다. 유튜브 요청은 앱 캐시로 처리하지 않습니다.
- 서비스워커는 같은 버전의 HTML·스크립트·음성 파일을 함께 제공합니다. 버전 변경 시 새 파일의 준비가 끝난 뒤 앱을 다시 엽니다.

음성 재생·영상 탐색은 실제 오디오 디코딩을 사용하는 별도 테스트로 확인합니다. PC 브라우저 검증이므로 물리적인 iPad 테스트를 대신하지는 않습니다.

```powershell
node scripts/build-speech-catalog.cjs
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/record-speech.ps1
python scripts/pack-speech.py
node scripts/audit-offline.cjs
python scripts/test-offline.py
```

Node가 PATH에 없다면 로컬 테스트 도구의 `_local/test-tools/playwright/driver/node.exe`를 사용할 수 있습니다. 음성 생성에는 Windows의 `Microsoft Heami Desktop`이 필요하며 원본 WAV와 문구 목록은 Git에서 제외하는 `_local/speech`에 보관합니다.

구현 참고: [캐시된 오디오·영상의 Range 처리](https://developer.chrome.com/docs/workbox/serving-cached-audio-and-video), [기기 내 음성 서비스 식별](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService).
