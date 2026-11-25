"""Exercise the four household activities through the child's play-school menu."""
import importlib.util
import threading
from functools import partial
from http.server import ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("app_tests", ROOT / "scripts/test-app.py")
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)
from playwright.sync_api import sync_playwright


def named(page, name):
    return page.get_by_role("button", name=name, exact=True)


def assert_photos(container):
    # Includes both individual food photos and the cropped household sticker sheets.
    sizes = container.locator("img, svg image").evaluate_all("""async nodes =>
      Promise.all(nodes.map(async node => {
        const img = new Image();
        img.src = node.getAttribute('src') || node.getAttribute('href');
        await img.decode();
        return img.naturalWidth;
      }))""")
    assert sizes and all(size > 0 for size in sizes), sizes


def order_meal(page):
    menu = page.locator(".pk-menu")
    assert_photos(menu)
    menu.locator('[data-kiosk-meal="gimbap"]').tap()
    named(page, "다시 고르기").tap()
    menu.locator('[data-kiosk-meal="udon"]').tap()
    named(page, "카드로 결제하기").tap()
    reader = page.locator("[data-kiosk-reader]")
    reader.tap()
    assert reader.is_visible() and not page.locator(".pk-collect").count()
    page.locator("[data-kiosk-card]").drag_to(reader)
    page.locator('.pk-collect[data-kiosk-meal="udon"]').tap()
    assert page.locator('[data-kiosk-step="served"] [data-kiosk-meal="udon"]').is_visible()


def wash_dish(page):
    page.locator('[data-dish-tool="dish-soap"]').drag_to(page.locator('[data-dish-target="sponge"]'))
    plate = page.locator(".dw-pad .dw-plate").bounding_box()
    y = plate["y"] + plate["height"] / 2
    start = plate["x"] + plate["width"] * .25
    end = plate["x"] + plate["width"] * .75
    page.mouse.move(start, y)
    page.mouse.down()
    page.mouse.move(end, y, steps=8)
    page.mouse.up()
    assert page.locator(".dw-meter").evaluate("meter => meter.value") == 1
    page.locator("[data-dish-scrub]").tap()
    page.locator("[data-dish-scrub]").tap()
    faucet = page.locator("[data-dish-faucet]")
    faucet.tap()
    assert faucet.get_attribute("aria-pressed") == "true"
    faucet.tap()
    page.locator('[data-dish-tool="plate"]').tap()
    page.locator('[data-dish-target="rack"]').tap()
    assert_photos(page.locator(".dw-rack-full"))
    assert page.locator(".dw-stored-plate").is_visible()


def set_table(page):
    pieces = ["bowl", "soup", "side-dishes", "spoon", "chopsticks", "glass"]
    for index, piece in enumerate(pieces):
        tool = page.locator(f'[data-table-piece="{piece}"]')
        target = page.locator("button[data-slot]")
        assert page.locator(".hh-placed").count() == index
        if index % 2:
            tool.tap()
            target.tap()
        else:
            tool.drag_to(target)
    assert page.locator(".hh-placed").count() == len(pieces)
    assert_photos(page.locator(".hh-mat"))


def find_names(page):
    topics = ["devices", "appliances", "kitchen", "living", "bathroom", "bedroom"]
    assert_photos(page.locator(".hh-groups"))
    for topic in topics:
        page.locator(f'[data-word-group="{topic}"]').tap()
        choices = page.locator("[data-word-choice]")
        assert choices.count() == 3
        assert_photos(page.locator(".hh-word-choices"))
        if topic == "devices":
            ids = choices.evaluate_all("nodes => nodes.map(n => n.dataset.wordChoice)")
            assert set(ids) == {"phone", "laptop", "tablet"}, ids
        named(page, "종류 바꾸기").tap()

    for mode in ["이름 듣고 사진 찾기", "사진 보고 이름 고르기"]:
        named(page, mode).tap()
        page.locator('[data-word-group="devices"]').tap()
        target = page.locator("[data-word-target]").get_attribute("data-word-target")
        page.locator(f'[data-word-choice]:not([data-word-choice="{target}"])').first.tap()
        assert page.locator(".hh-word-status").inner_text()
        assert page.locator("[data-word-target]").get_attribute("data-word-target") == target
        if mode == "사진 보고 이름 고르기":
            named_option = page.locator(f'[data-word-choice="{target}"]').inner_text()
            named(page, named_option + " 이름 듣기").tap()
            page.wait_for_function("word => window.spoken.includes(word)", arg=named_option)
        else:
            named(page, "사진 힌트").tap()
        assert page.locator(".hh-word-cue").is_visible()
        page.locator(f'[data-word-choice="{target}"]').tap()
        assert page.locator(".hh-word-result").is_visible()
        if mode == "이름 듣고 사진 찾기":
            named(page, "다음").tap()
            named(page, "종류 바꾸기").tap()


def learn_yes_no(page):
    board = page.locator(".ox-game")
    yes = board.locator('[data-ox-answer="yes"]')
    no = board.locator('[data-ox-answer="no"]')
    assert yes.bounding_box()["x"] < no.bounding_box()["x"]
    no.tap()
    assert board.locator(".ox-stopped").is_visible()
    assert board.locator(".ps-road-car").count() == 0
    named(page, "다시 골라요").tap()
    yes.tap()
    assert board.locator(".ps-road-car.is-driving").is_visible()
    no.tap()
    assert board.locator(".ps-road-car").count() == 0
    assert not page.locator(".ps-reward-actions").count()
    named(page, "사진 오엑스 퀴즈").tap()
    no.tap()
    assert board.locator(".ox-status").inner_text() == "사진을 보고 다시 골라요"
    yes.tap()
    named(page, "다음").tap()
    no.tap()
    assert board.locator(".ox-heading").inner_text() == "아니에요. 리모컨이에요."
    named(page, "할래요·안 할래요").tap()
    assert board.locator(".ox-stopped").is_visible()
    assert not page.locator(".ps-reward-actions").count()


def ride_elevator(page):
    board = page.locator(".lift-board")
    assert board.get_attribute("data-lift-phase") == "call"
    assert board.locator("[data-lift-select]").count() == 0
    for start, goal, direction in [(1, 10, "up"), (10, 1, "down")]:
        wrong = "down" if direction == "up" else "up"
        board.locator(f'[data-lift-call="{wrong}"]').tap()
        assert board.get_attribute("data-lift-phase") == "call"
        assert board.locator(".lift-status").inner_text().endswith("버튼을 눌러요")
        board.locator(f'[data-lift-call="{direction}"]').tap()
        assert board.locator(".lift-open").count() == 1
        board.locator("[data-lift-enter]").tap()
        assert sorted(map(int, board.locator("[data-lift-select]").evaluate_all(
            "keys => keys.map(key => key.dataset.liftSelect)"))) == list(range(1, 11))
        board.locator("[data-lift-door=close]").tap()
        assert board.locator(".lift-open").count() == 0
        board.locator("[data-lift-door=open]").tap()
        assert board.locator(".lift-open").count() == 1
        board.locator(f'[data-lift-select="{start}"]').tap()
        assert board.locator(".lift-status").inner_text() == "갈 층을 다시 확인해요"
        chosen = board.locator(f'[data-lift-select="{goal}"]')
        chosen.tap()
        assert chosen.get_attribute("aria-pressed") == "true"
        board.locator("[data-lift-door=close]").tap()
        assert board.locator("[data-lift-door=open]").is_disabled()
        page.wait_for_selector(f'[data-lift-phase="arrive"] [data-lift-floor="{goal}"]')
        assert board.locator(".lift-open").count() == 1
        board.locator("[data-lift-exit]").tap()
        named(page, "다음").tap()
    board.locator(".lift-destination summary").tap()
    board.locator("select").select_option("2")
    board.locator("[data-lift-call=down]").tap()
    board.locator("[data-lift-enter]").wait_for()


def prepare_life_items(page):
    board = page.locator(".lp-board")
    scene = board.locator(".lp-scene")
    board.locator("[data-prep-topic=kitchen]").tap()
    assert board.get_attribute("data-prep-task") == "rice"
    assert scene.locator(".lp-slot:not(.lp-picked)").count() == 2
    wrong = board.locator(".lp-choice:not([data-prep-choice=paddle]):not([data-prep-choice=bowl])").first
    wrong.drag_to(scene.locator(".lp-slot").first)
    assert board.locator(".lp-picked").count() == 0
    assert wrong.get_attribute("aria-pressed") == "false"
    named(page, "사진 힌트").tap()
    assert board.locator(".lp-hint").count() == 2
    board.locator("[data-prep-choice=bowl]").tap()
    assert board.locator(".lp-picked").count() == 0
    scene.tap()
    assert board.locator(".lp-picked").count() == 1
    board.locator("[data-prep-choice=paddle]").drag_to(scene.locator(".lp-slot:not(.lp-picked)"))
    assert scene.locator(".lp-picked").count() == 2
    named(page, "다음").tap()
    assert board.get_attribute("data-prep-task") == "dishes"
    assert scene.locator(".lp-slot:not(.lp-picked)").count() == 3
    picked = []
    while board.locator(".lp-choice").count():
        tool = board.locator('.lp-choice:is([data-prep-choice=dishSoap],[data-prep-choice=sponge],[data-prep-choice=rubberGloves])').first
        target = scene.locator(".lp-slot:not(.lp-picked)").first
        picked.append(tool.inner_text())
        tool.drag_to(target)
        assert scene.locator(".lp-picked").all_inner_texts() == picked
        assert scene.locator(".lp-slot:not(.lp-picked)").count() == 3 - len(picked)
    assert scene.locator(".lp-count").inner_text() == "준비한 물건 3 / 3"
    named(page, "다음").tap()
    named(page, "종류 바꾸기").tap()
    board.locator("[data-prep-topic=weather]").tap()
    assert board.get_attribute("data-prep-task") == "hot"
    assert board.locator("[data-prep-choice=aircon]").is_visible()
    board.locator("[data-prep-choice=fan]").drag_to(scene)
    assert board.locator(".lp-picked").count() == 1
    named(page, "다 했어요").tap()
    named(page, "한 번 더").tap()
    named(page, "사진 AAC 퀴즈").tap()
    expected = page.evaluate("DATA.screens.photoAacHome.items.map(item => item.nav)")
    assert board.locator("[data-prep-topic]").evaluate_all("topics => topics.map(t => t.dataset.prepTopic)") == expected
    board.locator("[data-prep-topic=photoAacActions]").tap()
    assert board.get_attribute("data-prep-photo") == "0"
    named(page, "사진 힌트").tap()
    answer = board.locator(".lp-photo-hint").get_attribute("src")
    board.locator(f'.lp-choice:has(img[src="{answer}"])').tap()
    named(page, "다음").tap()
    assert board.get_attribute("data-prep-photo") == "1"
    named(page, "종류 바꾸기").tap()
    board.locator("[data-prep-topic=photoAacActions]").tap()
    assert board.get_attribute("data-prep-photo") == "1"
    named(page, "종류 바꾸기").tap()
    board.locator("[data-prep-topic=photoAacBirthday]").tap()
    named(page, "사진 힌트").tap()
    assert board.locator(".lp-photo-hint").get_attribute("src").endswith("birthday-celebration.webp")
    assert_photos(board)
    named(page, "종류 바꾸기").tap()
    named(page, "물건 준비하기").tap()
    board.locator("[data-prep-topic=celebration]").tap()
    scene = board.locator(".lp-scene")
    empty = scene.locator(".lp-slot:not(.lp-picked)")
    cue = scene.locator(".lp-cue")
    tray = scene.locator(".lp-tray")
    assert board.get_attribute("data-prep-task") == "birthday"
    assert empty.count() == 4
    cue_box, tray_box = cue.bounding_box(), tray.bounding_box()
    assert cue_box["x"] + cue_box["width"] <= tray_box["x"]
    assert empty.nth(0).bounding_box()["y"] == empty.nth(1).bounding_box()["y"]
    assert empty.nth(2).bounding_box()["y"] > empty.nth(0).bounding_box()["y"]
    for placed in range(1, 5):
        board.locator('[data-prep-choice^="birthday"]').first.drag_to(empty.first)
        assert scene.locator(".lp-picked").count() == placed
    assert scene.locator(".lp-count").inner_text() == "준비한 물건 4 / 4"
    assert cue.bounding_box()["height"] == cue_box["height"]
    assert_photos(scene)
    named(page, "다음").tap()
    assert board.get_attribute("data-prep-task") == "karaoke"
    board.locator("[data-prep-choice=microphone]").drag_to(empty)
    assert scene.locator(".lp-picked").inner_text() == "마이크"
    assert scene.locator(".lp-picked-art").bounding_box()["height"] >= 100
    assert_photos(scene)


def main():
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(base.QuietHandler, directory=str(ROOT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(channel="chrome", headless=True)
            context = browser.new_context(viewport={"width": 1024, "height": 768}, has_touch=True, service_workers="block")
            context.add_init_script(base.MOCK_SPEECH)
            page = context.new_page()
            page.set_default_timeout(10000)
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.goto(f"http://127.0.0.1:{server.server_port}/")
            page.get_by_text("재민이 놀이학교", exact=True).tap()
            named(page, "생활 놀이").tap()
            page.locator(".ps-settings summary").click()
            page.get_by_label("고르는 그림 수").select_option("3")
            page.locator(".ps-settings summary").click()
            games = [("kiosk", order_meal), ("dishwash", wash_dish), ("tablesetting", set_table),
                     ("objectnames", find_names), ("yesno", learn_yes_no), ("elevator", ride_elevator),
                     ("lifeprep", prepare_life_items)]
            for game, check in games:
                page.locator(f'[data-game="{game}"]').tap()
                check(page)
                page.locator(".ps-footer").get_by_role("button", name="놀이 목록", exact=True).tap()
                assert named(page, "생활 놀이").get_attribute("aria-pressed") == "true"
                print("PASS: " + game, flush=True)
            assert not errors, errors
            browser.close()
    finally:
        server.shutdown()


if __name__ == "__main__":
    main()
