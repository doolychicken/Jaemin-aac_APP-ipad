"""Read alpha bounds only; source art stays unchanged and SVG clips each sticker."""
from pathlib import Path
import sys, json
from copy import deepcopy
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / '_local/print-tools'))
from PIL import Image
from food import extend_kitchen

# id, label, x, y, size, dimension (in the 1536 x 1024 room)
ROOMS = {
 'kitchen': ('주방', 'stickerKitchen', [
  ('fridge','냉장고',150,165,520,'h'), ('sink','싱크대',700,260,220,'w'),
  ('hob','인덕션',1030,408,210,'w'), ('table','식탁',320,675,650,'w'),
  ('chair','의자',1040,680,300,'h'), ('cooker','밥솥',1270,298,145,'h'),
  ('plate','접시',470,676,140,'w'), ('glass','물컵',745,625,90,'h'),
  ('spoon','숟가락',825,655,90,'h'), ('bowl','밥그릇',650,672,95,'w'),
  ('banana','바나나',920,360,105,'w'), ('milk','우유',550,295,145,'h')]),
 'living': ('거실', 'stickerLiving', [
  ('sofa','소파',310,480,590,'w'), ('console','텔레비전 받침대',920,640,360,'w'),
  ('tv','텔레비전',932,433,335,'w'), ('table','거실 탁자',390,800,560,'w'),
  ('shelf','책장',1290,410,400,'h'), ('clock','벽시계',620,220,110,'w'),
  ('cushion','쿠션',420,535,105,'w'), ('book','책',1330,440,65,'h'),
  ('remote','리모컨',840,805,65,'h'), ('car','장난감 자동차',495,807,120,'w'),
  ('plant','화분',150,600,190,'h'), ('basket','정리 바구니',1040,835,180,'w')]),
 'bedroom': ('침실', 'stickerBedroom', [
  ('bed','침대',350,520,640,'w'), ('wardrobe','옷장',1180,215,480,'h'),
  ('nightstand','침대 옆 탁자',960,580,180,'w'), ('dresser','서랍장',90,500,240,'w'),
  ('lamp','스탠드',975,400,180,'h'), ('alarm','알람 시계',200,420,80,'h'),
  ('pillow','베개',660,615,170,'w'), ('blanket','이불',495,700,190,'w'),
  ('slippers','슬리퍼',955,865,150,'w'), ('pajamas','잠옷',125,450,95,'w'),
  ('teddy','곰 인형',795,680,150,'h'), ('book','그림책',1040,560,70,'w')])
}
books=[]

def kitchen_piece(pid, label, asset, region, x, y, size, axis='w'):
 image=Image.open(ROOT/f'images/home_books/{asset}.png')
 assert image.mode=='RGBA'
 l,t,r,b=region
 bounds=image.getchannel('A').crop(region).point(lambda v:255 if v>100 else 0).getbbox()
 assert bounds, pid
 a,c,d,e=bounds
 left=max(l,l+a-2);top=max(t,t+c-2);right=min(r,l+d+2);bottom=min(b,t+e+2)
 w,h=right-left,bottom-top
 tw,th=(size,size*h/w) if axis=='w' else (size*w/h,size)
 assert x>=0 and y>=0 and x+tw<=1536 and y+th<=1024, pid
 return dict(id=pid,label=label,image=f'./images/home_books/{asset}.png',sheet=list(image.size),crop=[left,top,w,h],target=[x/1536,y/1024,tw/1536,th/1024])

def update_kitchen(book):
 fixtures,items=book['chapters']
 appliances='kitchen-appliances-v2'
 replacements={
  'fridge':kitchen_piece('fridge','냉장고',appliances,(70,15,440,670),140,165,520,'h'),
  'hob':kitchen_piece('hob','가스레인지',appliances,(25,680,730,1005),1000,328,290),
  'cooker':kitchen_piece('cooker','밥솥',appliances,(755,595,1130,1024),1300,295,145,'h')
 }
 for index,piece in enumerate(fixtures['pieces']):
  if piece['id'] in replacements: fixtures['pieces'][index]=replacements[piece['id']]
  elif piece['id']=='sink':
   ratio=piece['crop'][3]/piece['crop'][2]
   piece['target']=[810/1536,325/1024,170/1536,170*ratio/1024]
 fixtures['pieces'].extend([
  kitchen_piece('microwave','전자레인지',appliances,(500,175,1130,565),450,305,220),
  kitchen_piece('purifier','정수기',appliances,(1190,25,1460,580),690,195,245,'h')
 ])
 tools='kitchen-tools-v2'
 tool_regions=[(110,45,400,485),(520,45,965,490),(1040,105,1480,480),
               (0,540,535,950),(535,490,975,950),(995,550,1536,950)]
 for index,piece in enumerate(items['pieces']):
  if piece['id']=='glass':items['pieces'][index]=kitchen_piece('glass','물컵',tools,tool_regions[0],720,355,65,'h')
  elif piece['id']=='bowl':items['pieces'][index]=kitchen_piece('bowl','밥그릇',tools,tool_regions[2],1288,415,70)
  elif piece['id']=='banana':piece['target']=[660/1536,675/1024,*piece['target'][2:]]
  elif piece['id']=='milk':piece['target']=[870/1536,565/1024,*piece['target'][2:]]
 # Standing yellow model: retain the saved ID and the previous maximum size.
 paddle_image=Image.open(ROOT/'images/home_books/kitchen-paddle-yellow.png')
 items['pieces'].append(kitchen_piece('paddle','밥주걱','kitchen-paddle-yellow',
                                    (0,0,*paddle_image.size),1375,418,45,'h'))
 cooking=[]
 for pid,label,region,x,width in [('pot','냄비',tool_regions[3],1008,140),('kettle','주전자',tool_regions[4],1022,112),('pan','프라이팬',tool_regions[5],1008,185)]:
  p=kitchen_piece(pid,label,tools,region,x,0,width)
  p['target'][1]=365/1024-p['target'][3]
  cooking.append(p)
 book['room']=book['empty']='./images/home_books/kitchen-room-v4.png'
 fixtures['title']='가구와 가전 놓기'
 book['description']='가구와 가전 · 생활용품 · 조리도구'
 book['chapters'].append(dict(id='cooking',title='조리도구 올려놓기',subtitle='가스레인지에 하나씩 올려놓아요',single=True,pieces=cooking))
 update_kitchen_items(book)

def update_kitchen_items(book):
 fixtures,items=book['chapters'][:2]
 asset='kitchen-items-v3'
 boxes=[(20,45,360,330),(370,40,705,330),(710,30,1086,350),
        (15,390,370,700),(440,340,640,720),(720,395,1060,710),
        (125,710,245,1090),(490,710,600,1090),(845,710,935,1090),
        (85,1085,305,1430),(380,1100,710,1410),(710,1090,1086,1425)]
 def p(pid,label,index,x,y,size,axis='w'):
  return kitchen_piece(pid,label,asset,boxes[index],x,y,size,axis)
 table=kitchen_piece('table','식탁','kitchen-table-v3',(0,0,1536,1024),180,510,900)
 fixtures['pieces']=[table if item['id']=='table' else item for item in fixtures['pieces']]
 replacements={
  'plate':p('plate','접시',11,340,580,115),
  'glass':p('glass','물컵',9,720,355,65,'h'),
  'spoon':p('spoon','숟가락',6,735,550,75,'h'),
  'bowl':p('bowl','밥그릇',0,440,490,100)
 }
 replacements['plate']['fit']=True
 replacements['plate']['target'][3]=55/1024
 for i,item in enumerate(items['pieces']):
  if item['id'] in replacements:items['pieces'][i]=replacements[item['id']]
  elif item['id']=='banana':
   item['target']=[490/1536,580/1024,70/1536,70*item['crop'][3]/item['crop'][2]/1024]
  elif item['id']=='milk':item['target'][:2]=[920/1536,450/1024]
 # Append to the existing seven IDs so saved progress remains compatible.
 items['pieces'].extend([
  p('soup','국',1,320,490,100),p('side-dishes','반찬',2,600,530,125),
  p('sponge','수세미',3,790,430,55),p('dish-soap','주방세제',4,795,335,110,'h'),
  p('fried-egg','계란프라이',5,365,585,65),p('fork','포크',7,775,550,75,'h'),
  p('chopsticks','젓가락',8,810,550,75,'h'),p('tissue','휴지',10,885,540,80)
 ])

def arrange_kitchen(book):
 fixtures,items,cooking=book['chapters']
 byid={p['id']:p for p in fixtures['pieces']}
 # Keep existing IDs, order and physical sizes; change only positions.
 for pid,x in [('microwave',150),('hob',330),('sink',630),('blender',810),('cooker',885),('purifier',1020)]:
  p=byid[pid];p['target'][:2]=[x/1536,450/1024-p['target'][3]]
 byid['fridge']['target'][:2]=[1175/1536,165/1024]
 byid['table']['target'][:2]=[330/1536,510/1024]
 # Opposite side views face the table; retain IDs and 300px chair height.
 cw,ch=Image.open(ROOT/'images/home_books/kitchen-chairs-side.png').size
 right=kitchen_piece('chair','의자','kitchen-chairs-side',(cw//2,0,cw,ch),1240,680,300,'h')
 byid['chair'].update(right)
 left=kitchen_piece('chair-left','왼쪽 의자','kitchen-chairs-side',(0,0,cw//2,ch),130,680,300,'h')
 fixtures['pieces'].append(left)
 table_items={'plate','spoon','bowl','banana','milk','soup','side-dishes','fried-egg','fork','chopsticks','tissue','mug'}
 positions={'glass':(1040,410),'paddle':(1020,440),'sponge':(650,405),'dish-soap':(610,305),'rubber-gloves':(750,420)}
 for p in items['pieces']:
  if p['id'] in table_items:p['target'][0]+=150/1536
  elif p['id'] in positions:
   x,y=positions[p['id']];p['target'][:2]=[x/1536,y/1024]
 for p in cooking['pieces']:
  p['target'][0]-=670/1536;p['target'][1]-=2/1024
 for chapter in book['chapters']:
  for p in chapter['pieces']:
   x,y,w,h=p['target'];assert x>=0 and y>=0 and x+w<=1 and y+h<=1,p['id']

def update_living(book):
 # Source regions are measured against the restored collage, not a presumed grid.
 asset='living-stickers-v2'
 rows=[
  ('sofa','소파',(5,100,380,295),300,470,520,'w'),
  ('console','거실장',(380,120,735,295),865,590,400,'w'),
  ('tv','텔레비전',(735,65,1086,305),890,0,350,'w'),
  ('table','거실 탁자',(5,455,385,680),370,750,530,'w'),
  ('aircon','에어컨',(460,330,630,793),1320,250,490,'h'),
  ('clock','벽시계',(735,800,1086,1120),500,225,120,'w'),
  ('fan','선풍기',(750,330,1060,785),65,500,265,'h'),
  ('purifier','공기청정기',(85,780,320,1125),220,650,160,'h'),
  ('vacuum','청소기',(465,793,625,1118),1160,620,290,'h'),
  ('slippers','슬리퍼',(15,1160,385,1425),305,713,115,'w'),
  ('remote','텔레비전 리모컨',(465,1118,620,1448),510,760,105,'h'),
  ('acremote','에어컨 리모컨',(800,1120,990,1448),715,760,95,'h')
 ]
 pieces=[kitchen_piece(pid,label,asset,region,x,y,size,axis) for pid,label,region,x,y,size,axis in rows]
 # TV feet rest on the console; remote controls lie horizontally on the table.
 pieces[2]['target'][1]=590/1024-pieces[2]['target'][3]
 for piece in pieces[-2:]:
  piece['rotate']=90
  x,y,w,h=piece['target'];piece['target']=[x,y,h*1024/1536,w*1536/1024]
 book['storageKey']='jaemin-living-stickers-v2'
 book['description']='사진 속 가구와 가전 · 리모컨 · 슬리퍼'
 book['chapters']=[dict(id='fixtures',title='가구와 가전 놓기',subtitle='큰 물건부터 하나씩 놓아요',pieces=pieces[:9]),
                   dict(id='items',title='생활용품 놓기',subtitle='슬리퍼와 리모컨을 알맞은 자리에 놓아요',pieces=pieces[9:])]

def update_bedroom(book):
 asset='bedroom-stickers-v2'
 rows=[
  ('curtains','커튼',(0,750,390,1125),140,95,470,'w'),
  ('bed','침대',(0,40,485,380),120,450,570,'w'),
  ('nightstand','협탁',(485,105,710,365),710,595,145,'w'),
  ('dresser','화장대',(725,153,1086,385),915,510,280,'w'),
  ('mirror','거울',(0,440,390,740),915,0,280,'w'),
  ('wardrobe','장롱',(405,385,680,765),1230,250,450,'h'),
  ('chest','서랍장',(690,465,1086,750),955,790,300,'w'),
  ('pillows','베개',(380,850,760,1055),235,520,320,'w'),
  ('lamp','스탠드',(425,1090,660,1420),710,497,110,'h'),
  ('digital','전자시계',(760,850,1086,1065),790,560,60,'w'),
  ('alarm','알람 시계',(50,1125,310,1420),1070,742,60,'h'),
  ('slippers','슬리퍼',(715,1150,1086,1420),650,830,110,'w')
 ]
 pieces=[kitchen_piece(pid,label,asset,region,x,y,size,axis) for pid,label,region,x,y,size,axis in rows]
 pieces[0]['target']=[140/1536,95/1024,470/1536,480/1024]
 pieces[0]['fit']=True
 # Retain the complete curtain rod while excluding neighbouring pillow pixels.
 cx,cy,cw,ch=pieces[0]['crop'];split=40;lower_width=min(cw,370-cx)
 pieces[0]['parts']=[dict(crop=[cx,cy,cw,split],box=[0,0,1,split/ch]),
                     dict(crop=[cx,cy+split,lower_width,ch-split],box=[0,split/ch,lower_width/cw,1-split/ch])]
 pieces[4]['target'][1]=510/1024-pieces[4]['target'][3]
 # Both clocks and the lamp sit on their furniture instead of floating above it.
 pieces[9]['target'][1]=607/1024-pieces[9]['target'][3]
 book['room']=book['empty']='./images/home_books/bedroom-room-v2.png'
 book['storageKey']='jaemin-bedroom-stickers-v2'
 book['description']='창가 침대 · 협탁 · 화장대와 거울 · 장롱'
 book['chapters']=[dict(id='fixtures',title='큰 가구 붙이기',subtitle='창가부터 차례로 침실을 꾸며요',pieces=pieces[:7]),
                   dict(id='items',title='생활용품 놓기',subtitle='베개와 시계, 스탠드를 놓아요',pieces=pieces[7:])]

for id,(label,nav,rows) in ROOMS.items():
 image=Image.open(ROOT/f'images/home_books/{id}-stickers.png')
 assert image.mode=='RGBA' and image.size==(1536,1024)
 alpha=image.getchannel('A').point(lambda v:255 if v>100 else 0)
 pieces=[]
 bands={'kitchen':[(0,264),(272,510),(516,760),(768,1024)],
        'living':[(0,246),(248,508),(514,760),(762,1024)],
        'bedroom':[(0,286),(286,545),(545,766),(766,1024)]}[id]
 for index,(pid,name,x,y,size,axis) in enumerate(rows):
  col=index%3; row=index//3; left=col*512; top,bottom=bands[row]
  bounds=alpha.crop((left,top,left+512,bottom)).getbbox()
  assert bounds, (id,pid)
  a,b,c,d=bounds; a=max(0,a-2);b=max(0,b-2);c=min(512,c+2);d=min(bottom-top,d+2)
  w,h=c-a,d-b
  tw,th=(size,size*h/w) if axis=='w' else (size*w/h,size)
  assert x+tw<=1536 and y+th<=1024,(id,pid,tw,th)
  pieces.append(dict(id=pid,label=name,image=f'./images/home_books/{id}-stickers.png',sheet=[1536,1024],crop=[left+a,top+b,w,h],target=[x/1536,y/1024,tw/1536,th/1024]))
 room=f'./images/home_books/{id}-room.png'
 books.append(dict(id=id,label=label,nav=nav,storageKey=f'jaemin-{id}-stickers-v1',width=1536,height=1024,room=room,empty=room,compose=True,chapters=[
  dict(id='fixtures',title='큰 가구 붙이기',subtitle='큰 물건부터 하나씩 놓아요',pieces=pieces[:6]),
  dict(id='items',title='생활용품 놓기',subtitle='물건을 알맞은 자리에 놓아요',pieces=pieces[6:])]))
 if id=='kitchen':
  update_kitchen(books[-1])
  extend_kitchen(books[-1])
  # Append after existing items, preserving saved progress indices.
  gloves=Image.open(ROOT/'images/home_books/kitchen-rubber-gloves.png')
  books[-1]['chapters'][1]['pieces'].append(kitchen_piece(
      'rubber-gloves','고무장갑','kitchen-rubber-gloves',(0,0,*gloves.size),895,382,115,'h'))
  arrange_kitchen(books[-1])
 if id=='living':update_living(books[-1])
 if id=='bedroom':update_bedroom(books[-1])
source='/* Generated by scripts/build-home-sticker-catalog.py */\nwindow.STICKER_BOOKS = [Object.assign(window.STICKER_BOOK, {id: "bathroom", label: "화장실", nav: "stickerBathroom"}), ...'+json.dumps(books,ensure_ascii=False,indent=2)+'];\n'
(ROOT/'js/data/home-sticker-data.js').write_text(source,encoding='utf-8')
print('Built three room catalogs; source images unchanged.')
