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
  page.locator('#buttonGrid').get_by_text('바로 말하기',exact=True).click()
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
   page.wait_for_timeout(200) # The app redraws the current route after a resize.
   assert page.locator('#buttonGrid .quick-talk-card').count()==11
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   if w>600:
    assert page.locator('#buttonGrid').evaluate('(e)=>getComputedStyle(e).gridTemplateColumns.split(" ").length')==4
    for card in page.locator('#buttonGrid .quick-talk-card').all():
     b=card.bounding_box();assert b['y']>=0 and b['y']+b['height']<=h,(w,h,b)
   page.screenshot(path=str(out/f'quick-talk-{w}.png'))
  page.set_viewport_size(dict(width=1024,height=768))
  page.locator('#homeButton').tap()
  page.get_by_text('재민이 놀이학교',exact=True).tap()
  page.locator('[data-game=kiosk]').tap()
  selected=page.locator('[data-kiosk-meal]').first
  meal=selected.get_attribute('data-kiosk-meal')
  selected.tap()
  page.locator('[data-kiosk-step="1"]').wait_for()
  launch=page.locator('#quickTalkButton')
  dialog=page.locator('#quickTalkDialog')
  for w,h in [(1024,768),(768,1024),(390,844)]:
   page.set_viewport_size(dict(width=w,height=h))
   page.wait_for_timeout(200)
   launch.tap()
   assert dialog.is_visible()
   cards=dialog.locator('.quick-talk-card')
   assert cards.evaluate_all("(nodes) => nodes.map(card => card.getAttribute('aria-label'))")==expected
   cards.nth(3).tap()
   assert page.evaluate('window.spoken.at(-1)')==expected[3]
   before=page.evaluate('window.spoken.length')
   page.evaluate("speak('게임 안내')")
   assert page.evaluate('window.spoken.length')==before
   assert page.evaluate('currentKey()')=='playSchool_kiosk'
   assert page.locator('[data-kiosk-step="1"]').is_visible()
   dialog.screenshot(path=str(out/f'quick-talk-overlay-{w}.png'))
   dialog.get_by_role('button',name='돌아가기').tap()
   assert not dialog.is_visible()
  page.get_by_role('button',name='카드로 결제하기').tap()
  page.locator('[data-kiosk-card]').tap()
  page.locator('[data-kiosk-reader]').tap()
  assert page.locator(f'[data-kiosk-step="3"] [data-kiosk-meal="{meal}"]').is_visible()
  assert not errors,errors
  browser.close()
 print('PASS: 11 stable request cards, speech, and return to the same kiosk order from the overlay at three screen sizes')
finally:server.shutdown()
