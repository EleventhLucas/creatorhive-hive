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
test('NPCs pass through each other while still avoiding the player', () => {
  const game = new OfficeGame(), crew = new OfficeCoworkers(game, { random: randomSource() });
  const first = crew.workers[0], second = crew.workers[1]; second.x = 2; second.z = 3;
  assert.equal(crew.blocked(first, second.x, second.z), false);
  assert.equal(crew.blocked(first, game.x, game.z), true);
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
test('rapid direct hits trigger each random knockdown style and safe respawn', () => {
  for (const [random, style, threshold] of [[0, 'crumple', 2], [0.5, 'ragdoll', 4], [0.99, 'burst', 5]]) {
    const game = new OfficeGame(), crew = new OfficeCoworkers(game, { random: () => random });
    const worker = crew.workers[0];
    assert.equal(worker.hitThreshold, threshold);
    crew.tick(0.05, [{ x: worker.x, z: worker.z }]);
    assert.equal(worker.hitTimes.length, 0, 'nearby floor impacts do not count as hits');
    for (let i = 0; i < threshold - 1; i++) crew.tick(0.05, [], [{ workerId: worker.id }]);
    assert.notEqual(worker.state, 'down');
    crew.tick(0.05, [], [{ workerId: worker.id }]);
    assert.equal(worker.state, 'down'); assert.equal(worker.deathStyle, style);
    assert.ok(!game.occupiedChairs.has(worker.chairId)); assert.ok(!game.workerPositions.includes(worker));
    for (let i = 0; i < 53; i++) crew.tick(0.05);
    assert.equal(worker.state, 'standing'); assert.ok(game.canStand(worker.x, worker.z));
    assert.ok(Math.hypot(worker.x - game.x, worker.z - game.z) > 1);
    assert.equal(worker.hitTimes.length, 0); assert.ok(game.workerPositions.includes(worker));
  }
});
test('hits outside the four second succession window do not stack', () => {
  const crew = new OfficeCoworkers(new OfficeGame(), { random: () => 0 });
  crew.hit(0); for (let i = 0; i < 81; i++) crew.tick(0.05);
  crew.hit(0); assert.notEqual(crew.workers[0].state, 'down'); assert.equal(crew.workers[0].hitTimes.length, 1);
});
test('fast mugs hit a coworker between frames and cannot count twice', () => {
  const game = new OfficeGame(); game.workerPositions = [{ id: 7, chairId: 0, x: 0, z: 0 }];
  game.projectiles = [{ id: 1, x: 0, y: 1.5, z: 0.5, vx: 0, vy: 0, vz: -20, age: 0, hitWorkers: new Set() }];
  game.stepMugs(0.05); assert.deepEqual(game.hits, [{ workerId: 7, mugId: 1 }]);
  for (let i = 0; i < 10; i++) { game.stepMugs(0.05); assert.equal(game.hits.length, 0); }
});
