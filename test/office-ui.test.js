import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { createOffice } from '../src/games/worker-bee/office.js';
import { GameSettings } from '../src/games/worker-bee/settings.js';

test('office input drives FOV, mug throwing/refill, chair sitting, and pause without leaking into another mode', () => {
  const browserWindow = new Window();
  const previous = Object.fromEntries(['window', 'document', 'matchMedia'].map(key => [key, globalThis[key]]));
  try {
    globalThis.window = browserWindow; globalThis.document = browserWindow.document; globalThis.matchMedia = () => ({ matches: true });
    browserWindow.HTMLCanvasElement.prototype.getContext = () => ({ fillRect() {}, strokeRect() {}, fillText() {} });
    browserWindow.HTMLMediaElement.prototype.play = () => Promise.resolve(); browserWindow.HTMLMediaElement.prototype.pause = () => {};
    const canvas = document.createElement('canvas'), layer = document.createElement('div'); document.body.append(canvas, layer);
    let scene, camera, openedSettings = 0;
    const renderer = { domElement: canvas, render(s, c) { scene = s; camera = c; } };
    const settings = new GameSettings(); settings.set('bobbing', 0);
    const office = createOffice({ renderer, container: layer, notify() {}, settings, openDialog() { openedSettings++; }, random: () => 0 });
    office.activate(); layer.querySelector('[data-office="start"]').click(); office.update(0.05, 0);
    settings.set('fov', 95); office.update(0.05, 0); assert.equal(camera.fov, 95);
    layer.querySelector('.office-settings').click(); assert.equal(openedSettings, 1);
    layer.querySelector('[data-office="start"]').click();
    const held = scene.getObjectByName('held-nectar-mug'); assert.equal(held.visible, true);
    canvas.click(); office.update(0.05, 0); assert.equal(held.visible, false);
    assert.ok(scene.getObjectByName('thrown-nectar-mug-1'));
    for (let i = 0; i < 2; i++) office.update(0.05, 0); assert.equal(held.visible, false);
    office.update(0.05, 0); assert.equal(held.visible, true);

    function walk(code, frames) {
      document.dispatchEvent(new browserWindow.KeyboardEvent('keydown', { code }));
      for (let i = 0; i < frames; i++) office.update(0.05, i * 0.05);
      document.dispatchEvent(new browserWindow.KeyboardEvent('keyup', { code }));
    }
    // Walk the outside aisle, then approach the report computer's chair.
    walk('KeyW', 18); walk('KeyA', 66); walk('KeyW', 50); walk('KeyD', 16);
    assert.ok(Math.abs(camera.position.x + 8) < 0.2, `chair approach x: ${camera.position.x}`); assert.ok(Math.abs(camera.position.z + 2.88) < 0.2, `chair approach z: ${camera.position.z}`);
    document.dispatchEvent(new browserWindow.KeyboardEvent('keydown', { code: 'KeyF' })); office.update(0.05, 0);
    assert.equal(camera.position.y, 1.22); assert.match(layer.querySelector('.seat-hint').textContent, /stand up/);
    const seatedX = camera.position.x, seatedZ = camera.position.z; walk('KeyW', 10);
    assert.equal(camera.position.x, seatedX); assert.equal(camera.position.z, seatedZ);
    document.dispatchEvent(new browserWindow.KeyboardEvent('keyup', { code: 'KeyF' }));
    document.dispatchEvent(new browserWindow.KeyboardEvent('keydown', { code: 'KeyF' })); office.update(0.05, 0);
    assert.equal(camera.position.y, 1.65);

    office.pause(); const pausedZ = camera.position.z; walk('KeyW', 10); assert.equal(camera.position.z, pausedZ);
    office.deactivate(); document.dispatchEvent(new browserWindow.KeyboardEvent('keydown', { code: 'KeyF' })); canvas.click(); office.update(0.05, 0);
    assert.equal(layer.children.length, 0); assert.equal(camera.position.z, pausedZ);
  } finally {
    for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete globalThis[key]; else globalThis[key] = value; }
    browserWindow.happyDOM.abort();
  }
});
