# AAC App File Structure

이 앱은 iPad와 Lenovo 태블릿에서 바로 열어 쓰는 정적 웹앱입니다.

## Main Files

- `index.html`: 화면 뼈대와 스크립트 로딩 순서
- `css/app.css`: 전체 화면, 버튼, 일정표 스타일
- `sw.js`: 오프라인 캐시와 업데이트 버전 관리

## JavaScript

- `js/data/app-data.js`: 버튼 이름, 이미지, 화면 이동 정보
- `js/core/pager.js`: 한 화면에 버튼을 맞추고 `다음` / `이전`으로 넘기는 공통 기능
- `js/features/schedule.js`: 일정표, 집 스케줄, 치료 일정 기능
- `js/main.js`: 앱 시작, 공통 렌더링, 음성 출력, 유튜브, 외출/날짜 화면

## Editing Guide

- 새 버튼이나 새 화면을 추가할 때는 먼저 `js/data/app-data.js`를 수정합니다.
- 일정표 관련 기능은 `js/features/schedule.js`에서 수정합니다.
- 화면에 몇 개 버튼을 보여줄지 바꾸려면 `js/core/pager.js`의 `getDefaultPageSize()`를 수정합니다.
- CSS나 JS 파일 경로를 바꾸면 `index.html`과 `sw.js`의 경로도 같이 바꿔야 합니다.
- iPad에서 예전 화면이 계속 보이면 `index.html`의 `?v=숫자`와 `sw.js`의 `CACHE_VERSION`을 올립니다.
