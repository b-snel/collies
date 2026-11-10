// Headless test: `node tools/pen-trap-test.mjs`. A coyote shut in a pen mauls sheep after sheep (each dies unless a dog comes);
// with the gate open it drags it out. Rams fight by bravery; lambs take after their sire.
import { open } from './harness.mjs';
const h = await open();
const trap = mode => h.page.evaluate(async mode => {
  const { G, T, step, startGame, resetGame, living, pens, spawnPack, setGate } = GAME;
  if (G.mode !== 'play') startGame({ kind: 'bot', index: 0 }); else resetGame();
  G.players[0].bot = {}; G.clock.hour = 22; G.clock.day = 3;
  for (const c of G.coyotes) c.gone = true; step(0.05);
  const pen = pens[0], d = G.dogs[0], live = living();
  const at = (o, x, z) => { o.x = x; o.z = z; o.vx = o.vz = 0; };
  live.forEach((s, i) => { const a = i * 2.4, r = 1 + (i % 4) * 1.2; at(s, pen.x + Math.cos(a) * r, pen.z + Math.sin(a) * r); s.pen = pen; });
  at(d, pen.x - Math.cos(pen.gateA) * 40, pen.z - Math.sin(pen.gateA) * 40);   // far off, behind the pen
  setGate(pen, mode === 'open');
  const p = spawnPack(1, { howl: false }); const c = p.members[0];
  at(c, pen.x + Math.cos(pen.gateA) * (pen.R - 2), pen.z + Math.sin(pen.gateA) * (pen.R - 2));
  if (mode === 'open') GAME.grab(c, live[0]);
  let grabbed = null, outT = null, saved = false, kills = 0, moved = 0;
  const n0 = live.length, T0 = mode === 'shut' ? 45 : 25;
  for (let t = 0; t < T0; t += 0.05) {
    const px = c.x, pz = c.z;
    step(0.05);
    if (!c.prey && grabbed) moved += Math.hypot(c.x - px, c.z - pz);   // between kills
    if (c.prey && !grabbed) grabbed = c.prey;
    if (mode === 'save' && grabbed && t > 6 && !saved) { at(d, c.x + 1, c.z); saved = true; }
    if (grabbed && outT === null && Math.hypot(c.x - pen.x, c.z - pen.z) > pen.R + 0.5) outT = +t.toFixed(1);
  }
  kills = n0 - living().length;
  return { mode, kills, moved: +moved.toFixed(1), grabbed: !!grabbed, dead: grabbed ? grabbed.dead : null, outT, everMauled: grabbed ? grabbed.maulHp !== undefined : false };
}, mode);
const rams = () => h.page.evaluate(() => {
  const { G, T, step, startGame, resetGame, living, spawnPack } = GAME;
  if (G.mode !== 'play') startGame({ kind: 'bot', index: 0 }); else resetGame();
  G.players[0].bot = {}; G.clock.hour = 22; G.clock.day = 3;
  const res = {};
  for (const b of [0.1, 0.95]) {
    for (const c of G.coyotes) c.gone = true; step(0.05);
    const r = living().find(s => s.ram), pp = GAME.pathPoint(300, 0); r.x = pp.x; r.z = pp.z; r.brave = b; r.pen = null; r.rs = 'idle'; r.rcd = 0;
    const d = G.dogs[0]; d.x = r.x + 50; d.z = r.z + 50;
    const p = spawnPack(1, { howl: false }); const c = p.members[0];
    let charges = 0;
    for (let t = 0; t < 12; t += 0.05) { c.x = r.x + 5; c.z = r.z; c.vx = c.vz = 0; c.state = 'pack'; c.courage = 5; step(0.05); if (r.rs === 'windup' || r.rs === 'charge') charges++; }
    res[b] = charges > 0;
  }
  // lambs take after their sire
  const kids = sb => { const out = []; for (let k = 0; k < 4; k++) {
    resetGame(); T.lambChance = 1; const n0 = G.sheep.length;
    for (const e of living()) if (!e.ram && !e.lamb) { e.bred = true; e.sireBrave = sb; e.hunger = 0; e.lambedDay = 0; }
    GAME.lambsAtDawn(); out.push(...G.sheep.slice(n0).map(l => l.brave)); }
    return out.reduce((a, b) => a + b, 0) / out.length; };
  const lc = T.lambChance, kb = kids(0.95), kf = kids(0.05); T.lambChance = lc;
  return { flightyFights: res[0.1], braveFights: res[0.95], kidsBrave: +kb.toFixed(2), kidsFlighty: +kf.toFixed(2) };
});
let ok = true;
const shut = await trap('shut'); console.log(JSON.stringify(shut));
ok &&= shut.grabbed && shut.dead === true && shut.outT === null && shut.everMauled; console.log(ok ? 'PASS' : 'FAIL', 'shut: mauled');
let pass = shut.kills >= 2 && shut.moved > 3; ok &&= pass; console.log(pass ? 'PASS' : 'FAIL', 'shut: havoc, goes for the next');
const save = await trap('save'); console.log(JSON.stringify(save));
pass = save.grabbed && save.dead === false; ok &&= pass; console.log(pass ? 'PASS' : 'FAIL', 'shut: dog saves it');
const op = await trap('open'); console.log(JSON.stringify(op));
pass = op.grabbed && op.outT !== null; ok &&= pass; console.log(pass ? 'PASS' : 'FAIL', 'open: dragged out');
const r = await rams(); console.log(JSON.stringify(r));
pass = !r.flightyFights && r.braveFights && r.kidsBrave > 0.7 && r.kidsFlighty < 0.3; ok &&= pass; console.log(pass ? 'PASS' : 'FAIL', 'rams: bravery');
if (h.errors.length) { console.log(h.errors.slice(0, 5).join('\n')); ok = false; }
await h.close(); process.exit(ok ? 0 : 1);
