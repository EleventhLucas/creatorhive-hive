import * as THREE from 'three';

// Tiny, repeatable material grain generated in memory; no texture assets or requests.
export function createSurfaceTextures() {
  const textures = {};
  for (const kind of ['paint', 'wood', 'fabric']) {
    const size = 64, pixels = new Uint8Array(size * size * 4); let seed = 41;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const noise = seed / 4294967296;
      const grain = kind === 'wood' ? Math.sin(y * 0.75 + Math.sin(x * 0.15) * 0.7) * 8
        : kind === 'fabric' ? ((x + y) % 2) * 5 : 0;
      const value = Math.round(241 + noise * 12 + grain);
      const offset = (y * size + x) * 4;
      pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = Math.min(255, value); pixels[offset + 3] = 255;
    }
    const texture = new THREE.DataTexture(pixels, size, size);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(kind === 'wood' ? 3 : 6, 6);
    texture.magFilter = THREE.LinearFilter; texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true; texture.needsUpdate = true; textures[kind] = texture;
  }
  return textures;
}
