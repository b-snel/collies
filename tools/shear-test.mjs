// Headless checks for shearing: the clippers' dig spot (dug up: Hank's), Hank shearing a penned flock behind a
// shut gate (over the fence, one at a time; not with the gate open, not asleep), the wool stock, regrowth, the shorn look,
// the saved flock keeping s.wool, a new journey. node tools/shear-test.mjs
import { open } from './harness.mjs';
let h = await open();
let fails = 0;
const ok = (name, cond, info) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${cond ? '' : '  ' + JSON.stringify(info)}`); if (!cond) fails++; };

// 1. the clippers' spot: one, between the first two camps, off the trail; the same on every load
const spot = () => h.page.evaluate(() => {
  const { CLIP_DIG: sp, DIGS, sAt, sdfAt, CAMPS, pathPoint } = GAME, s = sAt(sp.x, sp.z), p = pathPoint(s, 0);
  return { n: DIGS.filter(d => d.clip).length, s: +s.toFixed(1), c0: CAMPS[0].s, c1: CAMPS[1].s, sdf: +sdfAt(sp.x, sp.z).toFixed(1), off: +Math.hypot(sp.x - p.x, sp.z - p.z).toFixed(1), x: sp.x, z: sp.z };
});
const r1 = await spot();
ok(`one clippers spot, between the first two camps (s ${r1.s})`, r1.n === 1 && r1.s > r1.c0 + 20 && r1.s < r1.c1 - 20, r1);
ok('on open ground off the trail', r1.sdf > 2 && r1.off > 4, r1);
await h.page.reload(); await h.page.waitForFunction(() => window.GAME);
const r1b = await spot();
ok('the same spot every load (own rng)', r1b.x === r1.x && r1b.z === r1.z, [r1, r1b]);

// 2. a dog digs them up: straight to Hank
const r2 = await h.page.evaluate(() => {
  localStorage.clear();
  const { G, CLIP_DIG: sp, HANK, step, startGame, renderOnce } = GAME;
  startGame({ kind: 'bot', index: 0 }); G.players[0].bot = {}; for (const c of G.coyotes) c.gone = true;
  const d = G.dogs[0]; let t = 0;
  while (!sp.dug && t < 5) { d.x = sp.x + 0.3; d.z = sp.z; d.vx = d.vz = 0; step(0.025); t += 0.025; }
  renderOnce();
  for (let i = 0; i < 3; i++) renderOnce(0.1);
  return { dug: sp.dug, secs: +t.toFixed(2), hank: HANK.clippers, belt: HANK.model.shears.belt.visible, again: GAME.giveHankClippers(), said: HANK.log.slice(-3).map(l => l.text), row: document.getElementById('hWoolRow').style.display };
});
ok(`a dog digs up the clippers (${r2.secs}s): Hank has them`, r2.dug && r2.hank, r2);
ok('on his belt; his line; the 🧶 row shows', r2.belt && r2.said.some(t => /shear/i.test(t)) && r2.row === '', r2);
ok('giveHankClippers() again: no-op', r2.again === false, r2);

// 4. a flock penned behind a shut gate: Hank climbs in and shears the woolliest, one at a time
const r4 = await h.page.evaluate(() => {
  const { G, T, HANK, step, pens, setGate, penAt, shearSize, renderOnce, living } = GAME;
  const pen = pens[1], ga = pen.camp.gateA, out = {};
  G.clock.hour = 15; setGate(pen, false);
  living().forEach((s, i) => { const a = i * 2.4, rr = 1.5 + (i % 4) * 1.5; s.x = pen.x + Math.cos(a) * rr; s.z = pen.z + Math.sin(a) * rr; s.vx = s.vz = 0; s.wool = s.lamb ? 0.7 : 1; s.stress = 0; s.hunger = 0.2; });
  const d = G.dogs[0]; d.x = pen.x - Math.cos(ga) * 45; d.z = pen.z - Math.sin(ga) * 45;
  HANK.x = pen.x - Math.cos(ga) * (pen.R + 9); HANK.z = pen.z - Math.sin(ga) * (pen.R + 9); HANK.vx = HANK.vz = 0; HANK.goal = null; HANK.upT = -99; HANK.asleep = false; HANK.farT = 0;
  const wool0 = G.wool; let t = 0, maxStep = 0, climbs = 0, wasClimb = false, inPen = false, hold = 0, shownHand = false, order = [], stressMax = 0;
  let px = HANK.x, pz = HANK.z, cur = null, cx = 0, cz = 0;
  while (t < 45 && order.length < 4) {
    step(0.025); t += 0.025;
    maxStep = Math.max(maxStep, Math.hypot(HANK.x - px, HANK.z - pz)); px = HANK.x; pz = HANK.z;
    if (HANK.climb && !wasClimb) climbs++; wasClimb = !!HANK.climb;
    if (penAt(HANK.x, HANK.z) === pen) inPen = true;
    const s = G.sheep.find(o => o.state === 'shear');
    if (s && s !== cur) { cur = s; cx = s.x; cz = s.z; }
    if (s) { hold = Math.max(hold, Math.hypot(s.x - cx, s.z - cz)); if (!shownHand && HANK.shearing) { renderOnce(); shownHand = HANK.model.shears.hand.visible && !HANK.model.shears.belt.visible; } }
    if (!s && cur) { order.push({ lamb: cur.lamb, ram: cur.ram, wool: +cur.wool.toFixed(2) }); stressMax = Math.max(stressMax, cur.stress); cur = null; }
  }
  const lamb = living().find(s => s.lamb), ewe = living().find(s => !s.lamb && !s.ram), ram = living().find(s => s.ram);
  Object.assign(out, { t: +t.toFixed(1), climbs, inPen, maxStep: +maxStep.toFixed(2), hold: +hold.toFixed(3), shownHand, order, stressMax: +stressMax.toFixed(2), gained: G.wool - wool0,
    sizes: [lamb, ewe, ram].map(s => +shearSize(s).toFixed(2)), penned: living().filter(s => s.pen === pen).length, of: living().length });
  return out;
});
ok(`Hank climbs over the fence into the pen (${r4.climbs} climb), no jumps (max ${r4.maxStep} m a step)`, r4.climbs >= 1 && r4.inPen && r4.maxStep < 0.3, r4);
ok(`he shears ${r4.order.length} in ${r4.t}s, one at a time, woolliest first (not the lambs)`, r4.order.length >= 4 && r4.order.every(o => o.wool === 0 && !o.lamb), r4.order);
ok(`the wool stock rises (+${r4.gained} 🧶)`, r4.gained >= 3 * r4.order.length - 1, r4);
ok('the sheep sits still while shorn; his clippers in hand', r4.hold < 0.05 && r4.shownHand, r4);
ok(`a shorn sheep stays calm (stress ≤ ${r4.stressMax}); the flock stays penned`, r4.stressMax < 0.35 && r4.penned === r4.of, r4);
ok(`fleece by size: lamb < ewe < ram (${r4.sizes.join(' < ')})`, r4.sizes[0] < 0.75 && r4.sizes[0] < r4.sizes[1] && r4.sizes[1] < r4.sizes[2], r4.sizes);

// 5. the gate opened mid-shear: he stops; with it open nobody's shorn
const r5 = await h.page.evaluate(() => {
  const { G, HANK, step, pens, setGate, living } = GAME, pen = pens[1], out = {};
  let t = 0; while (!(HANK.job && HANK.job.on) && t < 15) { step(0.025); t += 0.025; }
  out.wasOn = !!(HANK.job && HANK.job.on);
  setGate(pen, true); for (let i = 0; i < 10; i++) step(0.025);
  out.stopped = !HANK.job && !HANK.shearing && !G.sheep.some(s => s.state === 'shear');
  for (const s of living()) if (s.pen === pen) s.wool = 1;
  const w0 = G.wool; let any = false;
  for (let i = 0; i < 320; i++) { step(0.025); setGate(pen, true); if (HANK.shearing || G.sheep.some(s => s.state === 'shear')) any = true; }
  out.gained = G.wool - w0; out.any = any;
  return out;
});
ok('opening the gate stops him mid-shear', r5.wasOn && r5.stopped, r5);
ok('with the gate open, nobody is shorn', !r5.any && r5.gained === 0, r5);

// 6. asleep at the campfire he doesn't shear; awake, he does; done, he beds down
const r6 = await h.page.evaluate(() => {
  const { G, HANK, step, pens, setGate, living, COUGARS } = GAME, pen = pens[0], out = {};
  const quiet = () => { for (const c of G.coyotes) { c.state = 'leave'; c.x = c.z = 1e4; } for (const k of COUGARS) if (k.state !== 'perch' && k.state !== 'away') k.state = 'away'; };
  G.clock.day = 3; G.clock.hour = 22; setGate(pens[1], false); setGate(pen, false); quiet();
  living().forEach((s, i) => { const a = i * 2.4, rr = 1.5 + (i % 4) * 1.4; s.x = pen.x + Math.cos(a) * rr; s.z = pen.z + Math.sin(a) * rr; s.vx = s.vz = 0; s.wool = 1; s.stress = 0; });
  const d = G.dogs[0]; d.x = pen.exitX + 30; d.z = pen.exitZ + 30;
  const f = pen.fire; HANK.x = f.x + 1.9; HANK.z = f.z; HANK.vx = HANK.vz = 0; HANK.asleep = true; HANK.upT = -99; HANK.goal = null;
  const w0 = G.wool; let any = false;
  for (let i = 0; i < 200; i++) { G.clock.hour = 22; quiet(); step(0.025); if (HANK.job || HANK.shearing) any = true; }
  out.asleep = HANK.asleep; out.any = any; out.gained = G.wool - w0;
  HANK.asleep = false; HANK.upT = -99;
  let t = 0; while (!(HANK.job && HANK.job.on) && t < 30) { G.clock.hour = 22; quiet(); step(0.025); t += 0.025; }
  out.awakeShears = !!(HANK.job && HANK.job.on); out.after = +t.toFixed(1);
  for (const s of living()) s.wool = 0.2;   // all done: off to bed
  let slept = false; t = 0; while (!slept && t < 40) { G.clock.hour = 22; quiet(); step(0.025); t += 0.025; slept = HANK.asleep; }
  out.slept = slept; out.sleptIn = +t.toFixed(1); out.outOfPen = !GAME.penAt(HANK.x, HANK.z);
  return out;
});
ok('asleep at the campfire, he doesn\'t shear', r6.asleep && !r6.any && r6.gained === 0, r6);
ok(`awake, he goes and shears (${r6.after}s)`, r6.awakeShears, r6);
ok(`nothing left to shear: back over the fence and asleep by the fire (${r6.sleptIn}s)`, r6.slept && r6.outOfPen, r6);

// 7. the fleece grows back over T.shear.regrowDays, up to full
const r7 = await h.page.evaluate(() => {
  const { G, T, HANK, step, living } = GAME, s = living().find(o => !o.lamb), full = living().find(o => o !== s);
  G.clock.hour = 9; s.wool = 0.2; full.wool = 1; HANK.clippers = false;   // (no shearing meanwhile)
  const h0 = (G.clock.day - 1) * 24 + G.clock.hour;
  for (let i = 0; i < 800; i++) step(0.025);
  const hrs = (G.clock.day - 1) * 24 + G.clock.hour - h0;
  HANK.clippers = true;
  return { got: +(s.wool - 0.2).toFixed(4), want: +(hrs / (24 * T.shear.regrowDays)).toFixed(4), hrs: +hrs.toFixed(2), full: full.wool };
});
ok(`wool regrows (+${r7.got} in ${r7.hrs} h, want ${r7.want}), capped at 1`, Math.abs(r7.got - r7.want) < r7.want * 0.15 && r7.full === 1, r7);

// 8. the look: shorn is slimmer and pinker, growing back smoothly; sat on its rump while shorn
const r8 = await h.page.evaluate(() => {
  const { G, SI, syncSheep, living, oldK } = GAME;
  const ewes = living().filter(s => !s.lamb && !s.ram && !s.black && !(s.look && s.look.wool) && oldK(s) === 0).slice(0, 3);
  [0, 0.5, 1].forEach((w, i) => { ewes[i].wool = w; ewes[i].hunger = 0.2; ewes[i].state = 'idle'; });
  syncSheep();
  const shown = living().filter(s => !s.dead), m = SI.body.m.instanceMatrix.array, c = SI.body.m.instanceColor.array;
  const look = s => { const i = shown.indexOf(s), e = m.slice(i * 16, i * 16 + 3); return { w: s.wool, x: +(Math.hypot(...e) / (s.scale * s.grow)).toFixed(3), rg: +(c[i * 3] - c[i * 3 + 1]).toFixed(3) }; };
  const L = ewes.map(look);
  const s = ewes[2], y0 = s.headM.elements[13]; s.state = 'shear'; for (let i = 0; i < 15; i++) syncSheep();
  const tip = +(s.headM.elements[13] - y0).toFixed(2), shK = s.shK; s.state = 'idle'; for (let i = 0; i < 15; i++) syncSheep();
  return { L, tip, shK, back: s.shK };
});
const [a8, b8, c8] = r8.L;
ok('shorn: slimmer, smoothly fuller as it grows', a8.x < c8.x * 0.85 && a8.x < b8.x && b8.x < c8.x, r8.L);
ok('shorn: pink skin showing, less as it grows', a8.rg > 0.1 && a8.rg > b8.rg && b8.rg > c8.rg && c8.rg < 0.02, r8.L);
ok('sat back on its rump while shorn (head up), and up again after', r8.shK === 1 && r8.tip > 0.1 && r8.back === 0, r8);

// 9. online: what's synced
const r9 = await h.page.evaluate(() => { const T = window.NET.api.types; return { s: 'wool' in T.sheep.fields, h: ['clippers', 'shearing', 'lift'].every(k => k in T.hank.fields), g: 'wool' in T.game.fields }; });
ok('synced: s.wool, Hank\'s clippers/shearing/climb, G.wool', r9.s && r9.h && r9.g, r9);

// 10. a new journey: no wool, clippers buried
const r10 = await h.page.evaluate(() => {
  const { G, HANK, CLIP_DIG: sp, resetGame } = GAME, out = {};
  G.mode = 'end'; resetGame(); out.wool = G.wool; out.hank = HANK.clippers; out.spot = !sp.dug;
  return out;
});
ok('a new journey: no wool, clippers buried again', r10.wool === 0 && !r10.hank && r10.spot, r10);

// 11. the saved flock keeps each sheep's fleece
const r11a = await h.page.evaluate(() => {
  localStorage.clear(); const { G, saveFlock, readFlockSave } = GAME;
  const s = G.sheep.find(o => !o.lamb && !o.dead); s.name = 'Shorn Sue'; s.renamed = true; s.wool = 0.23; saveFlock();
  return (readFlockSave().flock.find(r => r.name === 'Shorn Sue') || {}).wool;
});
await h.page.reload(); await h.page.waitForFunction(() => window.GAME);
const r11 = await h.page.evaluate(() => { const s = GAME.G.sheep.find(o => o.name === 'Shorn Sue'); return s && s.wool; });
ok(`the saved flock keeps s.wool (${r11a} saved, ${r11} after a reload)`, r11a === 0.23 && r11 === 0.23, { r11a, r11 });

ok('no page errors', h.errors.length === 0, h.errors.slice(0, 5));
await h.close();
console.log(fails ? `${fails} FAILED` : 'all ok');
process.exit(fails ? 1 : 0);
