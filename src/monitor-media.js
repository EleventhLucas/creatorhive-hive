import * as THREE from 'three';

export const MONITOR_CLIPS = ['pollen-flight', 'waggle-dance', 'honey-loop'];

export function createMonitorMedia(screens, { random = Math.random } = {}) {
  const poster = document.createElement('canvas'); poster.width = 64; poster.height = 36;
  const ctx = poster.getContext('2d');
  ctx.fillStyle = '#152b20'; ctx.fillRect(0, 0, 64, 36);
  ctx.fillStyle = '#accdb0'; ctx.fillRect(23, 8, 9, 7); ctx.fillRect(34, 8, 9, 7);
  ctx.fillStyle = '#e4bd58'; ctx.fillRect(19, 16, 27, 13);
  ctx.fillStyle = '#273323'; ctx.fillRect(24, 16, 4, 13); ctx.fillRect(34, 16, 4, 13); ctx.fillRect(44, 17, 7, 11);
  const posterTexture = new THREE.CanvasTexture(poster); posterTexture.colorSpace = THREE.SRGBColorSpace;
  screens.forEach(screen => { screen.material = new THREE.MeshBasicMaterial({ map: posterTexture, toneMapped: false }); });
  let active = false, paused = true;
  const pools = [];
  function makePool(index) {
    const video = document.createElement('video'); video.muted = true; video.defaultMuted = true; video.volume = 0;
    video.setAttribute('muted', ''); video.playsInline = true; video.setAttribute('playsinline', ''); video.preload = 'none';
    const texture = new THREE.VideoTexture(video); texture.colorSpace = THREE.SRGBColorSpace;
    const pool = { video, texture, clip: index, screens: [] };
    const showPoster = () => pool.screens.forEach(s => { s.material.map = posterTexture; s.material.needsUpdate = true; });
    video.addEventListener('playing', () => pool.screens.forEach(s => { s.material.map = texture; s.material.needsUpdate = true; }));
    video.addEventListener('error', showPoster);
    video.addEventListener('ended', () => {
      pool.clip = (pool.clip + 1 + Math.floor(random() * 2)) % MONITOR_CLIPS.length;
      showPoster(); video.src = `/media/${MONITOR_CLIPS[pool.clip]}.mp4`;
      if (active && !paused) video.play()?.catch(showPoster);
    });
    video.src = `/media/${MONITOR_CLIPS[index]}.mp4`;
    return pool;
  }
  function initialize() {
    if (pools.length) return;
    for (let i = 0; i < 3; i++) pools.push(makePool(i));
    const offset = Math.floor(random() * 3);
    screens.forEach((screen, i) => pools[(i + offset) % 3].screens.push(screen));
  }
  return {
    start() { active = true; paused = false; initialize(); for (const pool of pools) pool.video.play()?.catch(() => {}); },
    pause() { paused = true; for (const pool of pools) pool.video.pause(); },
    stop() { active = false; paused = true; for (const pool of pools) pool.video.pause(); },
  };
}
