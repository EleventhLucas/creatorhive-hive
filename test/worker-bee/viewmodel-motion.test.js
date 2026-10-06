import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ViewmodelMotion } from '../../src/games/worker-bee/features/viewmodel-motion.js';

test('mouse velocity and walking move the held items, settle at rest, and respect disabled motion', () => {
  const motion = new ViewmodelMotion(), input = { distance: 0.5, strength: 1, moving: true, vx: 3, vz: -2, yaw: 0 };
  motion.look(30, 10); const pose = { ...motion.step(0.05, input) };
  assert.ok(pose.x < 0); assert.notEqual(pose.y, 0); assert.ok(pose.ry < 0); assert.notEqual(pose.rz, 0);
  for (let i = 0; i < 100; i++) motion.step(0.05, { ...input, moving: false, vx: 0, vz: 0 });
  assert.ok(Object.values(motion.pose).every(value => Math.abs(value) < 0.0001));
  motion.look(99999, -99999); motion.step(0.05, input); assert.ok(Math.abs(motion.pose.x) < 0.1);
  assert.ok(Object.values(motion.step(0.05, { ...input, strength: 0 })).every(value => value === 0));
});
