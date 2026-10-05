import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Window } from 'happy-dom';
import { createOffice } from '../src/office.js';

test('office replaces all garden overlays and switching back preserves the garden HUD state', () => {
  const browserWindow = new Window();
  const previous = Object.fromEntries(['window', 'document', 'matchMedia'].map(key => [key, globalThis[key]]));
  try {
    globalThis.window = browserWindow;
    globalThis.document = browserWindow.document;
    globalThis.matchMedia = () => ({ matches: true });
    browserWindow.HTMLCanvasElement.prototype.getContext = () => ({ fillRect() {}, strokeRect() {}, fillText() {} });

    // Use the actual page markup, including its nested garden HUD and controls.
    const source = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
    document.body.innerHTML = source.match(/innerHTML = `([\s\S]*?)`;/)[1].replace('${hexIcon}', '');
    const layer = document.getElementById('game-ui');
    const garden = document.getElementById('garden-ui');
    const intro = document.getElementById('intro');
    const inventory = document.getElementById('flight-hud');
    intro.hidden = true; inventory.hidden = false;
    const canvas = document.createElement('canvas');
    document.getElementById('world').appendChild(canvas);
    const renderer = { domElement: canvas, render() {} };
    const office = createOffice({ renderer, container: layer, notify() {}, chime() {} });
    assert.equal(layer.children.length, 1);
    assert.equal(document.querySelector('.office-ui'), null, 'inactive office UI must not appear in the garden');

    for (let visit = 0; visit < 3; visit++) {
      office.activate();
      assert.equal(layer.children.length, 1);
      for (const selector of ['.arena-top', '.scene-label', '#timer', '#honey', '#flight-hud', '#touch-controls']) {
        assert.equal(document.querySelector(selector), null, `${selector} must not carry into the office`);
      }
      const officePanel = document.querySelector('.office-ui');
      assert.equal(officePanel.hidden, false);
      assert.match(officePanel.textContent, /WORKER BEE SIM/);
      assert.doesNotMatch(officePanel.textContent, /GARDEN_01|nectar drop-off|YOUR NECTAR/);
      officePanel.querySelector('[data-office="start"]').click();
      office.update(0.05, 0);
      assert.equal(officePanel.querySelector('[data-office="intro"]').hidden, true);
      assert.match(officePanel.querySelector('[data-office="task"]').textContent, /Approve pollen reports/);

      office.deactivate();
      layer.replaceChildren(garden);
      assert.equal(document.querySelector('.office-ui'), null);
      assert.equal(document.getElementById('intro'), intro);
      assert.equal(intro.hidden, true, 'switching must not restart the garden');
      assert.equal(inventory.hidden, false, 'the active garden inventory must return');
      assert.equal(document.getElementById('timer').textContent, '3:00');
    }
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
    }
    browserWindow.happyDOM.abort();
  }
});
