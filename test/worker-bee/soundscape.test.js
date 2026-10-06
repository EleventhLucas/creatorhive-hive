import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OfficeGame } from '../../src/games/worker-bee/simulation.js';
import { OfficeCoworkers } from '../../src/games/worker-bee/npcs.js';
import { createOfficeSoundscape } from '../../src/games/worker-bee/features/audio/soundscape.js';

function setup() {
  const game = new OfficeGame(), crew = new OfficeCoworkers(game, { random: () => 0 }), events = [];
  const soundscape = createOfficeSoundscape({ audio: { play(name, options) { events.push({ name, options }); } }, random: () => 0 });
  soundscape.reset(game, crew.workers);
  const tick = (dt = 0.05) => soundscape.tick(dt, game, crew.workers);
  return { game, crew, events, soundscape, tick, names: () => events.map(event => event.name) };
}
test('movement, seating, mug refill, and glide produce event sounds without idle repeats', () => {
  const { game, tick, names } = setup();
  tick(); assert.deepEqual(names(), []);
  game.x += 0.9; tick(); assert.ok(names().includes('step'));
  game.jump(); game.tick(0.05); tick(); assert.ok(names().includes('jump'));
  game.gliding = true; tick(); assert.ok(names().includes('glide'));
  game.grounded = true; game.gliding = false; tick(); assert.ok(names().includes('land'));
  game.seated = 0; tick(); game.seated = null; tick(); assert.ok(names().includes('sit') && names().includes('stand'));
  game.throwMug(); tick(); assert.ok(names().includes('throw'));
  game.mugCooldown = 0; tick(); assert.ok(names().includes('refill'));
  const count = names().length; tick(); assert.equal(names().length, count);
});
test('different stations, surface impacts, and task/shift completion have distinct sounds', () => {
  const { game, tick, names, soundscape, crew } = setup();
  for (let task = 0; task < 4; task++) { game.task = task; soundscape.reset(game, crew.workers); game.progress = 0.1; tick(); }
  for (const cue of ['reports', 'printer', 'archive', 'cooler']) assert.ok(names().includes(cue), cue);
  game.impacts = ['floor', 'wall', 'desk', 'worker'].map(kind => ({ kind, x: 1, z: 2 })); tick();
  for (const cue of ['mugFloor', 'mugWall', 'mugDesk']) assert.ok(names().includes(cue));
  game.impacts = []; game.task = 0; soundscape.reset(game, crew.workers); game.task = 1; tick();
  assert.ok(names().includes('taskComplete'));
  game.task = 4; game.complete = true; tick(); assert.ok(names().includes('shiftComplete'));
});
test('coworker hits, knockdowns, and respawns sound once at the correct location', () => {
  for (const style of ['crumple', 'ragdoll', 'burst']) {
    const { game, crew, tick, events, names } = setup();
    const worker = crew.workers[0]; worker.x = 4; worker.z = 8;
    game.hits = [{ workerId: worker.id }]; tick();
    assert.equal(events[0].name, 'hit'); assert.equal(events[0].options.distance, 4); assert.equal(events[0].options.pan, 1);
    game.hits = []; worker.state = 'down'; worker.deathStyle = style; tick(); tick();
    assert.equal(names().filter(name => name === style).length, 1);
    worker.state = 'standing'; tick(); assert.ok(names().includes('respawn'));
  }
});
test('occasional coworker ambience follows activity and stays out of completed shifts', () => {
  const { game, crew, tick, names } = setup();
  game.x = crew.workers[0].x; game.z = crew.workers[0].z;
  for (let i = 0; i < 17; i++) tick(); assert.ok(names().includes('typing'));
  const before = names().length; game.complete = true;
  for (let i = 0; i < 40; i++) tick(); assert.equal(names().length, before);
});
