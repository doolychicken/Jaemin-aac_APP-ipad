"""Bathroom sticker-book touch, persistence, layout and offline regressions."""
import importlib.util
from functools import partial
from http.server import ThreadingHTTPServer
from pathlib import Path
import threading
import json

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('app_tests', ROOT/'scripts/test-app.py')
base=importlib.util.module_from_spec(spec); spec.loader.exec_module(base)
from playwright.sync_api import sync_playwright

def main():
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(base.QuietHandler,directory=str(ROOT)))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    url=f'http://127.0.0.1:{server.server_port}/'
    out=ROOT/'_local/sticker-book'; out.mkdir(exist_ok=True)
    errors=[]
    try:
        with sync_playwright() as p:
            browser=p.chromium.launch(channel='chrome',headless=True)
            context=browser.new_context(viewport={'width':1024,'height':768},has_touch=True,service_workers='block')
            context.add_init_script(base.MOCK_SPEECH)
            page=context.new_page(); page.set_default_timeout(10000)
            page.on('pageerror',lambda error:errors.append(str(error)))
            page.goto(url)
            # Follow the real app-study navigation, not a separate test route.
            page.evaluate("pushScreen('studyAppLearning','앱 공부'); render()")
            page.get_by_text('스티커북',exact=True).click()
            page.get_by_text('화장실 스티커북',exact=True).click()
            page.wait_for_selector('.sb-chapter')
            page.screenshot(path=str(out/'book-landscape.png'))
            assert page.locator('.sb-chapter').count()==3

            def chapter(id):
                if page.locator('.sb-toolbar').count(): page.locator('.sb-toolbar').get_by_role('button',name='목록',exact=True).click()
                page.locator(f'[data-chapter="{id}"]').click()
                page.wait_for_selector('.sb-loading',state='detached')

            def saved(id='fixtures'):
                return page.evaluate(f"JSON.parse(localStorage.getItem('jaemin-bathroom-stickers-v1')).progress.{id}")

            def drag(source='.sb-card',target='.sb-target'):
                a=page.locator(source).bounding_box(); b=page.locator(target).bounding_box()
                page.mouse.move(a['x']+a['width']/2,a['y']+a['height']/2); page.mouse.down()
                page.mouse.move(b['x']+b['width']/2,b['y']+b['height']/2,steps=12); page.mouse.up()

            chapter('fixtures')
            assert page.locator('.sb-card').count()==1
            page.screenshot(path=str(out/'fixture-landscape.png'))
            page.locator('.sb-card').click()
            assert page.locator('.sb-next').count()==0
            drag(target='.sb-toolbar')
            assert page.locator('.sb-next').count()==0
            assert '괜찮아요' in page.locator('.sb-status').inner_text()
            drag(); assert saved()['placed']==['bath']
            page.get_by_role('button',name='다음 스티커',exact=True).click()
            # Real touch through CDP: cancellation and a successful drop.
            touch=context.new_cdp_session(page)
            def touch_drag(cancel=False,exit=False):
                a=page.locator('.sb-card').bounding_box(); b=page.locator('.sb-target').bounding_box()
                start={'x':a['x']+a['width']/2,'y':a['y']+a['height']/2}
                end={'x':b['x']+b['width']/2,'y':b['y']+b['height']/2}
                touch.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[dict(start,id=1)]})
                for step in range(1,7):
                    point={k:start[k]+(end[k]-start[k])*step/6 for k in start}
                    touch.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[dict(point,id=1)]})
                assert page.locator('.sb-drag-ghost').count()==1
                if exit: page.evaluate('backBtn.click()')
                touch.send('Input.dispatchTouchEvent',{'type':'touchCancel' if cancel else 'touchEnd','touchPoints':[]})
                assert page.locator('.sb-drag-ghost').count()==0
            touch_drag(cancel=True); assert saved()['placed']==['bath']
            touch_drag(exit=True); assert page.locator('.sb-chapter').count()==3
            chapter('fixtures'); touch_drag(); assert saved()['placed']==['bath','shower']
            # Relaunch restores a completed placement and waits for the child's Next action.
            page.reload(); page.evaluate("pushScreen('stickerBathroom','화장실 스티커북'); render()")
            chapter('fixtures'); assert page.locator('.sb-next').count()==1
            page.get_by_role('button',name='하나 되돌리기',exact=True).click(); assert saved()['placed']==['bath']
            page.get_by_role('button',name='쉬어요',exact=True).click(); assert page.get_by_role('dialog').is_visible()
            page.keyboard.press('Escape'); assert page.get_by_role('dialog').count()==0
            page.get_by_role('button',name='처음부터',exact=True).click()
            page.get_by_role('dialog').get_by_role('button',name='계속할래요',exact=True).click(); assert saved()['placed']==['bath']
            while page.locator('.sb-card').count():
                drag()
                page.locator('.sb-next').click()
            assert page.locator('.sb-tray--complete').count()==1
            assert len(saved()['placed'])==8
            page.screenshot(path=str(out/'fixture-complete.png'))
            print('PASS: drag-only pointer/touch, cancel/exit, resume, undo, rest and 8-fixture completion',flush=True)

            chapter('items')
            for i in range(16):
                page.wait_for_selector('.sb-loading',state='detached')
                assert page.locator('.sb-card').count()==1
                drag(); page.locator('.sb-next').click()
            assert len(saved('items')['placed'])==16
            page.screenshot(path=str(out/'items-complete.png'))
            chapter('routines'); drag(); page.locator('.sb-next').click()
            drag(); page.screenshot(path=str(out/'routines.png'))
            page.locator('.sb-next').click()
            for i in range(2,8):
                page.wait_for_selector('.sb-loading',state='detached')
                drag(); page.screenshot(path=str(out/f'routine-{i}.png')); page.locator('.sb-next').click()
            assert len(saved('routines')['placed'])==8
            print('PASS: all 16 toiletries and all 8 boy routines place and save',flush=True)

            chapter('fixtures')
            page.get_by_role('button',name='처음부터',exact=True).click()
            page.get_by_role('dialog').get_by_role('button',name='처음부터',exact=True).click()
            assert saved()['placed']==[] and len(saved('items')['placed'])==16
            for width,height in [(768,1024),(820,1180),(1024,768),(1180,820),(390,844)]:
                page.set_viewport_size({'width':width,'height':height}); page.wait_for_timeout(400)
                page.wait_for_selector('.sb-loading',state='detached')
                for selector in ['.sb-card','.sb-stage','.sb-footer']:
                    box=page.locator(selector).bounding_box()
                    assert box and box['width']>20 and box['height']>20,(width,height,selector,box)
                    assert box['x']>=-1 and box['y']>=0 and box['x']+box['width']<=width+1 and box['y']+box['height']<=height+1,(width,height,selector,box)
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
                page.screenshot(path=str(out/f'layout-{width}-{height}.png'))
            # Keyboard/switch alternative: select the card, then confirm the target.
            page.locator('.sb-card').focus(); page.keyboard.press('Enter'); page.keyboard.press('Enter')
            assert saved()['placed']==['bath']
            # Missing art must show an explicit retry and must not allow an invisible drop.
            page.reload()
            page.route('**/images/bathroom_book/fixtures.png',lambda route:route.abort())
            page.evaluate("pushScreen('stickerBathroom_fixtures','큰 물건 붙이기'); render()")
            page.get_by_role('button',name='다음 스티커',exact=True).click()
            page.get_by_role('button',name='다시 불러오기',exact=True).wait_for()
            assert page.locator('.sb-card').is_disabled()
            page.unroute('**/images/bathroom_book/fixtures.png')
            page.get_by_role('button',name='다시 불러오기',exact=True).click()
            page.wait_for_selector('.sb-card:not(:disabled)')
            # Corrupt local progress falls back to a fresh session, not a broken screen.
            page.evaluate("localStorage.setItem('jaemin-bathroom-stickers-v1', '{broken')")
            page.reload(); page.evaluate("pushScreen('stickerBathroom_fixtures','큰 물건 붙이기'); render()")
            page.wait_for_selector('.sb-card:not(:disabled)')
            assert page.locator('.sb-card').get_attribute('data-piece')=='bath'
            assert page.locator('#storageNotice').is_visible()
            assert not errors,errors
            print('PASS: layout bounds, keyboard, reset, missing-image retry and corrupt storage fallback',flush=True)
            context.close()

            # Fresh SW install; actual image and code requests must work disconnected.
            offline=browser.new_context(viewport={'width':1024,'height':768})
            offline_spec=importlib.util.spec_from_file_location('offline_tests', ROOT/'scripts/test-offline.py')
            offline_tests=importlib.util.module_from_spec(offline_spec); offline_spec.loader.exec_module(offline_tests)
            offline.add_init_script(offline_tests.NO_NATIVE_SPEECH)
            off=offline.new_page(); off.set_default_timeout(120000)
            off.goto(url)
            off.wait_for_function("async () => { const c=await caches.open('jaemin-aac-v404'); return !!(await c.match('./images/bathroom_book/boy-two.png')) && !!(await c.match('./js/features/sticker-book.js')); }")
            off.reload(); off.wait_for_function('navigator.serviceWorker.controller !== null')
            off.wait_for_function("document.getElementById('offlineStatusText').textContent.includes('준비 완료')")
            offline.set_offline(True); off.reload()
            off.evaluate("pushScreen('stickerBathroom_items','생활용품 놓기'); render()")
            off.wait_for_selector('.sb-card:not(:disabled)')
            assert off.locator('.sb-loading').count()==0
            a=off.locator('.sb-card').bounding_box(); b=off.locator('.sb-target').bounding_box()
            off.mouse.move(a['x']+a['width']/2,a['y']+a['height']/2); off.mouse.down()
            # The app's first-gesture audio warmup may call a silent native utterance.
            off.evaluate('window.nativeSpeechCalls = 0')
            off.mouse.move(b['x']+b['width']/2,b['y']+b['height']/2,steps=8); off.mouse.up()
            assert off.locator('.sb-next').count()==1
            off.wait_for_function('window.recordedEnds > 0')
            assert off.evaluate('window.nativeSpeechCalls')==0
            assert not off.locator('#storageNotice').is_visible()
            off.screenshot(path=str(out/'offline.png'))
            print('PASS: cached code/photos and placement after offline reload',flush=True)
            offline.close(); browser.close()
    finally:
        server.shutdown()

if __name__=='__main__': main()
