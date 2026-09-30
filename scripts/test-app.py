"""Browser regressions. Requires Playwright and a local Chrome/Edge installation.

Install locally: python -m pip install --target _local/test-tools playwright
Run: python scripts/test-app.py
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json
import sys
import threading

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "_local/test-tools"))
from playwright.sync_api import sync_playwright


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


MOCK_SPEECH = """(() => {
  // Existing UI regressions isolate TTS; test-offline.py exercises real audio.
  Object.defineProperty(window, 'OFFLINE_SPEECH', { get: () => null, set() {} });
  window.spoken = [];
  window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
  let pending;
  Object.defineProperty(window, 'speechSynthesis', { value: {
    getVoices: () => [{name:'Test Korean', lang:'ko-KR', default:true}],
    resume() {},
    cancel() { if (pending) { clearTimeout(pending.timer); pending.u.onerror?.(); pending = null; } },
    speak(u) {
      window.spoken.push(u.text);
      pending = {u, timer: setTimeout(() => { pending = null; u.onend?.(); }, 200)};
    }
  }});
})();"""


def go(page, key):
    page.evaluate("key => { pushScreen(key, key); render(); }", key)


def tile(page, label):
    return page.locator("button.tile").filter(has=page.get_by_text(label, exact=True))


def main():
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(ROOT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    url = f"http://127.0.0.1:{server.server_port}/"
    errors = []
    class Checks(list):
        def append(self, value):
            super().append(value)
            print("PASS: " + value, flush=True)
    checks = Checks()
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(channel="chrome", headless=True, timeout=20000)
            context = browser.new_context(viewport={"width": 1024, "height": 768}, service_workers="block")
            context.add_init_script(MOCK_SPEECH)
            context.route("**/*", lambda route: route.continue_() if route.request.url.startswith(url) else route.abort())
            page = context.new_page()
            page.set_default_timeout(10000)
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.goto(url)
            page.wait_for_function("typeof render === 'function' && document.querySelector('#buttonGrid button')")

            # A speech-delayed navigation must not undo a later Home action.
            go(page, "mealHome")
            page.evaluate("""() => {
              renderButtons([{label:'다음', nav:'weatherHome'}], 'main');
              gridEl.querySelector('button').click();
              homeBtn.click();
            }""")
            page.wait_for_timeout(500)
            assert page.evaluate("currentKey()") == "main"
            checks.append("pending navigation cancelled by Home")

            page.evaluate("""() => {
              renderButtons([{label:'A', nav:'weatherHome'}, {label:'B', nav:'toilet'}], 'main');
              const buttons = gridEl.querySelectorAll('button');
              buttons[0].click(); buttons[1].click();
            }""")
            page.wait_for_timeout(300)
            assert page.evaluate("navStack.map(x => x.key)") == ["main", "toilet"]
            checks.append("rapid navigation uses only latest request")

            games = page.evaluate("Object.entries(DATA.screens).filter(([k,s]) => ['trafficLightGame','martCartGame','facePartsGame','recyclingGame'].includes(s.layout)).map(([k]) => k)")
            for key in games:
                go(page, key)
                page.evaluate("homeBtn.click(); window.spoken = [];")
                page.wait_for_timeout(650)
                assert page.evaluate("window.spoken") == [], key
                assert page.evaluate("currentKey()") == "main"
            checks.append(f"no delayed game prompts after exit ({len(games)} games)")

            traffic = page.evaluate("Object.keys(DATA.screens).find(k => DATA.screens[k].layout === 'trafficLightGame')")
            go(page, traffic)
            page.evaluate("document.querySelector('.traffic-action').click(); homeBtn.click();")
            revision = page.evaluate("renderRevision")
            page.wait_for_timeout(2300)
            assert page.evaluate("renderRevision") == revision
            go(page, traffic)
            assert page.locator(".traffic-progress").inner_text() == "1/8"
            checks.append("in-flight game round cancelled and re-entry unlocked")

            go(page, "dateHome")
            for mode in ["cards", "puzzle", "blankPuzzle", "stepFlow", "boardFill"]:
                page.evaluate("mode => { dateActivityMode = mode; render(); }", mode)
                assert page.locator("#buttonGrid").is_visible()
            checks.append("all five date modes render")

            go(page, "scheduleShopping")
            tile(page, "하나로마트").click()
            tile(page, "물").click()
            tile(page, "우유").click()
            page.get_by_role("button", name="장보기 시작", exact=False).click()
            # Complete the first real step through its speech + animation handler.
            page.locator(".home-runner-current").click()
            page.wait_for_function("JSON.parse(localStorage.getItem('jaemin-schedule-session-v1')).shoppingRemaining.length === 2")
            saved = page.evaluate("JSON.parse(localStorage.getItem('jaemin-schedule-session-v1'))")
            page.reload()
            go(page, "scheduleShopping")
            page.get_by_role("button", name="장보기 이어하기", exact=False).click()
            restored = page.evaluate("JSON.parse(localStorage.getItem('jaemin-schedule-session-v1'))")
            assert restored["shoppingRemaining"] == saved["shoppingRemaining"]
            assert len(restored["shoppingItems"]) == 2
            page.evaluate("homeBtn.click()")
            go(page, "scheduleShopping")
            assert page.get_by_role("button", name="장보기 이어하기", exact=False).count() == 1
            checks.append("shopping selection and remaining steps survive reload and Home")

            go(page, "scheduleHomeActivity")
            tile(page, "집에만 있을 때").click()
            tile(page, "간식 먹기").click()
            tile(page, "밥 먹기").click()
            page.get_by_role("button", name="시작하기", exact=False).click()
            page.locator(".home-runner-current").click()
            page.wait_for_function("JSON.parse(localStorage.getItem('jaemin-schedule-session-v1')).homeScheduleRemaining.length === 1")
            page.reload()
            go(page, "scheduleHomeActivity")
            page.get_by_role("button", name="이어하기", exact=False).click()
            assert page.evaluate("JSON.parse(localStorage.getItem('jaemin-schedule-session-v1')).homeScheduleRemaining.length") == 1
            checks.append("home schedule and completed steps survive reload")

            page.evaluate("localStorage.setItem('jaemin-weekly-periods-v1', 'null'); localStorage.setItem('jaemin-schedule-session-v1', '{}')")
            page.reload()
            assert page.locator("#storageNotice").is_visible()
            go(page, "scheduleShopping")
            checks.append("malformed saved state falls back with a visible notice")

            page.evaluate("() => { Storage.prototype.setItem = function() { throw new Error('QuotaExceededError'); }; }")
            page.evaluate("window.appStorage.save('test', {})")
            assert "저장하지 못했어요" in page.locator("#storageNotice").inner_text()
            checks.append("storage write failure is visible")

            assert not errors, errors
            context.close()

            android = browser.new_context(service_workers="block", user_agent="Mozilla/5.0 (Linux; Android 14) Chrome/130 Mobile")
            android.add_init_script(MOCK_SPEECH)
            android_page = android.new_page()
            android_page.goto(url)
            android_page.evaluate("speak('first'); speak('last');")
            android_page.wait_for_timeout(500)
            assert android_page.evaluate("window.spoken") == ["last"]
            checks.append("Android delayed speech uses only latest request")
            android.close()

            offline = browser.new_context()
            offline.add_init_script(MOCK_SPEECH)
            offline_page = offline.new_page()
            offline_page.goto(url)
            offline_page.wait_for_function("navigator.serviceWorker.controller && typeof render === 'function'", timeout=60000)
            offline_page.wait_for_function("async () => !!(await (await caches.open('jaemin-aac-v401')).match('./js/core/runtime.js'))")
            offline.set_offline(True)
            offline_page.reload()
            offline_page.wait_for_function("typeof render === 'function' && document.querySelector('#buttonGrid button')")
            go(offline_page, "scheduleShopping")
            assert tile(offline_page, "하나로마트").count() == 1
            checks.append("service worker installs and app reloads offline with new runtime")
            offline.close()
            browser.close()
        print(json.dumps({"passed": checks, "page_errors": errors}, ensure_ascii=True, indent=2))
    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    main()
