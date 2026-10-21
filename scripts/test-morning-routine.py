"""Morning routine presets, drag/tap, per-day edits, persistence and rollover."""
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
out=ROOT/'_local/morning-routine';out.mkdir(exist_ok=True)
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(channel='chrome')
  context=browser.new_context(viewport=dict(width=1180,height=820),has_touch=True,service_workers='block')
  context.add_init_script(base.MOCK_SPEECH)
  page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.clock.set_fixed_time('2026-10-21T08:00:00+09:00')
  page.goto(f'http://127.0.0.1:{server.server_port}/')
  page.get_by_text('아침 일정',exact=True).click()
  page.wait_for_selector('.morning-board')
  def prepare():
   page.locator('.mr-date').click()
   page.get_by_role('button',name='맑음',exact=True).click()
  def select_date(date):
   page.locator('summary').click()
   page.locator('input[type=date]').fill(date)
  expected={
   '2026-10-19':['학교','점심 먹기','장애인 콜택시','강서 큰나무 병원','택시','집'],
   '2026-10-20':['학교','점심 먹기','장애인 콜택시','강서 큰나무 병원','택시','집'],
   '2026-10-21':['학교','점심 먹기','장애인 콜택시','강서 큰나무 병원','택시','집'],
   '2026-10-22':['학교','점심 먹기','수업','장애인 콜택시','사람과소통','걸어가기','집'],
   '2026-10-23':['학교','점심 먹기','장애인 콜택시','세브란스병원','푸르메 재활병원','버스','집']}
  prepare()
  # A missed drag must not advance, then a successful drag places exactly one.
  source=page.locator('.mr-source').bounding_box();drop=page.locator('.mr-drop').bounding_box()
  sx,sy=source['x']+source['width']/2,source['y']+source['height']/2
  page.mouse.move(sx,sy);page.mouse.down();page.mouse.move(10,10,steps=8);page.mouse.up()
  assert page.locator('.mr-sequence .mr-card').count()==0
  page.mouse.move(sx,sy);page.mouse.down();page.mouse.move(drop['x']+drop['width']/2,drop['y']+drop['height']/2,steps=8);page.mouse.up()
  assert page.locator('.mr-sequence .mr-card').count()==1
  while page.locator('.mr-source').count():page.locator('.mr-source').tap()
  assert page.locator('.mr-sequence strong').all_text_contents()==expected['2026-10-21']
  page.get_by_role('button',name='다 했어요',exact=True).tap()
  page.reload();page.get_by_text('아침 일정',exact=True).click()
  page.wait_for_selector('.morning-board')
  assert page.locator('.mr-done').count()==1
  assert page.locator('.mr-sequence .mr-card').count()==6
  for date,labels in expected.items():
   if date=='2026-10-21':continue
   select_date(date);prepare()
   while page.locator('.mr-source').count():page.locator('.mr-source').tap()
   assert page.locator('.mr-sequence strong').all_text_contents()==labels,(date,labels)
  for w,h in [(1180,820),(820,1180),(390,844)]:
   page.set_viewport_size(dict(width=w,height=h))
   page.wait_for_timeout(500)  # App debounces responsive re-rendering.
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   page.screenshot(path=str(out/f'friday-{w}.png'))
  page.set_viewport_size(dict(width=1180,height=820))
  page.wait_for_timeout(500)
  page.locator('summary').click()
  page.locator('.mr-editor li').nth(3).get_by_role('button',name='빼기').click()
  assert page.locator('.mr-slot').count()==6
  assert page.locator('.mr-source').count()==1
  select_date('2026-10-22')
  assert page.locator('.mr-slot').count()==7
  select_date('2026-10-24');prepare()
  assert page.locator('.mr-slot').count()==0
  page.locator('summary').click();page.get_by_label('추가할 일정').select_option('home')
  page.get_by_role('button',name='일정 추가',exact=True).click()
  page.locator('.mr-source').tap()
  assert page.locator('.mr-sequence strong').all_text_contents()==['집']
  # A new day never inherits yesterday's completion marks.
  page.clock.set_fixed_time('2026-10-22T08:00:00+09:00')
  page.evaluate('pushScreen("main","메인 화면");render();pushScreen("morningRoutine","아침 일정");render()')
  assert '22일' in page.locator('.mr-date').inner_text()
  assert page.locator('.mr-done').count()==0
  assert not errors,errors
  browser.close()
 print('PASS: weekday schedules, missed/successful drag, tap, reload, per-date edits, weekend, rollover and three screen sizes')
finally:server.shutdown()
