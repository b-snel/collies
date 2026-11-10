// Headless: `node tools/straggler-sim.mjs [--trials N]`. Evening, gate open: lone sheep dropped all round the outside of a pen (behind it,
// beside it, in the pocket behind the open leaf). Left alone, or a dog walking round behind them: how many get in, who's stuck where?
import { open } from './harness.mjs';
const h = await open({ query: '?sim&debug' });
const reps = +(process.argv[process.argv.indexOf('--trials') + 1]) || 2;
const r = await h.page.evaluate(REPS => {
  const { G, step, pens, setGate } = GAME;
  const R = { x: Math.SQRT1_2, z: -Math.SQRT1_2 }, F = { x: -Math.SQRT1_2, z: -Math.SQRT1_2 };
  const P = () => G.players[0], D = () => G.dogs[0];
  if (!G.players.length) GAME.startGame({ kind: 'bot', index: 0 });
  const live = () => G.sheep.filter(s => !s.dead && !s.grabbed);
  const goTo = (x, z, slow = 2) => { const d = D(), dx = x - d.x, dz = z - d.z, l = Math.hypot(dx, dz); if (l < 0.5) { P().bot = {}; return; } const k = Math.min(1, l / slow); P().bot = { mx: (dx * R.x + dz * R.z) / l * k, my: -(dx * F.x + dz * F.z) / l * k }; };
  const res = {};
  for (const mode of ['alone', 'dog']) for (const inward of [false, true]) {
    let inN = 0, tot = 0, T30 = 0; const stuck = [];
    for (let rep = 0; rep < REPS; rep++) {
      GAME.resetGame(); P().bot = {}; G.clock.hour = 18.5; for (const c of G.coyotes) c.gone = true;
      const pen = pens[1]; setGate(pen, true, inward);
      const S = live(); tot += S.length;
      // most of the flock already in, so the pen pulls hard
      const ga = pen.camp.gateA, Rr = pen.R;
      S.forEach((s, i) => {
        s.hunger = 0.15; s.stress = 0; s.fear = 0;
        if (i < S.length - 6) { const a = i * 2.4, rr = 1.5 + (i % 3) * 1.5; s.x = pen.x + Math.cos(a) * rr; s.z = pen.z + Math.sin(a) * rr; }
        else { const k = i - (S.length - 6), a = ga + (k < 2 ? (k ? 0.75 : -0.75) : [Math.PI, Math.PI * 0.6, -Math.PI * 0.6, -0.35][k - 2] + (rep % 3) * 0.15), rr = Rr + (k < 2 ? 2.2 : 3 + rep % 2); s.x = pen.x + Math.cos(a) * rr; s.z = pen.z + Math.sin(a) * rr; s._k = k; }
      });
      D().x = pen.gx + Math.cos(ga) * 30; D().z = pen.gz + Math.sin(ga) * 30;
      for (let t = 0; t < 30; t += 0.025) {
        if (mode === 'dog') { const out = live().filter(s => !s.pen); let c = null, cd = 1e9; for (const s of out) { const d = Math.hypot(s.x - pen.gx, s.z - pen.gz); if (d < cd) { cd = d; c = s; } }   // the nearest straggler
          if (c) { const dx = c.x - pen.x, dz = c.z - pen.z, l = Math.hypot(dx, dz) || 1; goTo(c.x + dx / l * 6, c.z + dz / l * 6); } else P().bot = {}; }
        step(0.025); if (Math.abs(t - 15) < 0.01) T30 += live().filter(s => s.pen === pen).length;
      }
      for (const s of live()) { if (s.pen === pen) inN++; else stuck.push({ k: s._k, a: +(Math.atan2(s.z - pen.z, s.x - pen.x) - ga).toFixed(2), r: +(Math.hypot(s.x - pen.x, s.z - pen.z) - Rr).toFixed(1), st: s.state }); }
    }
    res[mode + (inward ? '-swungIn' : '-swungOut')] = { penned: inN + '/' + tot, at15s: T30, out: stuck };
  }
  return res;
}, reps);
console.log(JSON.stringify(r)); console.log(h.errors.slice(0, 3));
await h.close();
