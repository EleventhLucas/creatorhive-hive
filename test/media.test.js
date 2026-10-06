import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { Window } from 'happy-dom';
import { MONITOR_CLIPS, createMonitorMedia } from '../src/monitor-media.js';

test('bundled bee videos stay within the small-file budget and have only video tracks', () => {
  let total = 0;
  function handlers(buffer, start = 0, end = buffer.length) {
    const found = [];
    for (let offset = start; offset + 8 <= end;) {
      const size = buffer.readUInt32BE(offset), type = buffer.toString('ascii', offset + 4, offset + 8);
      assert.ok(size >= 8 && offset + size <= end, 'valid MP4 box');
      if (['moov', 'trak', 'mdia'].includes(type)) found.push(...handlers(buffer, offset + 8, offset + size));
      if (type === 'hdlr') found.push(buffer.toString('ascii', offset + 16, offset + 20));
      offset += size;
    }
    return found;
  }
  for (const clip of MONITOR_CLIPS) {
    const path = new URL(`../public/media/${clip}.mp4`, import.meta.url); const size = statSync(path).size;
    assert.ok(size < 256 * 1024, `${clip} must stay tiny`); total += size;
    const data = readFileSync(path); assert.equal(data.toString('ascii', 4, 8), 'ftyp');
    assert.deepEqual(handlers(data), ['vide'], `${clip} must contain video and no audio`);
  }
  assert.ok(total < 768 * 1024);
});

test('six monitors share three muted video players and stop when inactive', () => {
  const browserWindow = new Window(); const previous = globalThis.document;
  try {
    globalThis.document = browserWindow.document;
    browserWindow.HTMLCanvasElement.prototype.getContext = () => ({ fillRect() {} });
    let plays = 0, pauses = 0; const videos = [];
    const create = document.createElement.bind(document);
    document.createElement = tag => {
      const element = create(tag);
      if (tag === 'video') { videos.push(element); element.play = () => { plays++; return Promise.resolve(); }; element.pause = () => { pauses++; }; }
      return element;
    };
    const screens = Array.from({ length: 6 }, () => ({}));
    const media = createMonitorMedia(screens, { random: () => 0 });
    assert.equal(videos.length, 0, 'do not load videos before activating the office');
    media.start(); assert.equal(videos.length, 3); assert.equal(plays, 3);
    assert.ok(videos.every(v => v.muted && v.defaultMuted && v.volume === 0 && v.playsInline));
    videos.forEach(v => v.dispatchEvent(new browserWindow.Event('playing')));
    assert.equal(new Set(screens.map(s => s.material.map)).size, 3);
    const initial = videos[0].src; videos[0].dispatchEvent(new browserWindow.Event('ended'));
    assert.notEqual(videos[0].src, initial); assert.equal(plays, 4);
    media.pause(); assert.equal(pauses, 3);
    videos[0].dispatchEvent(new browserWindow.Event('ended')); assert.equal(plays, 4, 'no playback after pausing');
    media.start(); assert.equal(videos.length, 3, 'resuming reuses decoders');
    media.stop(); const stopped = plays; videos[0].dispatchEvent(new browserWindow.Event('ended')); assert.equal(plays, stopped);
  } finally {
    if (previous === undefined) delete globalThis.document; else globalThis.document = previous;
    browserWindow.happyDOM.abort();
  }
});
