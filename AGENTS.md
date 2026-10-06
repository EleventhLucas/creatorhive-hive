# Working in this repository

## Authorization and local work

- Never trigger a desktop keyring or authentication dialog. Do not run GitHub CLI, remote Git, credential-helper probes, auth checks, or login flows unless the user explicitly requests that operation and a prompt-free path is already known.
- Keep work in this repository. No deployments, publishing, account integrations, analytics, PII, or external runtime requests.
- Commit after each completed development stage, as the user requested. Run the relevant checks first. Use local commits with signing disabled for the command (`git -c commit.gpgsign=false commit`) to avoid signing dialogs. Preserve user edits and other contributors' work; do not reset unrelated changes.

## Mandatory module boundaries

Read [docs/GAME_MODULES.md](docs/GAME_MODULES.md) before adding games or features.

- A game lives in `src/games/<game-id>/`, with an `index.js` descriptor. New games must be discoverable without editing `src/main.js`, navigation, or a central game list.
- Game scenes, simulation, settings, UI, and features stay inside their game folder. Add substantial new features as cohesive files or `features/<feature-name>/` modules; do not grow the shared shell with game-specific conditionals.
- Never import another game's files. Shared code belongs in `src/shared/` only when there is a real shared need. Shell changes are reserved for features that apply to all games.
- Game CSS must be rooted at the descriptor's `uiClass`. Do not style global elements or another game's UI from a game stylesheet. `npm run check:modules` enforces descriptors, import boundaries, and CSS scoping; the production build runs it automatically.
- Follow the lifecycle contract. Only the active game may process inputs, update state, render, or play media. Deactivation removes its UI, clears inputs, releases pointer lock, and pauses media. Preserve its session state across navigation.
- Do not add a new framework, backend, persistence layer, or multiplayer implementation without a request. Multiplayer is internally planned only.

## Collaboration and validation

- Keep changes focused on the owning module. State the game/features and files you are editing when coordinating with contributors. Avoid touching another module or shared shell unless required.
- Put behavioral tests in `test/<game-id>/` for new work. Existing flat tests are retained; do not churn unrelated tests just to relocate them.
- Run `npm test` and `npm run build` before committing a stage. For media changes also run `npm run check:media` (requires FFprobe).
- Keep video assets silent and small: 256 KiB maximum each, 768 KiB combined. Document source/license in `public/media/README.md`; never add Git LFS or large downloads. Original procedural artwork is preferred.
- UI should be compact with clear objectives and accessible icon buttons. Global display preferences belong to the shell; game movement/FoV preferences belong only to that game.
