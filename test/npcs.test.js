import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OfficeGame, CHAIRS } from '../src/office-game.js';
import { OfficeCoworkers, findOfficePath } from '../src/office-npcs.js';

function randomSource() { let seed = 97; return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
test('coworker paths route around furniture using reachable floor points', () => {
  const game = new OfficeGame(), start = { x: -8, z: -2.9 }, goal = { x: 9.3, z: 5.8 };
  const path = findOfficePath(game, start, goal);
  assert.ok(path.length > 2); assert.ok(path.every(p => game.canStand(p.x, p.z)));
  assert.deepEqual(path.at(-1), goal);
});
test('coworkers work, stand, walk, take breaks, and reserve occupied chairs', () => {
  const game = new OfficeGame(), crew = new OfficeCoworkers(game, { random: randomSource() });
  assert.deepEqual([...game.occupiedChairs], [1, 2, 4]); assert.ok(!game.occupiedChairs.has(0), 'leave the report desk available to the player');
  const seen = new Set();
  for (let i = 0; i < 3600; i++) {
    crew.tick(0.05);
    for (const w of crew.workers) {
      seen.add(w.state);
      assert.ok(crew.isSeated(w) || game.canStand(w.x, w.z), 'workers cannot walk through desks or walls');
      assert.equal(game.occupiedChairs.has(w.chairId), crew.isSeated(w));
    }
  }
  assert.ok(seen.has('working') && seen.has('standing') && seen.has('walking'));
  assert.ok(seen.has('drinking') && seen.has('chatting'), 'workers should reach their break destinations');
  assert.ok(crew.workers.every(w => w.walkDistance > 1), 'all coworkers eventually leave their desk');
});
test('coworkers react to nearby mug impacts and return to what they were doing', () => {
  const game = new OfficeGame(), crew = new OfficeCoworkers(game, { random: randomSource() });
  const worker = crew.workers[0], before = worker.state;
  crew.tick(0.05, [{ x: worker.x + 1, z: worker.z }]); assert.equal(worker.state, 'reacting');
  assert.ok(game.occupiedChairs.has(worker.chairId), 'reacting workers keep their seated reservation');
  for (let i = 0; i < 30; i++) crew.tick(0.05);
  assert.equal(worker.state, before);
});
test('coworkers wait instead of taking a chair occupied by the player', () => {
  const game = new OfficeGame(), crew = new OfficeCoworkers(game, { random: randomSource() });
  const worker = crew.workers[0], chair = CHAIRS[worker.chairId];
  game.seated = chair.id; game.x = chair.x; game.z = chair.z;
  worker.state = 'walking'; worker.returning = true; worker.destination = crew.approach(worker); worker.path = [];
  worker.x = worker.destination.x; worker.z = worker.destination.z;
  crew.tick(0.05); assert.equal(worker.state, 'waiting'); assert.ok(!game.occupiedChairs.has(chair.id));
  game.seated = null; game.x = 0; game.z = 8;
  for (let i = 0; i < 70; i++) crew.tick(0.05);
  assert.equal(worker.state, 'working'); assert.ok(game.occupiedChairs.has(chair.id));
});
