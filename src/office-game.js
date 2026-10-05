export const OFFICE_BOUNDS = { x: 12.5, z: 9.5 };
export const DESKS = [
  { x: -8, z: -5 }, { x: -3.5, z: -5 }, { x: 3.5, z: -5 },
  { x: -8, z: 0 }, { x: -3.5, z: 0 }, { x: 3.5, z: 0 },
];
export const STATIONS = [
  { name: 'POLLEN REPORTS', action: 'Approve pollen reports', x: -8, z: -2.9 },
  { name: 'HONEY PRINTER', action: 'Print honey labels', x: 9.5, z: -6.4 },
  { name: 'HIVE ARCHIVE', action: 'File labels in the hive archive', x: -9.5, z: 6 },
  { name: 'NECTAR BREAK', action: 'Refill your nectar mug', x: 9.5, z: 6 },
];
export const OBSTACLES = [
  ...DESKS.map(({ x, z }) => ({ x, z, halfX: 1.65, halfZ: 0.65 })),
  ...DESKS.map(({ x, z }) => ({ x, z: z + 1.1, halfX: 0.35, halfZ: 0.36 })),
  { x: 9.5, z: -8, halfX: 1.4, halfZ: 0.55 },
  { x: -9.5, z: 8, halfX: 1.4, halfZ: 0.55 },
  { x: 9.5, z: 8, halfX: 1.4, halfZ: 0.55 },
];

export class OfficeGame {
  constructor() { this.shift = 0; this.reset(); }
  reset() {
    this.shift++; this.x = 0; this.z = 8; this.yaw = 0; this.pitch = 0;
    this.task = 0; this.progress = 0; this.elapsed = 0; this.complete = false;
  }
  get station() { return STATIONS[this.task] ?? null; }
  get nearStation() { return !!this.station && Math.hypot(this.x - this.station.x, this.z - this.station.z) < 2; }
  canStand(x, z) {
    const radius = 0.32;
    return Math.abs(x) <= OFFICE_BOUNDS.x && Math.abs(z) <= OFFICE_BOUNDS.z && !OBSTACLES.some(o =>
      Math.abs(x - o.x) < o.halfX + radius && Math.abs(z - o.z) < o.halfZ + radius);
  }
  look(dx, dy) { this.yaw -= dx * 0.002; this.pitch = Math.max(-1.2, Math.min(1.2, this.pitch - dy * 0.002)); }
  tick(dt, { forward = 0, right = 0, sprint = false, work = false } = {}) {
    dt = Math.max(0, Math.min(dt, 0.05));
    if (this.complete) return false;
    this.elapsed += dt;
    const norm = Math.max(1, Math.hypot(forward, right));
    const speed = (sprint ? 5.5 : 3.2) * dt / norm;
    const dx = (right * Math.cos(this.yaw) - forward * Math.sin(this.yaw)) * speed;
    const dz = (-forward * Math.cos(this.yaw) - right * Math.sin(this.yaw)) * speed;
    if (this.canStand(this.x + dx, this.z)) this.x += dx;
    if (this.canStand(this.x, this.z + dz)) this.z += dz;
    if (work && this.nearStation) {
      this.progress += dt;
      if (this.progress >= 1.5) { this.task++; this.progress = 0; this.complete = this.task === STATIONS.length; return true; }
    } else this.progress = 0;
    return false;
  }
}
