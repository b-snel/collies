// Headless gateway test: `node tools/gateway-sim.mjs`. Driving the flock into a pen through a gate swung in (pushed open from
// outside) vs swung out, and the flock leaving in the morning both ways: how many get through, and does anyone stall at the gate?
import { open } from './harness.mjs';
const h = await open({ query: '?sim&debug' });
const r = await h.page.evaluate(() => {
  const { G, T, step, pens, setGate } = GAME;
  const R = { x: Math.SQRT1_2, z: -Math.SQRT1_2 }, F = { x: -Math.SQRT1_2, z: -Math.SQRT1_2 };
  const P = () => G.players[0], D = () => G.dogs[0];
  if (!G.players.length) GAME.startGame({ kind: 'bot', index: 0 });
  const live = () => G.sheep.filter(s => !s.dead && !s.grabbed);
  const reset = h => { GAME.resetGame(); P().bot = {}; G.clock.hour = h; for (const c of G.coyotes) c.gone = true; };
  const goTo = (x, z, slow = 2) => { const d = D(), dx = x - d.x, dz = z - d.z, l = Math.hypot(dx, dz); if (l < 0.5) { P().bot = {}; return; } const k = Math.min(1, l / slow); P().bot = { mx: (dx * R.x + dz * R.z) / l * k, my: -(dx * F.x + dz * F.z) / l * k }; };
  const stuckTrack = (pen, outside) => { const near = live().filter(s => (outside ? !s.pen : s.pen === pen) && Math.hypot(s.x - pen.gx, s.z - pen.gz) < 4.5 && Math.hypot(s.vx, s.vz) < 0.35); for (const s of near) s._st = (s._st || 0) + 0.025; };
  const res = {};
  for (const inward of [false, true]) {
    // ---- in: flock 16 m out in front of the gate, a dumb bot walks it in
    reset(15); const pen = pens[1]; setGate(pen, true, inward);
    for (const s of live()) { s.hunger = 0.1; s._st = 0; }
    const n = Math.cos(pen.camp.gateA), m = Math.sin(pen.camp.gateA);
    live().forEach((s, i) => { s.x = pen.gx + n * 16 + ((i % 4) - 1.5) * 1.6; s.z = pen.gz + m * 16 + (Math.floor(i / 4) - 1.5) * 1.6; });
    D().x = pen.gx + n * 30; D().z = pen.gz + m * 30;
    let t = 0; const at = {};
    while (t < 40) {
      const sh = live().filter(s => !s.pen); let cx = 0, cz = 0; for (const s of sh) { cx += s.x; cz += s.z; } if (sh.length) { cx /= sh.length; cz /= sh.length; }
      let gx = pen.gx - cx, gz = pen.gz - cz; const gl = Math.hypot(gx, gz) || 1; gx /= gl; gz /= gl;
      if (sh.length) goTo(cx - gx * 6, cz - gz * 6); else P().bot = {};
      step(0.025); stuckTrack(pen, true); t += 0.025;
      for (const k of [10, 20, 30, 40]) if (!at[k] && t >= k) at[k] = live().filter(s => s.pen === pen).length;
    }
    res[(inward ? 'in-swungIn' : 'in-swungOut')] = { penned: at, of: live().length, phi: +pen.phi.toFixed(2), stuckOver2s: live().filter(s => s._st > 2).length, maxStuckSecs: +Math.max(...live().map(s => s._st)).toFixed(1) };
    // ---- out: everyone penned at dawn, gate opened, dog stands off well away: do they file out?
    reset(6.5); setGate(pen, false);
    live().forEach((s, i) => { const a = i / 14 * 6.28, rr = 2 + (i % 3) * 2; s.x = pen.x + Math.cos(a) * rr; s.z = pen.z + Math.sin(a) * rr; s.hunger = 0.5; s._st = 0; });
    D().x = pen.x - n * 40; D().z = pen.z - m * 40;
    for (let i = 0; i < 40; i++) step(0.025);
    setGate(pen, true, inward);
    t = 0; const out = {};
    while (t < 40) { P().bot = {}; step(0.025); stuckTrack(pen, false); t += 0.025; for (const k of [10, 20, 40]) if (!out[k] && t >= k) out[k] = live().filter(s => !s.pen).length; }
    res[(inward ? 'out-swungIn' : 'out-swungOut')] = { left: out, of: live().length, stuckOver2s: live().filter(s => s._st > 2).length, maxStuckSecs: +Math.max(...live().map(s => s._st)).toFixed(1) };
  }
  return res;
});
console.log(JSON.stringify(r, null, 1)); console.log(h.errors.slice(0, 3));
let fails = 0; const ok = (name, cond) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}`); if (!cond) fails++; };
for (const g of ['swungOut', 'swungIn']) {
  const i = r['in-' + g], o = r['out-' + g];
  ok(`gate ${g}: driven in, ${i.penned[10]}/${i.of} in by 10 s, all by 30 s; nobody stalls at it (${i.maxStuckSecs} s)`, i.penned[10] >= i.of - 3 && i.penned[30] === i.of && i.stuckOver2s === 0);
  ok(`gate ${g}: out at dawn, ${o.left[10]}/${o.of} out by 10 s, all by 20 s; nobody stalls (${o.maxStuckSecs} s)`, o.left[10] >= o.of - 3 && o.left[20] === o.of && o.stuckOver2s === 0);
}
ok('no page errors', !h.errors.length);
await h.close();
process.exit(fails ? 1 : 0);
