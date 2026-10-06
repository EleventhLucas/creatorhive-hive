// Original cartoon synthesis recipes, dedicated to CC0. No recordings or melodies are sampled.
const tone = (frequency, end, duration, at = 0, gain = 0.12, wave = 'sine', points) => ({ frequency, end, duration, at, gain, wave, points });
const noise = (cutoff, duration, at = 0, gain = 0.08) => ({ noise: true, cutoff, duration, at, gain });
const notes = (frequencies, spacing = 0.08, gain = 0.09) => frequencies.map((f, i) => tone(f, f * 0.98, spacing * 1.3, i * spacing, gain, 'triangle'));

export const CUES = {
  clockIn: v => notes([[440, 660, 880], [392, 588, 784], [480, 720, 960]][v]),
  resume: v => [tone(280 + v * 40, 680, 0.14), tone(880, 1100, 0.1, 0.1, 0.07)],
  step: v => [noise(450 + v * 120, 0.045, 0, 0.035), tone(150 + v * 25, 65, 0.06, 0, 0.035)],
  jump: v => [tone(160 + v * 35, 950, 0.24, 0, 0.14, 'triangle', [180 + v * 30, 420 + v * 70, 300 + v * 30, 950 + v * 90]), noise(800, 0.07, 0, 0.025)],
  glide: v => [noise(1300 + v * 300, 0.24, 0, 0.055), tone(170 + v * 20, 240, 0.24, 0, 0.025, 'sawtooth')],
  land: v => [tone(190 + v * 25, 55, 0.16, 0, 0.12), noise(650, 0.1, 0, 0.05)],
  throw: v => [noise(1900 + v * 350, 0.13, 0, 0.09), tone(650 + v * 70, 160, 0.16, 0, 0.07, 'triangle')],
  refill: v => [tone(420 + v * 65, 1200, 0.1, 0, 0.07), tone(1250, 650, 0.08, 0.07, 0.04)],
  mugFloor: v => [tone(740 + v * 130, 210, 0.13, 0, 0.09, 'triangle'), noise(1600, 0.045, 0, 0.045)],
  mugWall: v => [tone(950 + v * 180, 430, 0.18, 0, 0.1), tone(1600 + v * 100, 900, 0.09, 0.025, 0.04)],
  mugDesk: v => [noise(900 + v * 200, 0.07, 0, 0.07), tone(280 + v * 40, 150, 0.08, 0, 0.07, 'triangle')],
  hit: v => [tone(230 + v * 30, 80, 0.2, 0, 0.15, 'sine', [260, 95, 200, 80]), noise(550, 0.055, 0, 0.045)],
  react: v => notes([[500, 900, 580], [680, 400, 760], [800, 550, 1000]][v], 0.06, 0.055),
  crumple: v => [tone(500 + v * 90, 60, 0.48, 0, 0.13, 'triangle', [550 + v * 80, 250 + v * 30, 380 + v * 40, 100 + v * 10, 60]), noise(650, 0.16, 0.28, 0.06)],
  ragdoll: v => [tone(460 + v * 80, 70, 0.55, 0, 0.13, 'sine', [460 + v * 60, 170 + v * 20, 400 + v * 40, 140, 310 + v * 30, 70]), noise(500, 0.07, 0.4, 0.06)],
  burst: v => [noise(1000 + v * 250, 0.22, 0, 0.14), ...notes([800 + v * 100, 1200, 1500, 650], 0.055, 0.065)],
  respawn: v => [tone(170 + v * 25, 1100, 0.26, 0, 0.1), ...notes([900, 1350, 1800], 0.065, 0.065)],
  sit: v => [tone(620 + v * 100, 160, 0.2, 0, 0.09, 'triangle'), noise(400, 0.1, 0.06, 0.04)],
  stand: v => [tone(180 + v * 40, 750, 0.18, 0, 0.08, 'triangle')],
  denied: v => notes([180 + v * 30, 120 + v * 20], 0.08, 0.055),
  reports: v => [noise(1900 + v * 300, 0.025, 0, 0.04), noise(2400, 0.025, 0.055, 0.035), tone(650, 780, 0.045, 0.09, 0.02, 'square')],
  printer: v => [tone(140 + v * 25, 220, 0.17, 0, 0.04, 'sawtooth'), noise(1100, 0.1, 0.12, 0.04), tone(320, 160, 0.06, 0.23, 0.03, 'square')],
  archive: v => [noise(700 + v * 180, 0.18, 0, 0.055), tone(260, 100, 0.06, 0.15, 0.055)],
  cooler: v => notes([240 + v * 35, 430, 280, 560], 0.055, 0.06),
  taskComplete: v => notes([[620, 930, 1240], [700, 1050, 1400], [560, 840, 1120]][v], 0.09, 0.1),
  shiftComplete: v => notes([[400, 600, 800, 1200, 1600], [440, 660, 880, 1320, 1760], [360, 540, 720, 1080, 1440]][v], 0.13, 0.12),
  typing: v => [noise(2100 + v * 250, 0.018, 0, 0.035), noise(1800, 0.022, 0.07, 0.03), noise(2400, 0.015, 0.13, 0.03)],
  chatter: v => [tone(230 + v * 40, 420, 0.09, 0, 0.035, 'triangle'), tone(480, 260 + v * 30, 0.13, 0.1, 0.04, 'triangle'), tone(340, 600, 0.08, 0.24, 0.025, 'triangle')],
  sip: v => [noise(450 + v * 100, 0.13, 0, 0.04), tone(240, 550 + v * 60, 0.12, 0.08, 0.035)],
  buzz: v => [tone(125 + v * 20, 175 + v * 15, 0.3, 0, 0.022, 'sawtooth', [140 + v * 12, 180 + v * 14, 135 + v * 12, 170 + v * 16])],
};
