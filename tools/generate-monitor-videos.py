#!/usr/bin/env python3
"""Generate original, silent bee animations with only Python stdlib and FFmpeg.

No downloaded footage, temporary frame files, or third-party artwork. Outputs
are 256x144, 8 fps, six seconds, H.264 MP4. Generated artwork is dedicated CC0.
"""
import math
import subprocess
from pathlib import Path

W, H, FPS, SECONDS = 256, 144, 8, 6
OUT = Path(__file__).resolve().parents[1] / 'public' / 'media'


PALETTES = {
    'pollen-flight': {'background': (89, 145, 180), 'grid': (99, 154, 185), 'flowers': [(221, 123, 148), (239, 202, 104), (205, 178, 223)]},
    'waggle-dance': {'background': (120, 78, 42), 'grid': (139, 94, 51)},
    'honey-loop': {'background': (77, 44, 29), 'grid': (91, 53, 32)},
    'flower-clock': {'background': (179, 198, 214), 'grid': (174, 195, 207), 'flowers': [(199, 130, 154), (164, 143, 200), (244, 221, 172)]},
    'nectar-run': {'background': (46, 66, 104), 'grid': (55, 78, 115)},
    'hive-scan': {'background': (25, 42, 56), 'grid': (34, 55, 68)},
}


def frame(kind, t):
    palette = PALETTES[kind]
    data = bytearray(bytes(palette['background']) * W * H)

    def rect(x, y, w, h, color):
        left, top = max(0, int(x)), max(0, int(y))
        right, bottom = min(W, int(x + w)), min(H, int(y + h))
        if right <= left or bottom <= top:
            return
        row = bytes(color) * (right - left)
        for yy in range(top, bottom):
            start = (yy * W + left) * 3
            data[start:start + len(row)] = row

    def ellipse(x, y, rx, ry, color):
        for yy in range(max(0, int(y - ry)), min(H, int(y + ry) + 1)):
            half = rx * math.sqrt(max(0, 1 - ((yy - y) / ry) ** 2))
            rect(x - half, yy, half * 2 + 1, 1, color)

    def bee(x, y, scale=1):
        flap = 4 + 5 * abs(math.sin(t * math.pi * 8))
        ellipse(x - 4 * scale, y - 9 * scale, 7 * scale, flap * scale, (208, 232, 242))
        ellipse(x + 4 * scale, y - 9 * scale, 7 * scale, flap * scale, (241, 241, 220))
        ellipse(x, y, 15 * scale, 9 * scale, (233, 193, 79))
        rect(x - 7 * scale, y - 8 * scale, 4 * scale, 16 * scale, (40, 39, 35))
        rect(x + 1 * scale, y - 8 * scale, 4 * scale, 16 * scale, (40, 39, 35))
        ellipse(x + 12 * scale, y - scale, 5 * scale, 7 * scale, (44, 44, 39))
        ellipse(x + 14 * scale, y - 3 * scale, 1.4 * scale, 1.4 * scale, (245, 241, 198))

    def flower(x, y, phase):
        rect(x - 1, y, 2, 30, (90, 136, 81))
        petals = palette.get('flowers', [(226, 181, 101)])
        color = petals[int(x // 30) % len(petals)]
        for i in range(6):
            a = math.pi * i / 3 + phase
            ellipse(x + math.cos(a) * 7, y + math.sin(a) * 7, 5, 5, color)
        ellipse(x, y, 4, 4, (248, 206, 89))

    for x in range(0, W, 16):
        rect(x, 0, 1, H, palette['grid'])
    for y in range(0, H, 16):
        rect(0, y, W, 1, palette['grid'])

    if kind == 'pollen-flight':
        rect(0, 119, W, 25, (80, 125, 64))
        for i in range(7):
            flower(16 + i * 36, 108 + math.sin(i) * 6, t * .2)
        for i in range(3):
            bee(128 + math.sin(t * math.tau / SECONDS + i * 2) * 92,
                49 + math.cos(t * math.tau / SECONDS + i * 2) * 22, .8)
    elif kind == 'waggle-dance':
        for i in range(9):
            ellipse(20 + i * 27, 120, 10, 4, (169, 118, 57))
        for i in range(3):
            a = t * math.tau / SECONDS + i * math.tau / 3
            bee(128 + math.sin(a) * 60, 72 + math.sin(a * 2) * 26, 1)
        for i in range(8):
            a = i * math.tau / 8 + t * .3
            ellipse(128 + math.cos(a) * 92, 72 + math.sin(a) * 55, 2, 2, (213, 180, 90))
    elif kind == 'flower-clock':
        for i in range(10):
            a = i * math.tau / 10
            flower(128 + math.cos(a) * 75, 65 + math.sin(a) * 35, a + t * .1)
        a = t * math.tau / SECONDS
        bee(128 + math.cos(a) * 47, 65 + math.sin(a) * 23, 1.1)
    elif kind == 'nectar-run':
        for i in range(5):
            x = 20 + i * 48
            rect(x, 110, 26, 3, (148, 122, 92))
            ellipse(x + 13, 99, 10, 7, (202, 157, 54))
        for i in range(2):
            a = t * math.tau / SECONDS + i * math.pi
            x, y = 128 + math.cos(a) * 88, 58 + math.sin(a * 2) * 22
            bee(x, y, .9)
            ellipse(x - 8, y + 10, 4, 4, (244, 205, 87))
    else:
        for row in range(4):
            for col in range(7):
                x, y = 14 + col * 38 + (row % 2) * 19, 20 + row * 32
                ellipse(x, y, 17, 14, (86, 115, 120) if kind == 'hive-scan' else (186, 130, 43))
                ellipse(x, y, 13, 10, (40, 66, 74) if kind == 'hive-scan' else (118, 75, 25))
                fill = (math.sin(t * math.tau / SECONDS + col * .5 + row) + 1) / 2
                ellipse(x, y + 3, 11 * fill, 7 * fill + .2, (218, 168, 54))
        bee(128 + math.sin(t * math.tau / SECONDS) * 80, 65, 1.1)
        if kind == 'hive-scan':
            rect(t / SECONDS * W, 0, 3, H, (107, 211, 219))
            bee(128 - math.sin(t * math.tau / SECONDS) * 80, 105, .65)
    return data


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for kind in ['pollen-flight', 'waggle-dance', 'honey-loop', 'flower-clock', 'nectar-run', 'hive-scan']:
        output = OUT / f'{kind}.mp4'
        command = ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
                   '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
                   '-r', str(FPS), '-i', 'pipe:0', '-an', '-c:v', 'libx264',
                   '-preset', 'slow', '-crf', '33', '-profile:v', 'baseline',
                   '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
                   '-map_metadata', '-1', str(output)]
        process = subprocess.Popen(command, stdin=subprocess.PIPE)
        for i in range(FPS * SECONDS):
            process.stdin.write(frame(kind, i / FPS))
        process.stdin.close()
        if process.wait() != 0:
            raise RuntimeError(f'Encoding failed: {kind}')
        if output.stat().st_size > 256 * 1024:
            raise RuntimeError(f'Clip exceeds the 256 KiB limit: {kind}')
        print(f'{output.name}: {output.stat().st_size:,} bytes')


if __name__ == '__main__':
    main()
