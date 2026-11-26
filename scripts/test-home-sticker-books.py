"""Exercise every new room, saved progress isolation and room rendering."""
import importlib.util, threading
from functools import partial
from http.server import ThreadingHTTPServer
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('base',ROOT/'scripts/test-app.py')
base=importlib.util.module_from_spec(spec);spec.loader.exec_module(base)
from playwright.sync_api import sync_playwright

V427_KITCHEN_ITEMS = [
 'plate', 'glass', 'spoon', 'bowl', 'banana', 'milk', 'paddle', 'soup',
 'side-dishes', 'sponge', 'dish-soap', 'fried-egg', 'fork', 'chopsticks',
 'tissue', 'mug', 'rubber-gloves', 'ladle', 'turner', 'tongs',
]
TABLE_SETTING = ('bowl', 'soup', 'spoon', 'chopsticks', 'fork')


def check_kitchen_setting(page, out):
 # Measure the photos on the completed board, independently of the expanded drop zones.
 for width,height in [(1024,768), (768,1024), (1180,820)]:
  page.set_viewport_size({'width':width, 'height':height})
  page.wait_for_timeout(350)
  pieces=page.locator('.sb-placed').evaluate_all("""nodes => Object.fromEntries(nodes.map(node => {
    const sprite=node.querySelector('svg'), box=sprite.viewBox.baseVal, m=sprite.getScreenCTM();
    const a=new DOMPoint(box.x,box.y).matrixTransform(m);
    const b=new DOMPoint(box.x+box.width,box.y+box.height).matrixTransform(m);
    return [node.dataset.placed,{x:a.x,y:a.y,right:b.x,bottom:b.y,w:b.x-a.x,h:b.y-a.y}];
  }))""")
  table=pieces['table']
  center=pieces['side-dishes']
  for name in TABLE_SETTING:
   left=pieces[name];right=pieces[name+'-right']
   assert left['right']<=center['x']+1 and center['right']<=right['x']+1,(width,name,left,center,right)
   for piece in [left,right]:
    assert table['x']<=piece['x'] and piece['right']<=table['right'],(name,piece,table)
    assert table['y']<=piece['y'] and piece['bottom']<=table['y']+.65*table['h'],(name,piece,table)
  # At 1024 × 768 the former paddle measured 17 px, cutlery 28 px and glass 25 px.
  for name,minimum in [('paddle',34),('glass',38),('spoon',42),('chopsticks',42),('fork',42),('sponge',33),('dish-soap',53)]:
   p=pieces[name]
   assert max(p['w'],p['h'])>=minimum,(width,height,name,p,minimum)
  stage=page.locator('.sb-stage').bounding_box()
  for name,p in pieces.items():
   assert p['x']>=stage['x']-1 and p['right']<=stage['x']+stage['width']+1,(name,p,stage)
   assert p['y']>=stage['y']-1 and p['bottom']<=stage['y']+stage['height']+1,(name,p,stage)
  page.screenshot(path=str(out/f'kitchen-setting-{width}x{height}.png'))
 page.set_viewport_size({'width':1180,'height':820})


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
   placement=page.evaluate("""() => {
    const b=window.STICKER_BOOKS.find(b=>b.id==='kitchen');
    const p=Object.fromEntries(b.chapters[0].pieces.map(p=>[p.id,p.target]));
    return {ordered:['microwave','hob','sink','blender','cooker','purifier','fridge'].map(id=>p[id][0]),
     left:p['chair-left'][0]+p['chair-left'][2],table:p.table[0],right:p.chair[0],tableEnd:p.table[0]+p.table[2]};
   }""")
   assert placement['ordered']==sorted(placement['ordered'])
   assert placement['left']<placement['table'] and placement['right']>placement['tableEnd']
   def shelf():
    page.evaluate("pushScreen('stickerBookHome','스티커북');render()")
    assert page.locator('.sb-library-card').count()==6
   shelf();page.screenshot(path=str(out/'shelf.png'))
   chapter_counts = {'kitchen': {'fixtures':10, 'items':25, 'cooking':3},
                     'living': {'fixtures':9, 'items':8}, 'bedroom': {'fixtures':8, 'items':5}}
   for id,label in [('kitchen','주방'),('living','거실'),('bedroom','침실')]:
    page.get_by_text(label+' 스티커북',exact=True).click()
    chapters=chapter_counts[id]
    assert page.locator('[data-chapter]').count()==len(chapters)
    for chapter,total in chapters.items():
     page.locator(f'[data-chapter="{chapter}"]').click()
     page.wait_for_selector('.sb-card:not(:disabled)')
     page.screenshot(path=str(out/f'{id}-{chapter}-start.png'))
     for i in range(total):
      page.wait_for_selector('.sb-card:not(:disabled)')
      assert page.locator('.sb-card').count()==1
      a=page.locator('.sb-card').bounding_box();b=page.locator('.sb-target').bounding_box()
      if id=='kitchen' and chapter=='items':
       piece=page.locator('.sb-card').get_attribute('data-piece')
       hint=page.locator('.sb-guide').bounding_box()
      page.mouse.move(a['x']+a['width']/2,a['y']+a['height']/2);page.mouse.down()
      page.mouse.move(b['x']+b['width']/2,b['y']+b['height']/2,steps=8);page.mouse.up()
      if id=='kitchen' and chapter=='items':
       photo=page.locator(f'[data-placed="{piece}"] .sb-sprite').bounding_box()
       assert all(abs(hint[key]-photo[key])<2 for key in hint),(piece,hint,photo)
      if chapter=='cooking':
       assert page.locator('.sb-placed').count()==11
       page.screenshot(path=str(out/f'kitchen-cooking-{i}.png'))
      page.locator('.sb-next').click()
     page.wait_for_selector('.sb-loading',state='detached')
     assert page.locator('.sb-tray--complete').count()==1
     if id=='kitchen' and chapter=='items':
      check_kitchen_setting(page,out)
     page.screenshot(path=str(out/f'{id}-{chapter}-complete.png'))
     page.locator('.sb-toolbar').get_by_role('button',name='목록',exact=True).click()
     assert page.locator('.sb-intro h2').inner_text()==label+' 꾸미기'
    shelf()
   page.reload();shelf()
   for id in ['kitchen','living','bedroom']:
    version=1 if id=='kitchen' else 2
    saved=page.evaluate(f"JSON.parse(localStorage.getItem('jaemin-{id}-stickers-v{version}'))")
    expected=chapter_counts[id]
    assert {k:len(s['placed']) for k,s in saved['progress'].items()}==expected
   # Bathroom progress remains on its original key and each book has independent reset.
   assert page.evaluate("localStorage.getItem('jaemin-bathroom-stickers-v1')")==None
   page.get_by_text('주방 스티커북',exact=True).click()
   page.locator('[data-chapter="items"]').click()
   page.get_by_role('button',name='처음부터',exact=True).click()
   page.locator('.sb-dialog').get_by_role('button',name='처음부터',exact=True).click()
   assert page.evaluate("JSON.parse(localStorage.getItem('jaemin-living-stickers-v2')).progress.items.placed.length")==8
   # A previously completed v425 room resumes directly at its first added sticker.
   for room,version,old_count in [('kitchen',1,17),('living',2,3)]:
    page.evaluate("""([room,version,count]) => {
      const key='jaemin-'+room+'-stickers-v'+version;
      const ids=STICKER_BOOKS.find(b=>b.id===room).chapters.find(c=>c.id==='items').pieces.map(p=>p.id);
      localStorage.setItem(key, JSON.stringify({version:1,sound:true,hints:true,progress:{items:{placed:ids.slice(0,count),cursor:count}}}));
    }""",[room,version,old_count])
    page.reload()
    page.evaluate("room => {pushScreen('sticker'+room+'_items','생활용품');render()}",room.capitalize())
    page.wait_for_selector('.sb-card:not(:disabled)')
    label=page.locator('.sb-tray h2').inner_text()
    assert label in (['국자','뒤집개','집게'] if room=='kitchen' else ['꽃 화분','분무기','물뿌리개','소파 쿠션','체중계']),label
   # A kitchen saved by v427 keeps each placed item and offers the second place setting next.
   page.evaluate("""ids => localStorage.setItem('jaemin-kitchen-stickers-v1', JSON.stringify({
     version:1,sound:false,hints:true,progress:{items:{placed:ids,cursor:ids.length}}
   }))""",V427_KITCHEN_ITEMS)
   page.reload()
   page.evaluate("pushScreen('stickerKitchen_items','주방');render()")
   page.wait_for_selector('.sb-card:not(:disabled)')
   assert page.locator('.sb-card').get_attribute('data-piece')=='bowl-right'
   for piece in V427_KITCHEN_ITEMS:
    assert page.locator(f'[data-placed="{piece}"]').is_visible(),piece
   # v406 completed chapters remain valid; appended appliances/tools continue next.
   page.evaluate("""localStorage.setItem('jaemin-kitchen-stickers-v1',JSON.stringify({version:1,sound:false,hints:true,progress:{
     fixtures:{cursor:6,placed:['fridge','sink','hob','table','chair','cooker']},
     items:{cursor:6,placed:['plate','glass','spoon','bowl','banana','milk']}
   }}))""")
   page.reload()
   for chapter,next_piece in [('fixtures','microwave'),('items','paddle')]:
    page.evaluate(f"pushScreen('stickerKitchen_{chapter}','주방');render()")
    page.wait_for_selector('.sb-card:not(:disabled)')
    assert page.locator('.sb-card').get_attribute('data-piece')==next_piece
   assert not page.locator('#storageNotice').is_visible()
   for w,h in [(1024,768),(768,1024),(820,1180),(1366,1024),(390,844)]:
    page.set_viewport_size({'width':w,'height':h});page.wait_for_timeout(350)
    page.wait_for_selector('.sb-card:not(:disabled)')
    for sel in ['.sb-card','.sb-stage','.sb-footer']:
     r=page.locator(sel).bounding_box();assert r['x']>=0 and r['y']>=0 and r['x']+r['width']<=w+1 and r['y']+r['height']<=h+1,(w,h,sel,r)
   assert not errors,errors
   browser.close()
   print('PASS: all 67 room stickers, both table settings, iPad photo sizes, v427 resume, cooking replacement, per-room resets and five screen sizes')
 finally:server.shutdown()

if __name__=='__main__':main()
