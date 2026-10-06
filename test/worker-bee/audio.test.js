import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createOfficeAudio } from '../../src/games/worker-bee/features/audio/engine.js';
import { CUES } from '../../src/games/worker-bee/features/audio/cues.js';

export function fakeAudioContext() {
  const sources = [], gains = [], pans = [];
  const param = () => ({ value: 0, events: [], setValueAtTime(value, at) { this.events.push([value, at]); }, linearRampToValueAtTime(value, at) { this.events.push([value, at]); }, exponentialRampToValueAtTime(value, at) { this.events.push([value, at]); }, setTargetAtTime(value, at) { this.events.push([value, at]); }, cancelScheduledValues() {} });
  const node = () => ({ connect() {}, disconnect() { this.disconnected = true; } });
  const source = () => { const s = { ...node(), frequency: param(), start(at) { this.starts = at; }, stop(at) { this.stops = at; } }; sources.push(s); return s; };
  return { sources, gains, pans, currentTime: 0, sampleRate: 8000, state: 'running', destination: {}, resume() { return Promise.resolve(); },
    createGain() { const n = { ...node(), gain: param() }; gains.push(n); return n; }, createDynamicsCompressor() { return { ...node(), threshold: param(), knee: param(), ratio: param() }; },
    createBuffer(channels, length) { return { getChannelData() { return new Float32Array(length); } }; }, createBufferSource: source, createOscillator: source,
    createBiquadFilter() { return { ...node(), frequency: param() }; }, createStereoPanner() { const n = { ...node(), pan: param() }; pans.push(n); return n; } };
}
test('audio starts only after unlock and stops queued/current voices on mute or deactivation', () => {
  const context = fakeAudioContext(); let created = 0;
  const audio = createOfficeAudio({ createContext() { created++; return context; }, random: () => 0.5 });
  audio.setEnabled(true); assert.equal(audio.play('jump'), false); assert.equal(created, 0);
  audio.unlock(); assert.equal(created, 1); assert.equal(audio.play('jump'), true);
  assert.ok(context.sources.every(s => s.stops > s.starts));
  audio.setEnabled(false); assert.ok(context.sources.every(s => s.disconnected && s.stops === undefined));
  assert.equal(audio.play('throw'), false);
  audio.setEnabled(true); context.currentTime = 1; audio.play('clockIn'); audio.setVolume(0);
  assert.equal(audio.play('refill'), false); assert.ok(context.sources.every(s => s.disconnected));
  audio.setVolume(0.7); audio.unlock(); assert.equal(created, 1); assert.equal(audio.play('refill'), true);
});
test('every cartoon family has varied recipes and schedules bounded positive envelopes', () => {
  assert.equal(Object.keys(CUES).length, 30);
  const context = fakeAudioContext(), audio = createOfficeAudio({ createContext: () => context, random: () => 0.5 });
  audio.setEnabled(true); audio.unlock();
  for (const [name, recipe] of Object.entries(CUES)) {
    assert.notDeepEqual(recipe(0), recipe(1), name);
    for (let variant = 0; variant < 3; variant++) for (const layer of recipe(variant)) { assert.ok(layer.duration > 0 && layer.duration < 0.6); assert.ok(layer.gain <= 0.15); }
    assert.equal(audio.play(name), true, name); audio.stop(); context.currentTime++;
  }
  assert.ok(context.gains.flatMap(g => g.gain.events).every(([value, at]) => Number.isFinite(value) && value >= 0 && Number.isFinite(at)));
});
test('distance/panning, burst throttling, and a voice cap constrain noisy scenes', () => {
  const context = fakeAudioContext(), audio = createOfficeAudio({ createContext: () => context, random: () => 0 });
  audio.setEnabled(true); audio.unlock(); audio.play('hit', { distance: 10, pan: 3 });
  assert.equal(context.pans[0].pan.value, 0.85);
  assert.ok(context.gains[1].gain.events[1][0] < 0.04, 'distant hits are softer');
  assert.equal(audio.play('hit'), false, 'same-frame repeated impacts are throttled');
  for (const name of Object.keys(CUES)) { context.currentTime += 0.1; audio.play(name); }
  assert.ok(context.sources.length <= 32, 'voice cap includes future scheduled notes');
  for (const s of context.sources) s.onended();
  context.currentTime++; assert.equal(audio.play('shiftComplete'), true, 'ended nodes release voice capacity');
});
test('unsupported audio and rejected resume remain playable and silent', () => {
  const audio = createOfficeAudio({ createContext: () => null }); audio.setEnabled(true); audio.unlock(); assert.equal(audio.play('jump'), false);
  const broken = createOfficeAudio({ createContext() { throw new Error('unavailable'); } }); broken.unlock(); assert.equal(broken.play('jump'), false);
});
