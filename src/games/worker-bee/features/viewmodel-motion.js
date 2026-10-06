const clamp = (value, limit) => Math.max(-limit, Math.min(limit, value));

// Spring-like lag in camera-local space, driven by actual movement and mouse velocity.
export class ViewmodelMotion {
  constructor() { this.reset(); }
  reset() { this.lookX = this.lookY = 0; this.pose = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 }; }
  look(dx, dy) { this.lookX += clamp(dx, 120); this.lookY += clamp(dy, 120); }
  step(dt, { distance, strength, moving, vx, vz, yaw }) {
    const seconds = Math.max(0.001, dt), right = vx * Math.cos(yaw) - vz * Math.sin(yaw), forward = -vx * Math.sin(yaw) - vz * Math.cos(yaw);
    const mouseX = clamp(this.lookX * 0.002 / seconds, 5), mouseY = clamp(this.lookY * 0.002 / seconds, 5);
    this.lookX = this.lookY = 0;
    const bob = moving ? strength : 0;
    const target = {
      x: clamp(-mouseX * 0.01 - right * 0.005, 0.065) * Math.min(1, strength) + Math.sin(distance * 4.5) * 0.012 * bob,
      y: clamp(mouseY * 0.008, 0.04) * Math.min(1, strength) + Math.sin(distance * 9 + 0.6) * 0.025 * bob,
      z: clamp(-forward * 0.004, 0.025) * Math.min(1, strength),
      rx: clamp(mouseY * 0.016 + forward * 0.004, 0.09) * Math.min(1, strength),
      ry: clamp(-mouseX * 0.016, 0.08) * Math.min(1, strength),
      rz: clamp(-right * 0.012, 0.07) * Math.min(1, strength) + Math.sin(distance * 4.5) * 0.015 * bob,
    };
    const blend = 1 - Math.exp(-10 * Math.max(0, dt));
    for (const key of Object.keys(this.pose)) this.pose[key] = strength ? this.pose[key] + (target[key] - this.pose[key]) * blend : 0;
    return this.pose;
  }
}
