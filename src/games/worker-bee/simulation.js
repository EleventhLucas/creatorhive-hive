export const OFFICE_BOUNDS = { x: 12.5, z: 9.5 };
export const DESKS = [
  { x: -8, z: -5 }, { x: -3.5, z: -5 }, { x: 3.5, z: -5 },
  { x: -8, z: 0 }, { x: -3.5, z: 0 }, { x: 3.5, z: 0 },
];
export const CHAIRS = DESKS.map(({ x, z }, id) => ({ id, x, z: z + 1.1 }));
export const STATIONS = [
  { name: 'POLLEN REPORTS', destination: 'Go to the report computer', action: 'Approve pollen reports', x: -8, z: -2.9 },
  { name: 'HONEY PRINTER', destination: 'Move to the honey printer', action: 'Print honey labels', x: 9.5, z: -6.4 },
  { name: 'HIVE ARCHIVE', destination: 'Go to the hive archive', action: 'File labels in the hive archive', x: -9.5, z: 6 },
  { name: 'NECTAR BREAK', destination: 'Move to the nectar cooler', action: 'Refill your nectar mug', x: 9.5, z: 6 },
];
export const OBSTACLES = [
  ...DESKS.map(({ x, z }) => ({ x, z, halfX: 1.65, halfZ: 0.65, height: 1.04 })),
  ...DESKS.map(({ x, z }) => ({ x, z: z + 1.1, halfX: 0.35, halfZ: 0.36, height: 1.27 })),
  { x: 9.5, z: -8, halfX: 1.4, halfZ: 0.55, height: 1.1 },
  { x: -9.5, z: 8, halfX: 1.4, halfZ: 0.55, height: 1.1 },
  { x: 9.5, z: 8, halfX: 1.4, halfZ: 0.55, height: 1.1 },
];

export class OfficeGame {
  constructor() { this.shift = 0; this.reset(); }
  reset() {
    this.shift++; this.x = 0; this.z = 8; this.yaw = 0; this.pitch = 0;
    this.task = 0; this.progress = 0; this.elapsed = 0; this.complete = false;
    this.seated = null; this.standPoint = null; this.occupiedChairs = new Set(); this.workerPositions = [];
    this.mugCooldown = 0; this.projectiles = []; this.nextMug = 0; this.impacts = []; this.hits = [];
    this.altitude = 0; this.verticalSpeed = 0; this.grounded = true; this.glideRemaining = 1; this.gliding = false;
  }
  get station() { return STATIONS[this.task] ?? null; }
  get nearStation() { return !!this.station && this.altitude < 0.4 && Math.hypot(this.x - this.station.x, this.z - this.station.z) < 2; }
  get nearbyChair() {
    if (this.altitude > 0.25) return null;
    return CHAIRS.filter(c => Math.hypot(this.x - c.x, this.z - c.z) < 1.8)
      .sort((a, b) => Math.hypot(this.x - a.x, this.z - a.z) - Math.hypot(this.x - b.x, this.z - b.z))[0] ?? null;
  }
  get eyeHeight() { return (this.seated === null ? 1.65 : 1.22) + this.altitude; }
  jump() {
    if (!this.grounded || this.seated !== null || this.complete) return false;
    this.verticalSpeed = 6.2; this.grounded = false; this.glideRemaining = 1; return true;
  }
  stepFlight(dt, glide) {
    if (this.seated !== null) return;
    const support = OBSTACLES.filter(o => Math.abs(this.x - o.x) < o.halfX && Math.abs(this.z - o.z) < o.halfZ && this.altitude >= o.height - 0.02)
      .reduce((height, o) => Math.max(height, o.height), 0);
    if (this.altitude > support + 0.02) this.grounded = false;
    this.gliding = !this.grounded && glide && this.verticalSpeed <= 0 && this.glideRemaining > 0;
    if (!this.grounded) {
      if (this.gliding) { this.glideRemaining = Math.max(0, this.glideRemaining - dt); this.verticalSpeed = Math.max(-0.7, this.verticalSpeed - 2 * dt); }
      else this.verticalSpeed -= 12 * dt;
      this.altitude += this.verticalSpeed * dt;
      if (this.altitude > 2.2) { this.altitude = 2.2; this.verticalSpeed = Math.min(0, this.verticalSpeed); }
      if (this.altitude <= support) { this.altitude = support; this.verticalSpeed = 0; this.grounded = true; this.glideRemaining = 1; this.gliding = false; }
    }
  }
  toggleSeat() {
    if (this.complete) return false;
    if (this.seated !== null) {
      const candidates = [this.standPoint, ...[0, Math.PI / 2, Math.PI, -Math.PI / 2].map(a => ({ x: this.x + Math.cos(a) * 1.2, z: this.z + Math.sin(a) * 1.2 }))];
      const point = candidates.find(p => p && this.canPlayerStand(p.x, p.z));
      if (!point) return false;
      this.x = point.x; this.z = point.z; this.seated = null; this.standPoint = null; return true;
    }
    const chair = this.nearbyChair;
    if (!chair || this.occupiedChairs.has(chair.id)) return false;
    this.standPoint = { x: this.x, z: this.z }; this.seated = chair.id;
    this.x = chair.x; this.z = chair.z; this.yaw = 0; this.pitch = -0.03; return true;
  }
  throwMug() {
    if (this.complete || this.mugCooldown > 0) return false;
    const dx = -Math.sin(this.yaw) * Math.cos(this.pitch), dy = Math.sin(this.pitch), dz = -Math.cos(this.yaw) * Math.cos(this.pitch);
    this.projectiles.push({ id: ++this.nextMug, x: this.x + dx * 0.6 + Math.cos(this.yaw) * 0.27,
      y: Math.max(1.28, this.eyeHeight - 0.2), z: this.z + dz * 0.6 - Math.sin(this.yaw) * 0.27,
      vx: dx * 11, vy: dy * 11 + 1.7, vz: dz * 11, age: 0, hitWorkers: new Set() });
    this.projectiles = this.projectiles.slice(-12); this.mugCooldown = 0.2; return true;
  }
  stepMugs(dt) {
    this.mugCooldown = Math.max(0, this.mugCooldown - dt); if (this.mugCooldown < 1e-6) this.mugCooldown = 0;
    this.impacts = []; this.hits = [];
    for (const mug of this.projectiles) {
      const oldX = mug.x, oldZ = mug.z, oldY = mug.y; mug.age += dt; mug.vy -= 9.8 * dt;
      mug.x += mug.vx * dt; mug.y += mug.vy * dt; mug.z += mug.vz * dt;
      // Swept body collision catches fast mugs between frames; each mug hits a coworker once.
      for (const worker of this.workerPositions) {
        if (mug.hitWorkers.has(worker.id)) continue;
        const dx = mug.x - oldX, dz = mug.z - oldZ;
        const t = Math.max(0, Math.min(1, ((worker.x - oldX) * dx + (worker.z - oldZ) * dz) / (dx * dx + dz * dz || 1)));
        const y = oldY + (mug.y - oldY) * t;
        const seated = this.occupiedChairs.has(worker.chairId);
        if (y < 0.35 || y > (seated ? 1.85 : 2.1) || Math.hypot(oldX + dx * t - worker.x, oldZ + dz * t - worker.z) > 0.42) continue;
        mug.hitWorkers.add(worker.id); this.hits.push({ workerId: worker.id, mugId: mug.id });
        this.impacts.push({ x: worker.x, z: worker.z, kind: 'worker' });
        mug.vx *= -0.25; mug.vz *= -0.25; mug.vy = 1.5;
        break;
      }
      if (Math.abs(mug.x) > 12.7) { mug.x = Math.sign(mug.x) * 12.7; mug.vx *= -0.4; this.impacts.push({ x: mug.x, z: mug.z, kind: 'wall' }); }
      if (Math.abs(mug.z) > 9.7) { mug.z = Math.sign(mug.z) * 9.7; mug.vz *= -0.4; this.impacts.push({ x: mug.x, z: mug.z, kind: 'wall' }); }
      if (mug.y > 3.8) { mug.y = 3.8; mug.vy = -Math.abs(mug.vy) * 0.3; }
      const table = OBSTACLES.find(o => mug.y < 1.14 && oldY >= 1.14 && Math.abs(mug.x - o.x) < o.halfX && Math.abs(mug.z - o.z) < o.halfZ);
      if (table) { mug.y = 1.14; mug.vy = Math.abs(mug.vy) * 0.3; mug.vx *= 0.5; mug.vz *= 0.5; this.impacts.push({ x: mug.x, z: mug.z, kind: 'desk' }); }
      if (mug.y < 0.13) {
        mug.y = 0.13; if (Math.abs(mug.vy) > 1) this.impacts.push({ x: mug.x, z: mug.z, kind: 'floor' });
        mug.vy = Math.abs(mug.vy) > 0.7 ? Math.abs(mug.vy) * 0.3 : 0; mug.vx *= 0.75; mug.vz *= 0.75;
      }
    }
    this.projectiles = this.projectiles.filter(mug => mug.age < 4);
  }
  canStand(x, z) {
    const radius = 0.32;
    return Math.abs(x) <= OFFICE_BOUNDS.x && Math.abs(z) <= OFFICE_BOUNDS.z && !OBSTACLES.some(o =>
      Math.abs(x - o.x) < o.halfX + radius && Math.abs(z - o.z) < o.halfZ + radius);
  }
  canPlayerStand(x, z) {
    const floorClear = Math.abs(x) <= OFFICE_BOUNDS.x && Math.abs(z) <= OFFICE_BOUNDS.z && !OBSTACLES.some(o =>
      this.altitude < o.height - 0.02 && Math.abs(x - o.x) < o.halfX + 0.32 && Math.abs(z - o.z) < o.halfZ + 0.32);
    return floorClear && (this.altitude > 1.8 || !this.workerPositions.some(w => Math.hypot(w.x - x, w.z - z) < 0.55));
  }
  look(dx, dy) { this.yaw -= dx * 0.002; this.pitch = Math.max(-1.2, Math.min(1.2, this.pitch - dy * 0.002)); }
  tick(dt, { forward = 0, right = 0, sprint = false, work = false, glide = false } = {}) {
    dt = Math.max(0, Math.min(dt, 0.05));
    if (this.complete) return false;
    this.stepMugs(dt);
    this.elapsed += dt;
    const norm = Math.max(1, Math.hypot(forward, right));
    const speed = (sprint ? 5.5 : 3.2) * dt / norm;
    const dx = (right * Math.cos(this.yaw) - forward * Math.sin(this.yaw)) * speed;
    const dz = (-forward * Math.cos(this.yaw) - right * Math.sin(this.yaw)) * speed;
    if (this.seated === null) {
      if (this.canPlayerStand(this.x + dx, this.z)) this.x += dx;
      if (this.canPlayerStand(this.x, this.z + dz)) this.z += dz;
    }
    this.stepFlight(dt, glide);
    if (work && this.nearStation) {
      this.progress += dt;
      if (this.progress >= 1.5) { this.task++; this.progress = 0; this.complete = this.task === STATIONS.length; return true; }
    } else this.progress = 0;
    return false;
  }
}
