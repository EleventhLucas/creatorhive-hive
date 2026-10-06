import { createHive } from './scene.js';

export const game = {
  id: 'hive', title: 'Honey Retrieval', uiClass: 'garden-ui', order: 10, label: 'Honey Retrieval garden game',
  controls: `<span class="controls-label">CONTROLS</span><span><kbd>WASD</kbd> move</span><span><kbd>LMB</kbd> drag to rotate</span><span><kbd>SCROLL</kbd> zoom</span><span><kbd>SHIFT</kbd> boost</span><span><kbd>P</kbd> pause</span>`, create: createHive,
};

