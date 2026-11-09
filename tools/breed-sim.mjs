// Headless economy test: `node tools/breed-sim.mjs [days] [--norams] [--set key=value ...]`. The flock is parked at the valley camp:
// out grazing by day, everyone put in the pen at 19:00 (gate shut), let out at dawn. Rams court the fed ewes in the
// closed pen in the evening; bred ewes lamb at dawn. Prints the flock each morning (the demo's "14 -> 22 by day 4").
import { open } from './harness.mjs';
const days = +process.argv.find(a => /^\d+$/.test(a)) || 4, noRams = process.argv.includes('--norams');
// --set key=value (repeatable) overrides a T number, e.g. --set foodValue=0.075
const sets = {}; process.argv.forEach((a, i) => { if (a === '--set') { const [k, v] = process.argv[i + 1].split('='); sets[k] = +v; } });
const h = await open({ query: '?sim&debug' });
const r = await h.page.evaluate(({ days, noRams, sets }) => {
  const { G, T, step, pens, CAMPS } = GAME;
  Object.assign(T, sets);
  if (noRams) T.startRams = 0;
  GAME.startGame({ kind: 'bot', index: 0 }); GAME.resetGame(); G.players[0].bot = {};
  const pen = pens[1], c = CAMPS[1];
  for (const s of G.sheep) { s.x = pen.exitX + (Math.random() - 0.5) * 8; s.z = pen.exitZ + (Math.random() - 0.5) * 8; }
  const d = G.dogs[0]; d.x = pen.x - 40; d.z = pen.z; G.clock.hour = 7;
  const log = []; let lastH = 7, courted = 0, hearts = 0;
  const setGate = open => { if (pen.open !== open) GAME.setGate(pen, open); };
  while (G.clock.day <= days) {
    for (let i = 0; i < 4; i++) step(0.025);
    const hr = G.clock.hour;
    if (lastH < 19 && hr >= 19) {   // bring them all in and shut the gate
      for (const s of G.sheep) if (!s.dead && !s.grabbed) { const a = Math.random() * 6.28, rr = Math.sqrt(Math.random()) * (pen.R - 2); s.x = pen.x + Math.cos(a) * rr; s.z = pen.z + Math.sin(a) * rr; s.vx = s.vz = 0; }
      setGate(false);
    }
    if (lastH < 6.5 && hr >= 6.5) {
      const live = G.sheep.filter(s => !s.dead);
      log.push(`day ${G.clock.day}: ${live.length} sheep (${live.filter(s => s.ram).length} rams, ${live.filter(s => s.lamb).length} lambs), hunger ${(live.reduce((a, s) => a + s.hunger, 0) / live.length).toFixed(2)}, born so far ${G.stats.born}, starved ${G.stats.starved}, eaten ${G.stats.eaten}`);
      setGate(true);
    }
    if (hr > 19 || hr < 6) courted += G.sheep.filter(s => s.bred).length > courted ? G.sheep.filter(s => s.bred).length - courted : 0;
    lastH = hr;
  }
  const live = G.sheep.filter(s => !s.dead);
  log.push(`end: ${live.length} sheep (${live.filter(s => s.ram).length} rams), born ${G.stats.born}, starved ${G.stats.starved}, eaten ${G.stats.eaten}`);
  return log;
}, { days, noRams, sets });
console.log(r.join('\n')); if (h.errors.length) console.log('PAGE ERRORS', h.errors.slice(0, 5));
await h.close();
