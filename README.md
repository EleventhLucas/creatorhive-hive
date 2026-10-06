# The Hive

A local, single-player 3D bee game for CreatorHive's livestream. Fly through a floating hexagonal garden, collect nectar from flowers, and return it to the golden hive. Six AI scouts contribute to a shared goal of 300 nectar in three minutes. Rounds restart automatically.

## Run locally

Requires Node.js 22.12+ and npm.

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173**. Click **▶** to begin. The landing screen previews the AI garden.

The interface uses a minimal dark terminal theme: gameplay fills the page, the objective and timer sit inside the game, and a compact controls strip stays beneath it. Use the **Hive** and **Worker Bee Sim** buttons to switch games; the inactive mode stops updating and its UI is removed from the page until you return.

## Settings

The centered navigation switches games. The top-right global **⚙** controls fullscreen, dark/light appearance, accent colors, and compact UI. The default is black and yellow; preferences last for the current page session.

Worker Bee Sim has its own **⚙** inside the office HUD for first-person FoV (55–105°) and walking view bobbing (0–100%; 0 disables it). Reduced-motion devices default to no bobbing. Its sound volume slider controls cartoon effects and office ambience (default 55%; 0 mutes). The HUD **♫** button mutes/unmutes quickly.

## Worker Bee Sim

A first-person office game with stickman bee coworkers, honeycomb archives, pollen paperwork, and a nectar cooler. Select **Worker Bee Sim** and click **▶** to clock in. Finish four tasks in order: approve pollen reports, print honey labels, file them, and refill your nectar mug. Objectives say where to go. Active stations have a large bobbing arrow, a glowing floor ring, and a distance indicator; at the destination the objective changes to a work action. After completing a shift, click **▶** for the next shift to start again.

- **WASD / arrows**: walk; **Shift**: sprint.
- **Space**: jump, then hold to glide for up to one second on descent. Glide recharges on landing. The bee can land on furniture; room bounds and the ceiling still constrain movement.
- **Mouse**: look around. Clicking Clock in captures the mouse; **Esc** releases it and pauses. Dragging the game is also supported when mouse capture is unavailable.
- **Hold E** near the highlighted station for 1.5 seconds to complete its task.
- **F** near an unoccupied computer chair: sit / stand. You can look around, throw mugs, and do computer work while seated; walking resumes after standing up.
- **Left click**: throw your nectar mug. A replacement appears after 0.5 seconds. Thrown mugs follow gravity, bounce off floors/walls/desktops, and disappear after four seconds.
- **P** or the pause button: pause/resume. Resume captures the mouse again.
- Touch devices: drag the game to look, use the direction buttons to walk, hold **Work** at a station, and use **Sit / Stand** and **Throw**.

Furniture and walls block movement. Switching modes releases the mouse, and returning to an active office shift shows a Resume button. Both games remain entirely local, without saved progress or multiplayer.

### Coworkers

Five stickman bee coworkers alternate between typing at their computers, standing up, walking around desks, nectar breaks, and idle conversation. Their joints animate for walking, sitting, typing, sipping, and gestures. Nearby thrown-mug impacts make them react briefly before returning to their routine. Land 2–3 direct mug hits within four seconds and a coworker randomly crumples, tumbles like a ragdoll, or bursts into honey-colored particles; they respawn at a random clear office location after 2.6 seconds. Each mug can hit a given coworker only once. They route around furniture, avoid the player, and reserve chairs while seated; returning workers wait if you took their chair. The pollen-report chair is always available for the player. NPC-to-NPC collisions are disabled. NPC activity pauses with the office.

### Cartoon sounds

Worker Bee Sim synthesizes **30 original cartoon effect families**, each with **three base variations** and randomized pitch/timing: footsteps, spring jumps, wing flutter, landing thuds, mug throws/refills and surface clinks, rubbery coworker hits, crumple/ragdoll/burst knockdowns, respawn pops, chair squeaks, report typing, printer noises, archive rustles, nectar bubbles, task jingles, bee chatter, sipping, and occasional buzzes.

Sound starts after clicking **▶**. The office **⚙** has a working volume slider; **♫** toggles mute. Nearby coworkers and impacts sound louder and pan with your view. Effects stop on pause, hidden tabs, or switching games. Monitor videos remain silent. The original synthesis recipes and resulting sounds are CC0-dedicated; no samples, recordings, third-party sound packs, audio downloads, or large files are used. See [audio source and rights](src/games/worker-bee/features/audio/README.md).

### Monitor videos

Office monitors play randomized, original bee animation clips. They are CC0-dedicated procedural artwork generated in this repo, **silent**, **256×144**, **8 fps**, and **six seconds** each. All six together are about **147 KiB**. Six screens use different clips and randomized starting timestamps, reuse six tiny video decoders, and pause their videos when the office is paused, hidden, or inactive.

**Keep video assets small: at most 256 KiB per clip and 768 KiB total. Do not add big files or Git LFS.** Source, rights, and regeneration instructions are in [public/media/README.md](public/media/README.md). `npm run check:media` uses FFprobe to verify sizes, codecs, and the absence of audio tracks. Ordinary `npm test` needs only Node.js.

### Launch from VS Code

After `npm ci`, open this repository in VS Code and press **F5** (or choose **The Hive: Play locally** in Run and Debug). The included `.vscode/launch.json` starts Vite on loopback and opens the game in your default browser. Press **Shift+F5** to stop it. If port 5173 is occupied, Vite chooses the next available port and opens that address automatically.

```sh
npm test
npm run build
npm start
```

`npm start` previews the production build at **http://127.0.0.1:4173**. Both servers bind to loopback by default. Nothing is deployed or published by these commands.

## Play

| Control | Action |
| --- | --- |
| WASD or arrow keys | Fly relative to the camera |
| Space | Fly up |
| Ctrl or C | Fly down |
| Shift | Half-second boost, four-second cooldown |
| P or pause button | Pause / resume |

Touch devices show directional, altitude, and boost buttons. Nectar collects automatically when you fly close to a flower at its height. Your bag holds eight drops. Fly into the center hive's glowing ring below altitude 3.7 to deliver. Scouts are AI, visibly labeled throughout the interface. Audio is synthesized locally and off by default. Leaving the window pauses active play.

## Privacy and scope

- All game state lives in memory in the browser. Refreshing clears it.
- No accounts, custom names, chat, persistent player identifiers, cookies, browser storage, telemetry, analytics, or external game connections.
- The player's alias is generated (`Bee 007`). No personal information is requested.
- Art, fonts, and audio are local or procedural. No remote assets or runtime CDN requests.
- This repository contains no CreatorHive user data or integration with its accounts, platform, or livestream service.
- A local development/preview server necessarily handles browser connections. The game does not record connection addresses or add access logging.
- This project is for local use. Public hosting, multiplayer, and livestream integrations are outside the current implementation.

The game uses Three.js and needs WebGL 2 / hardware acceleration. Its entry screen explains when graphics are unavailable.

## Collaboration and modules

Each game owns a folder under `src/games/`: `hive/` for the garden and `worker-bee/` for the office. The shell discovers game entries and styles automatically; adding a game does not require editing navigation or a central registry. Game-specific features stay inside their owning module, with scoped styles and independent simulation files.

See [CONTRIBUTING.md](CONTRIBUTING.md), [the module contract](docs/GAME_MODULES.md), and [agent instructions](AGENTS.md). `npm run check:modules` enforces descriptor/import/style boundaries and runs automatically during `npm run build`. Tests verify gameplay, collisions, tasks, settings, media lifecycle, and switching between actual game modules.
