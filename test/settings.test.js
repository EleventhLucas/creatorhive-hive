import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameSettings, viewBob } from '../src/settings.js';

test('FOV and bobbing settings stay in usable ranges and ignore invalid values', () => {
  const settings = new GameSettings();
  settings.set('fov', 300); assert.equal(settings.fov, 105);
  settings.set('fov', 20); assert.equal(settings.fov, 55);
  settings.set('fov', NaN); assert.equal(settings.fov, 55);
  settings.set('bobbing', -1); assert.equal(settings.bobbing, 0);
  settings.set('bobbing', 9); assert.equal(settings.bobbing, 1);
  assert.equal(new GameSettings({ reducedMotion: true }).bobbing, 0);
});
test('view bobbing disappears at rest and when disabled', () => {
  assert.deepEqual(viewBob(1, 1, false), { height: 0, roll: 0 });
  assert.deepEqual(viewBob(1, 0, true), { height: 0, roll: 0 });
  const bob = viewBob(1, 1, true); assert.ok(Math.abs(bob.height) <= 0.06); assert.ok(Math.abs(bob.roll) <= 0.007);
  assert.notEqual(bob.height, 0);
});
