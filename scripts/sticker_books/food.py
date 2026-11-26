"""Shared food artwork and activities. Pixel bounds only; never rewrites artwork."""
from pathlib import Path
import sys
from copy import deepcopy
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / '_local/print-tools'))
from PIL import Image

DRINKS = [('soy','두유'),('ginseng','홍삼 음료'),('cola','콜라'),('jelly','복숭아 젤리'),
          ('banana-milk','바나나 우유'),('chocolate-milk','초콜릿 우유'),('strawberry-milk','딸기 우유'),
          ('plain-milk','흰 우유'),('yogurt','딸기 요구르트'),('blender','믹서기'),('mug','머그컵'),('water','물')]
PRODUCE = [('potato','감자'),('sweet-potato','고구마'),('green-onion','대파'),('cucumber','오이'),
           ('carrot','당근'),('onion','양파'),('pear','배'),('blueberries','블루베리'),('grapes','포도'),
           ('melon','참외'),('tomato','토마토'),('watermelon','수박'),('apple','사과'),('banana','바나나'),('strawberry','딸기')]
MEALS = [('rice','밥'),('soup','국'),('sides','반찬'),('cake','딸기 케이크'),('choco-pie','초코파이'),
         ('tart','에그타르트'),('kimchi','김치'),('sprouts','콩나물'),('omelet','계란말이'),
         ('fried-egg','계란프라이'),('squid','오징어볶음'),('apple-slices','깎은 사과')]

def photo(group, index):
    defs = {'drinks': DRINKS, 'produce': PRODUCE, 'meals': MEALS}[group]
    path = f'images/sticker_food/{group}.png'
    im = Image.open(ROOT/path)
    w,h = im.size
    bands = {'drinks':[0,380,730,1060,1448], 'meals':[0,365,735,1065,1448]}.get(group)
    if bands:
        bands = [round(v*h/1448) for v in bands]
    else:
        bands = [0,331,648,947,1278,1619]
    col,row=index%3,index//3
    box=(round(col*w/3),bands[row],round((col+1)*w/3),bands[row+1])
    if group=='produce':
        columns=[0,324,662,971]
        box=(columns[col],bands[row],columns[col+1],bands[row+1])
    bounds=im.getchannel('A').crop(box).point(lambda v:255 if v>150 else 0).getbbox()
    assert bounds,(group,index)
    a,b,c,d=bounds
    return dict(id=defs[index][0],label=defs[index][1],image='./'+path,sheet=[w,h],
                crop=[box[0]+a,box[1]+b,c-a,d-b])

def place(p, cx, bottom, maxw, maxh):
    p=deepcopy(p)
    ratio=min(maxw/p['crop'][2],maxh/p['crop'][3])
    w,h=p['crop'][2]*ratio,p['crop'][3]*ratio
    p['target']=[(cx-w/2)/1536,(bottom-h)/1024,w/1536,h/1024]
    assert all(v>=0 for v in p['target']) and cx+w/2<=1536 and bottom<=1024
    return p

def chapter(id,title,pieces):
    return dict(id=id,title=title,subtitle='하나씩 끌어서 알맞은 자리에 놓아요',pieces=pieces)

def extend_storage(books):
    fridge=next(b for b in books if b['id']=='fridge')
    # Keep the original chapter and its IDs to preserve existing saved progress.
    fridge['description']='음료·음식·과일·채소를 나눠 한 냉장고에 넣어요'
    original=fridge['chapters'][0]
    upgrades={'milk':('drinks',7),'water':('drinks',11),'apple':('produce',12),
              'yogurt':('drinks',8),'carrot':('produce',4)}
    for p in original['pieces']:
        if p['id'] in upgrades:
            new=photo(*upgrades[p['id']])
            p.update(image=new['image'],sheet=new['sheet'],crop=new['crop'])
    by_id={p['id']:p for p in original['pieces']}
    drinks=[photo('drinks',i) for i in [0,1,2,3,4,5,6,7,11]]+[by_id['juice']]
    meals=[photo('meals',i) for i in range(6)]+[photo('drinks',8),by_id['eggs'],by_id['cheese']]
    vegetables=[photo('produce',i) for i in range(6)]
    fruit=[photo('produce',i) for i in range(6,15)]
    groups=[
        ('drinks','음료 넣기','음료칸',drinks,(1210,83),(950,103,523,831),
         [(x,y,136,145) for y,cols in [(253,(1030,1210,1390)),(477,(1030,1210,1390)),(691,(1115,1310)),(907,(1115,1310))] for x in cols]),
        ('meals','음식과 간식 넣기','음식·간식칸',meals,(490,418),(131,420,725,283),
         [(x,y,132,118) for y,cols in [(555,(203,346,489,632,775)),(690,(210,400,590,780))] for x in cols]),
        ('vegetables','채소 넣기','채소칸',vegetables,(490,745),(131,715,725,189),
         [(x,885,107,120) for x in (190,307,424,541,658,775)]),
        ('fruit','과일 넣기','과일칸',fruit,(490,99),(131,113,725,300),
         [(x,y,132,122) for y,cols in [(244,(203,346,489,632,775)),(405,(210,400,590,780))] for x in cols]),
    ]
    def photo_key(piece):
        return (piece['image'],tuple(piece['crop']))
    canonical={}
    fridge['sharedStorage']=[]
    for id,title,label,photos,(x,y),(left,top,w,h),slots in groups:
        assert len(photos)==len(slots),id
        pieces=[]
        for p,slot in zip(photos,slots):
            ready=place(p,*slot)
            ready['positionCue']=label
            ready['storageZone']=id
            canonical[photo_key(p)]=ready
            pieces.append(ready)
        fridge['chapters'].append(chapter(id,title,pieces))
        fridge['sharedStorage'].append(dict(id=id,label=label,target=[x/1536,y/1024],
            bounds=[left/1536,top/1024,w/1536,h/1024]))
    original['title']='냉장고 전체 채우기'
    original['pieces']=[{**canonical[photo_key(p)],'id':p['id'],'label':p['label']} for p in original['pieces']]
    used={photo_key(p) for p in original['pieces']}
    original['pieces'].extend(p for key,p in canonical.items() if key not in used)
    books.append(tray_book())

def utensil(index,label,pid,cx):
    im=Image.open(ROOT/'images/home_books/kitchen-items-v3.png')
    boxes=[(125,710,245,1090),(490,710,600,1090),(845,710,935,1090)]
    l,t,r,b=boxes[index]
    a,c,d,e=im.getchannel('A').crop((l,t,r,b)).point(lambda v:255 if v>150 else 0).getbbox()
    return place(dict(id=pid,label=label,image='./images/home_books/kitchen-items-v3.png',
                      sheet=list(im.size),crop=[l+a,t+c,d-a,e-c]),cx,850,100,300)

def tray_book():
    # Positions follow the photographed tray compartments, not a guessed grid.
    slots=[(350,795,350,260),(860,795,350,260),(280,375,220,210),
           (615,375,220,210),(950,375,220,210),(1340,335,160,200)]
    menus=[
      ('rice','밥과 국 차리기',[('meals',0),('meals',1),('meals',6),('meals',7),('meals',8),('drinks',11)]),
      ('meal','반찬 바꾸기',[('meals',0),('meals',1),('meals',9),('meals',10),('meals',7),('drinks',0)]),
      ('fruit','과일 간식 차리기',[('meals',11),('produce',13),('produce',14),('produce',7),('produce',8),('drinks',4)]),
      ('snack','맛있는 간식 차리기',[('meals',3),('meals',4),('meals',5),('drinks',8),('produce',14),('drinks',7)])]
    chapters=[]
    for id,title,foods in menus:
        pieces=[place(photo(*f),*slot) for f,slot in zip(foods,slots)]
        pieces.extend([utensil(0,'숟가락','spoon',1250),utensil(2,'젓가락','chopsticks',1340),utensil(1,'포크','fork',1430)])
        chapters.append(chapter(id,title,pieces))
    path='./images/sticker_food/tray.png'
    return dict(id='tray',label='식판',title='식판 차리기',heading='식판 차리기',nav='stickerTray',
                storageKey='jaemin-tray-stickers-v1',width=1536,height=1024,room=path,empty=path,
                description='밥 · 국 · 반찬 · 과일 · 음료 · 수저',chapters=chapters,
                completeMessage='식사 준비를 마쳤어요!')

def extend_kitchen(book):
    fixtures,items=book['chapters'][:2]
    for p in fixtures['pieces']:
        if p['id']=='microwave':
            p.update(place(p,535,440,170,140))
    fixtures['pieces'].append(place(photo('drinks',9),650,440,65,185))
    items['pieces'].append(place(photo('drinks',10),565,590,65,65))
