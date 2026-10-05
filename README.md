# The Hive

A local, single-player 3D bee game for CreatorHive's livestream. Fly through a floating hexagonal garden, collect nectar from flowers, and return it to the golden hive. Six AI scouts contribute to a shared goal of 300 nectar in three minutes. Rounds restart automatically. **Multiplayer: Soon™** (not implemented).

## Run locally

Requires Node.js 22.12+ and npm.

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173**. Click **Start flight** to begin. The landing screen previews the AI garden.

The interface uses a minimal dark terminal theme: gameplay fills the page, the objective and timer sit inside the game, and a compact controls strip stays beneath it. Expand **Flight crew** to see scores.

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

`src/game.js` contains the simulation and rules, `src/main.js` contains procedural 3D artwork and interface behavior, and `src/style.css` contains the responsive layout. `test/game.test.js` verifies collection/delivery, movement limits, boost cooldowns, round transitions, AI contribution, and generated aliases.
