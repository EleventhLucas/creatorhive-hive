# Worker Bee Sim cartoon sounds

All recipes in `cues.js` are original procedural sound effects written for this project. They use oscillators, filtered generated noise, and pitch/envelope sequences, with no recordings, samples, borrowed melodies, or external sound libraries. The sound recipes and resulting generated sounds are dedicated to the public domain under CC0 1.0, to the extent copyright applies. See the existing CC0 dedication link in `public/media/README.md`.

Each of the 30 event families has three base variants, with randomized pitch and timing and no immediate repeated base variant. Effects include spring jumps, fluttering glide, soft footsteps, mug whooshes/clinks/refills, rubbery hits, three knockdown styles, respawn pops, chair squeaks, office equipment, task jingles, typing, bee chatter, sipping, and occasional buzzes. Monitor videos remain silent.

`engine.js` creates Web Audio only after a play/resume gesture. It caps simultaneous voices, throttles bursts, attenuates distant sounds, pans coworkers relative to the view, and stops all voices on pause/deactivation/mute. The office volume control applies to all its effects. There are no audio asset files or downloads.

To add an effect, add a family to `CUES`, then dispatch it from `soundscape.js` or an explicit office action. Keep sequences short and gains modest. Add sound behavior tests under `test/worker-bee/`.
