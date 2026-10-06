import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { createOffice } from '../../src/games/worker-bee/office.js';
import { GameSettings } from '../../src/games/worker-bee/settings.js';

test('office audio follows play, settings volume, mute, pause, and game activation', () => {
  const browserWindow = new Window(), saved = Object.fromEntries(['window', 'document', 'matchMedia'].map(k => [k, globalThis[k]]));
  try {
    globalThis.window = browserWindow; globalThis.document = browserWindow.document; globalThis.matchMedia = () => ({ matches: true });
    browserWindow.HTMLCanvasElement.prototype.getContext = () => ({ fillRect() {}, strokeRect() {}, fillText() {} });
    browserWindow.HTMLMediaElement.prototype.play = () => Promise.resolve(); browserWindow.HTMLMediaElement.prototype.pause = () => {};
    const layer = document.createElement('div'), canvas = document.createElement('canvas'), dialog = document.createElement('dialog'); document.body.append(canvas, layer, dialog);
    let enabled = false, unlocked = 0, volume = null; const cues = [];
    const audio = { setVolume(v) { volume = v; }, setEnabled(v) { enabled = v; }, unlock() { unlocked++; }, play(cue) { if (enabled && volume) cues.push(cue); } };
    const settings = new GameSettings();
    const office = createOffice({ renderer: { domElement: canvas, render() {} }, container: layer, settings, audio, random: () => 0, notify() {}, openDialog(html) { dialog.innerHTML = html; } });
    assert.equal(unlocked, 0); office.activate(); office.update(0.05, 0); assert.equal(enabled, false); assert.equal(unlocked, 0);
    layer.querySelector('[data-office="start"]').click(); assert.equal(enabled, true); assert.ok(unlocked > 0); assert.ok(cues.includes('clockIn'));
    canvas.click(); office.update(0.05, 0); assert.ok(cues.includes('throw'));
    for (let i = 0; i < 2; i++) office.update(0.05, 0); assert.ok(!cues.includes('refill'));
    office.update(0.05, 0); assert.ok(cues.includes('refill'));
    layer.querySelector('.office-settings').click(); assert.equal(enabled, false);
    const slider = document.getElementById('office-volume'); assert.equal(slider.disabled, false);
    slider.value = '23'; slider.oninput({ target: slider }); assert.equal(settings.volume, 0.23); assert.equal(volume, 0.23);
    slider.value = '0'; slider.oninput({ target: slider }); assert.equal(volume, 0); assert.match(document.getElementById('office-volume-value').textContent, /Muted/);
    layer.querySelector('.office-sound').click(); assert.equal(volume, 0.23, 'unmute restores last nonzero level');
    layer.querySelector('[data-office="start"]').click(); assert.equal(enabled, true); assert.ok(cues.includes('resume'));
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new browserWindow.Event('visibilitychange')); assert.equal(enabled, false);
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    layer.querySelector('[data-office="start"]').click(); assert.equal(enabled, true);
    office.pause(); assert.equal(enabled, false); const count = cues.length;
    canvas.click(); office.update(0.05, 0); assert.equal(cues.length, count);
    layer.querySelector('[data-office="start"]').click(); office.deactivate(); assert.equal(enabled, false);
    document.dispatchEvent(new browserWindow.KeyboardEvent('keydown', { code: 'Space' })); canvas.click(); office.update(0.05, 0); assert.equal(enabled, false);
  } finally { for (const [k, v] of Object.entries(saved)) { if (v === undefined) delete globalThis[k]; else globalThis[k] = v; } browserWindow.happyDOM.abort(); }
});
