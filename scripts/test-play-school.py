"""Touch/click games, optional dragging, saved settings, and iPad-sized layouts."""
import importlib.util
from functools import partial
from http.server import ThreadingHTTPServer
from pathlib import Path
import threading

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('app_tests', ROOT / 'scripts/test-app.py')
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)
from playwright.sync_api import sync_playwright


def main():
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(base.QuietHandler, directory=str(ROOT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    url = f'http://127.0.0.1:{server.server_port}/'
    output = ROOT / '_local/play-school'
    output.mkdir(parents=True, exist_ok=True)
    errors = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(channel='chrome', headless=True, timeout=20000)
            context = browser.new_context(viewport={'width': 1024, 'height': 768}, has_touch=True, service_workers='block')
            context.add_init_script(base.MOCK_SPEECH)
            page = context.new_page()
            page.set_default_timeout(10000)
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(url)
            page.get_by_text('재민이 놀이학교', exact=True).click()
            page.wait_for_selector('.ps-menu-grid')
            assert page.locator('.ps-game-card').count() == 7
            page.screenshot(path=str(output / 'menu-landscape.png'))

            def open_game(game):
                if not page.locator('.ps-menu-grid').count():
                    page.locator('.ps-footer').get_by_role('button', name='놀이 목록', exact=True).click()
                page.locator(f'[data-game="{game}"]').click()

            open_game('match')
            assert page.locator('.ps-choice').count() == 2
            page.locator('[data-choice="toilet"]').click()
            assert page.locator('[data-choice="juice"]').evaluate("node => node.classList.contains('ps-hint')")
            page.locator('[data-choice="toilet"]').click()
            assert page.evaluate("JSON.parse(localStorage.getItem('jaemin-play-school-v1')).stats.match.help") == 1
            page.locator('[data-choice="juice"]').click()
            page.screenshot(path=str(output / 'reward-landscape.png'))
            page.get_by_role('button', name='다음', exact=True).click()
            page.locator('[data-choice="toilet"]').click()
            page.get_by_role('button', name='다음', exact=True).click()
            page.locator('[data-choice="juice"]').click()
            page.get_by_role('button', name='다 했어요', exact=True).click()
            assert page.locator('.ps-complete').is_visible()
            stats = page.evaluate("JSON.parse(localStorage.getItem('jaemin-play-school-v1')).stats.match")
            assert stats == {'completed': 1, 'first': 2, 'help': 1}, stats
            print('PASS: familiar choices, gentle hints, three rounds and accurate saved counters', flush=True)

            open_game('drive')
            page.get_by_role('button', name='출발', exact=True).click()
            assert page.locator('.ps-road-car.is-driving').count() == 1
            page.wait_for_timeout(700)
            assert page.locator('.ps-reward-actions').count() == 1
            page.get_by_role('button', name='자동차 한 번 더', exact=True).click()
            assert page.locator('.ps-road-car.is-driving').count() == 1
            print('PASS: passing car can be replayed without timed questions', flush=True)

            open_game('listen')
            assert page.locator('.ps-target > img').count() == 0
            page.get_by_role('button', name='도와주세요', exact=True).click()
            assert page.locator('.ps-target > img').count() == 1
            page.get_by_role('button', name='쉬어요', exact=True).click()
            assert page.locator('.ps-rest').is_visible()
            page.get_by_role('button', name='이어서 할래요', exact=True).click()
            page.locator('[data-choice="juice"]').click()
            print('PASS: listening, visual help, break and resume', flush=True)

            open_game('parking')
            page.screenshot(path=str(output / 'parking-landscape.png'))
            page.locator('[data-choice="red"]').click()
            assert page.locator('.ps-reward-actions').count() == 1
            open_game('delivery')
            page.locator('[data-choice="juice"]').click()
            assert page.locator('.ps-reward-actions').count() == 1
            open_game('count')
            page.locator('[data-choice="1"]').click()
            assert page.locator('.ps-reward-actions').count() == 1
            print('PASS: parking, delivery and counting all work with taps alone', flush=True)

            open_game('delivery')
            page.locator('[data-choice="juice"]').drag_to(page.locator('.ps-delivery-zone'))
            assert page.locator('.ps-reward-actions').count() == 1
            assert page.locator('.ps-drag-ghost').count() == 0
            open_game('parking')
            page.locator('.ps-park-car').drag_to(page.locator('[data-choice="red"]'))
            assert page.locator('.ps-reward-actions').count() == 1
            print('PASS: optional delivery and parking drag controls', flush=True)

            page.locator('.ps-footer').get_by_role('button', name='놀이 목록', exact=True).click()
            page.locator('.ps-settings summary').click()
            page.get_by_label('고르는 그림 수').select_option('3')
            page.get_by_label('자동차 움직임').select_option('still')
            page.get_by_label('놀이 안내 음성').select_option('false')
            page.reload()
            page.get_by_text('재민이 놀이학교', exact=True).click()
            page.wait_for_selector('.ps-menu-grid')
            open_game('listen')
            assert page.locator('.ps-choice').count() == 3
            assert page.locator('.ps-target > img').count() == 1
            page.locator('[data-choice="juice"]').click()
            assert page.locator('.ps-road-car').evaluate("node => getComputedStyle(node).animationName") == 'none'
            print('PASS: caregiver choices persist; silent mode has a visual prompt; still mode stops motion', flush=True)

            open_game('music')
            assert page.locator('[data-instrument]').count() == 2
            page.locator('[data-instrument="piano"]').click()
            page.wait_for_selector('[data-instrument="piano"].ps-playing')
            page.get_by_role('button', name='다른 악기', exact=True).click()
            assert page.locator('[data-instrument="guitar"]').count() == 1
            page.locator('[data-instrument="guitar"]').click()
            page.wait_for_selector('.ps-playing')
            page.get_by_label('악기 소리 크기').fill('0.2')
            assert page.locator('.ps-playing').count() == 0
            page.get_by_role('button', name='쉬어요', exact=True).click()
            page.get_by_role('button', name='이어서 할래요', exact=True).click()
            assert page.locator('[data-instrument="guitar"]').count() == 1
            for width, height in [(1024, 768), (768, 1024), (390, 844)]:
                page.set_viewport_size({'width': width, 'height': height})
                page.screenshot(path=str(output / f'music-{width}.png'))
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            print('PASS: instrument free play, two large choices, volume, rest and responsive layouts', flush=True)

            for width, height in [(1024, 768), (768, 1024), (390, 844)]:
                page.set_viewport_size({'width': width, 'height': height})
                page.wait_for_timeout(250)
                open_game('match')
                page.screenshot(path=str(output / f'match-{width}.png'))
                assert page.locator('.ps-choice').count() == 3
                assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
                page.locator('.ps-footer .ps-toilet').click()
                assert page.evaluate('currentKey()') == 'toilet'
                page.evaluate("while(navStack.length > 1) popScreen(); pushScreen('playSchoolHome', '놀이'); render();")
            print('PASS: landscape, portrait, small-screen layouts and always-available toilet navigation', flush=True)

            open_game('listen')
            page.evaluate("homeBtn.click(); window.spoken = []")
            page.wait_for_timeout(650)
            assert page.evaluate('window.spoken') == []
            assert page.evaluate('currentKey()') == 'main'
            assert not errors, errors
            print('PASS: exit cancels pending prompts; no browser errors', flush=True)
            browser.close()
    finally:
        server.shutdown()
        server.server_close()


if __name__ == '__main__':
    main()
