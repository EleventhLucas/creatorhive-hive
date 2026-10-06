import { createHive } from './scene.js';

export const game = {
  id: 'hive', title: 'Hive', uiClass: 'garden-ui', order: 10, label: '3D hive game',
  controls: `<span class="controls-label">CONTROLS</span><span><kbd>WASD</kbd> move</span><span><kbd>SPACE</kbd> / <kbd>CTRL</kbd> altitude</span><span><kbd>SHIFT</kbd> boost</span><span><kbd>P</kbd> pause</span>`, create: createHive,
};

