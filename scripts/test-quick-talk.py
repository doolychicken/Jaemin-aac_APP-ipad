"""Check request cards speak without navigating, with stable order on iPad."""
import importlib.util, threading
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('base',ROOT/'scripts/test-app.py')
base=importlib.util.module_from_spec(spec);spec.loader.exec_module(base)
from playwright.sync_api import sync_playwright
server=ThreadingHTTPServer(('127.0.0.1',0),partial(base.QuietHandler,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
out=ROOT/'_local/quick-talk';out.mkdir(exist_ok=True)
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(channel='chrome')
  context=browser.new_context(viewport=dict(width=1180,height=820),has_touch=True,service_workers='block')
  context.add_init_script(base.MOCK_SPEECH)
  page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}/')
  page.get_by_text('바로 말하기',exact=True).click()
  page.wait_for_selector('.quick-talk-card')
  expected=page.evaluate('DATA.screens.quickTalk.items.map(i=>i.speech)')
  assert len(expected)==11
  for i,phrase in enumerate(expected):
   page.locator('.quick-talk-card').nth(i).tap()
   assert page.evaluate('currentKey()')=='quickTalk'
   assert page.evaluate('window.spoken.at(-1)')==phrase
   assert page.locator('.quick-talk-status').inner_text()==phrase
  assert len(context.pages)==1
  assert page.locator('.quick-talk-card img').evaluate_all('(images)=>images.every(i=>i.complete && i.naturalWidth>0)')
  for w,h in [(1180,820),(820,1180),(390,844)]:
   page.set_viewport_size(dict(width=w,height=h))
   assert page.locator('.quick-talk-card').count()==11
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   if w>600:
    assert page.locator('.quick-talk-grid').evaluate('(e)=>getComputedStyle(e).gridTemplateColumns.split(" ").length')==4
    for card in page.locator('.quick-talk-card').all():
     b=card.bounding_box();assert b['y']>=0 and b['y']+b['height']<=h,(w,h,b)
   page.screenshot(path=str(out/f'quick-talk-{w}.png'))
  assert not errors,errors
  browser.close()
 print('PASS: all 11 request cards speak; no navigation/video launch; stable cards at three screen sizes; images loaded; no script errors')
finally:server.shutdown()
