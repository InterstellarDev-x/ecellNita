from PIL import Image, ImageDraw
from pathlib import Path
import random
import subprocess

import render_reel as base

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "output"
W, H, FPS, DURATION = 1080, 1920, 30, 18
TOTAL = FPS * DURATION
CUTS = [1.2, 3.5, 6.0, 8.5, 10.7, 13.0, 15.0]

def flash(frame, t):
    distance = min(abs(t-cut) for cut in CUTS)
    if distance >= 0.10:
        return frame
    strength = int(105 * (1-distance/0.10))
    layer = Image.new("RGBA", (W,H), (145,255,158,strength))
    return Image.alpha_composite(frame.convert("RGBA"), layer)

def render(t):
    if t < 1.2:
        frame = base.intro(t*1.65)
    elif t < 3.5:
        frame = base.scene_phone(t,1.2,3.5,base.IMAGES["hero"],
            "BUY. SELL.\nREUSE.","Your campus marketplace is live.")
    elif t < 6.0:
        frame = base.scene_phone(t,3.5,6.0,base.IMAGES["market"],
            "CAMPUS DEALS.\nONE SCROLL AWAY.","Find it before somebody else does.")
    elif t < 8.5:
        frame = base.scene_phone(t,6.0,8.5,base.IMAGES["detail"],
            "SEE IT.\nINSPECT IT SAFELY.","Campus pickup. More confidence.")
    elif t < 10.7:
        frame = base.scene_phone(t,8.5,10.7,base.IMAGES["seller"],
            "UNUSED STUFF?\nMAKE IT VALUABLE.","Your next buyer could be nearby.")
    elif t < 13.0:
        frame = base.scene_phone(t,10.7,13.0,base.IMAGES["add"],
            "SNAP IT.\nLIST IT. SELL IT.","A few details. Then go live.")
    elif t < 15.0:
        frame = base.movement(t)
    else:
        frame = base.cta(t+5.0)

    frame = flash(frame,t)
    draw = ImageDraw.Draw(frame)
    rng = random.Random(int(t*FPS)//2)
    for _ in range(120):
        x=rng.randrange(W); y=rng.randrange(H); shade=rng.randrange(34,47)
        draw.point((x,y),fill=(shade,shade+13,shade+5))
    return frame.convert("RGB")

def main():
    OUTPUT.mkdir(parents=True,exist_ok=True)
    target=OUTPUT/"recycool_fast_silent.mp4"
    proc=subprocess.Popen([
        str(ROOT/"raw-video-encoder"),str(W),str(H),str(FPS),str(target)
    ],stdin=subprocess.PIPE)
    assert proc.stdin is not None
    try:
        for idx in range(TOTAL):
            proc.stdin.write(render(idx/FPS).convert("RGBA").tobytes("raw","BGRA"))
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
