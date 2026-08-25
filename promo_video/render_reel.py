from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
from pathlib import Path
import math
import random
import subprocess
import sys

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"
OUTPUT = ROOT / "output"
W, H, FPS, DURATION = 1080, 1920, 30, 25
TOTAL = FPS * DURATION

FONT = "/System/Library/Fonts/SFNS.ttf"
FONT_ROUNDED = "/System/Library/Fonts/SFNSRounded.ttf"
BLACK = (8, 13, 11)
INK = (16, 24, 20)
GREEN = (85, 188, 101)
MINT = (194, 255, 200)
WHITE = (250, 252, 250)

def font(size, rounded=False):
    return ImageFont.truetype(FONT_ROUNDED if rounded else FONT, size)

F_HUGE = font(104, True)
F_BIG = font(72, True)
F_MED = font(46, True)
F_BODY = font(32)
F_SMALL = font(25)
F_TAG = font(25, True)

def ease(x):
    x = max(0.0, min(1.0, x))
    return x * x * (3 - 2 * x)

def fade_window(t, start, end, edge=0.32):
    return min(ease((t-start)/edge), ease((end-t)/edge), 1.0)

def background(seed=0):
    im = Image.new("RGB", (W, H), BLACK)
    d = ImageDraw.Draw(im)
    for y in range(H):
        q = y / H
        d.line((0, y, W, y), fill=(7 + int(4*q), 15 + int(13*q), 11 + int(5*q)))
    glow = Image.new("RGBA", (W, H), (0,0,0,0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((-420, -340, 750, 830), fill=(64, 190, 93, 68))
    gd.ellipse((610, 1110, 1450, 2070), fill=(53, 144, 74, 40))
    glow = glow.filter(ImageFilter.GaussianBlur(150))
    im = Image.alpha_composite(im.convert("RGBA"), glow)
    return im

def rounded_image(img, size, radius=48):
    img = img.resize(size, Image.Resampling.LANCZOS)
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0,0,size[0]-1,size[1]-1), radius=radius, fill=255)
    out = Image.new("RGBA", size, (0,0,0,0))
    out.paste(img, (0,0), mask)
    return out

def crop_phone(full, scroll=0.0):
    view_h = 844
    max_y = max(0, full.height - view_h)
    y = int(max_y * max(0, min(1, scroll)))
    return full.crop((0, y, 390, y + view_h))

def add_phone(canvas, screenshot, tlocal, scroll=0.0):
    if screenshot.height != 844:
        screenshot = crop_phone(screenshot, scroll)
    base_w, base_h = 620, 1342
    zoom = 0.965 + 0.025 * ease(tlocal)
    sw, sh = int(base_w * zoom), int(base_h * zoom)
    phone = rounded_image(screenshot, (sw, sh), int(45*zoom))
    x = (W-sw)//2
    y = 405 + int(20*(1-ease(tlocal)))
    shadow = Image.new("RGBA", (sw+100, sh+100), (0,0,0,0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((50,50,50+sw,50+sh), radius=55, fill=(0,0,0,150))
    shadow = shadow.filter(ImageFilter.GaussianBlur(34))
    canvas.alpha_composite(shadow, (x-50,y-35))
    frame = Image.new("RGBA", (sw+18,sh+18), (0,0,0,0))
    ImageDraw.Draw(frame).rounded_rectangle((1,1,sw+16,sh+16), radius=53, outline=(230,255,235,100), width=4, fill=(12,19,15,210))
    canvas.alpha_composite(frame,(x-9,y-9))
    canvas.alpha_composite(phone,(x,y))

def multiline(draw, text, xy, font_obj, fill, spacing=5, anchor="la", stroke=0):
    draw.multiline_text(xy, text, font=font_obj, fill=fill, spacing=spacing, anchor=anchor,
                        stroke_width=stroke, stroke_fill=(0,0,0,120))

def tag(draw, text, x=70, y=62):
    bbox = draw.textbbox((0,0), text, font=F_TAG)
    tw = bbox[2]-bbox[0]
    draw.rounded_rectangle((x,y,x+tw+44,y+50), radius=25, fill=(43,104,57), outline=(121,219,136), width=2)
    draw.text((x+22,y+25), text, font=F_TAG, fill=MINT, anchor="lm")

def scene_phone(t, start, end, image, headline, subtitle, scroll_end=0.0):
    p = (t-start)/(end-start)
    canvas = background(int(t*10))
    draw = ImageDraw.Draw(canvas)
    tag(draw, "REC YCOOL  •  NIT AGARTALA")
    lines = headline.split("\n")
    y = 145
    for i,line in enumerate(lines):
        color = GREEN if i == len(lines)-1 else WHITE
        draw.text((70,y), line, font=F_BIG, fill=color, anchor="la")
        y += 72
    draw.text((72, y+12), subtitle, font=F_BODY, fill=(224,235,228), anchor="la")
    scroll = ease(p) * scroll_end
    add_phone(canvas,image,p,scroll)
    return canvas

def recolor_logo(path, color, max_width):
    im = Image.open(path).convert("RGBA")
    bbox = im.getbbox()
    if bbox: im = im.crop(bbox)
    scale = min(max_width/im.width, 1.0)
    im = im.resize((int(im.width*scale),int(im.height*scale)),Image.Resampling.LANCZOS)
    alpha = im.getchannel("A")
    solid = Image.new("RGBA", im.size, color)
    solid.putalpha(alpha)
    return solid

def intro(t):
    canvas = background()
    draw = ImageDraw.Draw(canvas)
    p = ease(t/2.0)
    draw.text((W//2,410-int(30*(1-p))),"YOUR CAMPUS.",font=F_HUGE,fill=WHITE,anchor="mm")
    draw.text((W//2,525-int(30*(1-p))),"YOUR MARKETPLACE.",font=F_HUGE,fill=GREEN,anchor="mm")
    draw.text((W//2,700),"Great finds should stay on campus.",font=F_MED,fill=(220,233,224),anchor="mm")
    draw.rounded_rectangle((120,910,960,1250),radius=70,fill=(15,48,27),outline=(120,220,136),width=3)
    draw.text((W//2,1015),"BUY  •  SELL  •  REUSE",font=F_MED,fill=MINT,anchor="mm")
    draw.text((W//2,1140),"Built for NIT Agartala students",font=F_BODY,fill=WHITE,anchor="mm")
    draw.text((W//2,1730),"A PRODUCT BY E-CELL NITA",font=F_SMALL,fill=(166,193,174),anchor="mm")
    return canvas

def movement(t):
    canvas = background()
    draw = ImageDraw.Draw(canvas)
    tag(draw,"POWERED BY E-CELL NITA")
    draw.text((70,300),"MORE THAN\nA MARKETPLACE.",font=F_HUGE,fill=WHITE,spacing=6)
    draw.text((70,580),"A CAMPUS\nMOVEMENT.",font=F_HUGE,fill=GREEN,spacing=6)
    bullets=["Less waste.","Smarter spending.","Stronger student community."]
    y=980
    for i,b in enumerate(bullets):
        draw.ellipse((74,y-5,102,y+23),fill=GREEN)
        draw.text((135,y+9),b,font=F_MED,fill=WHITE,anchor="lm")
        y+=125
    logo = recolor_logo(Path("/Users/adityakumar/Downloads/ecell_logo.png"), (255,255,255,255), 480)
    canvas.alpha_composite(logo,((W-logo.width)//2,1490))
    return canvas

def cta(t):
    canvas = background()
    draw = ImageDraw.Draw(canvas)
    p=ease((t-20)/5)
    draw.text((W//2,260),"READY TO FIND\nYOUR NEXT DEAL?",font=F_HUGE,fill=WHITE,anchor="ma",align="center",spacing=4)
    card=(90,720,990,1485)
    draw.rounded_rectangle(card,radius=80,fill=(247,250,247),outline=(142,235,152),width=4)
    logo=Image.open("/Users/adityakumar/Documents/Ecell/ecellNita/frontend/public/logo.png").convert("RGBA")
    bbox=logo.getbbox()
    if bbox: logo=logo.crop(bbox)
    logo.thumbnail((520,180),Image.Resampling.LANCZOS)
    canvas.alpha_composite(logo,((W-logo.width)//2,825))
    draw.text((W//2,1075),"BUY SMART. SELL FAST. REUSE MORE.",font=F_SMALL,fill=(42,70,51),anchor="mm")
    button=(180,1190,900,1335)
    draw.rounded_rectangle(button,radius=72,fill=GREEN)
    draw.text((W//2,1262),"JOIN REC YCOOL NOW  →",font=F_MED,fill=WHITE,anchor="mm")
    draw.text((W//2,1400),"recycool.ecellnita.in",font=F_BODY,fill=(43,97,53),anchor="mm")
    draw.text((W//2,1665),"Powered by E-Cell NIT Agartala",font=F_BODY,fill=(210,227,215),anchor="mm")
    draw.text((W//2,1745),"Give every item a second life.",font=F_MED,fill=MINT,anchor="mm")
    return canvas

IMAGES = {
    "hero": Image.open(ASSETS/"01_landing_hero.png").convert("RGB"),
    "market": Image.open(ASSETS/"03_marketplace.png").convert("RGB"),
    "detail": Image.open(ASSETS/"04_product_detail.png").convert("RGB"),
    "seller": Image.open(ASSETS/"05_seller_dashboard.png").convert("RGB"),
    "add": Image.open(ASSETS/"06_add_product.png").convert("RGB"),
}

def render(t):
    if t < 2:
        frame=intro(t)
    elif t < 5:
        frame=scene_phone(t,2,5,IMAGES["hero"],"BUY. SELL.\nREUSE.","A campus marketplace made for us.")
    elif t < 8:
        frame=scene_phone(t,5,8,IMAGES["market"],"CAMPUS DEALS.\nONE SCROLL AWAY.","Discover useful finds from fellow students.")
    elif t < 11:
        frame=scene_phone(t,8,11,IMAGES["detail"],"SEE IT.\nINSPECT IT SAFELY.","Clear details. Campus pickup. More confidence.")
    elif t < 14:
        frame=scene_phone(t,11,14,IMAGES["seller"],"UNUSED STUFF?\nTURN IT INTO VALUE.","Your seller workspace keeps it simple.")
    elif t < 17:
        frame=scene_phone(t,14,17,IMAGES["add"],"LIST IT.\nIN MINUTES.","Add the details. Upload photos. Go live.")
    elif t < 20:
        frame=movement(t)
    else:
        frame=cta(t)
    # Fine film grain for a less sterile finish.
    d=ImageDraw.Draw(frame)
    rnd=random.Random(int(t*FPS)//2)
    for _ in range(220):
        x=rnd.randrange(W); y=rnd.randrange(H); a=rnd.randrange(8,24)
        shade=34+a//3
        d.point((x,y),fill=(shade,shade+13,shade+5))
    return frame.convert("RGB")

def main():
    OUTPUT.mkdir(parents=True,exist_ok=True)
    encoder=ROOT/"raw-video-encoder"
    target=OUTPUT/"recycool_reel_silent.mp4"
    proc=subprocess.Popen([str(encoder),str(W),str(H),str(FPS),str(target)],stdin=subprocess.PIPE)
    assert proc.stdin is not None
    try:
        for idx in range(TOTAL):
            frame=render(idx/FPS)
            proc.stdin.write(frame.convert("RGBA").tobytes("raw","BGRA"))
            if idx % 90 == 0:
                print(f"rendered {idx}/{TOTAL}",flush=True)
    finally:
        proc.stdin.close()
    code=proc.wait()
    if code:
        raise SystemExit(code)
    print(target)

if __name__=="__main__":
    main()
