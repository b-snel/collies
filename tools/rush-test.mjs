// Headless test: `node tools/rush-test.mjs`. (1) The morning rush: a fed flock penned overnight (troughs stocked, salt in the
// lick, asleep) pours out as soon as the gate's opened in the morning, but not of an evening. (2) Carrying: a dog with a sheep in
// its mouth walks it into the pen through the open gate and back out again, and can't carry it through a shut gate.
import { open } from './harness.mjs';
const h = await open({ query: '?sim&debug' });
const r = await h.page.evaluate(() => {
  const { G, T, step, pens, setGate } = GAME;
  const R = { x: Math.SQRT1_2, z: -Math.SQRT1_2 }, F = { x: -Math.SQRT1_2, z: -Math.SQRT1_2 };
  const P = () => G.players[0], D = () => G.dogs[0];
  if (!G.players.length) GAME.startGame({ kind: 'bot', index: 0 });
  const live = () => G.sheep.filter(s => !s.dead && !s.grabbed);
  const reset = hr => { GAME.resetGame(); P().bot = {}; G.clock.hour = hr; for (const c of G.coyotes) c.gone = true; };
  const goTo = (x, z, grab = true) => { const d = D(), dx = x - d.x, dz = z - d.z, l = Math.hypot(dx, dz); if (l < 0.4) { P().bot = { grab }; return true; } const k = Math.min(1, l / 1.5); P().bot = { grab, mx: (dx * R.x + dz * R.z) / l * k, my: -(dx * F.x + dz * F.z) / l * k }; return false; };
  const res = {};
  const pen = pens[1], n = Math.cos(pen.camp.gateA), m = Math.sin(pen.camp.gateA);
  for (const [label, hour] of [['morning', 6.6], ['evening', 17]]) {
    reset(hour); setGate(pen, false);
    live().forEach((s, i) => { const a = i / 14 * 6.28, rr = 2 + (i % 3) * 2; s.x = pen.x + Math.cos(a) * rr; s.z = pen.z + Math.sin(a) * rr; s.hunger = 0.1; s.salt = 0.3; s.state = 'sleep'; });
    for (const tr of pen.troughs) tr.food = 3; if (pen.lick) pen.lick.salt = 1;
    D().x = pen.x - n * 40; D().z = pen.z - m * 40;
    for (let i = 0; i < 80; i++) step(0.025);
    setGate(pen, true);
    let t = 0; const out = {};
    while (t < 20) { P().bot = {}; step(0.025); t += 0.025; for (const k of [3, 6, 10, 20]) if (!out[k] && t >= k - 1e-6) out[k] = live().filter(s => !s.pen).length; }
    res[label] = { left: out, of: live().length };
  }
  // carrying
  reset(10); setGate(pen, true);
  const s = live().find(o => !o.ram); for (const o of live()) if (o !== s) { o.x = pen.x + n * 60; o.z = pen.z + m * 60; }
  s.x = pen.gx + n * 6; s.z = pen.gz + m * 6; s.vx = s.vz = 0;
  const d = D(); d.x = pen.gx + n * 7.4; d.z = pen.gz + m * 7.4; d.vx = d.vz = 0; d.yaw = Math.atan2(-n, -m);
  for (let i = 0; i < 10; i++) step(0.025);
  P().bot = { grab: true }; for (let i = 0; i < 8; i++) step(0.025); const held = d.holding === s;
  let t = 0; while (t < 8 && !s.pen) { goTo(pen.x, pen.z); step(0.025); t += 0.025; }
  const inT = +t.toFixed(1), carriedIn = !!s.pen && s.heldBy === d;
  t = 0; while (t < 8 && (s.pen || Math.hypot(s.x - pen.gx, s.z - pen.gz) < 3)) { goTo(pen.gx + n * 8, pen.gz + m * 8); step(0.025); t += 0.025; }
  const carriedOut = !s.pen && s.heldBy === d;
  // shut gate: walk in a circle to the gateway from outside: the sheep must stay outside
  setGate(pen, false); for (let i = 0; i < 20; i++) step(0.025);
  t = 0; while (t < 5) { goTo(pen.x, pen.z); step(0.025); t += 0.025; }
  res.carry = { held, carriedIn, inT, carriedOut, throughShutGate: !!s.pen, stillHeld: s.heldBy === d };
  return res;
});
console.log(JSON.stringify(r, null, 1)); console.log(h.errors.slice(0, 3));
let fails = 0; const ok = (name, cond) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}`); if (!cond) fails++; };
const M = r.morning, E = r.evening, C = r.carry;
ok(`morning rush: gate opened, out they pour (${M.left[10]} by 10 s, ${M.left[20]}/${M.of} by 20 s)`, M.left[10] >= 3 && M.left[20] >= M.of - 2);
ok(`not of an evening (${E.left[20]} out)`, E.left[20] <= 1);
ok(`carried in through the open gate (${C.inT} s) and back out`, C.held && C.carriedIn && C.inT < 4 && C.carriedOut);
ok('not through a shut one', !C.throughShutGate && C.stillHeld);
ok('no page errors', !h.errors.length);
await h.close();
process.exit(fails ? 1 : 0);
