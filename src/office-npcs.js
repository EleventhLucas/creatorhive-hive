import { CHAIRS, OFFICE_BOUNDS } from './office-game.js';

// Small floor-grid BFS routes around desks and chairs without a navmesh asset.
export function findOfficePath(game, start, goal, blocked = () => false) {
  const step = 0.5, cols = 51, rows = 39;
  const cell = p => ({ x: Math.max(0, Math.min(cols - 1, Math.round((p.x + OFFICE_BOUNDS.x) / step))),
    z: Math.max(0, Math.min(rows - 1, Math.round((p.z + OFFICE_BOUNDS.z) / step))) });
  const point = c => ({ x: c.x * step - OFFICE_BOUNDS.x, z: c.z * step - OFFICE_BOUNDS.z });
  const key = c => c.z * cols + c.x;
  const origin = cell(start), destination = cell(goal), queue = [origin], parents = new Map([[key(origin), null]]);
  for (let i = 0; i < queue.length; i++) {
    const current = queue[i];
    if (key(current) === key(destination)) {
      const route = []; let cursor = current;
      while (cursor) { route.push(point(cursor)); cursor = parents.get(key(cursor)); }
      route.reverse(); if (game.canStand(goal.x, goal.z)) route.push({ ...goal }); return route;
    }
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const next = { x: current.x + dx, z: current.z + dz };
      if (next.x < 0 || next.x >= cols || next.z < 0 || next.z >= rows || parents.has(key(next))) continue;
      const p = point(next);
      if (!game.canStand(p.x, p.z) || (blocked(p) && key(next) !== key(destination))) continue;
      parents.set(key(next), current); queue.push(next);
    }
  }
  return [];
}

const BREAK_SPOTS = [
  { x: 9.3, z: 5.8, activity: 'drinking' },
  { x: -6, z: 6, activity: 'chatting' },
  { x: -10.7, z: 3.5, activity: 'standing' },
  { x: 9.5, z: -6, activity: 'standing' },
];

export class OfficeCoworkers {
  constructor(game, { random = Math.random } = {}) { this.game = game; this.random = random; this.reset(); }
  reset() {
    this.workers = [1, 2, 4, 3, 5].map((chairId, id) => {
      const chair = CHAIRS[chairId], sitting = id < 3;
      return { id, chairId, x: sitting ? chair.x : id === 3 ? 6 : -6, z: sitting ? chair.z : id === 3 ? 2 : 6,
        yaw: sitting ? Math.PI : 0, state: sitting ? 'working' : 'standing', timer: 4 + id * 1.6 + this.random() * 4,
        walkDistance: 0, path: [], destination: null, returning: false, onBreak: false, blockedTime: 0,
        reactionCooldown: 0, saved: null };
    });
    this.syncChairs();
  }
  isSeated(worker) { return worker.state === 'working' || (worker.state === 'reacting' && worker.saved?.state === 'working'); }
  syncChairs() {
    this.game.occupiedChairs = new Set(this.workers.filter(w => this.isSeated(w)).map(w => w.chairId));
    this.game.workerPositions = this.workers;
  }
  approach(worker) { const c = CHAIRS[worker.chairId]; return { x: c.x, z: c.z + 1.15 }; }
  route(worker, target, returning = false) {
    worker.destination = target; worker.returning = returning; worker.state = 'walking'; worker.blockedTime = 0;
    worker.path = findOfficePath(this.game, worker, target);
  }
  blocked(worker, x, z) {
    return Math.hypot(this.game.x - x, this.game.z - z) < 0.62 || this.workers.some(other => other !== worker && Math.hypot(other.x - x, other.z - z) < 0.52);
  }
  arrive(worker) {
    if (worker.returning) {
      if (this.game.seated === worker.chairId) { worker.state = 'waiting'; worker.timer = 2; return; }
      const chair = CHAIRS[worker.chairId]; worker.x = chair.x; worker.z = chair.z; worker.yaw = Math.PI;
      worker.state = 'working'; worker.onBreak = false; worker.timer = 8 + this.random() * 10;
    } else {
      worker.state = worker.destination.activity; worker.onBreak = true; worker.timer = 3 + this.random() * 4;
      worker.yaw = worker.state === 'drinking' ? 0 : Math.atan2(-worker.x, -worker.z);
    }
  }
  tick(dt, impacts = []) {
    dt = Math.max(0, Math.min(dt, 0.05));
    for (const worker of this.workers) {
      worker.reactionCooldown = Math.max(0, worker.reactionCooldown - dt);
      const impact = impacts.find(p => Math.hypot(worker.x - p.x, worker.z - p.z) < 3);
      if (impact && !worker.reactionCooldown && worker.state !== 'reacting') {
        worker.saved = { state: worker.state, timer: worker.timer, yaw: worker.yaw };
        worker.state = 'reacting'; worker.timer = 1.4; worker.reactionCooldown = 6;
        worker.yaw = Math.atan2(impact.x - worker.x, impact.z - worker.z);
      }
      worker.timer -= dt;
      if (worker.state === 'reacting') {
        if (worker.timer <= 0) { Object.assign(worker, worker.saved); worker.saved = null; }
        continue;
      }
      if (worker.state === 'walking') {
        if (!worker.path.length) {
          if (Math.hypot(worker.x - worker.destination.x, worker.z - worker.destination.z) < 0.25) this.arrive(worker);
          else worker.path = findOfficePath(this.game, worker, worker.destination);
          continue;
        }
        const target = worker.path[0], dx = target.x - worker.x, dz = target.z - worker.z, distance = Math.hypot(dx, dz);
        if (distance < 0.08) { worker.path.shift(); continue; }
        const step = Math.min(distance, dt * (1.05 + worker.id * 0.08));
        const x = worker.x + dx / distance * step, z = worker.z + dz / distance * step;
        if (this.game.canStand(x, z) && !this.blocked(worker, x, z)) {
          worker.x = x; worker.z = z; worker.walkDistance += step; worker.yaw = Math.atan2(dx, dz); worker.blockedTime = 0;
        } else {
          worker.blockedTime += dt;
          if (worker.blockedTime > 1.3) {
            worker.path = findOfficePath(this.game, worker, worker.destination, p => this.blocked(worker, p.x, p.z)); worker.blockedTime = 0;
          }
        }
        continue;
      }
      if (worker.timer > 0) continue;
      if (worker.state === 'working') {
        const target = this.approach(worker);
        if (this.blocked(worker, target.x, target.z)) { worker.timer = 0.5; continue; }
        worker.x = target.x; worker.z = target.z; worker.state = 'standing'; worker.timer = 1.2; worker.onBreak = false;
      } else if (worker.state === 'waiting' || worker.onBreak) {
        this.route(worker, this.approach(worker), true);
      } else {
        const target = BREAK_SPOTS[Math.floor(this.random() * BREAK_SPOTS.length)];
        this.route(worker, target);
      }
    }
    this.syncChairs();
  }
}
