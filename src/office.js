import * as THREE from 'three';
import { OfficeGame, DESKS, STATIONS } from './office-game.js';
import { GameSettings, viewBob } from './settings.js';
import { createMonitorMedia } from './monitor-media.js';

export function createOffice({ renderer, container, notify, settings = new GameSettings(), openSettings = () => {} }) {
  const game = new OfficeGame();
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#13231c');
  scene.fog = new THREE.Fog('#13231c', 22, 48);
  const camera = new THREE.PerspectiveCamera(75, 1, 0.08, 70); camera.rotation.order = 'YXZ'; scene.add(camera);
  scene.add(new THREE.HemisphereLight('#f2ecd6', '#334335', 2));
  const sunlight = new THREE.DirectionalLight('#ffe6a2', 2); sunlight.position.set(-9, 12, -2); scene.add(sunlight);
  const cache = new Map();
  function mat(color, glow = false) { const key = `${color}:${glow}`; if (!cache.has(key)) cache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...(glow ? { emissive: color, emissiveIntensity: 0.7 } : {}) })); return cache.get(key); }
  function shape(geometry, color, x, y, z, parent = scene, glow = false) { const m = new THREE.Mesh(geometry, mat(color, glow)); m.position.set(x, y, z); parent.add(m); return m; }
  const box = (w, h, d, color, x, y, z, parent, glow) => shape(new THREE.BoxGeometry(w, h, d), color, x, y, z, parent, glow);
  function ball(r, color, x, y, z, parent = scene) { return shape(new THREE.SphereGeometry(r, 12, 8), color, x, y, z, parent); }
  function rod(a, b, r, color, parent) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), delta = end.clone().sub(start);
    const m = shape(new THREE.CylinderGeometry(r, r, delta.length(), 8), color, 0, 0, 0, parent);
    m.position.copy(start.add(end).multiplyScalar(0.5)); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()); return m;
  }
  function sign(text, x, y, z, width = 3, parent = scene) {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#12251d'; ctx.fillRect(0, 0, 512, 128); ctx.strokeStyle = '#5c7652'; ctx.lineWidth = 4; ctx.strokeRect(2, 2, 508, 124);
    ctx.fillStyle = '#d5e5b8'; ctx.textAlign = 'center'; ctx.font = '25px monospace'; ctx.fillText(text, 256, 75);
    const texture = new THREE.CanvasTexture(canvas);
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(width, width / 4), new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })); panel.position.set(x, y, z); parent.add(panel); return panel;
  }
  box(26, 0.15, 20, '#344638', 0, -0.08, 0);
  const grid = new THREE.GridHelper(26, 26, '#53654a', '#405541'); grid.position.y = 0.01; scene.add(grid);
  box(26, 4, 0.2, '#30473a', 0, 2, -10); box(26, 4, 0.2, '#30473a', 0, 2, 10);
  box(0.2, 4, 20, '#293e32', -13, 2, 0); box(0.2, 4, 20, '#293e32', 13, 2, 0);
  box(26, 0.15, 20, '#20392e', 0, 4.05, 0);
  for (const x of [-9, -3, 3, 9]) for (const z of [-5, 4]) box(2.6, 0.03, 0.2, '#eef0bd', x, 3.94, z, scene, true);
  // Mint windows and hexagonal trim give the office its hive architecture.
  for (let z = -7; z <= 7; z += 4.5) {
    box(0.08, 1.7, 3.2, '#92c9a5', -12.86, 2.2, z, scene, true);
    for (const offset of [-1.7, 0, 1.7]) box(0.12, 1.9, 0.08, '#192e24', -12.78, 2.2, z + offset);
  }
  sign('CREATORHIVE // WORKER OPERATIONS', 0, 2.7, -9.87, 7);
  sign('MEETING COULD HAVE BEEN A BUZZ', 0, 2.8, 9.87, 6).rotation.y = Math.PI;
  const monitors = [];
  for (const d of DESKS) {
    box(3.3, 0.12, 1.3, '#a99360', d.x, 0.98, d.z);
    for (const offset of [-1.35, 1.35]) box(0.1, 0.93, 1, '#202d25', d.x + offset, 0.46, d.z);
    box(1.1, 0.75, 0.1, '#16291f', d.x, 1.52, d.z - 0.23);
    monitors.push(box(0.94, 0.58, 0.02, '#90c17a', d.x, 1.54, d.z - 0.17, scene, true));
    box(0.1, 0.3, 0.1, '#18251c', d.x, 1.17, d.z - 0.23);
    box(0.85, 0.04, 0.3, '#314235', d.x, 1.06, d.z + 0.35);
    box(0.7, 0.15, 0.65, '#26372c', d.x, 0.55, d.z + 1.1);
    box(0.7, 0.7, 0.12, '#26372c', d.x, 0.92, d.z + 1.4);
    box(0.08, 0.5, 0.08, '#b49e63', d.x, 0.25, d.z + 1.1);
    // Low dividers stay inside the desk collision footprint.
    box(3.3, 0.75, 0.09, '#547052', d.x, 1.35, d.z - 0.59);
    shape(new THREE.CylinderGeometry(0.1, 0.08, 0.2, 12), '#e1bd54', d.x + 0.9, 1.14, d.z + 0.2);
  }
  const monitorMedia = createMonitorMedia(monitors);
  box(2.8, 1.05, 1.1, '#607b60', 9.5, 0.53, -8);
  box(1.2, 0.5, 0.7, '#c2c4a0', 9.5, 1.32, -8);
  box(0.85, 0.06, 0.4, '#ece4b1', 9.5, 1.59, -7.8);
  box(2.8, 1.1, 1.1, '#8e784c', -9.5, 0.55, 8);
  for (let i = 0; i < 8; i++) {
    const hex = shape(new THREE.CylinderGeometry(0.3, 0.3, 0.14, 6), i % 2 ? '#ddbc61' : '#af964b', -10.45 + i % 4 * 0.63, 0.35 + Math.floor(i / 4) * 0.55, 7.38); hex.rotation.x = Math.PI / 2;
  }
  box(2.8, 1.05, 1.1, '#607b60', 9.5, 0.53, 8);
  shape(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 12), '#d5ad41', 9.5, 1.5, 8);
  box(0.12, 0.14, 0.35, '#344b34', 9.5, 1.3, 7.57);
  sign('NECTAR > COFFEE', 9.5, 2.7, 9.86, 3).rotation.y = Math.PI;
  const stationMarkers = STATIONS.map(s => {
    const ring = shape(new THREE.TorusGeometry(0.65, 0.025, 6, 32), '#b9df78', s.x, 0.04, s.z, scene, true); ring.rotation.x = -Math.PI / 2;
    const label = sign(s.name, s.x, 2.4, s.z, 2.5); return { ring, label };
  });
  function stickBee(x, z, yaw = 0) {
    const bee = new THREE.Group(); bee.position.set(x, 0, z); bee.rotation.y = yaw; scene.add(bee);
    ball(0.25, '#e9c45f', 0, 1.75, 0, bee);
    for (const side of [-1, 1]) {
      ball(0.035, '#17251b', side * 0.08, 1.79, 0.23, bee);
      rod([side * 0.11, 1.94, 0], [side * 0.21, 2.18, 0], 0.018, '#1c2c21', bee); ball(0.045, '#e8c568', side * 0.21, 2.18, 0, bee);
      rod([side * 0.05, 0.9, 0], [side * 0.17, 0.1, 0], 0.045, '#17241b', bee);
      rod([0, 1.42, 0], [side * 0.4, 1.1, 0.08], 0.035, '#17241b', bee);
      rod([side * 0.4, 1.1, 0.08], [side * 0.32, 0.9, 0.22], 0.035, '#17241b', bee);
      const wing = ball(0.3, '#bbd2b8', side * 0.22, 1.3, -0.17, bee); wing.scale.set(0.65, 1, 0.12);
    }
    rod([0, 0.9, 0], [0, 1.51, 0], 0.055, '#17241b', bee);
    const abdomen = ball(0.23, '#e9c45f', 0, 1.03, -0.02, bee); abdomen.scale.set(0.8, 1.35, 0.8);
    for (const y of [0.92, 1.09]) shape(new THREE.CylinderGeometry(0.18, 0.18, 0.07, 12), '#263328', 0, y, -0.02, bee);
    return bee;
  }
  const colleagues = [stickBee(-3.5, -3.6, Math.PI), stickBee(3.5, -3.6, Math.PI), stickBee(-3.5, 1.4, Math.PI), stickBee(6, 2), stickBee(-6, 6, 0.9)];
  for (const x of [-11.5, 11.5]) {
    shape(new THREE.CylinderGeometry(0.3, 0.2, 0.5, 6), '#bca164', x, 0.25, 1.8);
    rod([x, 0.4, 1.8], [x, 1.5, 1.8], 0.04, '#80a36e', scene);
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; const petal = ball(0.18, '#f0c563', x + Math.cos(a) * 0.24, 1.5, 1.8 + Math.sin(a) * 0.24); petal.scale.y = 0.4; }
  }
  // Visible stick forearms and a nectar mug: an office worker, not a weapon.
  rod([0.36, -0.6, -0.4], [0.28, -0.37, -0.65], 0.035, '#deb953', camera);
  rod([-0.35, -0.62, -0.35], [-0.26, -0.4, -0.7], 0.035, '#deb953', camera);
  const mugTemplate = new THREE.Group();
  shape(new THREE.CylinderGeometry(0.09, 0.07, 0.16, 12), '#dfbc5a', 0, 0, 0, mugTemplate);
  shape(new THREE.CylinderGeometry(0.077, 0.077, 0.012, 12), '#955823', 0, 0.085, 0, mugTemplate);
  const handle = shape(new THREE.TorusGeometry(0.055, 0.012, 6, 16), '#dfbc5a', 0.1, 0, 0, mugTemplate); handle.rotation.y = Math.PI / 2;
  const heldMug = mugTemplate.clone(true); heldMug.position.set(0.27, -0.32, -0.7); camera.add(heldMug);
  const thrownMugs = new Map();

  const root = document.createElement('div'); root.className = 'office-ui'; root.hidden = true;
  root.innerHTML = `<div class="office-top"><div class="world-title"><span class="live-dot"></span> WORKER BEE SIM<small>SHIFT <span data-office="shift">01</span></small></div><div class="office-objective"><span data-office="task">Approve pollen reports</span><small data-office="count">0 / 4 tasks</small></div><button class="office-pause" data-office="pause" aria-label="Pause office simulation" disabled>Ⅱ</button></div><div class="crosshair" aria-hidden="true">+</div><div class="office-interact" data-office="interact" hidden><span data-office="prompt"></span><div class="progress-track"><i data-office="progress"></i></div></div><div class="intro" data-office="intro"><div><h1>Welcome to the worker hive.</h1><p>Walk the office. Finish your shift. Take a nectar break.</p></div><button class="primary" data-office="start">Clock in <span>↗</span></button></div><div class="office-touch"><div class="dpad"><button data-office-key="KeyW" aria-label="Walk forward">↑</button><button data-office-key="KeyA" aria-label="Walk left">←</button><button data-office-key="KeyS" aria-label="Walk backward">↓</button><button data-office-key="KeyD" aria-label="Walk right">→</button></div><div><button data-office-key="KeyE">Work</button></div></div></div>`;
  const $ = name => root.querySelector(`[data-office="${name}"]`);
  const seatHint = document.createElement('small'); seatHint.className = 'seat-hint'; $('interact').appendChild(seatHint);
  const mugStatus = document.createElement('div'); mugStatus.className = 'office-mug'; root.appendChild(mugStatus);
  const throwButton = document.createElement('button'); throwButton.textContent = 'Throw'; throwButton.className = 'touch-throw'; root.querySelector('.office-touch > div:last-child').appendChild(throwButton);
  const seatButton = document.createElement('button'); seatButton.textContent = 'Sit'; seatButton.className = 'touch-seat'; root.querySelector('.office-touch > div:last-child').appendChild(seatButton);
  const keys = new Set(); let active = false, started = false, paused = false, lastTouch = null;
  let walkDistance = 0, bobHeight = 0, bobRoll = 0;
  const canvas = renderer.domElement;
  function renderIntro(title, description, button) { $('intro').hidden = false; $('intro').querySelector('h1').textContent = title; $('intro').querySelector('p').textContent = description; $('start').firstChild.textContent = button + ' '; }
  function unlock() { if (document.pointerLockElement === canvas) document.exitPointerLock(); }
  function captureMouse() { if (matchMedia('(pointer: coarse)').matches) return; try { const request = canvas.requestPointerLock(); request?.catch(() => notify('Mouse capture unavailable. Drag the game to look around.')); } catch { notify('Drag the game to look around.'); } }
  function setPaused(value) {
    paused = value; keys.clear(); $('pause').textContent = paused ? '▶' : 'Ⅱ'; $('pause').setAttribute('aria-label', paused ? 'Resume office simulation' : 'Pause office simulation');
    if (paused) { monitorMedia.pause(); unlock(); renderIntro('Shift paused.', 'Resume when you’re ready.', 'Resume'); } else { $('intro').hidden = true; monitorMedia.start(); captureMouse(); }
  }
  $('start').onclick = () => {
    if (game.complete) { game.reset(); started = false; }
    started = true; $('pause').disabled = false; setPaused(false);
  };
  $('pause').onclick = () => { if (started && !game.complete) setPaused(!paused); };
  let dragged = false;
  function throwMug() { if (active && started && !paused && !game.complete) game.throwMug(); }
  throwButton.onclick = throwMug;
  seatButton.onclick = () => { if (active && started && !paused) game.toggleSeat(); };
  canvas.addEventListener('click', () => { if (active && started && !paused && !game.complete) { if (!dragged) throwMug(); captureMouse(); } });
  document.addEventListener('pointerlockchange', () => { if (active && started && !game.complete && !paused && document.pointerLockElement !== canvas) setPaused(true); });
  document.addEventListener('mousemove', e => { if (active && !paused && document.pointerLockElement === canvas) game.look(e.movementX, e.movementY); });
  canvas.addEventListener('pointerdown', e => { if (!active || !started || paused) return; dragged = false; lastTouch = { x: e.clientX, y: e.clientY }; if (document.pointerLockElement !== canvas) canvas.setPointerCapture?.(e.pointerId); });
  canvas.addEventListener('pointermove', e => { if (!lastTouch || !active || paused || document.pointerLockElement === canvas) return; const dx = e.clientX - lastTouch.x, dy = e.clientY - lastTouch.y; if (Math.hypot(dx, dy) > 2) dragged = true; game.look(dx * 2, dy * 2); lastTouch = { x: e.clientX, y: e.clientY }; });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(event, () => { lastTouch = null; });
  document.addEventListener('keydown', e => { if (!active || !started || document.querySelector('dialog[open]')) return; if (e.code === 'KeyP' && !e.repeat && !game.complete) setPaused(!paused); if (e.code === 'Escape' && !game.complete && !paused) setPaused(true); if (e.code === 'KeyF' && !e.repeat && !paused) { if (game.toggleSeat()) keys.clear(); } if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault(); keys.add(e.code); });
  document.addEventListener('keyup', e => keys.delete(e.code));
  window.addEventListener('blur', () => { keys.clear(); if (active && started && !paused && !game.complete) setPaused(true); });
  document.addEventListener('visibilitychange', () => {
    if (!active) return;
    if (document.hidden) { monitorMedia.pause(); if (started && !paused && !game.complete) setPaused(true); }
    else if (!started) monitorMedia.start();
  });
  for (const button of root.querySelectorAll('[data-office-key]')) {
    button.addEventListener('pointerdown', e => { e.preventDefault(); button.setPointerCapture(e.pointerId); keys.add(button.dataset.officeKey); });
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(event, () => keys.delete(button.dataset.officeKey));
  }
  function update(dt, time) {
    if (!active) return;
    const previousX = game.x, previousZ = game.z;
    if (started && !paused && !game.complete) {
      const finished = game.tick(dt, {
        forward: Number(keys.has('KeyW') || keys.has('ArrowUp')) - Number(keys.has('KeyS') || keys.has('ArrowDown')),
        right: Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft')),
        sprint: keys.has('ShiftLeft') || keys.has('ShiftRight'), work: keys.has('KeyE'),
      });
      if (finished) { notify(game.complete ? 'Shift complete.' : 'Task complete.'); keys.delete('KeyE'); }
      if (game.complete) { monitorMedia.pause(); unlock(); renderIntro('Shift complete.', `4 tasks finished in ${Math.floor(game.elapsed / 60)}:${String(Math.floor(game.elapsed % 60)).padStart(2, '0')}.`, 'Next shift'); }
    }
    const walked = Math.hypot(game.x - previousX, game.z - previousZ); walkDistance += walked;
    const bob = viewBob(walkDistance, settings.bobbing, walked > 0.001 && game.seated === null);
    const blend = 1 - Math.exp(-12 * dt); bobHeight += (bob.height - bobHeight) * blend; bobRoll += (bob.roll - bobRoll) * blend;
    if (!settings.bobbing) { bobHeight = 0; bobRoll = 0; }
    camera.position.set(game.x, game.eyeHeight + bobHeight, game.z); camera.rotation.set(game.pitch, game.yaw, bobRoll);
    if (camera.fov !== settings.fov) { camera.fov = settings.fov; camera.updateProjectionMatrix(); }
    heldMug.visible = game.mugCooldown === 0;
    mugStatus.hidden = !started || paused || game.complete;
    mugStatus.textContent = game.mugCooldown ? `REFILL ${game.mugCooldown.toFixed(1)}s` : 'LMB — throw nectar';
    seatHint.textContent = game.seated !== null ? 'F — stand up' : game.nearbyChair ? (game.occupiedChairs.has(game.nearbyChair.id) ? 'Chair occupied' : 'F — sit at computer') : '';
    seatButton.textContent = game.seated !== null ? 'Stand' : 'Sit';
    for (const mug of game.projectiles) {
      if (!thrownMugs.has(mug.id)) { const model = mugTemplate.clone(true); model.scale.setScalar(1.5); scene.add(model); thrownMugs.set(mug.id, model); }
      const model = thrownMugs.get(mug.id); model.position.set(mug.x, mug.y, mug.z); model.rotation.set(mug.age * 9, mug.age * 4, mug.age * 2);
    }
    const liveMugs = new Set(game.projectiles.map(mug => mug.id));
    for (const [id, model] of thrownMugs) if (!liveMugs.has(id)) { model.removeFromParent(); thrownMugs.delete(id); }
    $('shift').textContent = String(game.shift).padStart(2, '0'); $('task').textContent = game.station?.action ?? 'Shift complete'; $('count').textContent = `${game.task} / 4 tasks`;
    $('interact').hidden = !started || paused || game.complete;
    if (game.station) {
      const distance = Math.hypot(game.x - game.station.x, game.z - game.station.z);
      $('prompt').textContent = game.nearStation ? `Hold E — ${game.station.action}` : `${game.station.name} · ${distance.toFixed(0)}m`;
      $('progress').style.width = `${game.progress / 1.5 * 100}%`;
    }
    stationMarkers.forEach((m, i) => { const current = i === game.task; m.ring.visible = current; m.label.material.opacity = current ? 1 : 0.55; m.label.material.transparent = true; m.label.rotation.y = Math.atan2(game.x - m.label.position.x, game.z - m.label.position.z); });
    colleagues.forEach((b, i) => { b.rotation.z = Math.sin(time * 1.3 + i) * 0.025; });
    renderer.render(scene, camera);
  }
  return {
    update,
    pause() { if (started && !game.complete) setPaused(true); },
    resize(width, height) { camera.aspect = width / height; camera.updateProjectionMatrix(); },
    activate() { active = true; root.hidden = false; container.replaceChildren(root); if (started && !game.complete) setPaused(true); else if (!started) monitorMedia.start(); },
    deactivate() { active = false; root.hidden = true; root.remove(); monitorMedia.stop(); keys.clear(); lastTouch = null; unlock(); if (started) paused = true; },
  };
}
