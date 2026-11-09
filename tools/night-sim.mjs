// Headless balance test: `node tools/night-sim.mjs [idle|guard]`. Simulate a night: flock in the open near the valley camp, one bot dog that barks + charges coyotes (or idles).
import { open } from './harness.mjs';
const mode = process.argv[2] || 'idle';
const h = await open({ query: '?debug' });
const r = await h.page.evaluate(async (mode) => {
  const { G, T, step, startGame, CAMPS, pathPoint, spawnCoyotes } = GAME;
  startGame({ kind: 'bot', index: 0 });
  const p = G.players[0]; p.bot = {};
  const c = CAMPS[1], pp = pathPoint(c.s - 30, 0);
  for (const s of G.sheep) { s.x = pp.x + (Math.random() - .5) * 10; s.z = pp.z + (Math.random() - .5) * 10; s.hunger = 0.3; }
  const d = G.dogs[0]; d.x = pp.x + 8; d.z = pp.z;
  G.clock.hour = 20.4;
  const log = []; let t = 0, phases = {};
  const start = G.sheep.length;
  while (!(G.clock.day >= 2 && G.clock.hour >= 6)) {
    // bot: idle, or chase the nearest coyote & bark
    if (mode === 'guard') {
      let best = null, bd = 1e9; for (const c of G.coyotes) { if (c.state === 'leave') continue; const dd = Math.hypot(c.x - d.x, c.z - d.z); if (dd < bd) { bd = dd; best = c; } }
      if (best && bd < 40) { const dx = best.x - d.x, dz = best.z - d.z, l = Math.hypot(dx, dz) || 1;
        // screen-space inputs: invert the camera mapping
        const R = { x: Math.SQRT1_2, z: -Math.SQRT1_2 }, F = { x: -Math.SQRT1_2, z: -Math.SQRT1_2 };
        p.bot = { mx: (dx * R.x + dz * R.z) / l, my: -(dx * F.x + dz * F.z) / l, sprint: bd > 6, bark: bd < 10 && Math.random() < 0.05 };
      } else p.bot = {};
    }
    for (let i = 0; i < 4; i++) step(0.025);
    t += 0.1;
    for (const pk of G.packs) phases[pk.phase] = (phases[pk.phase] || 0) + 1;
    if (t > 200) break;
    if (Math.round(t * 10) % 50 === 0) log.push(G.packs.map(pk => pk.phase + ":" + pk.members.map(c => c.role + "/" + c.state + "@" + Math.round(Math.hypot(c.x - (pk.target ? pk.target.x : 0), c.z - (pk.target ? pk.target.z : 0)))).join(",")).join(" | "));
  }
  return { start, end: G.sheep.length, eaten: G.stats.eaten, saved: G.stats.saved, graves: G.graves.map(g => g.name), phases, hour: G.clock.hour, log };
}, mode);
console.log(mode, JSON.stringify(r), h.errors.slice(0, 5));
await h.close();
