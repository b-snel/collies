// Headless test: `node tools/pen-escape-test.mjs`. A shut pen holds: (1) a dog tearing round inside it, the flock crushed against
// the fence and the salt lick; (2) a crammed, hungry flock, a dog pacing and barking outside: nobody's shoved through the fence or
// rolled round a trough or the lick and out the back (PREV, collideFences). (3) The gate opened: they still go out by it.
import { open } from './harness.mjs';
const h = await open({ query: '?sim&debug' });
const r = await h.page.evaluate(() => {
  const { G, step, pens, setGate, makeSheep } = GAME;
  const R = { x: Math.SQRT1_2, z: -Math.SQRT1_2 }, F = { x: -Math.SQRT1_2, z: -Math.SQRT1_2 };
  const P = () => G.players[0], D = () => G.dogs[0];
  if (!G.players.length) GAME.startGame({ kind: 'bot', index: 0 });
  const live = () => G.sheep.filter(s => !s.dead);
  const goTo = (x, z, sprint) => { const d = D(), dx = x - d.x, dz = z - d.z, l = Math.hypot(dx, dz); if (l < 0.4) { P().bot = {}; return; } const k = Math.min(1, l / 1.5); P().bot = { sprint, mx: (dx * R.x + dz * R.z) / l * k, my: -(dx * F.x + dz * F.z) / l * k }; };
  const pen = pens[1], res = {};
  const run = (label, n, hunger, T, drive) => {
    GAME.resetGame(); P().bot = {}; for (const c of G.coyotes) c.gone = true; setGate(pen, false); G.clock.hour = 6.5;
    while (G.sheep.length < n) G.sheep.push(makeSheep(pen.x, pen.z));
    live().forEach((s, i) => { const a = i * 2.39996, rr = Math.sqrt(i / n) * (pen.R - 1.2); s.x = pen.x + Math.cos(a) * rr; s.z = pen.z + Math.sin(a) * rr; s.vx = s.vz = 0; s.hunger = hunger; s.state = 'idle'; });
    D().x = pen.x - Math.cos(pen.gateA) * 30; D().z = pen.z - Math.sin(pen.gateA) * 30;
    const out = new Set(); let t = 0, opened = 0;
    while (t < T) {
      drive(t); step(0.025); t += 0.025;
      if (pen.gateT > 0.05) { opened++; setGate(pen, false); }   // (not let out by the gate: the dog's not to open it)
      for (const s of live()) if (!s.grabbed && !s.air && !s.heldBy && Math.hypot(s.x - pen.x, s.z - pen.z) > pen.R + 0.3) out.add(s.id);
    }
    res[label] = { n: live().length, out: out.size, opened };
  };
  // (1) the dog inside, sprinting and barking round the pen
  let ang = 0;
  run('dogIn', 30, 0.4, 60, t => { if (t < 0.1) { D().x = pen.x; D().z = pen.z; } ang += 0.03; goTo(pen.x + Math.cos(ang * 2.3) * (pen.R - 2) * Math.sin(ang), pen.z + Math.sin(ang * 1.7) * (pen.R - 2), t % 6 < 3); if (Math.random() < 0.01) P().bot.bark = true; });
  // (2) crammed and hungry, the dog pacing round outside the fence
  ang = 0;
  run('crowd', 60, 0.85, 45, t => { ang += 0.006; goTo(pen.x + Math.cos(ang) * (pen.R + 1.2), pen.z + Math.sin(ang) * (pen.R + 1.2), t % 8 < 2); if (Math.random() < 0.02) P().bot.bark = true; });
  // (3) the gate opened of a morning: out they go, by it
  GAME.resetGame(); P().bot = {}; for (const c of G.coyotes) c.gone = true; setGate(pen, false); G.clock.hour = 7;
  live().forEach((s, i) => { const a = i * 2.39996, rr = 1 + (i % 4) * 1.6; s.x = pen.x + Math.cos(a) * rr; s.z = pen.z + Math.sin(a) * rr; s.vx = s.vz = 0; s.hunger = 0.6; s.state = 'idle'; });
  D().x = pen.x - Math.cos(pen.gateA) * 30; D().z = pen.z - Math.sin(pen.gateA) * 30;
  for (let i = 0; i < 40; i++) step(0.025);
  setGate(pen, true);
  for (let i = 0; i < 20 / 0.025; i++) { P().bot = {}; step(0.025); }
  res.gate = { of: live().length, left: live().filter(s => !s.pen && Math.hypot(s.x - pen.x, s.z - pen.z) > pen.R).length };
  return res;
});
console.log(JSON.stringify(r)); console.log(h.errors.slice(0, 3));
let fails = 0; const ok = (name, cond) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}`); if (!cond) fails++; };
ok(`dog tearing round a shut pen: none out (${r.dogIn.out}/${r.dogIn.n})`, r.dogIn.out === 0);
ok(`crammed hungry flock, dog outside: none out (${r.crowd.out}/${r.crowd.n})`, r.crowd.out === 0);
ok(`the gate opened: out by it (${r.gate.left}/${r.gate.of} in 20 s)`, r.gate.left >= r.gate.of - 2);
ok('no page errors', !h.errors.length);
await h.close();
process.exit(fails ? 1 : 0);
