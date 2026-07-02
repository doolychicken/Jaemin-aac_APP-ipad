# AAC App Structure

이 문서는 앱을 오래 관리하기 쉽도록 파일 위치와 수정 기준을 정리한 안내서입니다.

## Root Files

- `index.html`: 앱 시작 파일입니다. CSS와 JavaScript를 불러오는 순서가 들어 있습니다.
- `sw.js`: 오프라인 캐시와 iPad/Safari 업데이트 버전을 관리합니다.
- `.gitignore`: 로컬 실행 로그, 저장된 웹페이지 찌꺼기, 백업 파일을 제외합니다.

루트에는 앱 실행에 꼭 필요한 파일만 둡니다. 임시 파일, 백업 파일, 원본 캡처는 `_local`에 보관합니다.

## CSS

- `css/app.css`: 전체 화면, 버튼, 공통 레이아웃 스타일입니다.
- `css/date-overrides.css`: 날짜 화면 전용 보정 스타일입니다.
- `css/features/study-puzzle.css`: 숫자/한글/이름 퍼즐 전용 스타일입니다.

새 기능의 스타일은 가능하면 `css/features/feature-name.css` 형태로 분리합니다.

## JavaScript

- `js/data/app-data.js`: 메인 화면, 사람, 밥/간식, 화장실, 외출, 날씨, YouTube 같은 일반 화면 데이터입니다.
- `js/data/study-data.js`: 공부하기, 스티커북, 꼭지퍼즐, 숫자/한글/이름 퍼즐 데이터입니다.
- `js/core/pager.js`: 버튼 페이지를 `다음` / `이전`으로 나누는 공통 기능입니다.
- `js/features/schedule.js`: 일정표, 치료 일정, 장보기, 집 일정 기능입니다.
- `js/features/study-puzzle.js`: 숫자/한글/이름 퍼즐 동작과 완료 처리를 담당합니다.
- `js/main.js`: 앱 시작, 화면 렌더링, 음성 출력, YouTube, 날짜 화면을 담당합니다.
- `js/legacy/inline.js`: 예전 단일 파일 방식 코드입니다. 현재 앱에서는 불러오지 않습니다.

새 기능의 동작은 가능하면 `js/features/feature-name.js`로 분리하고, 새 데이터 묶음은 `js/data/name-data.js`로 분리합니다.

## Images

- `images/`: 앱에서 직접 쓰는 기본 이미지입니다.
- `images/home_schedule/`: 집 일정과 장보기 장소 이미지입니다.
- `images/person/`: 사람/가족 이미지입니다.
- `images/therapy/`: 치료 센터와 치료 관련 이미지입니다.
- `images/weather_cards/`: 날씨 카드 SVG 이미지입니다.

이미지를 새로 추가할 때는 화면 주제에 맞는 하위 폴더를 먼저 사용합니다. 앱에서 쓰지 않는 원본이나 후보 이미지는 `_local/archive/unused-images`에 보관합니다.

## Local Archive

- `_local/`: 실행 로그, 브라우저 검사 프로필, 원본 캡처, 임시 파일을 보관합니다.
- `_local/archive/root-files/`: 루트에서 치운 백업/메시지 파일입니다.
- `_local/archive/unused-images/`: 현재 앱에서 참조하지 않는 이미지 후보입니다.
- `_local/archive/saved-page-dumps/`: 저장된 웹페이지가 만든 `_files` 폴더입니다.

`_local`은 앱 실행에 필요하지 않으며 Git 추적 대상도 아닙니다.

## Editing Guide

- 버튼 이름, 이미지, 화면 이동을 바꾸려면 먼저 `js/data/app-data.js` 또는 `js/data/study-data.js`를 수정합니다.
- 일정표 기능을 바꾸려면 `js/features/schedule.js`를 수정합니다.
- 퍼즐 기능을 바꾸려면 `js/features/study-puzzle.js`와 `css/features/study-puzzle.css`를 함께 확인합니다.
- 화면당 버튼 개수를 바꾸려면 `js/core/pager.js`의 `getDefaultPageSize()`를 확인합니다.
- CSS/JS 파일을 새로 추가하면 `index.html`과 `sw.js`에 같은 경로를 추가합니다.
- iPad에서 예전 화면이 계속 보이면 `index.html`의 `?v=숫자`와 `sw.js`의 `CACHE_VERSION`을 함께 올립니다.

## Organization Rules

- 루트는 `index.html`, `sw.js`, 설정 파일만 남깁니다.
- 앱에서 직접 쓰는 파일은 `css`, `js`, `images`, `docs`, `scripts` 중 하나에 둡니다.
- 임시 파일과 원본 자료는 `_local`에 둡니다.
- 저장된 웹페이지가 만든 `*_files` 폴더는 앱 이미지 폴더에 두지 않습니다.
- 현재 앱에서 참조하지 않는 파일은 삭제하지 말고 `_local/archive`에 보관합니다.
