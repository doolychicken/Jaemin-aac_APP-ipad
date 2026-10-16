"""Exercise every new room, saved progress isolation and room rendering."""
import importlib.util, threading
from functools import partial
from http.server import ThreadingHTTPServer
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('base',ROOT/'scripts/test-app.py')
base=importlib.util.module_from_spec(spec);spec.loader.exec_module(base)
from playwright.sync_api import sync_playwright

def main():
 server=ThreadingHTTPServer(('127.0.0.1',0),partial(base.QuietHandler,directory=str(ROOT)))
 threading.Thread(target=server.serve_forever,daemon=True).start()
 out=ROOT/'_local/home-stickers';out.mkdir(exist_ok=True)
 try:
  with sync_playwright() as p:
   browser=p.chromium.launch(channel='chrome',headless=True)
   context=browser.new_context(viewport={'width':1180,'height':820},has_touch=True,service_workers='block')
   context.add_init_script(base.MOCK_SPEECH)
   page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(f'http://127.0.0.1:{server.server_port}/')
   def shelf():
    page.evaluate("pushScreen('stickerBookHome','스티커북');render()")
    assert page.locator('.sb-library-card').count()==4
   shelf();page.screenshot(path=str(out/'shelf.png'))
   for id,label in [('kitchen','주방'),('living','거실'),('bedroom','침실')]:
    page.get_by_text(label+' 스티커북',exact=True).click()
    assert page.locator('.sb-chapter').count()==2
    for chapter in ['fixtures','items']:
     page.locator(f'[data-chapter="{chapter}"]').click()
     page.wait_for_selector('.sb-card:not(:disabled)')
     page.screenshot(path=str(out/f'{id}-{chapter}-start.png'))
     for i in range(6):
      page.wait_for_selector('.sb-card:not(:disabled)')
      assert page.locator('.sb-card').count()==1
      a=page.locator('.sb-card').bounding_box();b=page.locator('.sb-target').bounding_box()
      page.mouse.move(a['x']+a['width']/2,a['y']+a['height']/2);page.mouse.down()
      page.mouse.move(b['x']+b['width']/2,b['y']+b['height']/2,steps=8);page.mouse.up()
      page.locator('.sb-next').click()
     page.wait_for_selector('.sb-loading',state='detached')
     assert page.locator('.sb-tray--complete').count()==1
     page.screenshot(path=str(out/f'{id}-{chapter}-complete.png'))
     page.locator('.sb-toolbar').get_by_role('button',name='목록',exact=True).click()
     assert page.locator('.sb-intro h2').inner_text()==label+' 꾸미기'
    shelf()
   page.reload();shelf()
   for id in ['kitchen','living','bedroom']:
    saved=page.evaluate(f"JSON.parse(localStorage.getItem('jaemin-{id}-stickers-v1'))")
    assert all(len(s['placed'])==6 for s in saved['progress'].values())
   # Bathroom progress remains on its original key and each book has independent reset.
   assert page.evaluate("localStorage.getItem('jaemin-bathroom-stickers-v1')")==None
   page.get_by_text('주방 스티커북',exact=True).click()
   page.locator('[data-chapter="items"]').click()
   page.get_by_role('button',name='처음부터',exact=True).click()
   page.locator('.sb-dialog').get_by_role('button',name='처음부터',exact=True).click()
   assert page.evaluate("JSON.parse(localStorage.getItem('jaemin-living-stickers-v1')).progress.items.placed.length")==6
   for w,h in [(1024,768),(768,1024),(820,1180),(1366,1024),(390,844)]:
    page.set_viewport_size({'width':w,'height':h});page.wait_for_timeout(350)
    page.wait_for_selector('.sb-card:not(:disabled)')
    for sel in ['.sb-card','.sb-stage','.sb-footer']:
     r=page.locator(sel).bounding_box();assert r['x']>=0 and r['y']>=0 and r['x']+r['width']<=w+1 and r['y']+r['height']<=h+1,(w,h,sel,r)
   assert not errors,errors
   browser.close()
   print('PASS: all 36 stickers, four-book navigation, per-room resume/reset isolation, five screen sizes')
 finally:server.shutdown()

if __name__=='__main__':main()
