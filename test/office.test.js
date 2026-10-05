import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OfficeGame, STATIONS, OFFICE_BOUNDS } from '../src/office-game.js';

test('office walking stops at desks and room boundaries', () => {
  const game = new OfficeGame(); game.x = -7; game.z = -3;
  for (let i = 0; i < 100; i++) game.tick(0.05, { forward: 1, sprint: true });
  assert.ok(game.z > -4.03, 'desk must stop forward walking');
  assert.ok(game.canStand(game.x, game.z));
  game.x = 0; game.z = 8;
  for (let i = 0; i < 200; i++) game.tick(0.05, { right: 1, sprint: true });
  assert.ok(game.x <= OFFICE_BOUNDS.x); assert.ok(game.canStand(game.x, game.z));
});
test('diagonal walking is normalized and looking rotates movement', () => {
  const straight = new OfficeGame(), diagonal = new OfficeGame();
  straight.tick(0.05, { forward: 1 }); diagonal.tick(0.05, { forward: 1, right: 1 });
  assert.ok(Math.abs(Math.hypot(straight.x, straight.z - 8) - Math.hypot(diagonal.x, diagonal.z - 8)) < 1e-10);
  const rotated = new OfficeGame(); rotated.yaw = Math.PI / 2; rotated.tick(0.05, { forward: 1 });
  assert.ok(rotated.x < 0); assert.equal(rotated.z, 8);
  rotated.look(0, 1e6); assert.equal(rotated.pitch, -1.2);
});
test('office tasks require proximity and uninterrupted work', () => {
  const game = new OfficeGame();
  for (let i = 0; i < 60; i++) game.tick(0.05, { work: true });
  assert.equal(game.task, 0); assert.equal(game.progress, 0);
  game.x = STATIONS[0].x; game.z = STATIONS[0].z;
  for (let i = 0; i < 10; i++) game.tick(0.05, { work: true });
  assert.ok(game.progress > 0); game.tick(0.05); assert.equal(game.progress, 0);
  for (const station of STATIONS) {
    assert.equal(game.station, station); game.x = station.x; game.z = station.z;
    assert.ok(game.canStand(game.x, game.z), 'task station must be reachable');
    for (let i = 0; i < 30; i++) game.tick(0.05, { work: true });
  }
  assert.equal(game.task, 4); assert.equal(game.complete, true); assert.equal(game.station, null);
  const time = game.elapsed; game.tick(0.05, { forward: 1 }); assert.equal(game.elapsed, time);
  game.reset(); assert.equal(game.shift, 2); assert.equal(game.complete, false); assert.equal(game.task, 0); assert.equal(game.elapsed, 0);
});
