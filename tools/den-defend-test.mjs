// Headless test: `node tools/den-defend-test.mjs`. A dog (or the flock) startles a sleeping den by day:
// the pack wakes and attacks (a sheep: snapped at or chased off), but stays near the den, and goes back to sleep once everyone's gone.
import { open } from './harness.mjs';
const h = await open();
const run = who => h.page.evaluate(async who => {
  const { G, T, step, startGame, resetGame, living } = GAME;
  if (G.mode !== 'play') startGame({ kind: 'bot', index: 0 }); else resetGame();
  const p = G.players[0]; p.bot = {};
  G.clock.hour = 10; G.clock.day = 3;
  const D = G.dens[1], d = G.dogs[0], live = living();
  const at = (o, x, z) => { o.x = x; o.z = z; o.vx = o.vz = 0; };
  live.forEach((s, i) => { at(s, D.x + D.mx * 60 + (i % 5) * 1.5, D.z + D.mz * 60 + Math.floor(i / 5) * 1.5); s.pen = null; });
  at(d, D.x + D.mx * 40, D.z + D.mz * 40);
  for (let i = 0; i < 40; i++) step(0.05);   // den fills, asleep
  const out = { who, asleep0: D.coyotes.length && D.coyotes.every(c => c.state === 'sleep') };
  const hp0 = d.hp; let maxR = 0, snapped = 0;
  if (who === 'dog') at(d, D.x + D.mx * 3.5, D.z + D.mz * 3.5);
  else { const s = live[0]; at(s, D.x + D.mx * 2.5, D.z + D.mz * 2.5); }
  step(0.05); out.phase = D.pack.phase;
  const sh = live[0];
  let close = 1e9;   // (a bolting sheep can stay just out of snapping reach: chased off counts)
  for (let t = 0; t < 4; t += 0.05) { step(0.05); if (D.coyotes.some(c => c.snapAt)) snapped++; for (const c of D.coyotes) { maxR = Math.max(maxR, Math.hypot(c.x - D.x, c.z - D.z)); close = Math.min(close, Math.hypot(c.x - sh.x, c.z - sh.z)); } }
  out.chased = who === 'sheep' && close < 2.5 && Math.hypot(sh.x - D.x, sh.z - D.z) > T.denDefend.r;
  out.hpLost = +(hp0 - d.hp).toFixed(3);
  // walk away: the dog (and the sheep) leave; the pack must stay on its leash and go back to sleep
  at(d, D.x + D.mx * 45, D.z + D.mz * 45); for (const s of live) if (Math.hypot(s.x - D.x, s.z - D.z) < 30) at(s, D.x + D.mx * 50, D.z + D.mz * 50);
  let back = null;
  for (let t = 0; t < 40; t += 0.05) { step(0.05); for (const c of D.coyotes) maxR = Math.max(maxR, Math.hypot(c.x - D.x, c.z - D.z)); if (back === null && D.pack.phase === 'den') back = +t.toFixed(1); }
  Object.assign(out, { maxR: +maxR.toFixed(1), backAsleepS: back, snapped: snapped > 0, eaten: live.filter(s => s.dead).length });
  return out;
}, who);
let ok = true;
for (const who of ['dog', 'sheep']) {
  const r = await run(who); console.log(JSON.stringify(r));
  const pass = r.asleep0 && r.phase === 'defend' && r.maxR <= 26 && r.backAsleepS !== null && r.eaten === 0 && (who === 'dog' ? r.hpLost > 0 : r.snapped || r.chased);
  console.log(pass ? 'PASS' : 'FAIL', who); ok &&= pass;
}
await h.close(); process.exit(ok ? 0 : 1);
