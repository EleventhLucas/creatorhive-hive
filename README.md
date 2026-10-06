# The Hive

A local, single-player 3D bee game for CreatorHive's livestream. Fly through a floating hexagonal garden, collect nectar from flowers, and return it to the golden hive. Six AI scouts contribute to a shared goal of 300 nectar in three minutes. Rounds restart automatically.

## Run locally

Requires Node.js 22.12+ and npm.

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173**. Click **Start flight** to begin. The landing screen previews the AI garden.

The interface uses a minimal dark terminal theme: gameplay fills the page, the objective and timer sit inside the game, and a compact controls strip stays beneath it. Use the **Hive** and **Worker Bee Sim** buttons to switch games; the inactive mode stops updating and its UI is removed from the page until you return.

## Settings

The centered navigation switches games. The top-right global **⚙** controls fullscreen, dark/light appearance, accent colors, and compact UI. The default is black and yellow; preferences last for the current page session.

Worker Bee Sim has its own **⚙** inside the office HUD for first-person FoV (55–105°) and walking view bobbing (0–100%; 0 disables it). Reduced-motion devices default to no bobbing. Its volume slider is disabled and marked TODO; Worker Bee Sim has no audio.

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

Five stickman bee coworkers alternate between typing at their computers, standing up, walking around desks, nectar breaks, and idle conversation. Their joints animate for walking, sitting, typing, sipping, and gestures. Nearby thrown-mug impacts make them react briefly before returning to their routine. They route around furniture, avoid the player, and reserve chairs while seated; returning workers wait if you took their chair. The pollen-report chair is always available for the player. NPC-to-NPC collisions are disabled. NPC activity pauses with the office.

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

## Layout

`src/game.js` contains the garden simulation and rules, `src/main.js` contains garden artwork and mode navigation, `src/office-game.js` contains office movement and tasks, `src/office.js` contains the first-person office and controls, and `src/style.css` contains the responsive layout. Tests verify garden gameplay, office collision, movement, task progression, shift resets, and mode UI isolation using a local DOM simulation.
