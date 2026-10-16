# 스티커북 관리

## 한 곳에서 제작

`python scripts/build-sticker-books.py`로 전체 카탈로그를 다시 만듭니다.
기존 `build-sticker-catalog.py`, `build-home-sticker-catalog.py`, `build-storage-dress-catalog.py` 명령도 그대로 사용할 수 있습니다.

| 제작 원본 | 역할 | 사진 폴더 |
| --- | --- | --- |
| `scripts/sticker_books/bathroom.py` | 화장실·생활 연습 | `images/bathroom_book/` |
| `scripts/sticker_books/home.py` | 주방·거실·침실 | `images/home_books/` |
| `scripts/sticker_books/storage.py` | 냉장고·옷장·이불장·옷 입히기 | `images/storage_dress/` |
| `scripts/sticker_books/food.py` | 공용 음식·믹서기·머그컵·식판 | `images/sticker_food/` |

`js/data/`의 생성 결과를 직접 고치지 않습니다. 제작 원본에서 사진 영역과 배치 좌표를 수정하고 재생성합니다.
사진은 수정하지 않고 SVG로 원본의 영역을 표시합니다. 한 음식 사진을 냉장고와 식판이 함께 사용합니다.
이미지 제작 프롬프트와 이전 버전 기록은 이 폴더에 모았습니다.

## 메뉴와 저장

- 앱 공부 → 식판, 또는 스티커북 → 식판 차리기.
- 주방 → 냉장고 채우기 → 기존 활동·음료·음식과 간식·채소·과일.
- 진도는 책별 저장 키와 활동별 스티커 ID 순서로 저장됩니다.
- 기존 활동에 추가할 때는 ID 순서를 유지하고 뒤에 붙입니다. 기존 냉장고 8개 활동도 유지합니다.
- 새 활동을 추가하면 `js/data/study-data.js`에 경로를 등록합니다.

## 검증과 배포

```powershell
python scripts/build-sticker-books.py
node scripts/audit-sticker-books.cjs
node scripts/build-speech-catalog.cjs
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/record-speech.ps1
python scripts/pack-speech.py
node scripts/audit-offline.cjs
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/audit-assets.ps1
python scripts/test-home-sticker-books.py
python scripts/test-storage-dress.py
python scripts/test-food-stickers.py
python scripts/test-sticker-book.py
git diff --check
```

이 PC에서 `node`가 없으면 `_local/test-tools/playwright/driver/node.exe`를 사용합니다.
검사 화면은 `_local/home-stickers/`, `_local/storage-dress/`, `_local/food-stickers/`에 저장됩니다.
브라우저 검사는 PC에서 아이패드 화면 크기와 터치 입력을 모사합니다. 실제 아이패드 기기 검사와 구분합니다.

이미지를 추가하면 `sw.js`의 캐시 목록에도 등록하고, 배포 버전은 `index.html`, `sw.js`,
`js/core/offline-status.js` 및 오프라인 검사 코드에서 함께 갱신합니다.
인터넷 연결 상태에서 ‘오프라인 준비 완료’를 확인한 뒤 연결을 끊어 사용합니다.
