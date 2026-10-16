# 재민이 AAC · 아이패드 앱

실행 주소: https://doolychicken.github.io/Jaemin-aac_APP-ipad/

## 관리 위치

| 수정하려는 내용 | 위치 |
| --- | --- |
| 메뉴·화면 이동 | `js/data/app-data.js`, `js/data/study-data.js` |
| 기능 동작 | `js/features/` |
| 공통 동작·오프라인 | `js/core/`, `sw.js` |
| 화면 디자인 | `css/`, `css/features/` |
| 스티커 구성·배치 원본 | `scripts/sticker_books/` |
| 자동 생성 스티커 데이터 | `js/data/*sticker-data.js`, `js/data/storage-dress-data.js` |
| 사진 | `images/` 아래 기능별 폴더 |
| 녹음 음성 | `audio/speech/` |
| 제작 기록·사진 프롬프트 | `docs/sticker-books/` |
| 검사 도구 | `scripts/test-*.py`, `scripts/audit-*` |
| 테스트 화면·개인 작업 자료 | `_local/` (배포 제외) |

스티커 수정과 배포 전 검증 방법은 [스티커북 관리 안내](docs/sticker-books/README.md),
앱 전체 구조는 [구조 안내](docs/STRUCTURE.md)를 참고하세요.

실행 중인 사진 URL과 저장 키는 기존 기기의 진도와 오프라인 캐시에 연결되어 있습니다.
파일 정리는 제작 코드와 문서부터 하고, 앱에서 쓰는 URL을 옮길 때는 참조·캐시·기존 진도를 함께 검증합니다.
