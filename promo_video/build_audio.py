from pathlib import Path
import math
import random
import struct
import wave
import sys

ROOT = Path(__file__).resolve().parent
AUDIO = ROOT / "audio"
RATE = 44100
DURATION = 25.0

def read_wave(path):
    with wave.open(str(path), "rb") as w:
        channels = w.getnchannels()
        width = w.getsampwidth()
        rate = w.getframerate()
        frames = w.readframes(w.getnframes())
    if width != 2 or rate != RATE:
        raise ValueError(f"Expected 16-bit {RATE}Hz WAV, got width={width}, rate={rate}")
    values = struct.unpack("<" + "h" * (len(frames)//2), frames)
    if channels == 1:
        return [(v/32768.0, v/32768.0) for v in values]
    return [(values[i]/32768.0, values[i+1]/32768.0) for i in range(0,len(values),channels)]

def music_sample(t, rng):
    # A restrained cinematic bed: warm four-chord pad, sub pulse and soft shimmer.
    chords = [
        (110.00, 130.81, 164.81),  # Am
        (87.31, 110.00, 130.81),   # F
        (130.81, 164.81, 196.00),  # C
        (98.00, 123.47, 146.83),   # G
    ]
    chord = chords[int(t//2.0) % len(chords)]
    pad = sum(math.sin(2*math.pi*f*t + i*0.4) for i,f in enumerate(chord))/3
    pad += 0.35*sum(math.sin(2*math.pi*(f*2.01)*t) for f in chord)/3
    beat = t % 0.5
    kick = math.sin(2*math.pi*(54 + 24*math.exp(-beat*18))*t) * math.exp(-beat*18)
    hat_phase = (t+0.25) % 0.5
    hat = (rng.random()*2-1) * math.exp(-hat_phase*55)
    rise = min(1.0, t/1.2) * min(1.0, (DURATION-t)/1.5)
    return rise * (0.12*pad + 0.075*kick + 0.018*hat)

def main():
    AUDIO.mkdir(parents=True, exist_ok=True)
    music_only = "--music-only" in sys.argv
    voice = [] if music_only else read_wave(AUDIO/"voice.wav")
    voice_offset = int(0.35*RATE)
    count = int(DURATION*RATE)
    rng = random.Random(90210)
    output = bytearray()
    for i in range(count):
        t = i/RATE
        m = music_sample(t,rng) * (2.4 if music_only else 1.0)
        vi = i-voice_offset
        vl, vr = voice[vi] if 0 <= vi < len(voice) else (0.0,0.0)
        # Duck the music beneath narration while retaining a cinematic pulse.
        voice_level = max(abs(vl),abs(vr))
        duck = 1.0 - min(0.45, voice_level*1.25)
        left = max(-1,min(1,m*duck + vl*0.93))
        right = max(-1,min(1,m*duck + vr*0.93))
        output += struct.pack("<hh",int(left*32767),int(right*32767))
    target = AUDIO/("recycool_music_only.wav" if music_only else "recycool_mix.wav")
    with wave.open(str(target),"wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(RATE)
        w.writeframes(output)
    print(target)

if __name__ == "__main__":
    main()
