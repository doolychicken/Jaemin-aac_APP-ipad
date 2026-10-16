"""Meal tray entry, all food drops, persistence, and iPad layout coverage."""
import importlib.util, threading
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('base',ROOT/'scripts/test-app.py')
base=importlib.util.module_from_spec(spec);spec.loader.exec_module(base)
from playwright.sync_api import sync_playwright

def main():
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(base.QuietHandler,directory=str(ROOT)))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    out=ROOT/'_local/food-stickers';out.mkdir(exist_ok=True)
    try:
        with sync_playwright() as p:
            browser=p.chromium.launch(channel='chrome',headless=True)
            ctx=browser.new_context(viewport={'width':1180,'height':820},has_touch=True,service_workers='block')
            ctx.add_init_script(base.MOCK_SPEECH)
            page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
            page.goto(f'http://127.0.0.1:{server.server_port}/')
            page.evaluate("pushScreen('studyAppLearning','앱 공부');render()")
            page.get_by_text('식판',exact=True).click()
            page.wait_for_selector('[data-chapter="rice"]')
            assert page.locator('[data-chapter]').count()==4
            for book,chapters in [('Tray',{'rice':9,'meal':9,'fruit':9,'snack':9}),
                                  ('Fridge',{'drinks':9,'meals':7,'vegetables':6,'fruit':9})]:
                for chapter,total in chapters.items():
                    page.evaluate(f"pushScreen('sticker{book}_{chapter}','스티커북');render()")
                    for i in range(total):
                        page.wait_for_selector('.sb-card:not(:disabled)')
                        assert page.locator('.sb-card').count()==1
                        a=page.locator('.sb-card').bounding_box();b=page.locator('.sb-target').bounding_box()
                        page.mouse.move(a['x']+a['width']/2,a['y']+a['height']/2);page.mouse.down()
                        page.mouse.move(b['x']+b['width']/2,b['y']+b['height']/2,steps=6);page.mouse.up()
                        page.locator('.sb-next').click()
                    page.wait_for_selector('.sb-tray--complete')
                    page.wait_for_selector('.sb-loading',state='detached')
                    assert page.locator('.sb-placed').count()==total
                    page.screenshot(path=str(out/f'{book}-{chapter}.png'))
            page.reload()
            page.evaluate("pushScreen('stickerTray_rice','식판');render()")
            page.wait_for_selector('.sb-tray--complete')
            page.get_by_role('button',name='하나 되돌리기',exact=True).click()
            page.wait_for_selector('.sb-card:not(:disabled)')
            assert page.locator('.sb-card').get_attribute('data-piece')=='fork'
            for w,h in [(1024,768),(768,1024),(820,1180),(390,844)]:
                page.set_viewport_size({'width':w,'height':h});page.wait_for_timeout(300)
                for selector in ['.sb-stage','.sb-card','.sb-footer']:
                    b=page.locator(selector).bounding_box()
                    assert b['x']>=0 and b['y']>=0 and b['x']+b['width']<=w+1 and b['y']+b['height']<=h+1,(w,h,selector,b)
                page.screenshot(path=str(out/f'tray-{w}-{h}.png'))
            assert not errors,errors
            browser.close()
            print('PASS: 67 new food/tray placements, direct category, resume/undo, four layouts')
    finally:server.shutdown()

if __name__=='__main__':main()
