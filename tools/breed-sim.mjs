// Headless economy test: `node tools/breed-sim.mjs [days] [--norams] [--trough N] [--set key=value ...]`. The flock is parked at the valley camp:
// out grazing by day, everyone put in the pen at 19:00 (gate shut, water topped up), let out at dawn. Rams court the fed ewes in the
// closed pen in the evening; bred ewes lamb at dawn. Prints the flock each morning (the demo's "14 -> 22 by day 4").
// Checks: flock parked for days: lambs, pasture, starvation
import { open } from './harness.mjs';
const days = +process.argv.find(a => /^\d+$/.test(a)) || 4, noRams = process.argv.includes('--norams');
const tri = process.argv.indexOf('--trough'), trough = tri >= 0 ? +process.argv[tri + 1] : 0;   // --trough N: N units of feed spread over the pen's troughs every evening
// --set key=value (repeatable) overrides a T number, e.g. --set foodValue=0.075
const sets = {}; process.argv.forEach((a, i) => { if (a === '--set') { const [k, v] = process.argv[i + 1].split('='); sets[k] = +v; } });
const h = await open({ query: '?sim&debug' });
const r = await h.page.evaluate(({ days, noRams, sets, trough }) => {
  const { G, T, step, pens, CAMPS } = GAME;
  Object.assign(T, sets);
  if (noRams) T.startRams = 0;
  GAME.startGame({ kind: 'bot', index: 0 }); GAME.resetGame(); G.players[0].bot = {};
  const pen = pens[1], c = CAMPS[1];
  for (const s of G.sheep) { s.x = pen.exitX + (Math.random() - 0.5) * 8; s.z = pen.exitZ + (Math.random() - 0.5) * 8; }
  const d = G.dogs[0]; d.x = pen.x - 40; d.z = pen.z; G.clock.hour = 7;
  const log = [], n0 = G.sheep.filter(s => !s.dead).length, p40 = []; let lastH = 7, courted = 0, hearts = 0, dSum = 0, dN = 0, far = 0;
  // the pasture round the camp: how much grass is left (as a share of what it can hold) within r m of the pen
  const GR = GAME.grass, pasture = r => { let g = 0, c = 0; for (let b = 0; b < GR.VZ; b++) for (let a = 0; a < GR.VX; a++) { const x = GR.GMINX + a * GR.VS, z = GR.GMINZ + b * GR.VS, dd = Math.hypot(x - pen.x, z - pen.z); if (dd < r && dd > pen.R + 1 && GAME.sdfAt(x, z) > 0.5) { const k = b * GR.VX + a; g += GR.gAmt[k]; c += GR.gCap[k]; } } return c ? g / c : 0; };
  const setGate = open => { if (pen.open !== open) GAME.setGate(pen, open); };
  while (G.clock.day <= days) {
    for (let i = 0; i < 4; i++) step(0.025);
    const hr = G.clock.hour;
    if (lastH < 19 && hr >= 19) {   // bring them all in and shut the gate
      for (const s of G.sheep) if (!s.dead && !s.grabbed) { const a = Math.random() * 6.28, rr = Math.sqrt(Math.random()) * (pen.R - 2); s.x = pen.x + Math.cos(a) * rr; s.z = pen.z + Math.sin(a) * rr; s.vx = s.vz = 0; }
      setGate(false);
      if (trough) GAME.fillTroughs(pen, trough);
      GAME.fillWater(pen, 99);   // the water trough kept full (this is about food and lambs)
    }
    if (hr > 9 && hr < 18 && Math.random() < 0.05) for (const s of G.sheep) if (!s.dead && !s.pen) { const dd = Math.hypot(s.x - pen.x, s.z - pen.z); dSum += dd; dN++; far = Math.max(far, dd); }
    if (lastH < 6.5 && hr >= 6.5) {
      const live = G.sheep.filter(s => !s.dead);
      log.push(`day ${G.clock.day}: ${live.length} sheep (${live.filter(s => s.ram).length} rams, ${live.filter(s => s.lamb).length} lambs), hunger ${(live.reduce((a, s) => a + s.hunger, 0) / live.length).toFixed(2)}, well fed ${live.filter(s => s.hunger < T.breedHunger).length}, born so far ${G.stats.born}, starved ${G.stats.starved}, eaten ${G.stats.eaten}, cougar ${G.stats.cougar || 0}, thirst ${G.stats.thirst || 0} | pasture left: 20 m ${(pasture(20) * 100).toFixed(0)}%, 40 m ${(pasture(40) * 100).toFixed(0)}% | grazed ${dN ? (dSum / dN).toFixed(0) : '-'} m from the pen on average yesterday (furthest ${far.toFixed(0)})`);
      dSum = dN = far = 0; p40.push(pasture(40));
      setGate(true);
    }
    if (hr > 19 || hr < 6) courted += G.sheep.filter(s => s.bred).length > courted ? G.sheep.filter(s => s.bred).length - courted : 0;
    lastH = hr;
  }
  const live = G.sheep.filter(s => !s.dead);
  log.push(`end: ${live.length} sheep (${live.filter(s => s.ram).length} rams), born ${G.stats.born}, starved ${G.stats.starved}, eaten ${G.stats.eaten}, cougar ${G.stats.cougar || 0}, thirst ${G.stats.thirst || 0}`);
  return { log, n0, n: live.length, p40, st: G.stats };
}, { days, noRams, sets, trough });
console.log(r.log.join('\n')); if (h.errors.length) console.log('PAGE ERRORS', h.errors.slice(0, 5));
let fails = 0; const ok = (name, cond) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}`); if (!cond) fails++; };
if (days === 4 && !noRams && !trough && !Object.keys(sets).length) {   // checks: the default run, as tuned
  ok(`parked ${days} days, the flock grows: ${r.n0} → ${r.n} (${r.st.born} born, ${r.st.cougar} to cougars)`, r.n >= r.n0 + 2 && r.st.born >= 6);
  ok(`nobody starves or dies of thirst (${r.st.starved}, ${r.st.thirst})`, r.st.starved === 0 && r.st.thirst === 0);
  ok(`the pasture's grazed, not stripped (${r.p40.map(k => Math.round(k * 100) + '%').join(' → ')} within 40 m)`, r.p40.at(-1) < r.p40[0] && r.p40.at(-1) > 0.4);
}
ok('no page errors', !h.errors.length);
await h.close();
process.exit(fails ? 1 : 0);
