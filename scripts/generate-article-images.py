"""Draw original, synthetic article diagrams. Requires Pillow for local artwork generation.
The exported PNGs are committed assets; production builds do not require Python.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

DEST=Path(__file__).resolve().parents[1]/'public/blog-images'
DEST.mkdir(parents=True,exist_ok=True)
INK='#19382b'; GREEN='#416849'; LIGHT='#e9f1df'; LIME='#c9f478'; WHITE='#ffffff'; MUTED='#526c5b'
FONT=Path('/System/Library/Fonts/Supplemental/Arial.ttf')
def font(size):return ImageFont.truetype(str(FONT),size)
def canvas(title,subtitle):
 im=Image.new('RGB',(1200,675),'#f5f7f3');d=ImageDraw.Draw(im)
 d.rounded_rectangle((24,24,1176,651),radius=32,fill=WHITE,outline='#c8d8c1',width=2)
 d.text((68,58),'PAISATRACE · WORKED EXAMPLE',font=font(21),fill=GREEN)
 d.text((68,100),title,font=font(43),fill=INK)
 d.text((68,158),subtitle,font=font(25),fill=MUTED)
 return im,d
def box(d,xy,title,amount,fill=LIGHT):
 d.rounded_rectangle(xy,radius=22,fill=fill)
 d.text((xy[0]+25,xy[1]+26),title,font=font(25),fill=INK)
 d.text((xy[0]+25,xy[1]+76),amount,font=font(43),fill=INK)

im,d=canvas('See what makes up a category','One fictional week · all amounts in the same currency')
for y,label,amount in [(235,'Grocery shop','80'),(340,'Takeaway','35'),(445,'Work lunches','25')]:
 d.rounded_rectangle((68,y,565,y+85),radius=16,fill=LIGHT)
 d.text((92,y+25),label,font=font(29),fill=INK);d.text((465,y+21),amount,font=font(34),fill=INK)
box(d,(630,235,1128,380),'Groceries','80');box(d,(630,405,1128,550),'Dining','60',LIME)
d.text((70,587),'Food total 140  =  Groceries 80  +  Dining 60',font=font(27),fill=INK)
im.save(DEST/'daily-expense-categories.png',optimize=True)

im,d=canvas('Plan from payday to payday','A fictional day-25 monthly cycle')
d.line((135,335,1065,335),fill=GREEN,width=9)
for x,day,title,sub in [(135,'25','Payday','Cycle begins'),(445,'28','Rent due','Same period'),(755,'10','Bill due','Next month'),(1065,'24','Review','Cycle ends')]:
 d.ellipse((x-34,301,x+34,369),fill=LIME,outline=GREEN,width=3)
 d.text((x-23,315),day,font=font(31),fill=INK)
 d.text((x-65,410),title,font=font(26),fill=INK)
 d.text((x-65,455),sub,font=font(21),fill=MUTED)
d.rounded_rectangle((68,535,1128,605),radius=17,fill=LIGHT)
d.text((96,556),'25th → 24th    ·    Start the next cycle on the following 25th',font=font(27),fill=INK)
im.save(DEST/'payday-budget-timeline.png',optimize=True)

im,d=canvas('Separate expected from received','Fictional payments · all amounts in the same currency')
d.text((68,237),'Expected payments: 2,000',font=font(35),fill=INK)
d.rounded_rectangle((68,310,1128,400),radius=18,fill=LIGHT)
d.rounded_rectangle((68,310,704,400),radius=18,fill=GREEN)
d.text((285,333),'1,200',font=font(37),fill=WHITE);d.text((855,333),'800',font=font(37),fill=INK)
box(d,(68,440,575,590),'Received','1,200',LIME);box(d,(610,440,1128,590),'Still expected','800',LIGHT)
im.save(DEST/'expected-versus-received.png',optimize=True)
print('Created three 1200×675 original article diagrams.')
