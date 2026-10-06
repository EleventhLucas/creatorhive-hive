import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { createGameHost } from '../src/game-host.js';

test('a third game appears automatically, is created lazily, and receives only active lifecycle calls', () => {
  const browserWindow = new Window(), previousDocument = globalThis.document;
  globalThis.document = browserWindow.document;
  try {
    const calls = [], container = document.createElement('div'), controls = document.createElement('div'), navigation = document.createElement('nav'), arena = document.createElement('section');
    const games = ['one', 'two', 'new-game'].map(id => ({ id, title: id, controls: `${id} controls`, label: `${id} game`, create() {
      calls.push(`${id}:create`); const root = document.createElement('div'); root.textContent = id;
      return { activate() { calls.push(`${id}:activate`); container.replaceChildren(root); }, deactivate() { calls.push(`${id}:deactivate`); root.remove(); },
        pause() { calls.push(`${id}:pause`); }, update() { calls.push(`${id}:update`); }, resize(w, h) { calls.push(`${id}:resize:${w}:${h}`); } };
    } }));
    const host = createGameHost({ games, container, controls, navigation, arena, renderer: { domElement: document.createElement('canvas') }, closeDialog() {} });
    assert.equal(navigation.children.length, 3); assert.equal(calls.length, 0);
    host.resize(800, 600); host.select('one'); host.update(0.05, 0);
    navigation.children[2].click(); host.update(0.05, 1); host.pause();
    assert.equal(host.activeId, 'new-game'); assert.equal(container.textContent, 'new-game'); assert.equal(controls.textContent, 'new-game controls');
    assert.equal(navigation.children[2].getAttribute('aria-pressed'), 'true');
    assert.ok(calls.includes('one:deactivate') && calls.includes('new-game:resize:800:600'));
    assert.ok(!calls.includes('two:create')); assert.equal(calls.filter(c => c === 'one:update').length, 1);
    host.select('one'); assert.equal(calls.filter(c => c === 'one:create').length, 1, 'reuse session state');
    assert.throws(() => host.select('missing'), /Unknown game/);
  } finally { if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument; browserWindow.happyDOM.abort(); }
});
