# Contributing

This is a local browser game collection. Start with `npm ci`, then `npm run dev`, or press F5 in VS Code. Nothing requires accounts or external services.

Choose a game folder under `src/games/` and keep its features there. The shell discovers `index.js` entries and `style.css` automatically, so adding a game does not require changing a central registry. See [the module contract](docs/GAME_MODULES.md) for a minimal entry and lifecycle details. Agents must also follow [AGENTS.md](AGENTS.md).

To reduce merge conflicts, agree on the owning game and feature files before overlapping work. Prefer new cohesive feature modules to unrelated edits in shared files. A Worker Bee Sim feature normally belongs under `src/games/worker-bee/`; a new game gets its own folder. Keep tests close by naming them for the game under `test/<game-id>/`.

Before a local commit:

```sh
npm test
npm run build
# Only when changing monitor videos; requires FFprobe:
npm run check:media
```

The build checks module boundaries and CSS scope. Test behavior that crosses boundaries: inactive input/media, navigation preserving session state, collision and task rules. Keep assets small and document their rights. Do not introduce personal data, analytics, external runtime dependencies, or Git LFS.
