export class GameSettings {
  constructor({ reducedMotion = false } = {}) {
    this.fov = 75;
    this.bobbing = reducedMotion ? 0 : 0.35;
  }
  set(key, value) {
    if (!Number.isFinite(value)) return;
    if (key === 'fov') this.fov = Math.max(55, Math.min(105, value));
    if (key === 'bobbing') this.bobbing = Math.max(0, Math.min(1, value));
  }
}

export function viewBob(distance, strength, moving) {
  if (!moving || !strength) return { height: 0, roll: 0 };
  return { height: Math.sin(distance * 9) * 0.06 * strength, roll: Math.sin(distance * 4.5) * 0.007 * strength };
}
