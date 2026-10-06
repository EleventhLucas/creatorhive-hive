// Converts observable simulation changes into sound; no audio logic in the simulation.
export function createOfficeSoundscape({ audio, random = Math.random }) {
  let previous, steps = 0, workTimer = 0, flutterTimer = 0, ambientTimer = 1;
  const workerStates = new Map();
  const snapshot = game => ({ x: game.x, z: game.z, grounded: game.grounded, gliding: game.gliding,
    seated: game.seated, mug: game.nextMug, cooldown: game.mugCooldown, task: game.task });
  function reset(game, workers) {
    previous = snapshot(game); steps = 0; workTimer = 0; flutterTimer = 0; ambientTimer = 0.8 + random();
    workerStates.clear(); for (const worker of workers) workerStates.set(worker.id, worker.state);
  }
  function at(name, point, game, gain = 1) {
    const dx = point.x - game.x, dz = point.z - game.z, distance = Math.hypot(dx, dz);
    const pan = (dx * Math.cos(game.yaw) - dz * Math.sin(game.yaw)) / Math.max(1, distance);
    audio.play(name, { distance, pan, gain });
  }
  function tick(dt, game, workers) {
    if (!previous) { reset(game, workers); return; }
    if (previous.grounded && !game.grounded && game.verticalSpeed > 0) audio.play('jump');
    if (!previous.grounded && game.grounded) audio.play('land');
    flutterTimer -= dt;
    if (game.gliding && (!previous.gliding || flutterTimer <= 0)) { audio.play('glide'); flutterTimer = 0.24; }
    if (previous.seated !== game.seated) {
      audio.play(game.seated === null ? 'stand' : 'sit'); steps = 0;
    } else if (game.grounded && game.seated === null && previous.grounded) {
      steps += Math.hypot(game.x - previous.x, game.z - previous.z);
      if (steps >= 0.85) { audio.play('step'); steps %= 0.85; }
    }
    if (game.nextMug > previous.mug) audio.play('throw');
    if (previous.cooldown > 0 && game.mugCooldown === 0) audio.play('refill');
    const impactCues = { floor: 'mugFloor', wall: 'mugWall', desk: 'mugDesk' };
    for (const impact of game.impacts) if (impactCues[impact.kind]) at(impactCues[impact.kind], impact, game);
    for (const hit of game.hits) {
      const worker = workers.find(w => w.id === hit.workerId); if (worker) at('hit', worker, game);
    }
    workTimer -= dt;
    if (game.progress > 0 && workTimer <= 0) {
      audio.play(['reports', 'printer', 'archive', 'cooler'][game.task]); workTimer = 0.32 + random() * 0.1;
    } else if (!game.progress) workTimer = 0;
    if (game.task > previous.task) audio.play(game.complete ? 'shiftComplete' : 'taskComplete');
    for (const worker of workers) {
      const before = workerStates.get(worker.id);
      if (before !== worker.state) {
        if (worker.state === 'down') at(worker.deathStyle, worker, game);
        else if (before === 'down') at('respawn', worker, game);
        else if (worker.state === 'reacting') at('react', worker, game, 0.7);
        else if (worker.state === 'drinking') at('sip', worker, game, 0.6);
        else if (worker.state === 'chatting') at('chatter', worker, game, 0.6);
        else if (worker.state === 'working') at('sit', worker, game, 0.5);
        else if (before === 'working' && worker.state === 'standing') at('stand', worker, game, 0.5);
      }
      workerStates.set(worker.id, worker.state);
    }
    ambientTimer -= dt;
    if (ambientTimer <= 0 && !game.complete) {
      const nearby = workers.filter(w => w.state !== 'down' && Math.hypot(w.x - game.x, w.z - game.z) < 12);
      if (nearby.length) {
        const worker = nearby[Math.floor(random() * nearby.length)];
        const cue = { working: 'typing', chatting: 'chatter', drinking: 'sip', walking: 'step' }[worker.state] ?? 'buzz';
        at(cue, worker, game, 0.4);
      }
      ambientTimer = 0.6 + random() * 1.2;
    }
    previous = snapshot(game);
  }
  return { reset, tick };
}
