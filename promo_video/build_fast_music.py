from pathlib import Path
import math
import random
import struct
import wave

ROOT=Path(__file__).resolve().parent
AUDIO=ROOT/"audio"
RATE=44100
DURATION=18.0
BPM=132.0
BEAT=60.0/BPM
CUTS=[1.2,3.5,6.0,8.5,10.7,13.0,15.0]

def env(phase,decay):
    return math.exp(-phase*decay)

def sample(t,rng):
    beat_phase=t%BEAT
    beat_index=int(t/BEAT)
    half_phase=t%(BEAT/2)

    kick=math.sin(2*math.pi*(50+65*env(beat_phase,24))*t)*env(beat_phase,19)
    snare_phase=(t-BEAT)%(BEAT*2)
    snare=(rng.random()*2-1)*env(snare_phase,25) if beat_index%4 in (1,3) else 0.0
    hat=(rng.random()*2-1)*env(half_phase,75)

    roots=[55.00,43.65,65.41,49.00]
    root=roots[int(t/(BEAT*4))%4]
    sidechain=0.25+0.75*min(1.0,beat_phase/(BEAT*0.72))
    bass=(math.sin(2*math.pi*root*t)+0.32*math.sin(2*math.pi*root*2*t))*sidechain

    step=(t%(BEAT*2))/(BEAT*2)
    arp_freq=root*4*(2**([0,7,12,7][int(step*4)%4]/12))
    arp=math.sin(2*math.pi*arp_freq*t)*env(t%(BEAT/2),9)*sidechain

    impact=0.0
    for cut in CUTS:
        dt=t-cut
        if 0<=dt<0.42:
            impact+=(math.sin(2*math.pi*(82-35*dt)*dt)*env(dt,8)
                     +(rng.random()*2-1)*0.38*env(dt,14))

    buildup=max(0.0,min(1.0,(t-12.0)/3.0))
    roll_phase=t%(BEAT/4)
    roll=(rng.random()*2-1)*env(roll_phase,60)*buildup

    intro=min(1.0,t/0.35)
    outro=min(1.0,(DURATION-t)/0.65)
    raw=(0.58*kick+0.18*snare+0.08*hat+0.30*bass+0.14*arp+0.30*impact+0.10*roll)
    raw*=intro*outro
    # Analog-style soft limiting: loud and dense without digital clipping.
    return math.tanh(raw*1.65)/math.tanh(1.65)*0.67

def main():
    AUDIO.mkdir(parents=True,exist_ok=True)
    rng=random.Random(20260825)
    out=bytearray()
    for i in range(int(DURATION*RATE)):
        t=i/RATE
        mono=sample(t,rng)
        width=0.008*math.sin(2*math.pi*0.21*t)
        left=max(-1,min(1,mono+width))
        right=max(-1,min(1,mono-width))
        out+=struct.pack("<hh",int(left*32767),int(right*32767))
    target=AUDIO/"recycool_fast_loud_music.wav"
    with wave.open(str(target),"wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(RATE); w.writeframes(out)
    print(target)

if __name__=="__main__":
    main()
