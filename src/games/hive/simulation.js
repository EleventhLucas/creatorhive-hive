export const RULES = Object.freeze({ radius: 18, capacity: 8, duration: 180, break: 12, goal: 300 });
export const FLOWERS = Array.from({ length: 18 }, (_, i) => {
  const angle = i * Math.PI * 2 / 18;
  const radius = 8 + (i % 3) * 3;
  return { id: i, x: Math.cos(angle) * radius, y: 2, z: Math.sin(angle) * radius };
});
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export class Game {
  constructor({ bots = 6 } = {}) {
    this.players = new Map();
    this.sequence = 0;
    this.round = 1;
    this.remaining = RULES.duration;
    this.honey = 0;
    this.result = null;
    this.cooldowns = FLOWERS.map(() => 0);
    this.lastWinners = [];
    for (let i = 0; i < bots; i++) this.addPlayer(true);
  }
  addPlayer(bot = false) {
    if (!bot) {
      const existing = [...this.players.values()].find(p => !p.bot);
      if (existing) return existing;
    }
    const id = ++this.sequence;
    const p = { id, name: `${bot ? 'Scout' : 'Bee'} ${String(id).padStart(3, '0')}`, bot, x: Math.sin(id) * 2, y: 2, z: Math.cos(id) * 2,
      yaw: 0, bag: 0, score: 0, boost: 0, input: { x: 0, y: 0, z: 0, dash: false }, idle: 0, collect: 0, target: id % FLOWERS.length };
    this.players.set(id, p);
    return p;
  }
  setInput(id, input) {
    const p = this.players.get(id);
    if (!p || !input || typeof input !== 'object') return;
    p.input = { x: Number.isFinite(input.x) ? clamp(input.x, -1, 1) : 0,
      y: 0,
      z: Number.isFinite(input.z) ? clamp(input.z, -1, 1) : 0, dash: input.dash === true };
    p.idle = 0;
  }
  tick(dt) {
    dt = clamp(dt, 0, 0.1);
    this.remaining -= dt;
    if (this.remaining <= 0) {
      if (!this.result) this.finish();
      else this.reset();
    }
    if (this.result) return;
    this.cooldowns = this.cooldowns.map(c => Math.max(0, c - dt));
    for (const p of this.players.values()) {
      p.idle += dt;
      p.boost = Math.max(0, p.boost - dt);
      p.collect = Math.max(0, p.collect - dt);
      if (p.bot) {
        const target = p.bag >= RULES.capacity ? { x: 0, y: 2, z: 0 } : FLOWERS[p.target];
        const dx = target.x - p.x, dz = target.z - p.z, d = Math.hypot(dx, dz);
        p.input = { x: d > 0.4 ? dx / d : 0, z: d > 0.4 ? dz / d : 0, y: 0, dash: false };
        if (d < 1 && p.bag < RULES.capacity && this.cooldowns[p.target] > 0) p.target = (p.target + 5) % FLOWERS.length;
      }
      const input = p.idle > 0.5 && !p.bot ? { x: 0, y: 0, z: 0, dash: false } : p.input;
      const length = Math.max(1, Math.hypot(input.x, input.z));
      if (input.dash && p.boost === 0) p.boost = 4;
      const speed = (p.boost > 3.5 ? 13 : 6) * (p.bot ? 0.7 : 1);
      p.x += input.x / length * speed * dt;
      p.z += input.z / length * speed * dt;
      p.y = 2;
      const radius = Math.hypot(p.x, p.z);
      if (radius > RULES.radius) { p.x *= RULES.radius / radius; p.z *= RULES.radius / radius; }
      if (input.x || input.z) p.yaw = Math.atan2(input.x, input.z);
      if (Math.hypot(p.x, p.z) < 3 && p.y < 3.7 && p.bag > 0) {
        p.score += p.bag; this.honey += p.bag; p.bag = 0;
        if (p.bot) p.target = (p.target + 7) % FLOWERS.length;
      }
      if (p.bag < RULES.capacity && !p.collect) {
        for (const flower of FLOWERS) {
          if (!this.cooldowns[flower.id] && Math.hypot(p.x - flower.x, p.z - flower.z, p.y - flower.y) < 1.7) {
            p.bag++; p.collect = 0.25; this.cooldowns[flower.id] = 0.6; break;
          }
        }
      }
    }
    if (this.honey >= RULES.goal) this.finish();
  }
  finish() {
    this.result = this.honey >= RULES.goal ? 'complete' : 'time';
    this.remaining = RULES.break;
    this.lastWinners = [...this.players.values()].sort((a, b) => b.score - a.score).slice(0, 3).map(p => ({ name: p.name, score: p.score }));
  }
  reset() {
    this.round++; this.remaining = RULES.duration; this.honey = 0; this.result = null; this.cooldowns.fill(0);
    for (const p of this.players.values()) { p.score = 0; p.bag = 0; p.x = Math.sin(p.id) * 2; p.z = Math.cos(p.id) * 2; p.y = 2; p.boost = 0; }
  }
}
