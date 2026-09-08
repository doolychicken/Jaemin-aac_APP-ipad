"""Extract individual photo tiles from the supplied AAC print sheets.

The source sheets remain untouched.  Only the photographic area is exported;
the app renders the Korean label itself for sharper text and speech support.
"""

from pathlib import Path
from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r"C:\Users\dooly\Desktop\프린트")
OUTPUT = ROOT / "images" / "photo_aac"


SHEETS = [
    {
        "file": "1 (2).png",
        "prefix": "actions",
        "labels": [
            "분리수거하다", "악수하다", "인사하다", "뽀뽀하다",
            "손잡다", "노래하다", "만세하다", "팔들어",
            "오른쪽", "왼쪽", "위", "아래",
            "하이파이브", "아이스크림 먹다", "주스 마시다", "바나나껍질까기",
        ],
        "boxes": [(x, y, x + 406, y + 476) for y in (55, 638, 1220, 1801) for x in (45, 478, 911, 1344)],
    },
    {
        "file": "2.png",
        "prefix": "daily",
        "labels": [
            "똥싸다", "농구공놀이", "물내리기", "안아주다",
            "TV보기", "에어컨 틀기", "선풍기 틀기", "덥다",
            "춥다", "아이스크림 먹다", "차갑다", "뜨겁다",
            "믹서기 돌리다", "입안 헹구다", "춤추다", "사랑해요",
        ],
        "boxes": [(x, y, x + 406, y + 476) for y in (55, 638, 1220, 1801) for x in (45, 478, 911, 1344)],
    },
    {
        "file": "3.png",
        "prefix": "feelings_hobbies",
        "labels": [
            "요리하기", "설거지하기", "울고싶다", "짜증난다",
            "기쁘다", "슬프다", "빵먹기", "버스타기",
            "지하철타기", "자전거타기", "우유먹기", "기타치기",
            "피아노키보드치기", "노트북 하기", "공부하기", "축구공놀이",
        ],
        "boxes": [(x, y, x + 406, y + 476) for y in (55, 638, 1220, 1801) for x in (45, 478, 911, 1344)],
    },
    {
        "file": "4.png",
        "prefix": "places_answers",
        "labels": [
            "학교가기", "놀이터 놀기", "도서관가기", "마트장보기",
            "피아노치기", "우쿨렐레연주", "북치기", "터치벨 연주",
            "좋아요", "싫어요", "네", "아니오",
            "공원가기", "정수기물받기", "밥푸기", "엘리베이터 타기",
        ],
        "boxes": [(x, y, x + 406, y + 476) for y in (55, 638, 1220, 1801) for x in (45, 478, 911, 1344)],
    },
    {
        "file": "5.png",
        "prefix": "routine",
        "labels": [
            "일어나기", "소변보기", "밥먹기", "세수하기",
            "수건으로 얼굴닦기", "로션 바르기", "머리빗질", "샤워하기",
            "팬티입기", "바지입기", "윗도리입기", "양말 신기",
            "겉옷 입기", "가방메기", "준비완료", "신발 신기",
            "학교가기", "공부하기", "간식먹기", "친구랑 놀기",
            "숙제하기", "손씻기", "잠옷입기", "잠자기",
        ],
        "boxes": [
            (x, y, x + 218, y + h)
            for y, h in ((4, 171), (218, 157), (413, 152), (607, 155), (806, 156), (1005, 157))
            for x in (3, 227, 451, 675)
        ],
    },
    {
        "file": "6.png",
        "prefix": "home_leisure",
        "labels": [
            "머리감기", "머리말리기", "신발정리", "양말벗기",
            "세탁기넣기", "손씻기", "겉옷벗기", "윗도리벗기",
            "바지벗기", "신발벗기", "싱크대갖다놓기", "커피숍가기",
            "놀이터가기", "차타기", "노래듣기", "유튜브보기",
        ],
        "boxes": [(x, y, x + 149, y + 172) for y in (17, 231, 446, 661) for x in (18, 176, 333, 491)],
    },
    {
        "file": "8.png",
        "prefix": "outing_weather",
        "labels": [
            "점프하다", "달리다", "올라간다", "내려간다",
            "그네타다", "미끄럼틀타다", "시소타다", "철봉에달리다",
            "옷구경", "이케아쇼핑", "다이소구경", "빵가게",
            "우산쓰기", "맑음", "비온다", "눈온다",
        ],
        "boxes": [(x, y, x + 406, y + 476) for y in (55, 638, 1220, 1801) for x in (45, 478, 911, 1344)],
    },
]


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    manifest = []
    for sheet in SHEETS:
        source_path = SOURCE / sheet["file"]
        with Image.open(source_path) as source:
            image = ImageOps.exif_transpose(source).convert("RGB")
            if len(sheet["labels"]) != len(sheet["boxes"]):
                raise ValueError(f"Label/box mismatch in {source_path}")
            for index, (label, box) in enumerate(zip(sheet["labels"], sheet["boxes"]), 1):
                filename = f'{sheet["prefix"]}_{index:02d}.jpg'
                tile = image.crop(box)
                tile.save(OUTPUT / filename, "JPEG", quality=88, optimize=True, progressive=True)
                manifest.append(f'{filename}\t{label}')
    (OUTPUT / "manifest.tsv").write_text("\n".join(manifest) + "\n", encoding="utf-8")
    print(f"Extracted {len(manifest)} AAC photos into {OUTPUT}")


if __name__ == "__main__":
    main()
