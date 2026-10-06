import * as THREE from 'three';
import { Game, RULES, FLOWERS } from './simulation.js';
import { markup } from './ui.js';
import { GARDEN_PALETTE as palette } from './palette.js';
import { OrbitView, bindOrbitControls } from './features/orbit-view.js';

export function createHive({ renderer, container, notify: toast, openDialog: showModal, closeDialog = () => {} }) {
  const root = document.createElement('div'); root.id = 'garden-ui'; root.className = 'garden-ui'; root.innerHTML = markup;
  const $ = id => root.querySelector(`#${id}`);
  const game = new Game();
  let player = null, started = false, paused = false, soundEnabled = false, audio, active = false;
  const keys = new Set();
  const modal = { get open() { return !!document.querySelector('dialog[open]'); }, close: closeDialog };
  $('sound').onclick = () => { soundEnabled = !soundEnabled; if (soundEnabled) { audio ??= new AudioContext(); audio.resume(); } $('sound').innerHTML = `♪ <span>Sound ${soundEnabled ? 'on' : 'off'}</span>`; $('sound').setAttribute('aria-pressed', soundEnabled); $('sound').setAttribute('aria-label', soundEnabled ? 'Disable sound' : 'Enable sound'); };
  function chime(frequency = 600) { if (!soundEnabled || !audio) return; const oscillator = audio.createOscillator(), gain = audio.createGain(); oscillator.connect(gain); gain.connect(audio.destination); oscillator.frequency.value = frequency; gain.gain.setValueAtTime(0.04, audio.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.18); oscillator.start(); oscillator.stop(audio.currentTime + 0.2); }
  $('start').onclick = () => { if (!renderer) return; game.reset(); game.round = 1; player = game.addPlayer(); started = true; $('intro').hidden = true; $('flight-hud').hidden = false; $('pause').disabled = false; $('phase').textContent = 'ACTIVE'; toast('Fly near flowers to collect. Return to the hive to deliver.'); };
  function togglePause() { if (!started) return; paused = !paused; keys.clear(); viewControls.cancel(); $('pause').textContent = paused ? '▶' : 'Ⅱ'; $('pause').setAttribute('aria-label', paused ? 'Resume game' : 'Pause game'); $('phase').textContent = paused ? 'PAUSED' : 'ACTIVE'; toast(paused ? 'Paused. Press P to resume.' : 'Resumed.'); }
  $('pause').onclick = togglePause;
  $('home').onclick = () => { toast('The glowing golden hive is in the center. Fly into its ring to deliver.'); hiveBeacon = 5; };
  document.addEventListener('keydown', e => { if (!active || modal.open || !started) return; if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault(); if (e.code === 'Space') return; if (e.code === 'KeyP' && !e.repeat) togglePause(); keys.add(e.code); });
  document.addEventListener('keyup', e => keys.delete(e.code));
  window.addEventListener('blur', () => { keys.clear(); viewControls.cancel(); if (active && started && !paused) togglePause(); });
  for (const button of root.querySelectorAll('[data-key]')) {
    button.addEventListener('pointerdown', e => { e.preventDefault(); button.setPointerCapture(e.pointerId); keys.add(button.dataset.key); });
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(event, () => keys.delete(button.dataset.key));
  }

  // All artwork is procedural. No remote models, textures, fonts, or services.
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(palette.sky);
  scene.fog = new THREE.Fog(palette.sky, 45, 95);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 150);
  const orbit = new OrbitView();
  const viewControls = bindOrbitControls(renderer.domElement, orbit, () => active && !paused && !modal.open);
  orbit.apply(camera, new THREE.Vector3());
  scene.add(new THREE.HemisphereLight('#fff4df', '#4b6151', 2.4));
  const sun = new THREE.DirectionalLight('#fff0c5', 3.2); sun.position.set(-12, 30, 15); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -25, right: 25, top: 25, bottom: -25, far: 70 }); sun.shadow.bias = -0.001; scene.add(sun);
  const materials = new Map();
  function material(color, extra = {}) { const key = color + JSON.stringify(extra); if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...extra })); return materials.get(key); }
  function mesh(geometry, color, parent = scene, x = 0, y = 0, z = 0, extra = {}) { const m = new THREE.Mesh(geometry, material(color, extra)); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; }
  const cylinder = (rt, rb, h, segments = 6) => new THREE.CylinderGeometry(rt, rb, h, segments);
  const sphere = new THREE.SphereGeometry(1, 16, 12);
  function orb(parent, color, x, y, z, sx, sy = sx, sz = sx, extra) { const m = mesh(sphere, color, parent, x, y, z, extra); m.scale.set(sx, sy, sz); return m; }
  // Seeded randomness keeps the garden stable across visits.
  let seed = 47;
  function random() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
  const island = new THREE.Group(); scene.add(island);
  const tileGeometry = cylinder(1.7, 1.55, 0.75);
  for (let q = -7; q <= 7; q++) for (let r = -7; r <= 7; r++) {
    const x = Math.sqrt(3) * 1.7 * (q + r / 2), z = 2.55 * r;
    if (Math.hypot(x, z) > 18.8) continue;
    const color = palette.tiles[Math.floor(random() * palette.tiles.length)];
    mesh(tileGeometry, color, island, x, -0.35 + random() * 0.07, z);
    if (Math.hypot(x, z) > 16) mesh(cylinder(1.52, 0.8, 3 + random() * 2), palette.soil, island, x, -2.5, z);
  }
  mesh(cylinder(17.8, 12, 5, 6), palette.soil, island, 0, -3.2, 0);
  mesh(cylinder(12, 3, 5, 6), palette.bedrock, island, 0, -7.2, 0);
  const ground = mesh(new THREE.PlaneGeometry(200, 200), palette.sky, scene, 0, -13, 0); ground.rotation.x = -Math.PI / 2; ground.castShadow = false;
  const grid = new THREE.GridHelper(140, 56, '#425868', '#314858'); grid.position.y = -12.98; grid.material.transparent = true; grid.material.opacity = 0.35; scene.add(grid);
  // Grass blades are instanced to keep the scene light on the GPU.
  const grass = new THREE.InstancedMesh(new THREE.ConeGeometry(0.065, 0.55, 3), material('#ffffff'), 550);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 550; i++) { const a = random() * Math.PI * 2, r = 4 + random() * 13; dummy.position.set(Math.cos(a) * r, 0.27, Math.sin(a) * r); dummy.rotation.set(random() * 0.2, a, random() * 0.3); dummy.scale.setScalar(0.7 + random()); dummy.updateMatrix(); grass.setMatrixAt(i, dummy.matrix); grass.setColorAt(i, new THREE.Color(palette.foliage[i % palette.foliage.length])); } scene.add(grass);
  const hive = new THREE.Group(); scene.add(hive);
  mesh(cylinder(3, 3.4, 0.3), '#cfac5c', hive, 0, 0.15, 0);
  for (let i = 0; i < 5; i++) mesh(cylinder(2.1 - i * 0.27, 2.2 - i * 0.27, 0.65, 12), i % 2 ? '#dba537' : '#edbb4f', hive, 0, 0.6 + i * 0.6, 0);
  orb(hive, '#f9d779', 0, 3.6, 0, 0.65, 0.35, 0.65);
  orb(hive, '#3a3020', 1.2, 0.85, 1.25, 0.5, 0.6, 0.15).rotation.y = Math.PI / 4;
  const hiveRing = mesh(new THREE.TorusGeometry(3.2, 0.05, 8, 64), '#fff2a3', hive, 0, 0.22, 0, { emissive: '#f1cb5e', emissiveIntensity: 0.5 }); hiveRing.rotation.x = -Math.PI / 2;
  const beacon = mesh(new THREE.OctahedronGeometry(0.32), '#ffe49c', hive, 0, 4.8, 0, { emissive: '#f9c75d', emissiveIntensity: 0.8 });
  let hiveBeacon = 0;
  const flowerModels = [];
  const petals = palette.flowers;
  for (const f of FLOWERS) {
    const group = new THREE.Group(); group.position.set(f.x, 0, f.z); scene.add(group);
    mesh(cylinder(0.07, 0.09, 1.5, 5), '#64864d', group, 0, 0.75, 0);
    const leaf = orb(group, '#86a563', 0.25, 0.75, 0, 0.4, 0.06, 0.17); leaf.rotation.z = 0.4;
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; const p = orb(group, petals[f.id % petals.length], Math.cos(a) * 0.48, 1.6, Math.sin(a) * 0.48, 0.43, 0.14, 0.28); p.rotation.y = -a; }
    orb(group, '#f8cc58', 0, 1.65, 0, 0.32, 0.18, 0.32);
    const nectar = mesh(new THREE.OctahedronGeometry(0.14), '#fff4bb', group, 0, 2.3, 0, { emissive: '#ffe69a', emissiveIntensity: 0.6 });
    flowerModels.push({ group, nectar });
  }
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI * 2 / 12 + 0.12, r = 16 + random(); const tree = new THREE.Group(); tree.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); scene.add(tree);
    const h = 1.8 + random() * 1.7; mesh(cylinder(0.15, 0.22, h, 6), '#806145', tree, 0, h / 2, 0);
    orb(tree, palette.foliage[i % palette.foliage.length], 0, h + 0.6, 0, 0.9, 1.2, 0.9); orb(tree, palette.foliage[(i + 1) % palette.foliage.length], 0.35, h + 1.25, 0, 0.75, 0.8, 0.75);
  }
  for (let i = 0; i < 26; i++) { const a = random() * Math.PI * 2, r = 15 + random() * 3; const rock = mesh(new THREE.DodecahedronGeometry(0.25 + random() * 0.4), ['#aaa79a', '#92968c', '#b5aa93'][i % 3], scene, Math.cos(a) * r, 0.15, Math.sin(a) * r); rock.scale.y = 0.6; }
  const motesGeometry = new THREE.BufferGeometry(); const motePositions = new Float32Array(90 * 3);
  for (let i = 0; i < 90; i++) { motePositions[i * 3] = (random() - 0.5) * 38; motePositions[i * 3 + 1] = 1 + random() * 7; motePositions[i * 3 + 2] = (random() - 0.5) * 38; }
  motesGeometry.setAttribute('position', new THREE.BufferAttribute(motePositions, 3)); const motes = new THREE.Points(motesGeometry, new THREE.PointsMaterial({ color: '#fff2c0', size: 0.07, transparent: true, opacity: 0.8 })); scene.add(motes);
  const beeModels = new Map();
  function createBee(p) {
    const group = new THREE.Group(); scene.add(group);
    const body = new THREE.Group(); group.add(body);
    orb(body, p.bot ? palette.bees[p.id % palette.bees.length] : '#ffd052', 0, 0, 0, 0.32, 0.3, 0.52);
    for (const z of [-0.2, 0.12]) { const band = mesh(cylinder(0.305, 0.305, 0.13, 16), '#34352d', body, 0, 0, z); band.rotation.x = Math.PI / 2; }
    orb(body, '#34352d', 0, 0.04, 0.44, 0.29, 0.27, 0.23);
    for (const x of [-0.13, 0.13]) { orb(body, '#fff7d7', x, 0.13, 0.61, 0.07); orb(body, '#282f29', x, 0.13, 0.66, 0.035); const antenna = mesh(cylinder(0.015, 0.02, 0.24, 5), '#34352d', body, x, 0.36, 0.47); antenna.rotation.z = x * -3; }
    const wings = [];
    for (const side of [-1, 1]) { const wing = orb(body, p.bot ? palette.wings[p.id % palette.wings.length] : '#fff8e4', side * 0.36, 0.22, -0.06, 0.4, 0.035, 0.22, { transparent: true, opacity: 0.65, roughness: 0.3 }); wings.push(wing); }
    const shadow = mesh(new THREE.CircleGeometry(p.bot ? 0.35 : 0.5, 24), p.bot ? palette.bees[p.id % palette.bees.length] : '#f9d260', scene, 0, 0.08, 0, { transparent: true, opacity: 0.4 }); shadow.rotation.x = -Math.PI / 2; shadow.castShadow = false;
    const labelCanvas = document.createElement('canvas'); labelCanvas.width = 256; labelCanvas.height = 64;
    const ctx = labelCanvas.getContext('2d'); ctx.font = `600 ${p.bot ? 23 : 27}px monospace`; ctx.textAlign = 'center'; ctx.fillStyle = p.bot ? '#f0e9ff' : '#fff8df';
    if (!p.bot) { ctx.fillStyle = '#242b45'; ctx.beginPath(); ctx.roundRect(50, 6, 156, 48, 4); ctx.fill(); ctx.fillStyle = '#ffe49c'; }
    ctx.fillText(p.bot ? p.name : 'YOU', 128, 39);
    const labelTexture = new THREE.CanvasTexture(labelCanvas); const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture, depthTest: false })); label.position.y = 1.1; label.scale.set(2.5, 0.625, 1); group.add(label);
    group.position.set(p.x, p.y, p.z);
    beeModels.set(p.id, { group, body, wings, shadow, labelTexture });
  }
  let lastBag = 0, lastScore = 0, lastResult = null, lastRound = 1, uiTime = 0;
  function updateUI() {
    const seconds = Math.max(0, Math.ceil(game.remaining)); $('timer').textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    $('round').textContent = String(game.round).padStart(2, '0'); $('honey').textContent = game.honey;
    const percent = Math.min(100, Math.floor(game.honey / RULES.goal * 100)); $('honey-progress').style.width = `${percent}%`; $('percent').textContent = `${percent}%`;
    if (player) {
      $('bag').innerHTML = Array.from({ length: RULES.capacity }, (_, i) => `<i class="${i < player.bag ? 'filled' : ''}"></i>`).join('') + `<strong>${player.bag}<span> / 8</span></strong>`;
      $('boost-label').textContent = player.boost ? `BOOST IN ${Math.ceil(player.boost)}s` : 'BOOST READY'; $('boost-meter').style.width = `${(1 - player.boost / 4) * 100}%`;
      if (player.score > lastScore) { toast(`+${player.score - lastScore} nectar delivered.`); chime(880); }
      else if (player.bag > lastBag) { chime(500 + player.bag * 55); if (player.bag === RULES.capacity) toast('Nectar bag full! Head back to the golden hive.'); }
      lastBag = player.bag; lastScore = player.score;
    }
    if (started && game.result && game.result !== lastResult) {
      $('phase').textContent = 'RESETTING';
      showModal(`<p class="eyebrow">ROUND ${game.round}</p><h2>${game.result === 'complete' ? 'Goal reached.' : 'Time expired.'}</h2><p>Hive: <strong>${game.honey} / 300 nectar</strong><br>Your contribution: <strong>${player.score}</strong></p><p class="result-note">Next round in 12 seconds.</p>`); chime(1046);
    }
    if (game.round !== lastRound) { modal.close(); $('phase').textContent = 'ACTIVE'; toast('New round.'); lastScore = 0; lastBag = 0; }
    lastResult = game.result; lastRound = game.round;
  }
  function update(dt, elapsed) {
    if (!active) return;
    if (!paused) {
      if (player) {
        const up = Number(keys.has('KeyW') || keys.has('ArrowUp')) - Number(keys.has('KeyS') || keys.has('ArrowDown'));
        const right = Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft'));
        game.setInput(player.id, modal.open ? { x: 0, z: 0 } : { ...orbit.movement(up, right), dash: keys.has('ShiftLeft') || keys.has('ShiftRight') });
      }
      game.tick(dt);
      // Keep the landing screen's world alive without using up its first round.
      if (!started) { game.remaining = RULES.duration; if (game.result) game.reset(); }
    }
    for (const p of game.players.values()) {
      if (!beeModels.has(p.id)) createBee(p);
      const bee = beeModels.get(p.id);
      bee.group.position.lerp(new THREE.Vector3(p.x, p.y + Math.sin(elapsed * 7 + p.id) * 0.06, p.z), 1 - Math.exp(-dt * 15));
      const angle = Math.atan2(Math.sin(p.yaw - bee.body.rotation.y), Math.cos(p.yaw - bee.body.rotation.y)); bee.body.rotation.y += angle * Math.min(1, dt * 12);
      bee.wings.forEach((w, i) => { w.rotation.z = Math.sin(elapsed * 75) * 0.45 * (i ? 1 : -1); }); bee.shadow.position.set(p.x, 0.07, p.z);
    }
    for (const [i, f] of flowerModels.entries()) { f.nectar.position.y = 2.25 + Math.sin(elapsed * 2 + i) * 0.15; f.nectar.rotation.y = elapsed; f.nectar.visible = !game.cooldowns[i]; }
    beacon.rotation.y = elapsed * 0.6; beacon.position.y = 4.5 + Math.sin(elapsed * 2) * 0.15;
    hiveBeacon = Math.max(0, hiveBeacon - dt); hiveRing.scale.setScalar(1 + Math.sin(elapsed * 2) * (hiveBeacon ? 0.12 : 0.025));
    motes.rotation.y = Math.sin(elapsed * 0.07) * 0.1;
    orbit.apply(camera, new THREE.Vector3(player ? player.x * 0.17 : 0, 0, player ? player.z * 0.17 : 0));
    renderer.render(scene, camera);
    uiTime += dt; if (uiTime > 0.12) { updateUI(); uiTime = 0; }
  }

  return {
    update,
    pause() { if (started && !paused) togglePause(); },
    resize(width, height) { camera.aspect = width / height; camera.updateProjectionMatrix(); },
    activate() { active = true; container.replaceChildren(root); renderer.domElement.setAttribute('aria-label', 'A floating garden with bees and a golden hive'); updateUI(); },
    deactivate() { active = false; keys.clear(); viewControls.cancel(); root.remove(); },
  };
}
