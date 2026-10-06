import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { openDisplaySettings } from '../src/display-settings.js';

test('global preferences change appearance, accent, compact UI, and fullscreen without office controls', async () => {
  const browserWindow = new Window(), previous = globalThis.document; globalThis.document = browserWindow.document;
  try {
    document.body.innerHTML = '<dialog id="modal"><div id="content"></div></dialog>';
    const modal = document.getElementById('modal'); modal.close = () => {};
    let paused = 0, fullscreen = 0;
    document.fullscreenEnabled = true; document.documentElement.requestFullscreen = async () => { fullscreen++; };
    openDisplaySettings({ pause() { paused++; }, notify() {}, openDialog(html) { document.getElementById('content').innerHTML = html; } });
    assert.equal(paused, 1); assert.doesNotMatch(modal.textContent, /FoV|bobbing|Volume/);
    const theme = document.getElementById('theme-choice'); theme.value = 'light'; theme.onchange({ target: theme }); assert.equal(document.documentElement.dataset.theme, 'light');
    document.querySelector('[data-accent="#74d9e6"]').click(); assert.equal(document.documentElement.style.getPropertyValue('--accent'), '#74d9e6');
    const compact = document.getElementById('compact-ui'); compact.checked = true; compact.onchange({ target: compact }); assert.ok(document.body.classList.contains('compact-ui'));
    await document.getElementById('fullscreen-button').onclick(); assert.equal(fullscreen, 1);
  } finally { if (previous === undefined) delete globalThis.document; else globalThis.document = previous; browserWindow.happyDOM.abort(); }
});
