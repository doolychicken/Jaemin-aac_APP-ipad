"""Build source-sheet clips and placement coordinates; never alter generated artwork."""
from pathlib import Path
import json,sys
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'_local/print-tools'))
from PIL import Image
from bathroom_art import BATHROOM_ITEMS_IMAGE, BATHROOM_VANITY_BOXES, bathroom_photo
from food import extend_storage, place

def piece(id,label,file,box,target,fit=False,folder='storage_dress'):
 im=Image.open(ROOT/f'images/{folder}/{file}.png')
 a=im.getchannel('A').point(lambda v:255 if v>150 else 0)
 l,t,r,b=box; bounds=a.crop(box).getbbox();assert bounds,(file,id)
 x0,y0,x1,y1=bounds;x0=max(0,x0-2);y0=max(0,y0-2);x1=min(r-l,x1+2);y1=min(b-t,y1+2)
 w,h=x1-x0,y1-y0
 x,y,size,axis=target
 if isinstance(axis,(float,int)):tw,th=size,axis
 elif axis=='w':tw,th=size,size*h/w
 else:tw,th=size*w/h,size
 assert x>=0 and y>=0 and x+tw<=1536 and y+th<=1024,(id,x,y,tw,th)
 p=dict(id=id,label=label,image=f'./images/{folder}/{file}.png',sheet=list(im.size),crop=[l+x0,t+y0,w,h],target=[x/1536,y/1024,tw/1536,th/1024])
 if fit:p['fit']=True
 return p

storage=[
 ('milk','우유',(450,95,170,'h')),('water','물',(760,80,185,'h')),
 ('apple','사과',(440,315,170,'w')),('eggs','달걀',(700,325,195,'w')),
 ('yogurt','요거트',(470,520,110,'h')),('cheese','치즈',(720,550,165,'w')),
 ('carrot','당근',(475,665,145,'w')),('juice','주스',(1110,285,200,'h')),
 ('shirt','윗도리',(370,425,150,'w')),('pants','바지',(585,420,145,'h')),
 ('pajamas','잠옷',(860,280,145,'h')),('socks','양말',(1075,320,105,'h')),
 ('cap','모자',(875,125,145,'w')),('bag','가방',(960,620,210,'h')),
 ('shoes','신발',(440,720,115,'h')),('towel','수건',(880,490,115,'h'))]
bands=[(0,340),(340,644),(644,928),(928,1254)]
columns=[(0,312),(312,645),(645,940),(940,1254)]
items=[]
for i,(id,label,target) in enumerate(storage):
 l,r=columns[i%4];t,b=bands[i//4]
 items.append(piece(id,label,'storage-items',(l,t,r,b),target))
with Image.open(ROOT/'images/storage_dress/cheese-slices.png') as cheese_im:
 items[5]=piece('cheese','치즈','cheese-slices',(0,0,*cheese_im.size),storage[5][2])

extra_boxes=[(10,100,350,400),(350,85,725,370),(725,20,1086,430),
             (15,450,350,735),(355,480,725,725),(730,490,1086,730),
             (5,790,365,1070),(370,785,725,1070),(730,800,1086,1075),
             (10,1130,360,1385),(370,1130,725,1385),(725,1160,1086,1360)]
extra_defs=[('underwear','팬티',(1070,500,110,'w')),('hanger','옷걸이',(360,125,140,'w')),
            ('coat','외투',(520,125,240,'w')),('gloves','장갑',(1075,150,90,'h')),
            ('scarf','목도리',(350,620,150,'w')),('belt','허리띠',(600,635,110,'w'))]
wardrobe_items=items[8:]+[piece(id,label,'wardrobe-extras',extra_boxes[i],target) for i,(id,label,target) in enumerate(extra_defs)]
def place_on_surface(item,left,bottom,size,axis='h'):
 w,h=item['crop'][2:]
 width,height=(size,size*h/w) if axis=='w' else (size*w/h,size)
 assert 0<=left and left+width<=1536 and 0<=bottom-height<=bottom<=1024,item['id']
 item['target']=[left/1536,(bottom-height)/1024,width/1536,height/1024]

folded_shirt=dict(wardrobe_items[0],id='folded-shirt',label='접은 윗도리')
wardrobe_items[1]['label']='접은 바지'
wardrobe_items[5]['label']='배낭'
wardrobe_items[6]['label']='운동화'
new_wardrobe_labels=[
 ('shirt','반팔 티셔츠'),('long-sleeve','긴팔 티셔츠'),('button-shirt','남방'),
 ('hanging-pants','옷걸이에 건 바지'),('crossbody','크로스백'),('tote','토트백'),
 ('dress-shoes','구두'),('sandals','샌들'),('wristwatch','손목시계')
]
with Image.open(ROOT/'images/storage_dress/wardrobe-arranged-items.png') as sheet:
 width,height=sheet.size
new_wardrobe=[]
for i,(pid,label) in enumerate(new_wardrobe_labels):
 col,row=i%3,i//3
 box=(col*width//3,row*height//3,(col+1)*width//3,(row+1)*height//3)
 new_wardrobe.append(piece(pid,label,'wardrobe-arranged-items',box,(0,0,100,'w')))
wardrobe_items=[new_wardrobe[0],*wardrobe_items[1:],*new_wardrobe[1:],folded_shirt]

adult_sheets={
 'dad-wardrobe-clothes':[
  ('hanger','나무 옷걸이'),('long-sleeve','니트'),('button-shirt','흰 와이셔츠'),
  ('suit-jacket','양복 재킷'),('hanging-pants','양복 바지'),('coat','코트'),
  None,None,('pajamas','체크 잠옷'),
 ],
 'dad-wardrobe-accessories':[
  ('tie','넥타이'),('belt','가죽 허리띠'),('wristwatch','금속 손목시계'),
  ('cap','회색 모자'),('gloves','가죽 장갑'),('scarf','울 목도리'),
  ('socks','정장 양말'),('underwear','사각팬티'),None,
 ],
 'dad-wardrobe-bags-shoes':[
  ('bag','서류 가방'),('navy-backpack','노트북 백팩'),('crossbody','어깨 가방'),
  ('tote','업무용 토트백'),('towel','손수건'),('shoes','검은 구두'),
  ('dress-shoes','갈색 로퍼'),('white-sneakers','흰 운동화'),('sandals','실내 슬리퍼'),
 ],
}
wardrobe_by_id={}
for asset,entries in adult_sheets.items():
 with Image.open(ROOT/f'images/storage_dress/{asset}.png') as sheet:
  width,height=sheet.size
 rows=(0,415,890,height) if asset=='dad-wardrobe-clothes' else (0,height//3,2*height//3,height)
 for index,entry in enumerate(entries):
  if entry is None: continue
  pid,label=entry
  col,row=index%3,index//3
  left=405 if pid=='underwear' else col*width//3
  box=(left,rows[row],(col+1)*width//3,rows[row+1])
  wardrobe_by_id[pid]=piece(pid,label,asset,box,(0,0,100,'w'))
shirt_sheet='dad-wardrobe-hanging-shirts'
with Image.open(ROOT/f'images/storage_dress/{shirt_sheet}.png') as sheet:
 width,height=sheet.size
# Keep the saved IDs for the two shirts now shown on hangers.
for index,(pid,label) in enumerate([('shirt','폴로 셔츠'),('folded-shirt','하늘색 와이셔츠')]):
 wardrobe_by_id[pid]=piece(pid,label,shirt_sheet,(index*width//2,0,(index+1)*width//2,height),(0,0,100,'w'))
adult_ids=[item['id'] for item in wardrobe_items if item['id']!='pants']+['navy-backpack','white-sneakers','suit-jacket','tie']
adult_items=[wardrobe_by_id[pid] for pid in adult_ids]
with Image.open(ROOT/'images/storage_dress/dad-wardrobe-shorts.png') as sheet:
 shorts=piece('shorts','반바지','dad-wardrobe-shorts',(0,0,*sheet.size),(0,0,100,'w'))
wardrobe_by_id['shorts']=shorts
adult_items.append(shorts)

# Slot centers and baselines follow the photographic shelves and preserve saved ID order.
wardrobe_layout=[
 ('rail','옷걸이 칸',(55,104,1040,562),(575,79),[
  ('shirt',163,0,184,250,114),('button-shirt',358,0,185,277,114),
  ('suit-jacket',557,0,186,290,114),('hanging-pants',749,0,132,340,114),
  ('coat',952,0,185,325,114),('folded-shirt',160,0,179,197,469),
  ('long-sleeve',366,0,179,197,469),('shorts',576,0,184,181,469),('hanger',777,0,110,105,469)]),
 ('bags','가방 칸',(57,687,1038,143),(575,682),[
  ('bag',179,826,165,137),('navy-backpack',414,826,164,129),
  ('crossbody',680,826,177,132),('tote',938,826,163,130)]),
 ('shoes','신발 칸',(57,850,1038,92),(563,849),[
  ('shoes',177,936,143,82),('dress-shoes',414,936,145,82),
  ('white-sneakers',680,936,148,82),('sandals',938,936,145,82)]),
 ('tie-watch','넥타이·시계·손수건 칸',(1126,79,363,155),(1307,80),[
  ('tie',1180,230,105,128),('wristwatch',1306,230,105,114),('towel',1428,230,104,83)]),
 ('hat-belt','모자·허리띠 칸',(1126,249,363,153),(1307,264),[
  ('cap',1212,396,150,110),('belt',1398,396,143,103)]),
 ('scarf-gloves','목도리·장갑 칸',(1126,417,363,154),(1307,430),[
  ('scarf',1212,562,151,139),('gloves',1398,562,133,116)]),
 ('underwear','양말·속옷 칸',(1126,589,363,146),(1307,600),[
  ('socks',1212,728,126,106),('underwear',1398,728,144,107)]),
 ('folded','잠옷 칸',(1126,752,363,188),(1307,774),[
  ('pajamas',1307,933,173,136)]),
]
# Keep the existing IDs and order for stickers that can already be saved.
kids_sheet='kids-wardrobe-items'
with Image.open(ROOT/f'images/storage_dress/{kids_sheet}.png') as sheet:
 kids_width,kids_height=sheet.size
kids_replacements={}
for index,(pid,label) in enumerate([
 ('shirt','공룡 반팔 티셔츠'),('long-sleeve','줄무늬 긴팔 티셔츠'),('bag','학교 가방'),
 ('shoes','찍찍이 운동화'),('coat','어린이 비옷'),('pajamas','별무늬 잠옷'),
]):
 col,row=index%3,index//3
 box=(col*kids_width//3,row*kids_height//2,(col+1)*kids_width//3,(row+1)*kids_height//2)
 kids_replacements[pid]=piece(pid,label,kids_sheet,box,(0,0,100,'w'))
adult_variants={'crossbody','tote','dress-shoes'}
kids_additions='kids-wardrobe-jacket-vest-scarf'
with Image.open(ROOT/f'images/storage_dress/{kids_additions}.png') as sheet:
 width,height=sheet.size
for index,(pid,label) in enumerate([('jacket','점퍼'),('vest','조끼'),('scarf','목도리')]):
 box=(index*width//3,0,(index+1)*width//3,height)
 kids_replacements[pid]=piece(pid,label,kids_additions,box,(0,0,100,'w'))
kids_items=[kids_replacements.get(item['id'],dict(item)) for item in wardrobe_items
            if item['id'] not in adult_variants and item['id']!='towel']
kids_items.extend(kids_replacements[pid] for pid in ('jacket','vest'))
seasonal_sheet='kids-wardrobe-winter-shorts'
with Image.open(ROOT/f'images/storage_dress/{seasonal_sheet}.png') as sheet:
 width,height=sheet.size
for index,(pid,label) in enumerate([('winter-coat','겨울 외투'),('shorts','반바지')]):
 box=(index*width//2,0,(index+1)*width//2,height)
 kids_items.append(piece(pid,label,seasonal_sheet,box,(0,0,100,'w')))
kids_by_id={item['id']:item for item in kids_items}
kids_by_id['scarf']['rotate']=90

def place_in_wardrobe(item,zone,label,cx,bottom,maxw,maxh,top=145):
 updated=place(item,cx,bottom or top+maxh,maxw,maxh)
 if not bottom: updated['target'][1]=top/1024
 item.update(updated,storageZone=zone,positionCue=label)

def wardrobe_shelves(layout,items_by_id):
 zones=[]
 for zone,label,(left,top,w,h),(x,y),slots in layout:
  zones.append(dict(id=zone,label=label,target=[x/1536,y/1024],
   bounds=[left/1536,top/1024,w/1536,h/1024]))
  for pid,*slot in slots:
   place_in_wardrobe(items_by_id[pid],zone,label,*slot)
 return zones

wardrobe_zones=wardrobe_shelves(wardrobe_layout,wardrobe_by_id)
kids_layout=[
 ('rail','옷걸이 칸',(55,119,1070,597),(590,97),[
  ('shirt',169,0,228,268),('long-sleeve',402,0,230,262),('button-shirt',637,0,226,270),
  ('hanging-pants',821,0,132,356),('coat',1003,0,228,275),
  ('jacket',178,0,224,222,490),('vest',389,0,169,222,490),
  ('shorts',590,0,170,170,490),('winter-coat',811,0,205,222,490),
  ('hanger',1021,0,102,96,490)]),
 ('bags','가방 칸',(57,735,313,205),(210,723),[('bag',210,933,155,182)]),
 ('folded','접은 옷 칸',(370,735,755,205),(740,723),[
  ('folded-shirt',500,933,169,152),('pants',740,933,154,143),('pajamas',980,933,171,151)]),
 ('hats','모자 칸',(1156,79,333,155),(1322,83),[('cap',1322,230,158,124)]),
 ('belt-watch','허리띠·시계 칸',(1156,249,333,153),(1322,258),[
  ('belt',1248,396,125,103),('wristwatch',1408,396,112,119)]),
 ('scarf-gloves','목도리·장갑 칸',(1156,417,333,154),(1322,430),[
  ('scarf',1255,566,176,112),('gloves',1418,562,125,106)]),
 ('underwear','양말·속옷 칸',(1156,589,333,146),(1322,600),[
  ('socks',1240,728,107,102),('underwear',1412,728,125,101)]),
 ('shoes','신발 칸',(1156,752,333,188),(1322,774),[
  ('shoes',1240,933,106,109),('sandals',1412,933,122,102)]),
]
kids_zones=wardrobe_shelves(kids_layout,kids_by_id)

vanity_defs=[
 ('vanity-dryer','드라이기',210,487,128,'w'),
 ('vanity-comb','머리빗',370,495,125,'w'),
 ('vanity-toner','스킨',528,462,160,'h'),
 ('vanity-lotion','얼굴 로션',670,474,137,'h'),
 ('vanity-body-lotion','바디로션',810,473,179,'h'),
 ('vanity-lipstick','립스틱',965,491,102,'h'),
]
vanity_items=[]
vanity_boxes=[(0,0,512,495),(512,0,1024,488),(1024,0,1536,496),
              (0,505,512,1024),(512,488,1024,1024),(1024,505,1536,1024)]
vanity_bathroom_photos={'vanity-dryer':'dryer','vanity-body-lotion':'lotion'}
with Image.open(ROOT/BATHROOM_ITEMS_IMAGE) as bathroom_sheet:
 bathroom_art={
  pid: bathroom_photo(bathroom_sheet,BATHROOM_ITEMS_IMAGE,BATHROOM_VANITY_BOXES[source])
  for pid,source in vanity_bathroom_photos.items()
 }
for i,(pid,label,x,bottom,size,axis) in enumerate(vanity_defs):
 if pid in bathroom_art:
  item=dict(id=pid,label=label,**bathroom_art[pid])
 else:
  item=piece(pid,label,'vanity-items',vanity_boxes[i],(0,0,size,axis))
 place_on_surface(item,x,bottom,size,axis)
 vanity_items.append(item)
clock=piece('vanity-clock','탁상시계','bedroom-stickers-v2',(760,850,1086,1065),(0,0,130,'w'),folder='home_books')
place_on_surface(clock,1115,478,130,'w')
vanity_items.append(clock)
linen=[]
for index,(id,label,x,width,bottom) in enumerate([
 ('winter','두꺼운 이불',395,285,320),('summer','얇은 이불',850,290,320),
 ('blanket','담요',380,310,575),('pillow','하얀 베개',850,300,575),
 ('bluepillow','파란 베개',385,300,835),('bolster','긴 베개',850,300,835)]):
 p=piece(id,label,'wardrobe-extras',extra_boxes[index+6],(x,0,width,'w'))
 p['target'][1]=bottom/1024-p['target'][3]
 assert p['target'][1]>=0
 linen.append(p)

dress_defs=[
 ('pants','바지',(625,472,258,405)),('shirt','윗도리',(582,231,340,257)),
 ('socks','양말',(620,820,278,140)),('shoes','신발',(610,865,290,115)),
 ('glasses','안경',(688,113,140,48)),('cap','모자',(648,17,205,104)),
 ('watch','시계',(580,505,42,47)),('bag','가방',(655,255,195,340)),
 ('bracelet','팔찌',(894,514,35,30))]
dress=[]
im=Image.open(ROOT/'images/storage_dress/dress-items.png')
for i,(id,label,target) in enumerate(dress_defs):
 col=i%3;row=i//3;w,h=im.size
 bands=[(0,.38),(.385,.638),(.64,1)]
 top,bottom=bands[row]
 box=(round(col*w/3),round(top*h),round((col+1)*w/3),round(bottom*h))
 dress.append(piece(id,label,'dress-items',box,target,True))
 if id in ['socks','shoes']:
  # Preserve the gap between the boy's feet instead of stretching a close-set pair.
  l,t,r,b=box;middle=round((l+r)/2)
  parts=[]
  for index,region in enumerate([(l,t,middle,b),(middle,t,r,b)]):
   clipped=piece(id,label,'dress-items',region,target,True)
   parts.append(dict(crop=clipped['crop'],box=[0 if index==0 else .68,0,.32,1]))
  dress[-1]['parts']=parts

def book(id,label,title,chapterTitle,pieces,room,**extra):
 path=f'./images/storage_dress/{room}.png'
 return dict(id=id,label=label,title=title,heading=title,nav='sticker'+id.title(),storageKey=f'jaemin-{id}-stickers-v1',
  width=1536,height=1024,room=path,empty=path,chapters=[dict(id='items',title=chapterTitle,subtitle='하나씩 끌어서 알맞은 자리에 놓아요',pieces=pieces)],**extra)
books=[book('fridge','냉장고','냉장고 채우기','냉장고 전체 채우기',items[:8],'fridge-wide',hidden=True,returnNav='stickerKitchen',returnLabel='주방 스티커북'),
 book('vanity','화장대','화장대 정리하기','화장대에 올려요',vanity_items,'vanity-ivory',hidden=True,returnNav='stickerBedroom',returnLabel='침실 스티커북'),
 book('wardrobe','어른 옷장','아빠 옷장 정리하기','아빠 옷장에 넣어요',adult_items,'dad-wardrobe-room-v4',sharedStorage=wardrobe_zones,retiredPieces={'items':['pants']},hidden=True,returnNav='stickerBedroom',returnLabel='침실 스티커북'),
 book('kidswardrobe','어린이 옷장','어린이 옷장 정리하기','어린이 옷장에 넣어요',kids_items,'kids-wardrobe-room-v4',sharedStorage=kids_zones,retiredPieces={'items':['towel']},hidden=True,returnNav='stickerBedroom',returnLabel='침실 스티커북'),
 book('linen','이불장','이불장 정리하기','이불과 베개를 넣어요',linen,'linen',hidden=True,returnNav='stickerBedroom',returnLabel='침실 스티커북'),
 book('dress','옷입히기','옷입히기','재민이 옷입히기',dress,'dress-base-refined',description='옷 · 양말 · 신발 · 소품',completeMessage='외출 준비를 마쳤어요!')]
extend_storage(books)
source='/* Generated by scripts/build-storage-dress-catalog.py */\nwindow.STICKER_BOOKS.push(...'+json.dumps(books,ensure_ascii=False,indent=2)+');\n'
activities={
 'kitchen':[dict(label='냉장고 채우기',description='음료와 음식, 과일과 채소를 넣어요',nav='stickerFridge',target=[.85,.40]),
            dict(label='식판 차리기',description='밥과 반찬, 간식을 차려요',nav='stickerTray')],
 'bedroom':[dict(label='화장대 정리하기',description='드라이기와 화장품 일곱 가지를 올려요',nav='stickerVanity_items',target=[.634,.52]),
            dict(label='어린이 옷장',description='학교 가방, 찍찍이 운동화, 어린이 옷을 정리해요',nav='stickerKidswardrobe_items',target=[.88,.42]),
            dict(label='어른 옷장',description='아빠의 양복, 넥타이, 출근 가방을 정리해요',nav='stickerWardrobe_items',target=[.88,.57]),
            dict(label='이불장 정리하기',description='넓은 칸에 이불과 베개를 넣어요',nav='stickerLinen_items',target=[.72,.86]),
            dict(label='옷입히기',description='재민이와 외출 준비를 해요',nav='stickerDress')]
}
source+='const storageActivities = '+json.dumps(activities,ensure_ascii=False)+';\nwindow.STICKER_BOOKS.forEach(book => { if (storageActivities[book.id]) book.activities = storageActivities[book.id]; });\n'
(ROOT/'js/data/storage-dress-data.js').write_text(source,encoding='utf-8')
print('Built refrigerator, wardrobe, linen, dress-up and meal tray catalogs.')
