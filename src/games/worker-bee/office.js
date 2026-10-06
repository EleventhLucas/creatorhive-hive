import * as THREE from 'three';
import { OfficeGame, DESKS, STATIONS } from './simulation.js';
import { GameSettings, viewBob } from './settings.js';
import { createMonitorMedia } from './media.js';
import { OfficeCoworkers } from './npcs.js';
import { OFFICE_PALETTE as palette } from './palette.js';
import { createSurfaceTextures } from './features/surfaces.js';
import { createTie, createHoneyMug } from './features/props.js';
import { ViewmodelMotion } from './features/viewmodel-motion.js';
import { createOfficeAudio } from './features/audio/engine.js';
import { createOfficeSoundscape } from './features/audio/soundscape.js';

export function createOffice({ renderer, container, notify, settings, openDialog = () => {}, random = Math.random, audio = createOfficeAudio() }) {
  settings ??= new GameSettings({ reducedMotion: typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches });
  const game = new OfficeGame();
  const coworkers = new OfficeCoworkers(game, { random });
  const soundscape = createOfficeSoundscape({ audio, random });
  soundscape.reset(game, coworkers.workers);
  audio.setVolume(settings.volume);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(palette.fog);
  scene.fog = new THREE.Fog(palette.fog, 22, 48);
  const camera = new THREE.PerspectiveCamera(75, 1, 0.08, 70); camera.rotation.order = 'YXZ'; scene.add(camera);
  scene.add(new THREE.HemisphereLight('#fff5e5', '#686b65', 2));
  const sunlight = new THREE.DirectionalLight('#fff0df', 2); sunlight.position.set(-9, 12, -2); scene.add(sunlight);
  const cache = new Map();
  const surfaces = createSurfaceTextures();
  function mat(color, glow = false, surface = 'paint') {
    const key = `${color}:${glow}:${surface}`;
    if (!cache.has(key)) cache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.7,
      ...(glow ? { emissive: color, emissiveIntensity: 0.7 } : { map: surfaces[surface], bumpMap: surfaces[surface], bumpScale: surface === 'fabric' ? 0.008 : 0.003 }) }));
    return cache.get(key);
  }
  function shape(geometry, color, x, y, z, parent = scene, glow = false, surface = 'paint') { const m = new THREE.Mesh(geometry, mat(color, glow, surface)); m.position.set(x, y, z); parent.add(m); return m; }
  const box = (w, h, d, color, x, y, z, parent, glow, surface) => shape(new THREE.BoxGeometry(w, h, d), color, x, y, z, parent, glow, surface);
  function ball(r, color, x, y, z, parent = scene) { return shape(new THREE.SphereGeometry(r, 12, 8), color, x, y, z, parent); }
  function rod(a, b, r, color, parent) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), delta = end.clone().sub(start);
    const m = shape(new THREE.CylinderGeometry(r, r, delta.length(), 8), color, 0, 0, 0, parent);
    m.position.copy(start.add(end).multiplyScalar(0.5)); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()); return m;
  }
  function sign(text, x, y, z, width = 3, parent = scene, accent = '#a6b5ad') {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#30373b'; ctx.fillRect(0, 0, 512, 128); ctx.strokeStyle = accent; ctx.lineWidth = 4; ctx.strokeRect(2, 2, 508, 124);
    ctx.fillStyle = '#fff5ee'; ctx.textAlign = 'center'; ctx.font = '25px monospace'; ctx.fillText(text, 256, 75);
    const texture = new THREE.CanvasTexture(canvas);
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(width, width / 4), new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })); panel.position.set(x, y, z); parent.add(panel); return panel;
  }
  box(26, 0.15, 20, palette.floor, 0, -0.08, 0, scene, false, 'fabric');
  const grid = new THREE.GridHelper(26, 26, '#92968f', '#82877f'); grid.position.y = 0.01; scene.add(grid);
  box(26, 4, 0.2, palette.walls[0], 0, 2, -10); box(26, 4, 0.2, palette.walls[1], 0, 2, 10);
  box(0.2, 4, 20, palette.walls[2], -13, 2, 0); box(0.2, 4, 20, palette.walls[3], 13, 2, 0);
  box(26, 0.15, 20, palette.ceiling, 0, 4.05, 0);
  for (const x of [-9, -3, 3, 9]) for (const z of [-5, 4]) box(2.6, 0.03, 0.2, '#fff5e4', x, 3.94, z, scene, true);
  // Sky-blue windows and hexagonal trim give the office its hive architecture.
  for (let z = -7; z <= 7; z += 4.5) {
    box(0.08, 1.7, 3.2, '#92d7f7', -12.86, 2.2, z, scene, true);
    for (const offset of [-1.7, 0, 1.7]) box(0.12, 1.9, 0.08, palette.frame, -12.78, 2.2, z + offset);
  }
  sign('CREATORHIVE // WORKER OPERATIONS', 0, 2.7, -9.87, 7);
  sign('MEETING COULD HAVE BEEN A BUZZ', 0, 2.8, 9.87, 6).rotation.y = Math.PI;
  const monitors = [];
  for (const [index, d] of DESKS.entries()) {
    const colors = palette.desks[index];
    box(3.3, 0.12, 1.3, colors.top, d.x, 0.98, d.z, scene, false, 'wood');
    for (const offset of [-1.35, 1.35]) box(0.1, 0.93, 1, palette.frame, d.x + offset, 0.46, d.z);
    box(1.1, 0.75, 0.1, palette.frame, d.x, 1.52, d.z - 0.23);
    monitors.push(box(0.94, 0.58, 0.02, '#b9d9f5', d.x, 1.54, d.z - 0.17, scene, true));
    box(0.1, 0.3, 0.1, palette.frame, d.x, 1.17, d.z - 0.23);
    box(0.85, 0.04, 0.3, '#d5d4ca', d.x, 1.06, d.z + 0.35);
    box(0.7, 0.15, 0.65, colors.chair, d.x, 0.55, d.z + 1.1, scene, false, 'fabric');
    box(0.7, 0.7, 0.12, colors.chair, d.x, 0.92, d.z + 1.4, scene, false, 'fabric');
    box(0.08, 0.5, 0.08, '#9a9f9e', d.x, 0.25, d.z + 1.1);
    // Low dividers stay inside the desk collision footprint.
    box(3.3, 0.75, 0.09, colors.divider, d.x, 1.35, d.z - 0.59);
    shape(new THREE.CylinderGeometry(0.1, 0.08, 0.2, 12), palette.accents[index], d.x + 0.9, 1.14, d.z + 0.2);
  }
  const monitorMedia = createMonitorMedia(monitors, { random });
  box(2.8, 1.05, 1.1, '#858e91', 9.5, 0.53, -8);
  box(1.2, 0.5, 0.7, '#d9d9d0', 9.5, 1.32, -8);
  box(0.85, 0.06, 0.4, '#f1ecdf', 9.5, 1.59, -7.8);
  box(2.8, 1.1, 1.1, '#aa855d', -9.5, 0.55, 8);
  for (let i = 0; i < 8; i++) {
    const hex = shape(new THREE.CylinderGeometry(0.3, 0.3, 0.14, 6), palette.folders[i % palette.folders.length], -10.45 + i % 4 * 0.63, 0.35 + Math.floor(i / 4) * 0.55, 7.38); hex.rotation.x = Math.PI / 2;
  }
  box(2.8, 1.05, 1.1, '#8a969a', 9.5, 0.53, 8);
  shape(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 12), '#dcbf6b', 9.5, 1.5, 8);
  box(0.12, 0.14, 0.35, '#606c72', 9.5, 1.3, 7.57);
  sign('NECTAR > COFFEE', 9.5, 2.7, 9.86, 3).rotation.y = Math.PI;
  const stationMarkers = STATIONS.map((s, index) => {
    const accent = palette.stations[index];
    const ring = shape(new THREE.TorusGeometry(0.65, 0.025, 6, 32), accent, s.x, 0.04, s.z, scene, true); ring.rotation.x = -Math.PI / 2;
    const label = sign(s.name, s.x, 2.7, s.z, 2.5, scene, accent);
    const pointer = shape(new THREE.ConeGeometry(0.35, 0.65, 4), accent, s.x, 2, s.z, scene, true); pointer.rotation.z = Math.PI;
    return { ring, label, pointer };
  });
  function stickBee(x, z, yaw = 0, index = 0) {
    const accent = palette.accents[index % palette.accents.length];
    const bee = new THREE.Group(); bee.position.set(x, 0, z); bee.rotation.y = yaw; scene.add(bee);
    const body = new THREE.Group(); bee.add(body);
    const arms = [], forearms = [], thighs = [], calves = [], hands = [], wings = [];
    ball(0.25, '#e9c45f', 0, 1.75, 0, body);
    for (const side of [-1, 1]) {
      ball(0.035, palette.frame, side * 0.08, 1.79, 0.23, body);
      rod([side * 0.11, 1.94, 0], [side * 0.21, 2.18, 0], 0.018, palette.frame, body); ball(0.045, '#e8c568', side * 0.21, 2.18, 0, body);
      const thigh = new THREE.Group(); thigh.position.set(side * 0.05, 0.9, 0); body.add(thigh); thighs.push(thigh);
      rod([0, 0, 0], [side * 0.1, -0.4, 0], 0.045, palette.frame, thigh);
      const calf = new THREE.Group(); calf.position.set(side * 0.1, -0.4, 0); thigh.add(calf); calves.push(calf);
      rod([0, 0, 0], [side * 0.015, -0.4, 0.03], 0.045, palette.frame, calf);
      const arm = new THREE.Group(); arm.position.set(side * 0.08, 1.42, 0); body.add(arm); arms.push(arm);
      rod([0, 0, 0], [side * 0.26, -0.3, 0.02], 0.035, palette.frame, arm);
      const forearm = new THREE.Group(); forearm.position.set(side * 0.26, -0.3, 0.02); arm.add(forearm); forearms.push(forearm);
      rod([0, 0, 0], [-side * 0.08, -0.24, 0.08], 0.035, palette.frame, forearm);
      const hand = new THREE.Group(); hand.position.set(-side * 0.08, -0.24, 0.08); forearm.add(hand); ball(0.05, '#e9c45f', 0, 0, 0, hand); hands.push(hand);
      const wing = ball(0.3, palette.wings[index % palette.wings.length], side * 0.22, 1.3, -0.17, body); wing.scale.set(0.65, 1, 0.12); wings.push(wing);
    }
    rod([0, 0.9, 0], [0, 1.51, 0], 0.055, palette.frame, body);
    const abdomen = ball(0.23, '#e9c45f', 0, 1.03, -0.02, body); abdomen.scale.set(0.8, 1.35, 0.8);
    for (const y of [0.92, 1.09]) shape(new THREE.CylinderGeometry(0.18, 0.18, 0.07, 12), palette.frame, 0, y, -0.02, body);
    body.add(createTie(mat(accent)));
    return { root: bee, body, arms, forearms, thighs, calves, hands, wings };
  }
  const deathBursts = coworkers.workers.map(() => {
    const group = new THREE.Group(); group.visible = false; scene.add(group);
    for (let i = 0; i < 12; i++) shape(new THREE.OctahedronGeometry(0.09), palette.accents[i % palette.accents.length], 0, 0, 0, group);
    return group;
  });
  const colleagues = coworkers.workers.map(worker => { const model = stickBee(worker.x, worker.z, worker.yaw, worker.id); model.root.name = `worker-bee-${worker.id}`; return model; });
  for (const x of [-11.5, 11.5]) {
    shape(new THREE.CylinderGeometry(0.3, 0.2, 0.5, 6), '#ac795d', x, 0.25, 1.8);
    rod([x, 0.4, 1.8], [x, 1.5, 1.8], 0.04, '#729453', scene);
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; const petal = ball(0.18, x < 0 ? '#dbaa68' : '#d793a1', x + Math.cos(a) * 0.24, 1.5, 1.8 + Math.sin(a) * 0.24); petal.scale.y = 0.4; }
  }
  const viewmodel = new THREE.Group(); viewmodel.name = 'player-hands-and-mug'; camera.add(viewmodel);
  const itemMotion = new ViewmodelMotion();
  // Visible stick forearms and a nectar mug: an office worker, not a weapon.
  rod([0.36, -0.6, -0.4], [0.28, -0.37, -0.65], 0.035, '#deb953', viewmodel);
  rod([-0.35, -0.62, -0.35], [-0.26, -0.4, -0.7], 0.035, '#deb953', viewmodel);
  const mugTemplate = createHoneyMug(color => mat(color), palette.playerMug);
  function paintMug(model, color) { model.traverse(part => { if (part.name === 'mug-shell' || part.name === 'mug-handle' || part.name === 'mug-bottom') part.material = mat(color); }); }
  function makeMug(color) { const model = mugTemplate.clone(true); paintMug(model, color); return model; }
  const heldMug = makeMug(palette.playerMug); heldMug.name = 'held-nectar-mug'; heldMug.position.set(0.27, -0.32, -0.7); viewmodel.add(heldMug);
  for (const [index, model] of colleagues.entries()) { model.mug = makeMug(palette.accents[index]); model.hands[1].add(model.mug); }
  const thrownMugs = new Map();

  const root = document.createElement('div'); root.className = 'office-ui'; root.hidden = true;
  root.innerHTML = `<div class="office-top"><div class="world-title"><span class="live-dot"></span> WORKER BEE SIM<small>SHIFT <span data-office="shift">01</span></small></div><div class="office-objective"><span data-office="task">Approve pollen reports</span><small data-office="count">0 / 4 tasks</small></div><button class="office-pause" data-office="pause" aria-label="Pause office simulation" disabled>Ⅱ</button></div><div class="crosshair" aria-hidden="true">+</div><div class="office-interact" data-office="interact" hidden><span data-office="prompt"></span><div class="progress-track"><i data-office="progress"></i></div></div><div class="intro" data-office="intro"><div><h1>Welcome to the worker hive.</h1><p>Walk the office. Finish your shift. Take a nectar break.</p></div><button class="primary play-button" data-office="start" aria-label="Clock in" title="Clock in">▶</button></div><div class="office-touch"><div class="dpad"><button data-office-key="KeyW" aria-label="Walk forward">↑</button><button data-office-key="KeyA" aria-label="Walk left">←</button><button data-office-key="KeyS" aria-label="Walk backward">↓</button><button data-office-key="KeyD" aria-label="Walk right">→</button></div><div><button data-office-key="KeyE">Work</button></div></div></div>`;
  const $ = name => root.querySelector(`[data-office="${name}"]`);
  const settingsButton = document.createElement('button'); settingsButton.className = 'office-settings'; settingsButton.textContent = '⚙'; settingsButton.setAttribute('aria-label', 'Worker Bee Sim settings'); settingsButton.title = 'Worker Bee Sim settings'; settingsButton.onclick = showOfficeSettings;
  root.querySelector('.office-top').insertBefore(settingsButton, $('pause'));
  const soundButton = document.createElement('button'); soundButton.className = 'office-sound';
  soundButton.onclick = () => { if (settings.volume) { lastVolume = settings.volume; settings.set('volume', 0); } else settings.set('volume', lastVolume); syncVolume(); };
  root.querySelector('.office-top').insertBefore(soundButton, settingsButton);
  let lastVolume = settings.volume || 0.55;
  function syncVolume() {
    audio.setVolume(settings.volume);
    soundButton.textContent = settings.volume ? '♫' : '♩';
    soundButton.setAttribute('aria-label', settings.volume ? 'Mute office sounds' : 'Unmute office sounds');
    soundButton.setAttribute('aria-pressed', String(settings.volume > 0)); soundButton.title = settings.volume ? 'Mute sounds' : 'Unmute sounds';
    const slider = document.getElementById('office-volume'), output = document.getElementById('office-volume-value');
    if (slider) slider.value = Math.round(settings.volume * 100);
    if (output) output.textContent = settings.volume ? `${Math.round(settings.volume * 100)}%` : 'Muted';
    if (active && started && !paused && !game.complete) audio.unlock();
  }
  const seatHint = document.createElement('small'); seatHint.className = 'seat-hint'; $('interact').appendChild(seatHint);
  const mugStatus = document.createElement('div'); mugStatus.className = 'office-mug'; root.appendChild(mugStatus);
  const throwButton = document.createElement('button'); throwButton.textContent = 'Throw'; throwButton.className = 'touch-throw'; root.querySelector('.office-touch > div:last-child').appendChild(throwButton);
  const seatButton = document.createElement('button'); seatButton.textContent = 'Sit'; seatButton.className = 'touch-seat'; root.querySelector('.office-touch > div:last-child').appendChild(seatButton);
  const jumpButton = document.createElement('button'); jumpButton.textContent = '↥'; jumpButton.dataset.officeKey = 'Space'; jumpButton.setAttribute('aria-label', 'Jump and hold to glide'); root.querySelector('.dpad').appendChild(jumpButton);
  const keys = new Set(); let active = false, started = false, paused = false, lastTouch = null;
  let walkDistance = 0, bobHeight = 0, bobRoll = 0, npcTime = 0;
  const canvas = renderer.domElement;
  function renderIntro(title, description, button) { $('intro').hidden = false; $('intro').querySelector('h1').textContent = title; $('intro').querySelector('p').textContent = description; $('start').textContent = '▶'; $('start').setAttribute('aria-label', button); $('start').title = button; }
  function unlock() { if (document.pointerLockElement === canvas) document.exitPointerLock(); }
  function captureMouse() { if (matchMedia('(pointer: coarse)').matches) return; try { const request = canvas.requestPointerLock(); request?.catch(() => notify('Mouse capture unavailable. Drag the game to look around.')); } catch { notify('Drag the game to look around.'); } }
  function setPaused(value) {
    paused = value; keys.clear(); itemMotion.reset(); $('pause').textContent = paused ? '▶' : 'Ⅱ'; $('pause').setAttribute('aria-label', paused ? 'Resume office simulation' : 'Pause office simulation');
    audio.setEnabled(active && started && !paused);
    if (paused) { monitorMedia.pause(); unlock(); renderIntro('Shift paused.', 'Resume when you’re ready.', 'Resume'); } else { $('intro').hidden = true; monitorMedia.start(); audio.unlock(); captureMouse(); }
  }
  function showOfficeSettings() {
    audio.setEnabled(false);
    if (started && !game.complete) setPaused(true);
    openDialog(`<p class="eyebrow">WORKER BEE SIM</p><h2>Office settings</h2><div class="settings-row"><label for="office-fov">Field of view <output id="office-fov-value">${settings.fov}°</output></label><input id="office-fov" type="range" min="55" max="105" step="1" value="${settings.fov}"/></div><div class="settings-row"><label for="office-bob">View bobbing <output id="office-bob-value">${Math.round(settings.bobbing * 100)}%</output></label><input id="office-bob" type="range" min="0" max="300" step="5" value="${Math.round(settings.bobbing * 100)}"/><small>100% is the default; raise it up to 300%. 0 disables camera and item motion.</small></div><div class="settings-row"><label for="office-volume">Sound volume <output id="office-volume-value">${settings.volume ? `${Math.round(settings.volume * 100)}%` : 'Muted'}</output></label><input id="office-volume" type="range" min="0" max="100" step="1" value="${Math.round(settings.volume * 100)}"/><small>Cartoon effects and office ambience. 0 mutes all sounds. Monitor videos stay silent.</small></div>`);
    const fov = document.getElementById('office-fov'), bob = document.getElementById('office-bob');
    if (fov) fov.oninput = e => { settings.set('fov', Number(e.target.value)); document.getElementById('office-fov-value').textContent = `${settings.fov}°`; };
    const volume = document.getElementById('office-volume');
    if (volume) volume.oninput = e => { settings.set('volume', Number(e.target.value) / 100); if (settings.volume) lastVolume = settings.volume; syncVolume(); };
    if (bob) bob.oninput = e => { settings.set('bobbing', Number(e.target.value) / 100); document.getElementById('office-bob-value').textContent = `${Math.round(settings.bobbing * 100)}%`; };
  }
  $('start').onclick = () => {
    if (game.complete) { game.reset(); coworkers.reset(); monitorMedia.shuffle(); started = false; soundscape.reset(game, coworkers.workers); }
    const clockingIn = !started;
    started = true; $('pause').disabled = false; setPaused(false); audio.play(clockingIn ? 'clockIn' : 'resume');
  };
  $('pause').onclick = () => { if (started && !game.complete) { const resuming = paused; setPaused(!paused); if (resuming) audio.play('resume'); } };
  let dragged = false;
  function throwMug() { if (active && started && !paused && !game.complete) game.throwMug(); }
  throwButton.onclick = throwMug;
  function toggleSeat() { if (!game.toggleSeat()) audio.play('denied'); else { keys.clear(); bobHeight = bobRoll = 0; itemMotion.reset(); } }
  seatButton.onclick = () => { if (active && started && !paused) toggleSeat(); };
  canvas.addEventListener('click', () => { if (active && started && !paused && !game.complete) { if (!dragged) throwMug(); captureMouse(); } });
  document.addEventListener('pointerlockchange', () => { if (active && started && !game.complete && !paused && document.pointerLockElement !== canvas) setPaused(true); });
  function look(dx, dy) { game.look(dx, dy); itemMotion.look(dx, dy); }
  document.addEventListener('mousemove', e => { if (active && !paused && document.pointerLockElement === canvas) look(e.movementX, e.movementY); });
  canvas.addEventListener('pointerdown', e => { if (!active || !started || paused) return; dragged = false; lastTouch = { x: e.clientX, y: e.clientY }; if (document.pointerLockElement !== canvas) canvas.setPointerCapture?.(e.pointerId); });
  canvas.addEventListener('pointermove', e => { if (!lastTouch || !active || paused || document.pointerLockElement === canvas) return; const dx = e.clientX - lastTouch.x, dy = e.clientY - lastTouch.y; if (Math.hypot(dx, dy) > 2) dragged = true; look(dx * 2, dy * 2); lastTouch = { x: e.clientX, y: e.clientY }; });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(event, () => { lastTouch = null; });
  document.addEventListener('keydown', e => { if (!active || !started || document.querySelector('dialog[open]')) return; if (e.code === 'KeyP' && !e.repeat && !game.complete) { const resuming = paused; setPaused(!paused); if (resuming) audio.play('resume'); } if (e.code === 'Escape' && !game.complete && !paused) setPaused(true); if (e.code === 'Space' && !e.repeat && !paused) game.jump(); if (e.code === 'KeyF' && !e.repeat && !paused) toggleSeat(); if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault(); keys.add(e.code); });
  document.addEventListener('keyup', e => keys.delete(e.code));
  window.addEventListener('blur', () => { keys.clear(); if (active && started && !paused && !game.complete) setPaused(true); });
  document.addEventListener('visibilitychange', () => {
    if (!active) return;
    if (document.hidden) { audio.setEnabled(false); monitorMedia.pause(); if (started && !paused && !game.complete) setPaused(true); }
    else if (!started) monitorMedia.start();
  });
  for (const button of root.querySelectorAll('[data-office-key]')) {
    button.addEventListener('pointerdown', e => { e.preventDefault(); button.setPointerCapture(e.pointerId); keys.add(button.dataset.officeKey); if (button.dataset.officeKey === 'Space' && active && started && !paused) game.jump(); });
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(event, () => keys.delete(button.dataset.officeKey));
  }
  function update(dt, time) {
    if (!active) return;
    const playing = started && !paused && !game.complete;
    const previousX = game.x, previousZ = game.z;
    audio.setVolume(settings.volume);
    if (started && !paused && !game.complete) {
      const finished = game.tick(dt, {
        forward: Number(keys.has('KeyW') || keys.has('ArrowUp')) - Number(keys.has('KeyS') || keys.has('ArrowDown')),
        right: Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft')),
        sprint: keys.has('ShiftLeft') || keys.has('ShiftRight'), work: keys.has('KeyE'), glide: keys.has('Space'),
      });
      if (finished) { notify(game.complete ? 'Shift complete.' : 'Task complete.'); keys.delete('KeyE'); }
      if (game.complete) { monitorMedia.pause(); unlock(); renderIntro('Shift complete.', `4 tasks finished in ${Math.floor(game.elapsed / 60)}:${String(Math.floor(game.elapsed % 60)).padStart(2, '0')}.`, 'Next shift'); }
    }
    const walked = Math.hypot(game.x - previousX, game.z - previousZ); walkDistance += walked;
    const bob = viewBob(walkDistance, settings.bobbing, walked > 0.001 && game.seated === null && game.grounded);
    const blend = 1 - Math.exp(-12 * dt); bobHeight += (bob.height - bobHeight) * blend; bobRoll += (bob.roll - bobRoll) * blend;
    if (!settings.bobbing) { bobHeight = 0; bobRoll = 0; }
    camera.position.set(game.x, game.eyeHeight + bobHeight, game.z); camera.rotation.set(game.pitch, game.yaw, bobRoll);
    const pose = itemMotion.step(dt, { distance: walkDistance, strength: settings.bobbing,
      moving: playing && walked > 0.001 && game.seated === null && game.grounded,
      vx: playing && game.seated === null ? (game.x - previousX) / Math.max(0.001, dt) : 0,
      vz: playing && game.seated === null ? (game.z - previousZ) / Math.max(0.001, dt) : 0, yaw: game.yaw });
    viewmodel.position.set(pose.x, pose.y, pose.z); viewmodel.rotation.set(pose.rx, pose.ry, pose.rz);
    if (camera.fov !== settings.fov) { camera.fov = settings.fov; camera.updateProjectionMatrix(); }
    heldMug.visible = game.mugCooldown === 0;
    mugStatus.hidden = !started || paused || game.complete;
    mugStatus.textContent = game.gliding ? `≋ GLIDE ${game.glideRemaining.toFixed(1)}s` : game.mugCooldown ? `REFILL ${game.mugCooldown.toFixed(1)}s` : 'LMB — throw nectar';
    seatHint.textContent = game.seated !== null ? 'F — stand up' : game.nearbyChair ? (game.occupiedChairs.has(game.nearbyChair.id) ? 'Chair occupied' : 'F — sit at computer') : '';
    seatButton.textContent = game.seated !== null ? 'Stand' : 'Sit';
    for (const mug of game.projectiles) {
      if (!thrownMugs.has(mug.id)) { const model = makeMug(palette.playerMug); model.name = `thrown-nectar-mug-${mug.id}`; model.scale.setScalar(1.5); scene.add(model); thrownMugs.set(mug.id, model); }
      const model = thrownMugs.get(mug.id); model.position.set(mug.x, mug.y, mug.z); model.rotation.set(mug.age * 9, mug.age * 4, mug.age * 2);
    }
    const liveMugs = new Set(game.projectiles.map(mug => mug.id));
    for (const [id, model] of thrownMugs) if (!liveMugs.has(id)) { model.removeFromParent(); thrownMugs.delete(id); }
    $('shift').textContent = String(game.shift).padStart(2, '0'); $('task').textContent = game.station ? (game.nearStation ? `Hold E to ${game.station.action.toLowerCase()}` : game.station.destination) : 'Shift complete'; $('count').textContent = `${game.task} / 4 tasks`;
    $('interact').hidden = !started || paused || game.complete;
    if (game.station) {
      const distance = Math.hypot(game.x - game.station.x, game.z - game.station.z);
      const needsSeat = game.station.chairId !== undefined && game.seated !== game.station.chairId && game.nearbyChair?.id === game.station.chairId;
      $('prompt').textContent = needsSeat ? 'F — sit at the report computer' : game.nearStation ? `Hold E — ${game.station.action}` : `${game.station.destination} · ${distance.toFixed(0)}m`;
      $('progress').style.width = `${game.progress / 1.5 * 100}%`;
    }
    stationMarkers.forEach((m, i) => { const current = i === game.task; m.ring.visible = current; m.pointer.visible = current; m.pointer.position.y = 2.05 + Math.sin(npcTime * 2.8) * 0.2; m.label.material.opacity = current ? 1 : 0.55; m.label.material.transparent = true; m.label.rotation.y = Math.atan2(game.x - m.label.position.x, game.z - m.label.position.z); });
    if (!paused && !game.complete) { coworkers.tick(dt, started ? game.impacts : [], started ? game.hits : []); npcTime += dt; }
    if (playing) soundscape.tick(dt, game, coworkers.workers);
    coworkers.workers.forEach((worker, i) => {
      const model = colleagues[i], sitting = coworkers.isSeated(worker), walking = worker.state === 'walking';
      const gait = Math.sin(worker.walkDistance * 8), idle = Math.sin(npcTime * 1.4 + i);
      const down = worker.state === 'down', age = worker.deathAge;
      const fall = Math.min(1, age * 3), burst = deathBursts[i];
      model.root.visible = !down || (worker.deathStyle !== 'burst' && age < 2.2);
      model.root.scale.set(1, down && worker.deathStyle === 'crumple' ? 1 - fall * 0.72 : 1, 1);
      model.root.rotation.x = down && worker.deathStyle === 'ragdoll' ? -fall * Math.PI / 2 : 0;
      model.root.rotation.z = down && worker.deathStyle === 'ragdoll' ? Math.sin(age * 14) * (1 - fall) * 0.3 : 0;
      model.root.position.set(worker.x, down && worker.deathStyle === 'ragdoll' ? fall * 0.2 : 0, worker.z);
      burst.visible = down && worker.deathStyle === 'burst' && age < 1.5;
      if (burst.visible) {
        burst.position.set(worker.x, 1, worker.z);
        burst.children.forEach((piece, j) => {
          const angle = j * Math.PI * 2 / burst.children.length;
          piece.position.set(Math.cos(angle) * age * 2, Math.sin(j * 7) * age + 2 * age - 3 * age * age, Math.sin(angle) * age * 2);
          piece.rotation.set(age * 8 + j, age * 5, age * 4); piece.scale.setScalar(Math.max(0, 1 - age / 1.5));
        });
      }
      const turn = Math.atan2(Math.sin(worker.yaw - model.root.rotation.y), Math.cos(worker.yaw - model.root.rotation.y)); model.root.rotation.y += turn * Math.min(1, dt * 8);
      const height = sitting ? -0.25 : walking ? Math.abs(gait) * 0.025 : idle * 0.01;
      model.body.position.y += (height - model.body.position.y) * Math.min(1, dt * 12);
      model.body.rotation.z = worker.state === 'chatting' ? idle * 0.04 : 0;
      for (let side = 0; side < 2; side++) {
        const sign = side ? 1 : -1;
        model.thighs[side].rotation.x = sitting ? -Math.PI / 2 : walking ? gait * sign * 0.45 : 0;
        model.calves[side].rotation.x = sitting ? Math.PI / 2 : walking ? Math.max(0, gait * sign) * 0.35 : 0;
        model.arms[side].rotation.x = walking ? -gait * sign * 0.35 : sitting ? -1 + Math.sin(npcTime * 9 + side * 2) * 0.06 : idle * 0.025;
        model.forearms[side].rotation.x = sitting ? -1 : 0;
        if (worker.state === 'drinking' && side === 1) { model.arms[side].rotation.x = -2.2 + idle * 0.12; model.forearms[side].rotation.x = -0.7; }
        if (worker.state === 'chatting' && side === 0) { model.arms[side].rotation.x = -0.9 + idle * 0.2; model.forearms[side].rotation.x = -0.4; }
        if (down) { model.thighs[side].rotation.x = fall * -1.4; model.calves[side].rotation.x = fall * 1.8; model.arms[side].rotation.x = fall * -2; }
        if (worker.state === 'reacting') { model.arms[side].rotation.x = -1.9; model.forearms[side].rotation.x = -0.8; }
        model.wings[side].rotation.y = sign * (0.1 + idle * 0.04);
      }
      model.mug.visible = worker.state === 'drinking';
    });
    renderer.render(scene, camera);
  }
  syncVolume();
  return {
    update,
    pause() { audio.setEnabled(false); if (started && !game.complete) setPaused(true); },
    resize(width, height) { camera.aspect = width / height; camera.updateProjectionMatrix(); },
    activate() { active = true; root.hidden = false; container.replaceChildren(root); if (started && !game.complete) setPaused(true); else if (!started) monitorMedia.start(); },
    deactivate() { audio.setEnabled(false); itemMotion.reset(); active = false; root.hidden = true; root.remove(); monitorMedia.stop(); keys.clear(); lastTouch = null; unlock(); if (started) paused = true; },
  };
}
