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

## Offline Audio and Video (v397)

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
