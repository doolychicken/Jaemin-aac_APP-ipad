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
