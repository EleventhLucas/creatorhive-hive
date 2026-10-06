import { createOffice } from './office.js';
export const game = {
  id: 'worker-bee', title: 'Worker Bee Sim', uiClass: 'office-ui', order: 20, label: 'Worker Bee Sim first-person office game',
  controls: '<span class="controls-label">CONTROLS</span><span><kbd>WASD</kbd> walk</span><span><kbd>MOUSE</kbd> look</span><span><kbd>SHIFT</kbd> sprint</span><span><kbd>SPACE</kbd> jump / glide</span><span><kbd>E</kbd> work</span><span><kbd>F</kbd> sit / stand</span><span><kbd>LMB</kbd> throw mug</span><span><kbd>ESC</kbd> / <kbd>P</kbd> pause</span>',
  create: createOffice,
};
