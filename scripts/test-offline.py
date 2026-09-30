"""Real decoded-audio, video/range, interrupted-install and cache-repair checks."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import sys
import threading

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '_local/test-tools'))
from playwright.sync_api import sync_playwright


class Handler(SimpleHTTPRequestHandler):
    fail_speech = False

    def log_message(self, *args):
        pass

    def do_GET(self):
        if self.fail_speech and '/audio/speech/' in self.path:
            self.send_error(503)
        else:
            super().do_GET()


NO_NATIVE_SPEECH = """(() => {
  window.nativeSpeechCalls = 0;
  Object.defineProperty(window, 'speechSynthesis', {value: {
    getVoices: () => [], resume() {}, cancel() {},
    speak() { window.nativeSpeechCalls++; throw new Error('No device voice'); }
  }});
  window.recordedStarts = 0;
  window.recordedEnds = 0;
  window.recordedStops = 0;
  window.instrumentNotes = [];
  window.instrumentStops = 0;
  const oscillatorStart = OscillatorNode.prototype.start;
  const oscillatorStop = OscillatorNode.prototype.stop;
  OscillatorNode.prototype.start = function(...args) {
    window.instrumentNotes.push(this.frequency.value);
    return oscillatorStart.apply(this, args);
  };
  OscillatorNode.prototype.stop = function(...args) {
    if (!args.length) window.instrumentStops++;
    return oscillatorStop.apply(this, args);
  };
  const start = AudioBufferSourceNode.prototype.start;
  const stop = AudioBufferSourceNode.prototype.stop;
  AudioBufferSourceNode.prototype.start = function(...args) {
    if (this.buffer?.duration > 0.1) {
      window.recordedStarts++;
      this.addEventListener('ended', () => window.recordedEnds++);
    }
    return start.apply(this, args);
  };
  AudioBufferSourceNode.prototype.stop = function(...args) {
    if (this.buffer?.duration > 0.1) window.recordedStops++;
    return stop.apply(this, args);
  };
})();"""


def main():
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Handler, directory=str(ROOT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    url = f'http://127.0.0.1:{server.server_port}/'
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(channel='chrome', headless=True, timeout=20000)
            context = browser.new_context(viewport={'width': 1024, 'height': 768}, has_touch=True)
            context.add_init_script(NO_NATIVE_SPEECH)
            page = context.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            # Failed installs must never report ready. Retry without deleting data.
            Handler.fail_speech = True
            page.goto(url)
            page.wait_for_function("!document.querySelector('#offlineRetry').hidden", timeout=30000)
            assert '완료 ·' not in page.locator('#offlineStatusText').inner_text()
            print('PASS: interrupted download does not report ready', flush=True)
            Handler.fail_speech = False
            page.locator('#offlineRetry').click()
            page.wait_for_function("navigator.serviceWorker.controller && document.querySelector('#offlineStatusText').textContent.includes('준비 완료')", timeout=60000)
            print('PASS: retry completes all offline files', flush=True)
            context.set_offline(True)
            page.reload()
            page.wait_for_function("document.querySelector('#offlineStatusText').textContent.includes('오프라인 사용 중')")

            ranges = page.evaluate("""async () => {
              const rows = [];
              for (const range of ['bytes=0-1', 'bytes=100-199', 'bytes=-64', 'bytes=999999999-']) {
                const response = await fetch('./video/watersound.mp4', {headers:{Range:range}});
                rows.push({status:response.status, length:(await response.arrayBuffer()).byteLength, range:response.headers.get('Content-Range')});
              }
              return rows;
            }""")
            assert [(r['status'], r['length']) for r in ranges] == [(206, 2), (206, 100), (206, 64), (416, 0)], ranges
            print('PASS: offline video byte ranges and invalid-range response', flush=True)

            page.evaluate("""() => {
              const button = document.createElement('button');
              button.id = 'speech-test'; button.textContent = '음성 확인';
              button.onclick = () => { window.speechDone = false; speak('화장실 가고 싶어요').then(() => window.speechDone = true); };
              document.querySelector('main').prepend(button);
            }""")
            page.locator('#speech-test').click()
            page.wait_for_function('window.speechDone === true', timeout=20000)
            assert page.evaluate('window.recordedStarts > 0 && window.recordedEnds > 0')
            # warmupTTS may attempt its silent utterance; reset its count after the first gesture.
            page.evaluate('window.nativeSpeechCalls = 0')
            result = page.evaluate("window.offlineSpeech.play('오늘은 2026년 9월 29일 화요일입니다. 날씨는 맑음입니다.')")
            assert result is True
            assert page.evaluate('window.nativeSpeechCalls') == 0
            print('PASS: real recorded Korean sentence plays offline without device TTS', flush=True)

            starts = page.evaluate('window.recordedStarts')
            page.evaluate("() => { window.offlineSpeech.play('오늘은 2026년 9월 29일 화요일입니다. 날씨는 맑음입니다.'); }")
            page.wait_for_function('before => window.recordedStarts > before', arg=starts)
            page.evaluate("speak('홈'); void 0")
            page.wait_for_timeout(1500)
            assert page.evaluate('window.recordedStops') > 0
            print('PASS: new speech cancels previous recorded audio', flush=True)

            page.evaluate("pushScreen('playSchoolHome', '놀이학교'); render();")
            assert page.locator('.ps-game-card').count() == 7
            page.locator('[data-game="match"]').click()
            page.locator('[data-choice="juice"]').click()
            assert page.locator('.ps-reward-actions').count() == 1
            assert page.evaluate("window.offlineSpeech.play('출발을 누르면 자동차가 지나가요')") is True
            assert page.evaluate('window.nativeSpeechCalls') == 0
            print('PASS: new play-school game and recorded instructions work offline', flush=True)

            page.evaluate("pushScreen('playSchool_music', '악기 소리 놀이'); render();")
            signatures = []
            for instrument in ['piano', 'drum', 'guitar', 'bell']:
                if instrument == 'guitar':
                    page.get_by_role('button', name='다른 악기', exact=True).click()
                page.evaluate('window.instrumentNotes = []')
                page.locator(f'[data-instrument="{instrument}"]').click()
                page.wait_for_selector(f'[data-instrument="{instrument}"].ps-playing')
                notes = page.evaluate('window.instrumentNotes')
                assert notes, instrument
                signatures.append(notes)
                page.get_by_role('button', name='소리 멈추기', exact=True).click()
                assert page.locator('.ps-playing').count() == 0
            assert len({str(notes) for notes in signatures}) == 4
            assert page.evaluate('window.instrumentStops') > 0
            page.locator('[data-instrument="bell"]').click()
            page.wait_for_selector('.ps-playing')
            stops = page.evaluate('window.instrumentStops')
            page.get_by_role('button', name='쉬어요', exact=True).click()
            assert page.evaluate('window.instrumentStops') > stops
            page.get_by_role('button', name='이어서 할래요', exact=True).click()
            page.locator('[data-instrument="bell"]').click()
            page.wait_for_selector('.ps-playing')
            stops = page.evaluate('window.instrumentStops')
            page.locator('.ps-footer').get_by_role('button', name='놀이 목록', exact=True).click()
            assert page.evaluate('window.instrumentStops') > stops
            print('PASS: four distinct instrument sounds play offline and stop on break or exit', flush=True)

            page.evaluate("pushScreen('toiletWaterVideo', '물소리'); render();")
            page.evaluate("document.querySelector('video').muted = true; document.querySelector('video').play();")
            page.wait_for_function("document.querySelector('video').currentTime > 0.2 && !document.querySelector('video').error")
            page.evaluate("document.querySelector('video').currentTime = 10")
            page.wait_for_function("document.querySelector('video').currentTime > 10.1 && !document.querySelector('video').seeking")
            print('PASS: local video plays and seeks with network disabled', flush=True)

            # Readiness must recover if a required recording disappears from storage.
            page.evaluate("async () => { const cache = await caches.open('jaemin-aac-v399'); await cache.delete(OFFLINE_SPEECH.assets[0]); }")
            page.reload()
            page.wait_for_function("document.querySelector('#offlineStatusText').textContent.includes('파일이 부족')")
            context.set_offline(False)
            page.locator('#offlineRetry').click()
            page.wait_for_function("document.querySelector('#offlineStatusText').textContent.includes('준비 완료')", timeout=30000)
            print('PASS: missing offline recording is detected and repaired', flush=True)
            assert not errors, errors
            browser.close()
            print('PASS: no browser script errors', flush=True)
    finally:
        server.shutdown()
        server.server_close()


if __name__ == '__main__':
    main()
