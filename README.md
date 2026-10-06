# The Hive

Honey Retrieval is a local, single-player 3D bee game for CreatorHive's livestream. Fly through a floating hexagonal garden with natural grass, earth, and stone, colorful flowers, and honey-colored AI scouts, collect nectar from flowers, and return it to the golden hive. Six AI scouts contribute to a shared goal of 300 nectar in three minutes. Rounds restart automatically.

## Run locally

Requires Node.js 22.12+ and npm.

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173**. Click **▶** to begin. The landing screen previews the AI garden.

The interface uses a minimal dark terminal theme: gameplay fills the page, the objective and timer sit inside the game, and a compact controls strip stays beneath it. Use the **Honey Retrieval** and **Worker Bee Sim** buttons to switch games; the inactive mode stops updating and its UI is removed from the page until you return.

## Settings

The centered navigation switches games. The top-right global **⚙** controls fullscreen, dark/light appearance, accent colors, and compact UI. The default is black and yellow; preferences last for the current page session.

Worker Bee Sim has its own **⚙** inside the office HUD for first-person FoV (55–105°) and walking view bobbing (0–300%; default 100%; 0 disables camera and item motion). Reduced-motion devices default to no bobbing. Its sound volume slider controls cartoon effects and office ambience (default 55%; 0 mutes). The HUD **♫** button mutes/unmutes quickly.

## Worker Bee Sim

A first-person office game with wood desks, neutral walls, coordinated blue and sage dividers, and restrained ceramic mug and tie accents, stickman bee coworkers with shaped ties, subtle procedural surface grain, honeycomb archives, pollen paperwork, and a nectar cooler. Select **Worker Bee Sim** and click **▶** to clock in. Finish four tasks in order: approve pollen reports, print honey labels, file them, and refill your nectar mug. Objectives say where to go. Active stations have a large bobbing arrow, a glowing floor ring, and a distance indicator; at the destination the objective changes to a work action. After completing a shift, click **▶** for the next shift to start again.

- **WASD / arrows**: walk; **Shift**: sprint.
- **Space**: jump, then hold to glide for up to one second on descent. Glide recharges on landing. The bee can land on furniture; room bounds and the ceiling still constrain movement.
- **Mouse**: look around. Clicking Clock in captures the mouse; **Esc** releases it and pauses. Dragging the game is also supported when mouse capture is unavailable.
- **Hold E** near the highlighted station for 1.5 seconds to complete its task. For pollen reports, first press **F** at the marked computer chair to sit; the seated view lines up with the monitor center.
- **F** near an unoccupied computer chair: sit / stand. You can look around, throw mugs, and do computer work while seated; walking resumes after standing up. Hands and the hexagonal nectar mug bob and sway with walking and mouse movement.
- **Left click**: throw your nectar mug. A replacement appears after 0.2 seconds. Thrown mugs follow gravity, bounce off floors/walls/desktops, and disappear after four seconds.
- **P** or the pause button: pause/resume. Resume captures the mouse again.
- Touch devices: drag the game to look, use the direction buttons to walk, hold **Work** at a station, and use **Sit / Stand** and **Throw**.

Furniture and walls block movement. Switching modes releases the mouse, and returning to an active office shift shows a Resume button. Both games remain entirely local, without saved progress or multiplayer.

### Coworkers

Five stickman bee coworkers alternate between typing at their computers, standing up, walking around desks, nectar breaks, and idle conversation. Their joints animate for walking, sitting, typing, sipping, and gestures. Nearby thrown-mug impacts make them react briefly before returning to their routine. Land 2–3 direct mug hits within four seconds and a coworker randomly crumples, tumbles like a ragdoll, or bursts into honey-colored particles; they respawn at a random clear office location after 2.6 seconds. Each mug can hit a given coworker only once. They route around furniture, avoid the player, and reserve chairs while seated; returning workers wait if you took their chair. The pollen-report chair is always available for the player. NPC-to-NPC collisions are disabled. NPC activity pauses with the office.

### Cartoon sounds

Worker Bee Sim synthesizes **30 original cartoon effect families**, each with **three base variations** and randomized pitch/timing: footsteps, spring jumps, wing flutter, landing thuds, mug throws/refills and surface clinks, rubbery coworker hits, crumple/ragdoll/burst knockdowns, respawn pops, chair squeaks, report typing, printer noises, archive rustles, nectar bubbles, task jingles, bee chatter, sipping, and occasional buzzes.

Sound starts after clicking **▶**. The office **⚙** has a working volume slider; **♫** toggles mute. Nearby coworkers and impacts sound louder and pan with your view. Effects stop on pause, hidden tabs, or switching games. Monitor videos remain silent. The original synthesis recipes and resulting sounds are CC0-dedicated; no samples, recordings, third-party sound packs, audio downloads, or large files are used. See [audio source and rights](src/games/worker-bee/features/audio/README.md).

### Monitor videos

Office monitors play randomized, original bee animation clips. They are CC0-dedicated procedural artwork generated in this repo, **silent**, **256×144**, **8 fps**, and **six seconds** each. All six together are about **131 KiB**. Six screens use different clips and randomized starting timestamps, reuse six tiny video decoders, and pause their videos when the office is paused, hidden, or inactive.

**Keep video assets small: at most 256 KiB per clip and 768 KiB total. Do not add big files or Git LFS.** Source, rights, and regeneration instructions are in [public/media/README.md](public/media/README.md). `npm run check:media` uses FFprobe to verify sizes, codecs, and the absence of audio tracks. Ordinary `npm test` needs only Node.js.

### Launch from VS Code

After `npm ci`, open this repository in VS Code and press **F5** (or choose **The Hive: Play locally** in Run and Debug). The included `.vscode/launch.json` starts Vite on loopback and opens the game in your default browser. Press **Shift+F5** to stop it. If port 5173 is occupied, Vite chooses the next available port and opens that address automatically.

```sh
npm test
npm run build
npm start
```

`npm start` previews the production build at **http://127.0.0.1:4173**. Both servers bind to loopback by default. Nothing is deployed or published by these commands.

## Cloudflare hosting

The checked-in `wrangler.jsonc` serves the production `dist/` directory through Cloudflare Workers static assets. Wrangler is pinned in the development dependencies. No Worker script or Cloudflare Vite plugin is needed.

For the Cloudflare Workers Git build, use these settings:

| Setting | Value |
| --- | --- |
| Root directory | Repository root |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Worker name | `creatorhive-hive` |

Keep the Worker name in the dashboard and config aligned. The explicit config prevents Wrangler from trying to automatically rewrite the Vite configuration during deployment. See [Cloudflare static assets documentation](https://developers.cloudflare.com/workers/static-assets/).

To validate deployment packaging locally without publishing or logging in:

```sh
npm run build
npm run check:deploy
```

Publishing is performed by Cloudflare's connected build after you push a commit. Local development and validation commands do not publish anything.

## Play

| Control | Action |
| --- | --- |
| WASD or arrow keys | Fly relative to the camera |
| Left click + drag | Rotate the garden view |
| Scroll wheel | Zoom in / out |
| Shift | Half-second boost, four-second cooldown |
| P or pause button | Pause / resume |

Touch devices show directional and boost buttons; drag the garden to rotate the view. Nectar collects automatically when you fly close to a flower at its height. Your bag holds eight drops. Fly into the center hive's glowing ring to deliver. Bees fly at a fixed height; Space and Ctrl do not change altitude. Scouts are AI, visibly labeled throughout the interface. Audio is synthesized locally and off by default. Leaving the window pauses active play.

## Privacy and scope

- All game state lives in memory in the browser. Refreshing clears it.
- No accounts, custom names, chat, persistent player identifiers, cookies, browser storage, telemetry, analytics, or external game connections.
- The player's alias is generated (`Bee 007`). No personal information is requested.
- Art, fonts, and audio are local or procedural. No remote assets or runtime CDN requests.
- This repository contains no CreatorHive user data or integration with its accounts, platform, or livestream service.
- A local development/preview server necessarily handles browser connections. The game does not record connection addresses or add access logging.
- The production build can be hosted as static files. Multiplayer and livestream integrations are internally planned only.

The game uses Three.js and needs WebGL 2 / hardware acceleration. Its entry screen explains when graphics are unavailable.

## Collaboration and modules

Each game owns a folder under `src/games/`: `hive/` for the garden and `worker-bee/` for the office. The shell discovers game entries and styles automatically; adding a game does not require editing navigation or a central registry. Game-specific features stay inside their owning module, with scoped styles and independent simulation files.

See [CONTRIBUTING.md](CONTRIBUTING.md), [the module contract](docs/GAME_MODULES.md), and [agent instructions](AGENTS.md). `npm run check:modules` enforces descriptor/import/style boundaries and runs automatically during `npm run build`. Tests verify gameplay, collisions, tasks, settings, media lifecycle, and switching between actual game modules.
