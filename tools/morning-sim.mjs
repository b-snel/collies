// Headless: `node tools/morning-sim.mjs [--trials N]`. Flock penned overnight, gate opened at 07:00, no dog about: how many are
// out, how far from the gate, and how many wander back in, over the next 2 h (120 s). Bare pen, troughs stocked, troughs + the dog by the gate.
import { open } from './harness.mjs';
const h = await open({ query: '?sim&debug' });
const trials = +(process.argv[process.argv.indexOf('--trials') + 1]) || 3;
const r = await h.page.evaluate(N => {
  const { G, step, pens, setGate } = GAME;
  const P = () => G.players[0], D = () => G.dogs[0];
  if (!G.players.length) GAME.startGame({ kind: 'bot', index: 0 });
  const live = () => G.sheep.filter(s => !s.dead && !s.grabbed);
  const res = {};
  for (const [fed, dogNear] of [[false, false], [true, false], [true, true]]) {
    const acc = {};
    for (let k = 0; k < N; k++) {
      GAME.resetGame(); P().bot = {}; G.clock.hour = 6.6; for (const c of G.coyotes) c.gone = true;
      const pen = pens[1]; setGate(pen, false);
      live().forEach((s, i) => { const a = i * 2.4, rr = 1.5 + (i % 3) * 2; s.x = pen.x + Math.cos(a) * rr; s.z = pen.z + Math.sin(a) * rr; s.hunger = 0.02 + (i % 4) * 0.08; s.stress = 0; s.state = 'idle'; });
      if (fed) { for (const tr of pen.troughs) tr.food = tr.cap; if (pen.lick) pen.lick.salt = pen.lick.cap; }
      D().x = pen.x - Math.cos(pen.camp.gateA) * 40; D().z = pen.z - Math.sin(pen.camp.gateA) * 40;
      for (let i = 0; i < 40; i++) step(0.025);
      setGate(pen, true);
      const gn = Math.cos(pen.camp.gateA), gm = Math.sin(pen.camp.gateA);
      if (dogNear) { D().x = pen.gx + gn * 5 - gm * 5; D().z = pen.gz + gm * 5 + gn * 5; }   // the dog that opened it, standing off to one side
      for (let t = 0; t <= 120; t += 0.025) {
        P().bot = {}; step(0.025);
        for (const c of [15, 40, 80, 119.9]) if (Math.abs(t - c) < 0.0124) {
          const S = live(), out = S.filter(s => !s.pen), d = out.length ? out.reduce((a, s) => a + Math.hypot(s.x - pen.gx, s.z - pen.gz), 0) / out.length : 0;
          const o = acc[c] || (acc[c] = { out: 0, of: 0, dist: 0 }); o.out += out.length; o.of += S.length; o.dist += d / N;
        }
      }
    }
    for (const c in acc) acc[c] = `${acc[c].out}/${acc[c].of} out, ${acc[c].dist.toFixed(1)} m`;
    res[(fed ? 'troughs' : 'bare') + (dogNear ? '+dog' : '')] = acc;
  }
  return res;
}, trials);
console.log(JSON.stringify(r, null, 1)); console.log(h.errors.slice(0, 3));
await h.close();
