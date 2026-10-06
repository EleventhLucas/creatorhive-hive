import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OfficeGame, STATIONS, OFFICE_BOUNDS, CHAIRS } from '../src/games/worker-bee/simulation.js';

test('office walking stops at desks and room boundaries', () => {
  const game = new OfficeGame(); game.x = -7; game.z = -3;
  for (let i = 0; i < 100; i++) game.tick(0.05, { forward: 1, sprint: true });
  assert.ok(game.z > -4.03, 'desk must stop forward walking');
  assert.ok(game.canStand(game.x, game.z));
  game.x = 0; game.z = 8;
  for (let i = 0; i < 200; i++) game.tick(0.05, { right: 1, sprint: true });
  assert.ok(game.x <= OFFICE_BOUNDS.x); assert.ok(game.canStand(game.x, game.z));
});
test('chair sitting blocks walking, allows computer work, and returns to a safe standing point', () => {
  const game = new OfficeGame(); game.x = -8; game.z = -2.9;
  const before = { x: game.x, z: game.z };
  assert.equal(game.toggleSeat(), true); assert.equal(game.seated, 0);
  assert.equal(game.x, CHAIRS[0].x); assert.equal(game.z, CHAIRS[0].z); assert.ok(game.eyeHeight < 1.65);
  game.tick(0.05, { forward: 1, right: 1 }); assert.equal(game.x, CHAIRS[0].x); assert.equal(game.z, CHAIRS[0].z);
  for (let i = 0; i < 30; i++) game.tick(0.05, { work: true }); assert.equal(game.task, 1);
  assert.equal(game.toggleSeat(), true); assert.equal(game.seated, null); assert.equal(game.eyeHeight, 1.65);
  assert.deepEqual({ x: game.x, z: game.z }, before); assert.ok(game.canStand(game.x, game.z));
  game.occupiedChairs.add(0); assert.equal(game.toggleSeat(), false, 'occupied chairs cannot be used');
});
test('mugs aim with the view, refill in 0.2 seconds, bounce inside the office, and expire', () => {
  const game = new OfficeGame(); game.pitch = 0.3;
  assert.equal(game.throwMug(), true); assert.equal(game.throwMug(), false); assert.equal(game.projectiles.length, 1);
  assert.ok(game.projectiles[0].vy > 1.7); assert.ok(game.projectiles[0].vz < 0);
  for (let i = 0; i < 3; i++) game.tick(0.05); assert.equal(game.throwMug(), false);
  game.tick(0.05); assert.equal(game.mugCooldown, 0); assert.equal(game.throwMug(), true);
  for (let i = 0; i < 82; i++) game.tick(0.05);
  assert.equal(game.projectiles.length, 0);
  game.z = -9; game.yaw = 0; game.pitch = 0; game.throwMug();
  game.tick(0.05); assert.ok(game.projectiles[0].z >= -9.7); assert.ok(game.projectiles[0].vz > 0, 'wall impact reverses the mug');
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
test('jumping gives one second of glide, cannot double-jump, and recharges on landing', () => {
  const plain = new OfficeGame(), glide = new OfficeGame();
  assert.equal(plain.jump(), true); assert.equal(glide.jump(), true); assert.equal(glide.jump(), false);
  let glideTime = 0, peak = 0;
  for (let i = 0; i < 24; i++) {
    plain.tick(0.05); glide.tick(0.05, { glide: true });
    peak = Math.max(peak, glide.altitude); if (glide.gliding) glideTime += 0.05;
  }
  assert.equal(plain.grounded, true); assert.ok(glide.altitude > 0, 'glide extends airtime'); assert.ok(peak < 2.2);
  for (let i = 0; i < 70; i++) { glide.tick(0.05, { glide: true }); if (glide.gliding) glideTime += 0.05; }
  assert.ok(glideTime <= 1.05); assert.equal(glide.altitude, 0); assert.equal(glide.grounded, true); assert.equal(glide.glideRemaining, 1);
  glide.x = -8; glide.z = -2.9; glide.toggleSeat(); assert.equal(glide.jump(), false, 'cannot jump from a seated pose');
});
test('bee flight lands on a desk without falling through its surface', () => {
  const landing = new OfficeGame(); landing.x = -8; landing.z = -5; landing.altitude = 1.5; landing.verticalSpeed = -1; landing.grounded = false;
  for (let i = 0; i < 20; i++) landing.tick(0.05);
  assert.equal(landing.altitude, 1.04); assert.equal(landing.grounded, true); assert.ok(landing.eyeHeight <= 3.85);
});
