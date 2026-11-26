"""Build source-sheet clips and placement coordinates; never alter generated artwork."""
from pathlib import Path
import json,sys
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'_local/print-tools'))
from PIL import Image
from food import extend_storage

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

# Align hanging clothes to the rail and rest folded pieces on the new shelves.
wardrobe_positions={
 'shirt':(326,388,230,'h'), 'pants':(542,649,95,'h'),
 'pajamas':(975,283,130,'h'), 'socks':(982,472,88,'h'),
 'cap':(1132,283,115,'w'), 'bag':(1030,803,130,'h'),
 'shoes':(344,903,115,'h'), 'towel':(685,774,100,'h'),
 'underwear':(1130,472,112,'w'), 'hanger':(553,242,131,'w'),
 'coat':(645,440,285,'h'), 'gloves':(997,649,92,'h'),
 'scarf':(323,647,150,'w'), 'belt':(495,775,141,'w'),
}
for item in wardrobe_items:
 place_on_surface(item,*wardrobe_positions[item['id']])

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
for i,(pid,label,x,bottom,size,axis) in enumerate(vanity_defs):
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
 book('wardrobe','옷장','옷장 정리하기','옷장에 넣어요',wardrobe_items,'wardrobe-ivory',hidden=True,returnNav='stickerBedroom',returnLabel='침실 스티커북'),
 book('linen','이불장','이불장 정리하기','이불과 베개를 넣어요',linen,'linen',hidden=True,returnNav='stickerBedroom',returnLabel='침실 스티커북'),
 book('dress','옷입히기','옷입히기','재민이 옷입히기',dress,'dress-base-refined',description='옷 · 양말 · 신발 · 소품',completeMessage='외출 준비를 마쳤어요!')]
extend_storage(books)
source='/* Generated by scripts/build-storage-dress-catalog.py */\nwindow.STICKER_BOOKS.push(...'+json.dumps(books,ensure_ascii=False,indent=2)+');\n'
activities={
 'kitchen':[dict(label='냉장고 채우기',description='음료와 음식, 과일과 채소를 넣어요',nav='stickerFridge',target=[.85,.40]),
            dict(label='식판 차리기',description='밥과 반찬, 간식을 차려요',nav='stickerTray')],
 'bedroom':[dict(label='화장대 정리하기',description='드라이기와 화장품 일곱 가지를 올려요',nav='stickerVanity_items',target=[.634,.52]),
            dict(label='옷장 정리하기',description='옷과 소품 14개를 정리해요',nav='stickerWardrobe_items',target=[.90,.48]),
            dict(label='이불장 정리하기',description='넓은 칸에 이불과 베개를 넣어요',nav='stickerLinen_items',target=[.72,.86]),
            dict(label='옷입히기',description='재민이와 외출 준비를 해요',nav='stickerDress')]
}
source+='const storageActivities = '+json.dumps(activities,ensure_ascii=False)+';\nwindow.STICKER_BOOKS.forEach(book => { if (storageActivities[book.id]) book.activities = storageActivities[book.id]; });\n'
(ROOT/'js/data/storage-dress-data.js').write_text(source,encoding='utf-8')
print('Built refrigerator, wardrobe, linen, dress-up and meal tray catalogs.')
