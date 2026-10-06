import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';
import { MONITOR_CLIPS } from '../src/games/worker-bee/media.js';

let total = 0;
for (const name of MONITOR_CLIPS) {
  const path = new URL(`../public/media/${name}.mp4`, import.meta.url);
  const size = statSync(path).size; total += size;
  if (size > 256 * 1024) throw new Error(`${name}: exceeds 256 KiB`);
  const report = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', path.pathname], { encoding: 'utf8' }));
  if (report.streams.length !== 1 || report.streams[0].codec_type !== 'video') throw new Error(`${name}: must have one video stream and no audio`);
  const stream = report.streams[0];
  if (stream.width !== 256 || stream.height !== 144 || stream.codec_name !== 'h264' || stream.avg_frame_rate !== '8/1') throw new Error(`${name}: unexpected encoding`);
  if (Number(report.format.duration) > 6.1) throw new Error(`${name}: clip is too long`);
  console.log(`${name}: ${(size / 1024).toFixed(1)} KiB, 256x144, 8 fps, no audio`);
}
if (total > 768 * 1024) throw new Error('Combined media budget exceeded');
console.log(`Total: ${(total / 1024).toFixed(1)} KiB. No Git LFS needed.`);
