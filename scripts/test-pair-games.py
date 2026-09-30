"""Pair-board state, memory retries, saved rewards and tablet layouts."""
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
    output = ROOT / '_local/play-school'
    output.mkdir(parents=True, exist_ok=True)
    errors = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(channel='chrome', headless=True)
            context = browser.new_context(viewport={'width': 1024, 'height': 768}, has_touch=True, service_workers='block')
            context.add_init_script(base.MOCK_SPEECH)
            page = context.new_page()
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(f'http://127.0.0.1:{server.server_port}/')
            page.get_by_text('재민이 놀이학교', exact=True).click()
            page.get_by_role('button', name='숫자 · 짝 맞추기', exact=True).click()
            assert page.locator('.ps-game-card').count() == 3
            page.screenshot(path=str(output / 'club-menu.png'))
            page.locator('[data-game="numbers"]').click()

            def card(side, value):
                return page.locator(f'[data-side="{side}"][data-pair="{value}"]')

            for round_index in range(3):
                ids = page.locator('[data-side="left"]').evaluate_all('nodes => nodes.map(n => n.dataset.pair)')
                assert len(ids) == 2
                assert all(card('right', item).locator('img').count() == int(item) for item in ids)
                if round_index == 0:
                    card('left', ids[0]).click()
                    card('right', ids[0]).click()
                    assert page.locator('.is-matched').count() == 0
                    card('left', ids[0]).drag_to(card('right', ids[1]))
                    assert page.locator('.is-matched').count() == 0
                    page.get_by_role('button', name='도와주세요', exact=True).click()
                    assert page.locator('.ps-pair-card.ps-hint').count() == 2
                for item in ids:
                    card('left', item).drag_to(card('right', item))
                assert page.locator('.ps-success-banner').is_visible()
                page.get_by_role('button', name='다 했어요' if round_index == 2 else '다음', exact=True).click()
            assert page.locator('.ps-earned-car').is_visible()
            assert page.evaluate("JSON.parse(localStorage.getItem('jaemin-play-school-v1')).stats.numbers") == {'completed': 1, 'first': 2, 'help': 1}
            page.get_by_role('button', name='다른 놀이', exact=True).click()
            assert page.locator('.ps-sticker.is-collected').count() == 1
            print('PASS: number/quantity pairs, wrong answers, hints, three boards and saved sticker', flush=True)

            page.locator('[data-game="pairs"]').click()
            ids = page.locator('[data-side="left"]').evaluate_all('nodes => nodes.map(n => n.dataset.pair)')
            card('right', ids[0]).drag_to(card('left', ids[0]))
            assert page.locator('.is-matched').count() == 2
            page.get_by_role('button', name='쉬어요', exact=True).click()
            page.get_by_role('button', name='이어서 할래요', exact=True).click()
            assert page.locator('.is-matched').count() == 2
            card('left', ids[1]).drag_to(card('right', ids[1]))
            assert page.locator('.ps-success-banner').is_visible()
            page.locator('.ps-footer').get_by_role('button', name='놀이 목록', exact=True).click()
            page.locator('[data-game="memory"]').click()
            assert page.locator('.ps-memory-card').count() == 4
            assert page.locator('.ps-memory-card img').count() == 0
            page.get_by_role('button', name='도와주세요', exact=True).click()
            labels = page.locator('.ps-memory-card').evaluate_all('nodes => nodes.map(n => n.getAttribute("aria-label"))')
            assert page.locator('.ps-memory-card img').count() == 4
            page.get_by_role('button', name='다시 뒤집기', exact=True).click()
            first = 0
            other = next(i for i, label in enumerate(labels) if label != labels[first])
            page.locator(f'[data-card="{first}"]').click()
            page.locator(f'[data-card="{other}"]').click()
            page.wait_for_timeout(1300)
            assert page.locator('.is-revealed').count() == 2
            page.get_by_role('button', name='쉬어요', exact=True).click()
            page.get_by_role('button', name='이어서 할래요', exact=True).click()
            assert page.locator('.is-revealed').count() == 2
            page.get_by_role('button', name='다시 뒤집기', exact=True).click()
            for label in set(labels):
                for i, value in enumerate(labels):
                    if value == label:
                        page.locator(f'[data-card="{i}"]').click()
            assert page.locator('.ps-success-banner').is_visible()
            print('PASS: picture pairs in either direction; memory hint, manual retry and pause preserve cards', flush=True)

            page.locator('.ps-footer').get_by_role('button', name='놀이 목록', exact=True).click()
            page.locator('.ps-settings summary').click()
            page.get_by_label('고르는 그림 수').select_option('3')
            page.get_by_label('숫자 놀이 범위').select_option('5')
            page.reload()
            page.get_by_text('재민이 놀이학교', exact=True).click()
            page.wait_for_selector('.ps-collection')
            assert page.locator('.ps-sticker.is-collected').count() == 1
            page.locator('[data-game="numbers"]').click()
            all_numbers = set()
            for round_index in range(3):
                ids = page.locator('[data-side="left"]').evaluate_all('nodes => nodes.map(n => n.dataset.pair)')
                assert len(ids) == 3
                all_numbers.update(ids)
                for item in ids:
                    card('left', item).drag_to(card('right', item))
                page.get_by_role('button', name='다 했어요' if round_index == 2 else '다음', exact=True).click()
            assert all_numbers == {'1', '2', '3', '4', '5'}
            for game in ['numbers', 'pairs', 'memory']:
                page.locator('.ps-footer').get_by_role('button', name='놀이 목록', exact=True).click()
                page.locator(f'[data-game="{game}"]').click()
                for width, height in [(1024, 768), (768, 1024), (390, 844)]:
                    page.set_viewport_size({'width': width, 'height': height})
                    page.screenshot(path=str(output / f'{game}-{width}.png'))
                    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            assert page.locator('.ps-memory-card').count() == 6
            page.evaluate('homeBtn.click(); window.spoken = []')
            page.wait_for_timeout(650)
            assert page.evaluate('window.spoken') == []
            assert not errors, errors
            print('PASS: saved 1-5 range, three-pair boards, six memory cards, responsive layouts and clean exit', flush=True)
            browser.close()
    finally:
        server.shutdown(); server.server_close()


if __name__ == '__main__':
    main()
