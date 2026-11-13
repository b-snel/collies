// Headless test: `node tools/burrow-test.mjs [dig|fill|raid|trap|dismay|leave|mid|guard|rules]`. Coyotes dig under a shut pen's fence,
// go under, drag a sheep out the same way; a dog standing on the hole fills it in.
// Checks: burrows: a pack digs under a shut pen's fence (off the gateway, no fast-forward), goes under, drags one out, gate shut; a dog
//   standing on either end fills it (not a few m off, not running); filled with one inside: shut in, mauls; fills: heart lost, gives up; out
//   the same way at dawn, or when the pack gives up mid-tunnel; dug away from a dog; not night one, not off, gone on a new journey
import { open } from './harness.mjs';
const only = process.argv[2];
const h = await open();
// night, day 3, the flock shut in the first pen, the dog far off, burrows on, every pack digs
const setup = `
  const { G, T, step, startGame, resetGame, living, pens, spawnPack, setGate, BURROWS, makeBurrow, setPhase, holeOf } = GAME;
  if (G.mode !== 'play') startGame({ kind: 'bot', index: 0 }); else resetGame();
  G.players[0].bot = {}; G.clock.hour = 21; G.clock.day = 3; T.burrow.on = true; T.burrow.chance = 1;
  for (const c of G.coyotes) c.gone = true; step(0.05);
  const pen = pens[0], d = G.dogs[0], live = living();
  const at = (o, x, z) => { o.x = x; o.z = z; o.vx = o.vz = 0; };
  live.forEach((s, i) => { const a = i * 2.4, r = 1 + (i % 4) * 1.2; at(s, pen.x + Math.cos(a) * r, pen.z + Math.sin(a) * r); s.pen = pen; });
  setGate(pen, false);
  const park = () => at(d, pen.x - Math.cos(pen.gateA) * 60, pen.z - Math.sin(pen.gateA) * 60);   // far off, behind the pen
  park();
  const out = s => Math.hypot(s.x - pen.x, s.z - pen.z) > pen.R + 0.3;
`;
const tests = {
  // a pack finds them all shut in: digs under the fence, away from the gate, goes under, drags one out; the gate stays shut
  dig: () => h.page.evaluate(new Function(`${setup}
    const p = spawnPack(2, { howl: false });
    let digT = null, openT = null, underT = null, grabT = null, outT = null, ff = false, gateMax = 0, hole = null;
    for (let t = 0; t < 120 && outT === null; t += 0.05) {
      step(0.05); gateMax = Math.max(gateMax, pen.gateT);
      hole = hole || BURROWS.find(b => b.pen === pen);
      if (hole && digT === null && hole.prog > 0) { digT = +t.toFixed(1); }
      if (hole && hole.prog > 0.05 && hole.prog < 1 && G.ff) ff = true;
      if (hole && hole.open && openT === null) openT = +t.toFixed(1);
      if (underT === null && G.coyotes.some(c => c.state === 'burrow')) underT = +t.toFixed(1);
      const c = G.coyotes.find(c => c.prey); if (c && grabT === null) grabT = +t.toFixed(1);
      if (c && grabT !== null && out(c.prey) && c.state !== 'burrow') outT = +t.toFixed(1);
    }
    const gateOff = hole ? Math.abs(((hole.a - pen.gateA) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI) : 0;
    return { digT, openT, underT, grabT, outT, ffWhileDigging: ff, gateMax: +gateMax.toFixed(2), gateOff: +gateOff.toFixed(2), gapHalf: +pen.gapHalf.toFixed(2) };
  `)),
  // a dog standing on either end fills it; one walking by, or a few m off, doesn't
  fill: () => h.page.evaluate(new Function(`${setup}
    const a = pen.gateA + Math.PI, b = makeBurrow(pen, a, 1);
    at(d, b.ox + b.nx * 3, b.oz + b.nz * 3); for (let t = 0; t < 2; t += 0.05) step(0.05);
    const off = b.prog;
    at(d, b.ox, b.oz); let fillT = null;
    for (let t = 0; t < 6 && fillT === null; t += 0.05) { step(0.05); d.x = b.ox; d.z = b.oz; d.vx = d.vz = 0; if (!BURROWS.includes(b)) fillT = +t.toFixed(1); }
    const b2 = makeBurrow(pen, a + 0.6, 1); let in2 = null;
    for (let t = 0; t < 6 && in2 === null; t += 0.05) { step(0.05); d.x = b2.ix; d.z = b2.iz; d.vx = d.vz = 0; if (!BURROWS.includes(b2)) in2 = +t.toFixed(1); }
    const b3 = makeBurrow(pen, a - 0.6, 1); G.players[0].bot = { mx: 1, sprint: true };
    for (let t = 0; t < 3; t += 0.05) { step(0.05); d.x = b3.ox; d.z = b3.oz; }   // running over and over it
    G.players[0].bot = {};
    return { off: +off.toFixed(2), fillT, insideT: in2, runK: +b3.prog.toFixed(2), fill: T.burrow.fill };
  `)),
  // an open one: a coyote goes under, grabs, comes out with it; filled while it's inside: shut in (mauls, as ever)
  raid: () => h.page.evaluate(new Function(`${setup}
    const b = makeBurrow(pen, pen.gateA + Math.PI, 1);
    const p = spawnPack(1, { howl: false }), c = p.members[0]; at(c, b.ox + b.nx * 3, b.oz + b.nz * 3);
    let under = 0, inT = null, grabT = null, outT = null, viaGate = false;
    for (let t = 0; t < 60 && outT === null; t += 0.05) {
      step(0.05); if (c.state === 'burrow') under++;
      if (inT === null && c.inPen === pen) inT = +t.toFixed(1);
      if (c.prey && grabT === null) grabT = +t.toFixed(1);
      if (c.prey && out(c.prey) && c.state !== 'burrow') { outT = +t.toFixed(1); viaGate = Math.hypot(c.x - pen.gx, c.z - pen.gz) < Math.hypot(c.x - b.ox, c.z - b.oz); }
    }
    return { underSteps: under, inT, grabT, outT, viaGate, phase: p.phase };
  `)),
  trap: () => h.page.evaluate(new Function(`${setup}
    const b = makeBurrow(pen, pen.gateA + Math.PI, 1);
    const p = spawnPack(1, { howl: false }), c = p.members[0]; at(c, b.ox + b.nx * 3, b.oz + b.nz * 3);
    for (let t = 0; t < 40 && !c.prey; t += 0.05) step(0.05);
    const grabbed = !!c.prey; b.prog = 0.001; at(d, b.ix, b.iz); step(0.05); park();   // filled with it inside
    let mauled = false, left = false;
    for (let t = 0; t < 8; t += 0.05) { step(0.05); if (c.mauling) mauled = true; if (Math.hypot(c.x - pen.x, c.z - pen.z) > pen.R) left = true; }
    return { grabbed, filled: !BURROWS.includes(b), trapped: c.trap === pen, mauled, out: left };
  `)),
  // filling one: the pack loses heart and starts over; a few and it gives up
  dismay: () => h.page.evaluate(new Function(`${setup}
    const p = spawnPack(3, { howl: false });
    let fills = 0, retreat = false, before = null, after = null;
    for (let t = 0; t < 240 && !retreat; t += 0.05) {
      step(0.05);
      const b = BURROWS.find(b => b.pen === pen);
      if (b && b.prog > 0.4 && !b.open) {   // the dog comes and stands on it (the digger runs)
        before = before ?? p.members.reduce((a, c) => a + c.courage, 0) / p.members.length;
        at(d, b.ox, b.oz); let k = 0; while (BURROWS.includes(b) && k++ < 200) { step(0.05); d.x = b.ox; d.z = b.oz; d.vx = d.vz = 0; }
        fills++; park();
        if (fills === 1) after = p.members.reduce((a, c) => a + c.courage, 0) / p.members.length;
      }
      if (p.phase === 'retreat') retreat = true;
    }
    return { fills, before: before && +before.toFixed(2), after: after && +after.toFixed(2), retreat, phase: p.phase };
  `)),
  // dawn with one inside a shut pen: out the way it came, not havoc
  leave: () => h.page.evaluate(new Function(`${setup}
    const b = makeBurrow(pen, pen.gateA + Math.PI, 1);
    const p = spawnPack(1, { howl: false }), c = p.members[0]; at(c, b.ix - b.nx * 2, b.iz - b.nz * 2); c.restT = G.time + 99;   // (no havoc first)
    c.state = 'leave'; c.stateT = 0; setPhase(p, 'retreat');
    let outT = null, under = false, kills0 = living().length;
    for (let t = 0; t < 20 && outT === null; t += 0.05) { step(0.05); if (c.state === 'burrow') under = true; if (Math.hypot(c.x - pen.x, c.z - pen.z) > pen.R + 0.5 && c.state !== 'burrow') outT = +t.toFixed(1); }
    return { outT, under, killed: kills0 - living().length };
  `)),
  // the pack gives up while one's under the fence: it comes out the far end whole, then leaves the way it came
  mid: () => h.page.evaluate(new Function(`${setup}
    const b = makeBurrow(pen, pen.gateA + Math.PI, 1);
    const p = spawnPack(1, { howl: false }), c = p.members[0]; at(c, b.ox + b.nx * 3, b.oz + b.nz * 3);
    for (let t = 0; t < 20 && !(c.state === 'burrow' && c.bur.t > 0.4); t += 0.05) step(0.05);
    const wasUnder = c.state === 'burrow'; setPhase(p, 'retreat');
    let surfaced = null, outT = null;
    for (let t = 0; t < 20 && outT === null; t += 0.05) {
      step(0.05);
      if (surfaced === null && c.state !== 'burrow') surfaced = { state: c.state, sink: c.sink, inside: c.inPen === pen };
      if (surfaced && c.state !== 'burrow' && Math.hypot(c.x - pen.x, c.z - pen.z) > pen.R + 0.5) outT = +t.toFixed(1);
    }
    return { wasUnder, surfaced, outT, killed: living().filter(s => s.dead).length };
  `)),
  // a dog right by the pen: they keep off it, and it isn't dug where the dog is
  guard: () => h.page.evaluate(new Function(`${setup}
    const g = pen.gateA + Math.PI; at(d, pen.x + Math.cos(g) * (pen.R + 2), pen.z + Math.sin(g) * (pen.R + 2));
    const p = spawnPack(2, { howl: false }); let hole = null;
    for (let t = 0; t < 60 && !hole; t += 0.05) { step(0.05); d.vx = d.vz = 0; hole = BURROWS.find(b => b.pen === pen); }
    return { dug: !!hole, fromDog: hole ? +Math.hypot(hole.ox - d.x, hole.oz - d.z).toFixed(1) : null };
  `)),
  // not on day one, not with the gate open, not off; gone on a new journey
  rules: () => h.page.evaluate(new Function(`${setup}
    const night = (day, on) => { for (const c of G.coyotes) c.gone = true; step(0.05); GAME.resetBurrows(); G.clock.day = day; G.clock.hour = 21; T.burrow.on = on;
      spawnPack(2, { howl: false }); for (let t = 0; t < 45; t += 0.05) step(0.05); return BURROWS.length; };
    const day1 = night(1, true), off = night(3, false); T.burrow.on = true;
    makeBurrow(pen, pen.gateA + 2, 1); resetGame();
    return { day1, off, afterReset: BURROWS.length };
  `)),
};
const checks = {
  dig: r => [['dug, opened', r.digT !== null && r.openT !== null], ['went under, grabbed, out', r.underT !== null && r.grabT !== null && r.outT !== null],
    ['gate stayed shut', r.gateMax < 0.3], ['off the gateway', r.gateOff > r.gapHalf + 0.3], ['no fast-forward while dug', !r.ffWhileDigging]],
  fill: r => [['a few m off: no', r.off === 1], ['standing on it: filled', r.fillT !== null && r.fillT < r.fill + 0.6], ['inside end too', r.insideT !== null], ['running over it: no', r.runK === 1]],
  raid: r => [['under, in, grabbed', r.underSteps > 0 && r.inT !== null && r.grabT !== null], ['out by the hole', r.outT !== null && !r.viaGate]],
  trap: r => [['grabbed inside', r.grabbed], ['filled: shut in, mauls', r.filled && r.trapped && r.mauled && !r.out]],
  dismay: r => [['loses heart', r.before !== null && r.after !== null && r.after < r.before - 0.3], ['gives up', r.retreat && r.fills >= 1 && r.fills <= 4]],
  leave: r => [['out by the hole', r.outT !== null && r.under && r.killed === 0]],
  mid: r => [['gives up under the fence: out the far end whole', r.wasUnder && r.surfaced && r.surfaced.state === 'leave' && r.surfaced.sink === 0 && r.surfaced.inside], ['…then back out', r.outT !== null && r.killed === 0]],
  guard: r => [['dug away from the dog', !r.dug || r.fromDog > 10]],
  rules: r => [['not day one', r.day1 === 0], ['off: none', r.off === 0], ['new journey: none', r.afterReset === 0]],
};
let ok = true;
for (const k of Object.keys(tests)) {
  if (only && k !== only) continue;
  const r = await tests[k](); console.log(k, JSON.stringify(r));
  for (const [what, pass] of checks[k](r)) { ok &&= pass; console.log(pass ? 'PASS' : 'FAIL', `${k}: ${what}`); }
}
if (h.errors.length) { console.log(h.errors.slice(0, 5).join('\n')); ok = false; }
await h.close(); process.exit(ok ? 0 : 1);
