"""Read alpha bounds only; source art stays unchanged and SVG clips each sticker."""
from pathlib import Path
import sys, json
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '_local/print-tools'))
from PIL import Image

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
 assert image.mode=='RGBA' and image.size==(1536,1024)
 l,t,r,b=region
 bounds=image.getchannel('A').crop(region).point(lambda v:255 if v>100 else 0).getbbox()
 assert bounds, pid
 a,c,d,e=bounds
 left=max(l,l+a-2);top=max(t,t+c-2);right=min(r,l+d+2);bottom=min(b,t+e+2)
 w,h=right-left,bottom-top
 tw,th=(size,size*h/w) if axis=='w' else (size*w/h,size)
 assert x>=0 and y>=0 and x+tw<=1536 and y+th<=1024, pid
 return dict(id=pid,label=label,image=f'./images/home_books/{asset}.png',sheet=[1536,1024],crop=[left,top,w,h],target=[x/1536,y/1024,tw/1536,th/1024])

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
 items['pieces'].append(kitchen_piece('paddle','밥주걱',tools,tool_regions[1],1375,418,45))
 cooking=[]
 for pid,label,region,x,width in [('pot','냄비',tool_regions[3],1008,140),('kettle','주전자',tool_regions[4],1022,112),('pan','프라이팬',tool_regions[5],1008,185)]:
  p=kitchen_piece(pid,label,tools,region,x,0,width)
  p['target'][1]=365/1024-p['target'][3]
  cooking.append(p)
 book['room']=book['empty']='./images/home_books/kitchen-room-v2.png'
 fixtures['title']='가구와 가전 놓기'
 book['description']='가구와 가전 · 생활용품 · 조리도구'
 book['chapters'].append(dict(id='cooking',title='조리도구 올려놓기',subtitle='가스레인지에 하나씩 올려놓아요',single=True,pieces=cooking))

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
 if id=='kitchen':update_kitchen(books[-1])
source='/* Generated by scripts/build-home-sticker-catalog.py */\nwindow.STICKER_BOOKS = [Object.assign(window.STICKER_BOOK, {id: "bathroom", label: "화장실", nav: "stickerBathroom"}), ...'+json.dumps(books,ensure_ascii=False,indent=2)+'];\n'
(ROOT/'js/data/home-sticker-data.js').write_text(source,encoding='utf-8')
print('Built three room catalogs, 42 stickers; source images unchanged.')
