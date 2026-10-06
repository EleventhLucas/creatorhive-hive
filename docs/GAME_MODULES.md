# Game modules

The shell (`src/main.js`) creates one WebGL renderer and discovers `src/games/*/index.js` using Vite's `import.meta.glob`. Each entry exports a `game` descriptor. Navigation comes from descriptors; instances are created on first selection and reused for the current page session. Optional `style.css` files are discovered alongside entries.

To add a game, create `src/games/example/index.js`:

```js
export const game = {
  id: 'example', // Must match the directory name; unique across games.
  title: 'Example', order: 30, label: 'Example game', uiClass: 'example-ui',
  controls: '<span><kbd>SPACE</kbd> play</span>',
  create({ renderer, container, notify, openDialog, closeDialog }) {
    const root = document.createElement('div'); root.className = 'example-ui';
    let active = false;
    // Create your own scene/camera/state here; retain them between visits.
    return {
      activate() { active = true; container.replaceChildren(root); },
      deactivate() { active = false; root.remove(); /* Clear keys, stop media, release pointer lock. */ },
      update(dt, elapsed) { if (!active) return; /* Tick state and renderer.render(scene, camera). */ },
      resize(width, height) { /* Update your camera aspect and projection. */ },
      pause() { /* Pause simulation, clear inputs, show an accessible resume button. */ },
    };
  },
};
```

Put game CSS in `src/games/example/style.css`, with selectors rooted at `.example-ui`. Media queries must also contain scoped selectors. Use shared shell variables such as `--text`, `--muted`, `--panel`, `--line`, and `--accent` for the global theme. Shell utilities provide buttons, intro panels, dialogs, and control-strip styling.

`notify(message)` displays a transient toast. `openDialog(html)` opens the shared dialog; pause first when gameplay should stop. `closeDialog()` closes it. These APIs accept repository-authored UI, not untrusted HTML. Global appearance/fullscreen settings use the shell; movement or camera settings use a game's own HUD.

`activate`, `deactivate`, `update`, `resize`, and `pause` are required. The host checks that they exist. Input handlers may stay registered for the lifetime of the app but must check active state and open dialogs. Avoid renderer-global changes that affect later games. Constructors must not attach visible UI or play media; do those in `activate`. Deactivate must stop video/audio, clear held controls, and release pointer lock.

Keep simulation pure where practical and keep cohesive features in separate files or `features/<name>/`. For example, Worker Bee Sim owns `simulation.js`, `npcs.js`, `media.js`, and `settings.js`; its entry only describes the game and delegates creation. Games cannot import each other or shell implementation files. Shared reusable helpers may be added to `src/shared/` when needed.

`npm run check:modules` validates descriptors, relative import boundaries, and scoped game CSS. `npm run build` runs this check before bundling. Tests in `test/mode-ui.test.js` exercise real module switching and UI isolation; `test/game-host.test.js` verifies adding a third module without changes to navigation.

Monitor videos stay in `public/media/` because they form the existing shared asset budget. New game assets can use `public/games/<id>/`, with source/license documentation. Keep all videos silent and within the repo-wide 256 KiB per-clip / 768 KiB combined limit, extending the media checker to include any new clips. No big files or Git LFS.
