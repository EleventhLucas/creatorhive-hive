import { CUES } from './cues.js';

// Created only by a play/resume gesture. Voices are short, bounded, and stopped on pause.
export function createOfficeAudio({ random = Math.random, createContext = () => {
  const Context = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  return Context ? new Context() : null;
} } = {}) {
  let context, master, noiseBuffer, enabled = false, volume = 0.55;
  const voices = new Set(), recent = new Map(), variants = new Map();
  function unlock() {
    if (!volume) return;
    try {
      if (!context) {
        context = createContext(); if (!context) return;
        master = context.createGain(); master.gain.value = enabled ? volume : 0;
        const compressor = context.createDynamicsCompressor();
        compressor.threshold.value = -16; compressor.knee.value = 12; compressor.ratio.value = 6;
        master.connect(compressor); compressor.connect(context.destination);
        noiseBuffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
        const samples = noiseBuffer.getChannelData(0); let seed = 73;
        for (let i = 0; i < samples.length; i++) { seed = (seed * 1664525 + 1013904223) >>> 0; samples[i] = seed / 2147483648 - 1; }
      }
      context.resume()?.catch(() => {});
    } catch { context = null; master = null; }
  }
  function stop() {
    for (const voice of [...voices]) { try { voice.source.stop(); } catch {} voice.clean(); }
    recent.clear();
  }
  function setVolume(value) {
    if (!Number.isFinite(value)) return;
    volume = Math.max(0, Math.min(1, value));
    if (master) { master.gain.cancelScheduledValues(context.currentTime); master.gain.setTargetAtTime(enabled ? volume : 0, context.currentTime, 0.015); }
    if (!volume) stop();
  }
  function setEnabled(value) {
    enabled = !!value;
    if (!enabled) stop();
    if (master) { master.gain.cancelScheduledValues(context.currentTime); master.gain.setValueAtTime(enabled ? volume : 0, context.currentTime); }
  }
  function play(name, { distance = 0, pan = 0, gain = 1 } = {}) {
    if (!enabled || !volume || !context || context.state !== 'running' || !CUES[name]) return false;
    const now = context.currentTime;
    if (now - (recent.get(name) ?? -Infinity) < 0.045) return false;
    const previous = variants.get(name), variant = previous === undefined ? Math.floor(random() * 3) : (previous + 1 + Math.floor(random() * 2)) % 3;
    const layers = CUES[name](variant);
    if (voices.size + layers.length > 32) return false;
    const loudness = Math.max(0, Math.min(1, gain)) / (1 + Math.max(0, distance) ** 2 * 0.035);
    if (loudness < 0.025) return false;
    recent.set(name, now); variants.set(name, variant);
    const pitch = 0.92 + random() * 0.16, speed = 0.93 + random() * 0.14;
    for (const layer of layers) {
      const at = now + layer.at / speed, duration = layer.duration / speed;
      const source = layer.noise ? context.createBufferSource() : context.createOscillator();
      const envelope = context.createGain(), panner = context.createStereoPanner();
      panner.pan.value = Math.max(-0.85, Math.min(0.85, pan));
      const peak = layer.gain * loudness;
      envelope.gain.setValueAtTime(0, at); envelope.gain.linearRampToValueAtTime(peak, at + Math.min(0.008, duration / 4));
      envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
      let filter;
      if (layer.noise) {
        source.buffer = noiseBuffer;
        filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = layer.cutoff * pitch;
        source.connect(filter); filter.connect(envelope);
      } else {
        source.type = layer.wave;
        const frequencies = layer.points ?? [layer.frequency, layer.end];
        source.frequency.setValueAtTime(frequencies[0] * pitch, at);
        frequencies.slice(1).forEach((frequency, i) => source.frequency.exponentialRampToValueAtTime(frequency * pitch, at + duration * (i + 1) / (frequencies.length - 1)));
        source.connect(envelope);
      }
      envelope.connect(panner); panner.connect(master);
      const voice = { source, clean() { voices.delete(voice); source.disconnect(); filter?.disconnect(); envelope.disconnect(); panner.disconnect(); } };
      voices.add(voice); source.onended = voice.clean;
      source.start(at); source.stop(at + duration + 0.01);
    }
    return true;
  }
  return { unlock, play, setEnabled, setVolume, stop };
}
