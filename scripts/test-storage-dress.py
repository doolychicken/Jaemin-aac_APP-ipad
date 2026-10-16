"""Storage hotspots, all 25 stickers, layering, persistence and keyboard access."""
import importlib.util,threading
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
 out=ROOT/'_local/storage-dress';out.mkdir(exist_ok=True)
 try:
  with sync_playwright() as p:
   browser=p.chromium.launch(channel='chrome',headless=True)
   ctx=browser.new_context(viewport={'width':1180,'height':820},has_touch=True,service_workers='block')
   ctx.add_init_script(base.MOCK_SPEECH)
   page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(f'http://127.0.0.1:{server.server_port}/')
   for id,parent,activity,total in [('fridge','Kitchen','냉장고 채우기',8),('wardrobe','Bedroom','옷장 정리하기',8),('dress',None,'옷입히기',9)]:
    if parent:
     page.evaluate(f"pushScreen('sticker{parent}_items','생활용품');render()")
     page.locator('.sb-room-link',has_text=activity).click()
    else:
     page.evaluate("pushScreen('studyAppLearning','앱 공부');render()")
     page.get_by_text('옷입히기',exact=True).click()
     page.locator('[data-chapter="items"]').click()
    page.wait_for_selector('.sb-card:not(:disabled)')
    page.screenshot(path=str(out/f'{id}-start.png'))
    for i in range(total):
     page.wait_for_selector('.sb-card:not(:disabled)')
     assert page.locator('.sb-card').count()==1
     a=page.locator('.sb-card').bounding_box();b=page.locator('.sb-target').bounding_box()
     page.mouse.move(a['x']+a['width']/2,a['y']+a['height']/2);page.mouse.down()
     page.mouse.move(b['x']+b['width']/2,b['y']+b['height']/2,steps=8);page.mouse.up()
     page.wait_for_selector('.sb-next')
     if id=='dress':page.screenshot(path=str(out/f'dress-{i}.png'))
     page.locator('.sb-next').click()
    page.wait_for_selector('.sb-loading',state='detached')
    page.screenshot(path=str(out/f'{id}-complete.png'))
    assert page.locator('.sb-placed').count()==total
    page.locator('.sb-toolbar').get_by_role('button',name='목록',exact=True).click()
    expected={'fridge':'주방 꾸미기','wardrobe':'침실 꾸미기','dress':'옷입히기'}[id]
    assert page.locator('.sb-intro h2').inner_text()==expected
   page.reload()
   page.evaluate("pushScreen('stickerDress_items','옷입히기');render()")
   page.wait_for_selector('.sb-tray--complete')
   page.get_by_role('button',name='하나 되돌리기',exact=True).click()
   page.wait_for_selector('.sb-card:not(:disabled)')
   assert page.locator('.sb-card').get_attribute('data-piece')=='bracelet'
   for w,h in [(1024,768),(768,1024),(820,1180),(390,844)]:
    page.set_viewport_size({'width':w,'height':h});page.wait_for_timeout(350)
    page.wait_for_selector('.sb-card:not(:disabled)')
    for sel in ['.sb-card','.sb-stage','.sb-footer']:
     r=page.locator(sel).bounding_box();assert r['x']>=0 and r['y']>=0 and r['x']+r['width']<=w+1 and r['y']+r['height']<=h+1,(w,h,sel,r)
   page.locator('.sb-card').focus();page.keyboard.press('Enter');page.keyboard.press('Enter')
   assert page.locator('.sb-next').count()==1
   assert page.evaluate("JSON.parse(localStorage.getItem('jaemin-fridge-stickers-v1')).progress.items.placed.length")==8
   assert not errors,errors
   browser.close();print('PASS: storage hotspots, all 25 stickers, correct parent menus, dress resume/undo, responsive layouts and keyboard')
 finally:server.shutdown()

if __name__=='__main__':main()
